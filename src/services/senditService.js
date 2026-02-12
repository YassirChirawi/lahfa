import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const SETTINGS_DOC = 'settings/delivery';
const API_BASE_URL = 'https://app.sendit.ma/api/v1';

let cachedToken = null;
let tokenExpiration = null;
let cachedDistricts = null;

// Helper to fetch credentials from Firestore
const getCredentials = async () => {
    const docRef = doc(db, SETTINGS_DOC);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Les paramètres de livraison ne sont pas configurés.");

    const data = snap.data();
    if (!data.sendit || !data.sendit.publicKey || !data.sendit.secretKey) {
        throw new Error("Clés API Sendit manquantes. Configurez-les dans les paramètres.");
    }
    return {
        ...data.sendit,
        pickup_district_id: data.sendit.pickup_district_id
    };
};

const senditService = {
    /**
     * Authenticate and get Bearer Token
     */
    getToken: async () => {
        const now = new Date();
        if (cachedToken && tokenExpiration && now < tokenExpiration) {
            return cachedToken;
        }

        try {
            const { publicKey, secretKey } = await getCredentials();

            console.log("Authenticating with Sendit...");
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    public_key: publicKey,
                    secret_key: secretKey
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || `Auth failed: ${response.status}`);
            }

            const data = await response.json();
            console.log("Sendit Auth Response:", data);

            if (!data.token && !data.access_token) {
                if (data.data?.token) cachedToken = data.data.token;
                else throw new Error("Token not found in response");
            } else {
                cachedToken = data.token || data.access_token;
            }

            // Set expiration (e.g., 23 hours)
            tokenExpiration = new Date(new Date().getTime() + 23 * 60 * 60 * 1000);
            return cachedToken;
        } catch (error) {
            console.error("Sendit Auth Error:", error);
            throw error;
        }
    },

    /**
     * Get ALL districts (Cities) with prices and delays
     * Used for syncing city data
     */
    getAllDistricts: async () => {
        try {
            const token = await senditService.getToken();

            // Sendit doesn't seem to have a strict "list all" without pagination documented clearly locally,
            // but usually /districts works. If paginated, we might need loop.
            // Documentation says: GET /districts with optional querystring.
            // Let's assume initially it returns a list or we can fetch a large page?
            // If pagination is mandatory, we might need to iterate.
            // Let's try fetching page 1 and see.

            let allDistricts = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const response = await fetch(`${API_BASE_URL}/districts?page=${page}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) break;
                const result = await response.json();

                // Handle different API response structures
                const districts = Array.isArray(result) ? result : (result.data || result.districts || []);

                if (districts.length === 0) {
                    console.log("No districts found in page", page);
                    hasMore = false;
                } else {
                    allDistricts = [...allDistricts, ...districts];
                    page++;
                }

                // Safety break to prevent infinite loops if API is weird
                if (page > 100) hasMore = false;
            }

            // Map to our internal format
            return allDistricts.map(d => ({
                id: d.id,
                name: d.name || d.ville || "Inconnu",
                price: parseFloat(d.price || d.tarif || 0),
                delais: d.delais || d.delivery_time || "24h-48h",
                ref: d.ref || d.code || null,
                region: d.region || null
            }));

        } catch (error) {
            console.error("Get All Districts Error:", error);
            throw error;
        }
    },

    /**
     * Create a new package
     */
    createPackage: async (order) => {
        try {
            const token = await senditService.getToken();

            // 1. Resolve District ID with Strict Validation
            let districtId = order.deliveryValues?.districtId;

            if (!districtId || isNaN(parseInt(districtId))) {
                console.error("Missing/Invalid District ID for city:", order.city);
                throw new Error(`La ville "${order.city}" n'est pas reconnue par Sendit. Veuillez modifier la commande et sélectionner une ville valide dans la liste déroulante.`);
            }

            // 1b. Resolve Pickup District ID
            let pickupId = (await getCredentials()).pickup_district_id;

            if (!pickupId) {
                try {
                    // Auto-detect Casablanca
                    if (!cachedDistricts) {
                        console.log("Fetching districts for auto-detect...");
                        cachedDistricts = await senditService.getAllDistricts();
                        console.log(`Fetched ${cachedDistricts.length} districts.`);
                    }

                    // Flexible match
                    const casa = cachedDistricts.find(d => d.name && d.name.toLowerCase().includes("casablanca"));

                    if (casa) {
                        pickupId = casa.id;
                        console.log(`✅ Auto-detected Pickup City: ${casa.name} (ID: ${pickupId})`);
                    } else {
                        console.warn("⚠️ 'Casablanca' not found in district list. Available examples:", cachedDistricts.slice(0, 5).map(d => d.name));
                    }
                } catch (e) {
                    console.error("Could not auto-detect pickup city:", e);
                }
            }

            if (!pickupId) {
                const count = cachedDistricts ? cachedDistricts.length : 0;
                const samples = cachedDistricts ? cachedDistricts.slice(0, 5).map(d => d.name).join(', ') : 'Aucune';

                throw new Error(`Impossible de trouver l'ID de Casablanca (Pickup). ${count} villes trouvées. Premières villes: ${samples}. Vérifiez la connexion ou contactez le support.`);
            }

            // 2. Prepare Product String (Robust Fallback)
            let productsString = "";
            if (order.items && order.items.length > 0) {
                productsString = order.items.map(item => {
                    let cleanName = (item.article || "ITEM").replace(/[^a-zA-Z0-9]/g, '');
                    if (!cleanName) cleanName = "ITEM";
                    const code = cleanName.substring(0, 10).toUpperCase();
                    return `${code}:${item.quantity || 1}`;
                }).join(';');
            } else {
                productsString = "ITEM:1";
            }

            // 3. Construct Payload
            const payload = {
                district_id: parseInt(districtId),
                pickup_district_id: parseInt(pickupId),
                name: order.customer || "Client",
                phone: order.phone || "",
                address: order.address || order.city || "Adresse inconnue",
                amount: parseFloat(order.amount) || 0,
                comment: order.notes || "",
                reference: order.displayId || order.id || "",
                products: productsString,
                allow_try: order.deliveryValues?.allowTry ? 1 : 0,
                allow_open: order.deliveryValues?.allowOpen ? 1 : 0,
                option_exchange: order.deliveryValues?.isExchange ? 1 : 0,
            };

            console.log("Creating Sendit Package:", payload);

            const response = await fetch(`${API_BASE_URL}/deliveries`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("Sendit Create Error:", result);
                let errorMessage = result.message || "Erreur lors de la création du colis Sendit";
                if (result.errors) {
                    const details = Object.entries(result.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n');
                    errorMessage = `${errorMessage} \n Détails: ${details}`;
                }
                throw new Error(errorMessage);
            }

            const trackingCode = result.code || result.data?.code;

            return {
                trackingID: trackingCode,
                status: result.status || result.data?.status || 'PENDING',
                trackingUrl: result.label_url || result.data?.label_url
            };

        } catch (error) {
            console.error("Sendit Create Package Error:", error);
            throw error;
        }
    },

    /**
     * Get package status
     */
    getPackageStatus: async (trackingID) => {
        try {
            if (!trackingID) throw new Error("Tracking ID is required");
            const token = await senditService.getToken();
            const response = await fetch(`${API_BASE_URL}/deliveries/${trackingID}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error("Impossible de récupérer le statut Sendit");
            }

            const result = await response.json();

            // Expected: { code: "...", status: "...", ... }
            return {
                status: result.status || result.data?.status,
                raw: result
            };
        } catch (error) {
            console.error("Sendit Get Status Error:", error);
            throw error;
        }
    },

    /**
     * Cancel package
     */
    cancelPackage: async (trackingID) => {
        try {
            const token = await senditService.getToken();
            // Check API docs for cancel endpoint. Often DELETE /deliveries/{code}
            const response = await fetch(`${API_BASE_URL}/deliveries/${trackingID}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) return true;
                throw new Error("Impossible d'annuler le colis Sendit");
            }
            return true;
        } catch (error) {
            console.error("Sendit Cancel Error:", error);
            throw error;
        }
    },

    /**
     * Request a pickup (Ramassage)
     */
    requestPickup: async (pickupData) => {
        try {
            const token = await senditService.getToken();

            // Payload based on documentation:
            // district_id, name, phone, address, comment, deliveries (comma separated codes)
            const payload = {
                district_id: parseInt(pickupData.district_id || 1),
                name: pickupData.name || "Vendeur",
                phone: pickupData.phone || "",
                address: pickupData.address || "",
                note: pickupData.note || "Demande de ramassage depuis le dashboard",
                deliveries: Array.isArray(pickupData.deliveries)
                    ? pickupData.deliveries
                    : (pickupData.deliveries ? pickupData.deliveries.toString().split(',') : [])
            };

            console.log("Requesting Sendit Pickup:", payload);

            const response = await fetch(`${API_BASE_URL}/pickups`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("Sendit Pickup Error:", result);
                let errorMessage = result.message || result.error || "Erreur lors de la demande de ramassage";
                const errors = result.errors || result.data?.errors;
                if (errors) {
                    const details = Object.entries(errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
                    errorMessage = `${errorMessage} (Détails: ${details})`;
                }
                throw new Error(errorMessage);
            }

            return result;
        } catch (error) {
            console.error("Sendit Request Pickup Error:", error);
            throw error;
        }
    },

    /**
     * Request a return (Retour)
     */
    requestReturn: async (returnData) => {
        try {
            const token = await senditService.getToken();

            // Payload based on documentation:
            // district_id, name, phone, address, comment, deliveries (comma separated codes)
            const payload = {
                district_id: parseInt(returnData.district_id || 1),
                name: returnData.name || "Vendeur",
                phone: returnData.phone || "",
                address: returnData.address || "",
                note: returnData.note || "Demande de retour depuis le dashboard",
                deliveries: Array.isArray(returnData.deliveries)
                    ? returnData.deliveries
                    : (returnData.deliveries ? returnData.deliveries.toString().split(',') : [])
            };

            console.log("Requesting Sendit Return:", payload);

            const response = await fetch(`${API_BASE_URL}/returns`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("Sendit Return Error:", result);
                let errorMessage = result.message || result.error || "Erreur lors de la demande de retour";
                const errors = result.errors || result.data?.errors;
                if (errors) {
                    const details = Object.entries(errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
                    errorMessage = `${errorMessage} (Détails: ${details})`;
                }
                throw new Error(errorMessage);
            }

            return result;
        } catch (error) {
            console.error("Sendit Request Return Error:", error);
            throw error;
        }
    },

    /**
     * Get PDF labels for a list of deliveries
     * @param {string} deliveries - Comma separated tracking codes
     * @param {number} printFormat - 1 for Thermal (10x10), 0 for A4
     */
    getLabels: async (deliveries, printFormat = 1) => {
        try {
            const token = await senditService.getToken();
            const response = await fetch(`${API_BASE_URL}/deliveries/getlabels`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ deliveries, printFormat })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Erreur lors de la génération des étiquettes");
            }

            return result; // Should contain the PDF URL
        } catch (error) {
            console.error("Sendit GetLabels Error:", error);
            throw error;
        }
    },

    /**
     * Sync all deliveries statuses in one call
     * Fetches ALL deliveries from Sendit (handles pagination)
     */
    syncAllDeliveries: async () => {
        try {
            const token = await senditService.getToken();
            let allDeliveries = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const response = await fetch(`${API_BASE_URL}/deliveries?page=${page}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || "Erreur lors de la récupération des colis Sendit");
                }

                const pageDeliveries = result.data || [];
                allDeliveries = [...allDeliveries, ...pageDeliveries];

                // Check pagination
                if (result.meta && result.meta.last_page) {
                    if (page >= result.meta.last_page) {
                        hasMore = false;
                    } else {
                        page++;
                    }
                } else if (result.next_page_url) {
                    // Fallback if structure is different but has next_page_url
                    page++;
                } else {
                    // No pagination info, assume single page
                    hasMore = false;
                }

                // Safety break
                if (page > 50) hasMore = false;
                if (page > 50) hasMore = false;
            }

            return { data: allDeliveries };
        } catch (error) {
            console.error("Sendit Global Sync Error:", error);
            throw error;
        }
    },

    /**
     * Get invoices list
     */
    getInvoices: async () => {
        try {
            const token = await senditService.getToken();
            const response = await fetch(`${API_BASE_URL}/invoices`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Erreur lors de la récupération des factures");
            }

            return result;
        } catch (error) {
            console.error("Sendit Invoices Error:", error);
            throw error;
        }
    }
};

export const getAllDistricts = senditService.getAllDistricts;
export const requestPickup = senditService.requestPickup;
export const requestReturn = senditService.requestReturn;
export const getLabels = senditService.getLabels;
export const syncAllDeliveries = senditService.syncAllDeliveries;
export const getInvoices = senditService.getInvoices;
export default senditService;
