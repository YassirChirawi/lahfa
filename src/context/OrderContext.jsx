import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, runTransaction } from 'firebase/firestore';

const OrderContext = createContext();

export const useOrders = () => useContext(OrderContext);

// Initial orders removed in favor of Firestore


import { useClients } from './ClientContext';
import { useProducts } from './ProductContext';

export const OrderProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { syncClientFromOrder } = useClients();
    const { decrementStock } = useProducts();

    // Helper: Log Action
    const logAction = async (action, orderId, details) => {
        try {
            await addDoc(collection(db, 'logs'), {
                action,
                orderId,
                details,
                timestamp: new Date().toISOString(),
                user: 'Admin' // Placeholder for now
            });
        } catch (e) {
            console.error("Error logging action:", e);
        }
    };

    useEffect(() => {
        // Subscribe to real-time updates
        const q = collection(db, 'orders');
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const ordersList = [];
            querySnapshot.forEach((doc) => {
                ordersList.push({ ...doc.data(), id: doc.id });
            });
            // Sort by date desc if needed, or rely on query
            setOrders(ordersList.sort((a, b) => new Date(b.date) - new Date(a.date)));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching orders:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addOrder = async (order) => {
        try {
            await runTransaction(db, async (transaction) => {
                // 1. Get the current counter
                const counterRef = doc(db, 'counters', 'orderCounter');
                const counterDoc = await transaction.get(counterRef);

                let newCount = 1;
                if (counterDoc.exists()) {
                    newCount = (counterDoc.data().count || 0) + 1;
                }

                // 2. Increment the counter
                transaction.set(counterRef, { count: newCount }, { merge: true });

                // 3. Generate sequential ID
                const displayId = `ORD-${newCount.toString().padStart(4, '0')}`;

                // 4. Create the new order
                const newOrderRef = doc(collection(db, 'orders')); // Auto-generate Firestore ID
                const newOrder = {
                    ...order,
                    displayId: displayId,
                    date: new Date().toISOString().split('T')[0],
                    status: order.status || 'Packing',
                    createdAt: new Date().toISOString()
                };

                transaction.set(newOrderRef, newOrder);

                // Note: Side effects (syncClient, stock) must be done AFTER transaction or handled carefully.
                // We'll perform them after successful commitment merely by relying on the code execution flow below,
                // but strictly speaking we can't return from void transaction easily to local variables unless we wrap.
                // However, transaction function can return values!
                return { newOrder, newId: newOrderRef.id };
            }).then(async ({ newOrder, newId }) => {
                // Side effects after successful transaction
                // Sync with Client Context
                await syncClientFromOrder({ ...newOrder, id: newId });

                // Decrement Stock if Product ID exists
                if (newOrder.productId) {
                    await decrementStock(newOrder.productId, newOrder.quantity || 1);
                }

                // Log Creation
                await logAction('ORDER_CREATED', newId, `Order #${displayId} created for ${newOrder.customer}`);
            });

        } catch (e) {
            console.error("Error adding document: ", e);
        }
    };

    const updateOrderStatus = async (id, newStatus) => {
        try {
            const orderRef = doc(db, 'orders', id);
            await updateDoc(orderRef, {
                status: newStatus
            });

            // Log Status Change
            const order = orders.find(o => o.id === id);
            const displayId = order?.displayId || id;
            await logAction('STATUS_CHANGED', id, `Order #${displayId} status changed to ${newStatus}`);
        } catch (e) {
            console.error("Error updating document: ", e);
        }
    };

    const updateOrder = async (id, updatedData) => {
        try {
            const orderRef = doc(db, 'orders', id);
            await updateDoc(orderRef, updatedData);

            // Sync with Client Context to ensure stats/details are up to date
            // We pass the merged data (we might need to fetch it first or just pass updatedData if it has enough info)
            // Ideally we should pass the full order object.
            // For now let's pass updatedData assuming it has phone/customer/amount.
            await syncClientFromOrder({ ...updatedData, date: updatedData.date || new Date().toISOString().split('T')[0] });
        } catch (e) {
            console.error("Error updating order: ", e);
        }
    };

    const deleteOrder = async (id) => {
        try {
            // Soft delete: just mark as deleted
            const orderRef = doc(db, 'orders', id);
            await updateDoc(orderRef, {
                deleted: true,
                deletedAt: new Date().toISOString()
            });
            await logAction('ORDER_DELETED', id, 'Order moved to trash');
        } catch (e) {
            console.error("Error deleting document: ", e);
        }
    };

    const restoreOrder = async (id) => {
        try {
            const orderRef = doc(db, 'orders', id);
            await updateDoc(orderRef, {
                deleted: false,
                deletedAt: null
            });
            await logAction('ORDER_RESTORED', id, 'Order restored from trash');
        } catch (e) {
            console.error("Error restoring document: ", e);
        }
    };

    // Hard delete for permanent cleanup if needed (optional, maybe distinct name)
    const permanentDeleteOrder = async (id) => {
        try {
            await deleteDoc(doc(db, 'orders', id));
        } catch (e) {
            console.error("Error permanently deleting document: ", e);
        }
    };

    const value = {
        orders,
        loading,
        addOrder,
        updateOrderStatus,
        updateOrder,
        deleteOrder,
        restoreOrder,
        permanentDeleteOrder
    };

    return (
        <OrderContext.Provider value={value}>
            {children}
        </OrderContext.Provider>
    );
};
