import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

const OrderContext = createContext();

export const useOrders = () => useContext(OrderContext);

// Initial orders removed in favor of Firestore


export const OrderProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const deleteOrder = async (id) => {
        try {
            await deleteDoc(doc(db, 'orders', id));
        } catch (e) {
            console.error("Error deleting document: ", e);
        }
    };

    const value = {
        orders,
        loading,
        addOrder,
        updateOrderStatus,
        deleteOrder
    };

    return (
        <OrderContext.Provider value={value}>
            {children}
        </OrderContext.Provider>
    );
};
