import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

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
            const newOrder = {
                ...order,
                // Firestore creates its own ID, but we can store a display ID if we want
                // For now, let's keep the existing logic for display fields
                displayId: `ORD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
                date: new Date().toISOString().split('T')[0],
                status: order.status || 'Packing'
            };
            await addDoc(collection(db, 'orders'), newOrder);

            // Sync with Client Context
            await syncClientFromOrder(newOrder);

            // Decrement Stock if Product ID exists
            if (newOrder.productId) {
                await decrementStock(newOrder.productId, newOrder.quantity || 1);
            }
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
