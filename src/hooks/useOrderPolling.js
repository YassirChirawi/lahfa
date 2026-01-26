import { useEffect, useRef } from 'react';
import { useOrders } from '../context/OrderContext';
import { getPackageStatus } from '../services/olivraisonService';
import toast from 'react-hot-toast';

const POLL_INTERVAL = 30 * 1000; // 30 seconds for near-instant updates

const useOrderPolling = () => {
    const { orders, updateOrder } = useOrders();
    const ordersRef = useRef(orders);

    // Keep ref in sync to use latest orders in interval without resetting it
    useEffect(() => {
        ordersRef.current = orders;
    }, [orders]);

    useEffect(() => {
        const checkStatuses = async () => {
            const activeOrders = ordersRef.current.filter(order =>
                order.deliveryValues?.trackingID &&
                order.status === 'Ramassage' && // Only check active shipping status
                !order.deleted
            );

            if (activeOrders.length === 0) return;

            console.log(`Polling status for ${activeOrders.length} orders...`);

            for (const order of activeOrders) {
                try {
                    const trackingID = order.deliveryValues.trackingID;
                    const result = await getPackageStatus(trackingID);

                    // Check if status changed
                    // Mapping Olivraison status to local status if needed, or just notifying
                    const oldStatus = order.deliveryValues.status;
                    const newStatus = result.status;

                    if (newStatus && newStatus !== oldStatus) {
                        console.log(`Order ${order.id} status changed: ${oldStatus} -> ${newStatus}`);

                        // Update local order
                        await updateOrder(order.id, {
                            deliveryValues: {
                                ...order.deliveryValues,
                                status: newStatus,
                                lastChecked: new Date().toISOString()
                            }
                        });

                        // Send Notification
                        if (Notification.permission === 'granted') {
                            new Notification(`Mise à jour Commande #${order.displayId || order.id}`, {
                                body: `Nouveau statut: ${newStatus}`,
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
        };

        // Request permission on mount
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const intervalId = setInterval(checkStatuses, POLL_INTERVAL);

        // Initial check after 5 seconds to catch updates on load (optional, maybe skip to avoid spam)
        // setTimeout(checkStatuses, 5000);

        return () => clearInterval(intervalId);
    }, []); // Empty dependency array to run effect once (using ref for orders)
};

export default useOrderPolling;
