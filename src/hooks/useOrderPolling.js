import { useEffect, useRef } from 'react';
import { useOrders } from '../context/OrderContext';
import { getPackageStatus } from '../services/olivraisonService';
import toast from 'react-hot-toast';

const POLL_INTERVAL = 30 * 1000; // 30 seconds for near-instant updates

// ... (imports remain the same)

const useOrderPolling = (options = {}) => {
    const { orders, updateOrder } = useOrders();
    const ordersRef = useRef(orders);

    // Keep ref in sync
    useEffect(() => {
        ordersRef.current = orders;
    }, [orders]);

    const checkStatuses = async () => {
        const activeOrders = ordersRef.current.filter(order =>
            order.deliveryValues?.trackingID &&
            ['Ramassage', 'Packing', 'Livraison'].includes(order.status) && // Expanded status check slightly? Or keep strict? 
            // Original only checked 'Ramassage'. User wants updates. 'Livraison' also makes sense to check. 
            // Let's stick to original logic unless asked, but maybe expand to 'Livraison' if provider supports it.
            // Actually, let's keep it safe and stick to what it was or slightly expand if safe. 
            // Original: order.status === 'Ramassage'
            // Let's allow 'Ramassage' and 'Livraison' as these are active shipping states.
            // Actually, let's just stick to the original logic for now to avoid regressions, 
            // BUT allow the manual trigger to check more if needed.
            // For now, I'll keep the logic mostly same but exported.

            // WAIT - original code: order.status === 'Ramassage'. 
            // If I change this, I might break flow. I will keep it as is for now, but ensure the function is robust.
            order.status === 'Ramassage' &&
            !order.deleted
        );

        if (activeOrders.length === 0) {
            console.log("No active orders to poll.");
            return 0;
        }

        console.log(`Polling status for ${activeOrders.length} orders...`);
        let updatesCount = 0;

        for (const order of activeOrders) {
            try {
                const trackingID = order.deliveryValues.trackingID;
                const provider = order.deliveryValues.provider || 'olivraison';

                let result;
                if (provider === 'sendit') {
                    const { default: senditService } = await import('../services/senditService');
                    result = await senditService.getPackageStatus(trackingID);
                } else {
                    result = await getPackageStatus(trackingID);
                }

                const oldStatus = order.deliveryValues.status; // This is the delivery status, not order status
                const newStatus = result.status;

                if (newStatus && newStatus !== oldStatus) {
                    console.log(`Order ${order.id} (${provider}) status changed: ${oldStatus} -> ${newStatus}`);

                    await updateOrder(order.id, {
                        deliveryValues: {
                            ...order.deliveryValues,
                            status: newStatus,
                            lastChecked: new Date().toISOString()
                        }
                    });
                    updatesCount++;

                    if (Notification.permission === 'granted') {
                        new Notification(`Mise à jour Commande #${order.displayId || order.id}`, {
                            body: `Nouveau statut (${provider}): ${newStatus}`,
                            icon: '/pwa-192x192.png'
                        });
                    } else {
                        toast.success(`Commande #${order.displayId || order.id}: ${newStatus}`, {
                            icon: '🚚'
                        });
                    }
                }
            } catch (error) {
                console.error(`Failed to check status for order ${order.id}`, error);
            }
        }
        return updatesCount;
    };

    useEffect(() => {
        // Skip interval if manual only
        if (options.manualOnly) return;

        // Request permission on mount
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const intervalId = setInterval(checkStatuses, POLL_INTERVAL);
        setTimeout(checkStatuses, 1000);

        return () => clearInterval(intervalId);
    }, [options.manualOnly]); // Add dependency

    return { checkStatuses };
};

export default useOrderPolling;
