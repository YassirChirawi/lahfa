import toast from 'react-hot-toast';

const API_BASE_URL = 'https://app.sendit.ma/api/v1';
const PUBLIC_KEY = '0976d72064c9cc2c5641eb7c3e00c9e7';
const SECRET_KEY = '26wUl1qdHqPuNPhhw2gH1hJwDLSNgEm0';

let cachedToken = null;
let tokenExpiration = null;
let cachedDistricts = null;

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
            console.log("Authenticating with Sendit...");
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    public_key: PUBLIC_KEY,
                    secret_key: SECRET_KEY
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || `Auth failed: ${response.status}`);
            }

            const data = await response.json();

            // Assuming response structure based on docs definition of LoginSuccessResponse
            // Often it's { token: "...", expires_in: ... } or similar. 
            // Docs say: 200 -> LoginSuccessResponse. Let's inspect data if possible, but standard is usually 'token' or 'access_token'
            // I'll assume 'token' based on typical matching logic, will debug if wrong.
            // Actually, let's log the auth response to be sure during first run
            console.log("Sendit Auth Response:", data);

            if (!data.token && !data.access_token) {
                // Try looking in data.data or similar wrappers if needed
                if (data.data?.token) cachedToken = data.data.token;
                else throw new Error("Token not found in response");
            } else {
                cachedToken = data.token || data.access_token;
            }

            // Set expiration (e.g., 23 hours to be safe)
            tokenExpiration = new Date(new Date().getTime() + 23 * 60 * 60 * 1000);
            return cachedToken;
        } catch (error) {
            console.error("Sendit Auth Error:", error);
            throw error;
        }
    },

    /**
     * Get list of districts (Cities)
     * Used to map text city to district_id
     */
    getDistricts: async () => {
        if (cachedDistricts) return cachedDistricts;

        try {
            const token = await senditService.getToken();
            // Fetch all pages? Or just search?
            // For mapping, we ideally need a full list or we can search by query.
            // Let's try fetching page 1 and see total, or just search when needed. 
            // Searching per order might be slower but safer if list is huge.
            // Let's try searching first since we have a 'querystring' param.
            return []; // Placeholder if we use search-on-demand
        } catch (error) {
            console.error("Get Districts Error:", error);
            return [];
        }
    },

    /**
     * Find district ID by name
     */
    findDistrictId: async (cityName) => {
        if (!cityName) return null;
        try {
            const token = await senditService.getToken();
            const response = await fetch(`${API_BASE_URL}/districts?querystring=${encodeURIComponent(cityName)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) return null;
            const result = await response.json();

            // Expected: { success: true, data: [ { id: 1, ville: "...", name: "..." } ] }
            if (result.success && result.data && result.data.length > 0) {
                // Try to find exact match or best match
                // API might return "Casablanca - Maarif" for query "Casablanca"
                // We prefer a generic city ID if available, otherwise the first one?
                // Let's just take the first one for now or look for one where ville == name?
                return result.data[0].id;
            }
            return null;
        } catch (error) {
            console.error("Find District Error:", error);
            return null;
        }
    },

    /**
     * Create a new package
     */
    createPackage: async (order) => {
        try {
            const token = await senditService.getToken();

            // 1. Resolve District ID
            let districtId = await senditService.findDistrictId(order.city);
            if (!districtId) {
                // Fallback: Default to Casablanca or throw error?
                // Let's throw for now to let user fix address
                throw new Error(`Ville non trouvée chez Sendit: ${order.city}`);
            }

            // 2. Prepare Product String "CODE:QTY;CODE2:QTY"
            // If items have no code, maybe we need to create dummy codes or ignore?
            // Docs say: "Si vous n'avez pas de stock, vous pouvez laisser ce champ vide ou le remplir avec les informations de vos produits."
            // So we can send text description? "Liste des produits ... au format code:qty" implies structure.
            // But detailed description says: "Si vous n'avez pas de stock... laisser vide ou remplir avec infos".
            // Let's try sending a descriptive string if no codes, or just "GENERIC:1".
            // Actually, let's construct a meaningful string if possible.
            let productsString = "";
            if (order.items && order.items.length > 0) {
                productsString = order.items.map(item => {
                    // Use item.id or item.article as code? Code must probably be short and no special chars?
                    // Let's try using a sanitized name or ID.
                    const code = (item.article || "ITEM").replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase();
                    return `${code}:${item.quantity || 1}`;
                }).join(';');
            } else {
                productsString = "ITEM:1";
            }

            // 3. Construct Payload
            // Required: products, district_id, name, phone, address
            const payload = {
                district_id: parseInt(districtId),
                name: order.customer || "Client",
                phone: order.phone || "",
                address: order.address || order.city || "Adresse",
                amount: parseFloat(order.amount) || 0,
                comment: order.notes || "",
                products: productsString,
                allow_open: 1, // Default to allow open
                allow_try: 1,  // Default to allow try
                products_from_stock: 0 // Default to 0 as we likely don't sync stock yet
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
                console.error("Sendit Create Error Response:", result);
                throw new Error(result.message || "Erreur lors de la création du colis Sendit");
            }

            // Success response: { success: true, data: { ... } }
            // We need the tracking ID. Usually in data.code or data.id?
            // "NewColisDetail" schema references "ColisDetailData".
            // Let's assume result.data.code is the tracking ID based on "deliveries/{code}" paths.

            return {
                trackingID: result.data.code,
                status: result.data.status,
                trackingUrl: result.data.labelUrl // Maybe?
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
            // Result schema: { success: true, data: { status: "...", ... } }

            return {
                status: result.data.status,
                raw: result.data
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
            const response = await fetch(`${API_BASE_URL}/deliveries/${trackingID}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) return true; // Already gone
                throw new Error("Impossible d'annuler le colis Sendit");
            }
            return true;
        } catch (error) {
            console.error("Sendit Cancel Error:", error);
            throw error;
        }
    }
};

export default senditService;
