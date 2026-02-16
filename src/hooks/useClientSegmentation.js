import { useMemo } from 'react';

export const useClientSegmentation = (clients, orders) => {
    return useMemo(() => {
        if (!clients || !orders) return [];

        const now = new Date();

        // Helper to normalize phone for comparison (remove spaces, dashes)
        const normalizePhone = (phone) => phone ? phone.replace(/\D/g, '') : '';

        return clients.map(client => {
            const clientPhone = normalizePhone(client.phone);

            // 1. Calculate RFM Metrics
            const clientOrders = orders.filter(o =>
                normalizePhone(o.phone) === clientPhone &&
                o.status !== 'Annulé'
            );

            // Recency: Days since last order
            const lastOrderDate = clientOrders.length > 0
                ? new Date(Math.max(...clientOrders.map(o => new Date(o.date).getTime())))
                : null;
            const recency = lastOrderDate
                ? Math.floor((now - lastOrderDate) / (1000 * 60 * 60 * 24))
                : 999; // Never ordered

            // Frequency: Total valid orders
            const frequency = clientOrders.length;

            // Monetary: Total spent
            const monetary = clientOrders.reduce((sum, o) => sum + (parseFloat(o.total || o.amount) || 0), 0);

            // 2. Assign Segment
            let segment = { name: 'Visitor', color: 'gray', message: "Nouveau visiteur, proposez-lui une offre de bienvenue !" };

            if (frequency === 0) {
                segment = { name: 'New Lead', color: 'blue', message: "Nouveau prospect : offrez-lui la livraison gratuite pour sa première commande." };
            } else if (frequency >= 5 && recency <= 30) {
                segment = { name: 'Champion 🏆', color: 'purple', message: "Client VIP ! Remerciez-le pour sa fidélité avec un cadeau exclusif." };
            } else if (frequency >= 3 && recency <= 60) {
                segment = { name: 'Loyal', color: 'green', message: "Client fidèle. Proposez-lui les nouveautés en avant-première." };
            } else if (recency > 90 && frequency >= 2) {
                segment = { name: 'At Risk ⚠️', color: 'orange', message: "Client à risque. Envoyez un code promo 'WE_MISS_YOU' (-15%)." };
            } else if (recency > 180 && frequency >= 1) {
                segment = { name: 'Hibernating zzz', color: 'gray', message: "Client inactif depuis longtemps. Tentez une relance douce." };
            } else if (frequency === 1 && recency <= 30) {
                segment = { name: 'Promising', color: 'teal', message: "A fait un premier achat récent. Incitez-le au deuxième achat." };
            }

            return {
                ...client,
                stats: {
                    ...client.stats, // Keep existing stats if any
                    recency,
                    frequency,
                    monetary,
                    // Check if there are discrepancies between stored stats and calculated ones
                    isLive: true
                },
                segment
            };
        });
    }, [clients, orders]);
};
