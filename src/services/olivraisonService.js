import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const SETTINGS_DOC = 'settings/delivery';
let cachedToken = null;
let tokenExpiration = null;

// Helper to determine base URL
const getBaseUrl = (settingsUrl) => {
    // If usage via proxy is needed (development)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return '/api/olivraison';
    }
    // Production / Settings override
    return settingsUrl || 'https://partners.olivraison.com';
};

/**
 * Fetch API credentials from Firestore
 */
const getCredentials = async () => {
    const docRef = doc(db, SETTINGS_DOC);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error("Les paramètres API Olivraison ne sont pas configurés.");
    return snap.data();
};

/**
 * Authenticate and get Bearer Token
 */
const getToken = async () => {
    const now = new Date();
    if (cachedToken && tokenExpiration && now < tokenExpiration) {
        return cachedToken;
    }

    const { apiKey, secretKey, baseUrl: settingsBaseUrl } = await getCredentials();
    const baseUrl = getBaseUrl(settingsBaseUrl);

    try {
        const response = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ apiKey, secretKey })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.description || 'Authentification échouée');
        }

        const data = await response.json();
        cachedToken = data.token;
        // Parse expiration or set default (e.g., 23 hours safe buffer)
        // API returns "expiration": "string", assuming ISO date or similar
        // If format is unknown, let's play safe and cache for 1 hour
        tokenExpiration = new Date(new Date().getTime() + 60 * 60 * 1000);

        return cachedToken;
    } catch (error) {
        console.error("Olivraison Auth Error:", error);
        throw error;
    }
};

// Helper to normalize city names
const normalizeCity = (city) => {
    if (!city) return "Alger";
    const lower = city.toLowerCase().trim();
    const map = {
        'casa': 'Casablanca',
        'casablanca': 'Casablanca',
        'alger': 'Alger',
        'algiers': 'Alger',
        'rabat': 'Rabat',
        'tanger': 'Tanger',
        'tangier': 'Tanger',
        'kech': 'Marrakech',
        'marrakech': 'Marrakech',
        'agadir': 'Agadir',
        'oran': 'Oran'
    };
    return map[lower] || city; // Return mapped value or original (capitalized properly would be better but API might be case insensitive or strict)
};

/**
 * Create a new package in Olivraison
 * @param {Object} order - Local order object
 */
export const createPackage = async (order) => {
    try {
        const token = await getToken();
        // Force endpoint to default if settings are missing/broken
        const { baseUrl: settingsBaseUrl } = await getCredentials().catch(() => ({}));
        const baseUrl = getBaseUrl(settingsBaseUrl);

        // Format description from items or legacy article field
        let description = "Commande";
        if (order.items && order.items.length > 0) {
            description = order.items.map(p => `${p.quantity || 1}x ${p.article || p.name || 'Article'}`).join(' + ');
        } else if (order.article) {
            description = `${order.quantity || 1}x ${order.article}`;
        }

        const payload = {
            price: order.amount || 0,
            comment: order.notes || "",
            description: description,
            inventory: false,
            // mode: "fast", // Removed: potentially causing 400 Bad Request
            name: `Order ${order.displayId || order.id}`,
            destination: {
                name: order.customer || "Client Inconnu",
                phone: order.phone || "",
                city: normalizeCity(order.city),
                streetAddress: order.address || ""
            }
        };

        console.log("Sending to Olivraison:", JSON.stringify(payload, null, 2));

        const response = await fetch(`${baseUrl}/package`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorDetails;
            try {
                errorDetails = JSON.parse(errorText);
            } catch (e) {
                errorDetails = { message: errorText };
            }
            console.error("Olivraison API Error:", errorDetails);

            // Extract meaningful message if possible
            const msg = errorDetails.description || errorDetails.message || errorDetails.error || `Erreur API (${response.status})`;
            throw new Error(msg);
        }

        const result = await response.json();
        console.log("Olivraison Success:", result);

        // Normalize response: Ensure trackingID exists globally
        return {
            ...result,
            trackingID: result.trackingID || result.checkingID || result.id
        };
    } catch (error) {
        console.error("Create Package Exception:", error);
        throw error;
    }
};

/**
 * Get package status
 */
export const getPackageStatus = async (trackingID) => {
    try {
        const token = await getToken();
        const { baseUrl: settingsBaseUrl } = await getCredentials().catch(() => ({}));
        const baseUrl = getBaseUrl(settingsBaseUrl);

        const response = await fetch(`${baseUrl}/package/${trackingID}`, { // Keeping previous path structure
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("Impossible de récupérer le statut");
        return await response.json();
    } catch (error) {
        console.error("Get Status Error:", error);
        throw error;
    }
};

/**
 * Cancel/Delete package in Olivraison
 */
export const cancelPackage = async (trackingID) => {
    try {
        const token = await getToken();
        const { baseUrl: settingsBaseUrl } = await getCredentials().catch(() => ({}));
        const baseUrl = getBaseUrl(settingsBaseUrl);

        console.log(`Cancelling Olivraison package: ${trackingID}`);

        const response = await fetch(`${baseUrl}/package/${trackingID}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            // Some APIs return 404 if already deleted, which is fine-ish, but let's log it.
            if (response.status === 404) {
                console.warn("Package not found or already deleted on Olivraison.");
                return true;
            }
            throw new Error("Impossible d'annuler le colis sur Olivraison");
        }

        return true;
    } catch (error) {
        console.error("Cancel Package Error:", error);
        throw error;
    }
};

export default {
    createPackage,
    getPackageStatus,
    cancelPackage
};
