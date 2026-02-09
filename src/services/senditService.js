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

                const districts = result.data || [];

                if (districts.length === 0) {
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
                // Hard fallback for Casablanca if fetch fails ? Or throw.
                // Let's assume 121 is Casablanca for Sendit (common), 
                // but safer to throw if not found to avoid wrong city.
                // However user said "toujours casablanca". 
                // If API fails, we are stuck.
                throw new Error("Impossible de déterminer l'ID de Casablanca (Pickup). Veuillez vérifier votre connexion ou les paramètres.");
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
                note: order.notes || "",
                products: productsString,
                // Options d'essayage et d'échange
                is_try: order.deliveryValues?.allowTry ? 1 : 0,
                is_open: order.deliveryValues?.allowOpen ? 1 : 0, // Certain APIs use is_open
                is_exchange: order.deliveryValues?.isExchange ? 1 : 0,
            };

            console.log("🚀 Payload Sendit:", JSON.stringify(payload, null, 2));

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
                    // Laravel style validation errors
                    const details = Object.entries(result.errors).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n');
                    errorMessage = `${errorMessage} \n Détails: ${details}`;
                }
                throw new Error(errorMessage);
            }

            // Success. We need tracking ID.
            // Assuming result.code or result.data.code
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
    }
};

export const getAllDistricts = senditService.getAllDistricts;
export default senditService;
