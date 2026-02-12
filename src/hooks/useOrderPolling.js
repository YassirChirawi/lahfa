import { useEffect, useRef } from 'react';
import { useOrders } from '../context/OrderContext';
import { useProducts } from '../context/ProductContext';
import { getPackageStatus } from '../services/olivraisonService';
import { mapSenditStatus, isReturnStatus } from '../utils/statusMapping';
import toast from 'react-hot-toast';

const POLL_INTERVAL = 30 * 1000;

const useOrderPolling = (options = {}) => {
    const { orders, updateOrder } = useOrders();
    const { products, addPendingReturn, cancelPendingReturn } = useProducts();

    const ordersRef = useRef(orders);
    const productsRef = useRef(products);

    // Keep refs in sync
    useEffect(() => {
        ordersRef.current = orders;
    }, [orders]);

    useEffect(() => {
        productsRef.current = products;
    }, [products]);

    const checkStatuses = async () => {
        const activeOrders = ordersRef.current.filter(order =>
            order.deliveryValues?.trackingID &&
            !order.deleted &&
            // Exclude only final statuses to ensure we catch all intermediate granular updates
            !['Livré', 'Livré Partiellement', 'Retour', 'Annulé', 'Refusé', 'À changer'].includes(order.status)
        );

        if (activeOrders.length === 0) return 0;

        console.log(`Polling status for ${activeOrders.length} orders...`);
        let updatesCount = 0;

        for (const order of activeOrders) {
            try {
                const trackingID = order.deliveryValues.trackingID;
                let provider = order.deliveryValues.provider;

                // Robust heuristic if provider is missing
                if (!provider) {
                    const tid = (trackingID || '').toString().trim().toUpperCase();
                    if (tid.startsWith('DH') || tid.startsWith('SNDT')) {
                        provider = 'sendit';
                    } else {
                        provider = 'olivraison';
                    }
                }

                let result;
                if (provider === 'sendit') {
                    const { default: senditService } = await import('../services/senditService');
                    result = await senditService.getPackageStatus(trackingID);
                } else {
                    result = await getPackageStatus(trackingID);
                }

                const newDeliveryStatus = result.status;
                const oldDeliveryStatus = order.deliveryValues.status;

                // 1. Check for status change
                if (newDeliveryStatus && newDeliveryStatus !== oldDeliveryStatus) {
                    const updates = {
                        deliveryValues: {
                            ...order.deliveryValues,
                            provider: provider, // PERSIST detected provider
                            status: newDeliveryStatus,
                            lastChecked: new Date().toISOString()
                        }
                    };

                    // 2. Map to Main Status if Sendit
                    if (provider === 'sendit') {
                        const mappedStatus = mapSenditStatus(newDeliveryStatus);
                        if (mappedStatus && mappedStatus !== order.status) {
                            updates.status = mappedStatus;

                            // 3. Handle Stock Logic for Returns
                            const previousStatus = order.status;
                            const newStatus = mappedStatus;
                            const currentProducts = productsRef.current;

                            // If moving TO a return status
                            if (isReturnStatus(newStatus) && !isReturnStatus(previousStatus)) {
                                const itemsToReturn = order.items || [{
                                    article: order.article,
                                    quantity: order.quantity || 1
                                }];

                                let returnedCount = 0;
                                for (const item of itemsToReturn) {
                                    // Logic matching Orders.jsx
                                    let product = currentProducts.find(p => p.id === item.productId);
                                    if (!product) product = currentProducts.find(p => p.name === (item.article || item.name));

                                    if (product) {
                                        await addPendingReturn(product.id, item.quantity || 1);
                                        returnedCount += (item.quantity || 1);
                                    }
                                }
                                if (returnedCount > 0) {
                                    if (returnedCount > 0) {
                                        toast(`${returnedCount} produits mis en "Retour" (Auto)`, {
                                            icon: '↩️',
                                            duration: 4000
                                        });
                                    }
                                }
                            }
                        }
                    }

                    await updateOrder(order.id, updates);
                    updatesCount++;

                    // Notifications
                    const notify = async () => {
                        if (Notification.permission === 'granted') {
                            const title = `Mise à jour Commande #${order.displayId || order.id}`;
                            const options = {
                                body: `Nouveau statut: ${newDeliveryStatus}`,
                                icon: '/pwa-192x192.png',
                                vibrate: [200, 100, 200]
                            };

                            try {
                                const registration = await navigator.serviceWorker.getRegistration();
                                if (registration) {
                                    registration.showNotification(title, options);
                                } else {
                                    new Notification(title, options);
                                }
                            } catch (e) {
                                new Notification(title, options);
                            }
                        } else {
                            toast.success(`Commande #${order.displayId || order.id}: ${newDeliveryStatus}`, {
                                icon: '🚚'
                            });
                        }
                    };
                    notify();
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
