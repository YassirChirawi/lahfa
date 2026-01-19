import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, where, getDocs } from 'firebase/firestore';

const ClientContext = createContext();

export const useClients = () => useContext(ClientContext);

export const ClientProvider = ({ children }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = collection(db, 'clients');
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const clientsList = [];
            querySnapshot.forEach((doc) => {
                clientsList.push({ ...doc.data(), id: doc.id });
            });
            setClients(clientsList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching clients:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addClient = async (clientData) => {
        try {
            // Check if client with phone already exists? 
            // For now, we assume the UI handles uniqueness or we just add.
            // But let's check duplicates to be safe if called programmatically.
            const q = query(collection(db, 'clients'), where("phone", "==", clientData.phone));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // If exists, maybe update? For now, return the existing one ID.
                console.log("Client already exists with this phone.");
                return querySnapshot.docs[0].id;
            }

            const docRef = await addDoc(collection(db, 'clients'), {
                ...clientData,
                createdAt: new Date().toISOString(),
                totalOrders: 0,
                totalSpent: 0
            });
            return docRef.id;
        } catch (e) {
            console.error("Error adding client: ", e);
            throw e;
        }
    };

    const updateClientStats = async (clientId, orderAmount) => {
        try {
            const client = clients.find(c => c.id === clientId);
            if (!client) return;

            const clientRef = doc(db, 'clients', clientId);
            await updateDoc(clientRef, {
                totalOrders: (client.totalOrders || 0) + 1,
                totalSpent: (client.totalSpent || 0) + parseFloat(orderAmount),
                lastOrderDate: new Date().toISOString().split('T')[0]
            });
        } catch (e) {
            console.error("Error updating client stats: ", e);
        }
    };

    // Helper to find client by phone (synchronous from state for instant UI feedback)
    const findClientByPhone = (phone) => {
        return clients.find(c => c.phone === phone);
    };

    const syncClientFromOrder = async (order) => {
        try {
            if (!order.phone) return;

            // Check if client exists
            const q = query(collection(db, 'clients'), where("phone", "==", order.phone));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Update existing client
                const clientDoc = querySnapshot.docs[0];
                const currentData = clientDoc.data();

                const clientRef = doc(db, 'clients', clientDoc.id);
                await updateDoc(clientRef, {
                    totalOrders: (currentData.totalOrders || 0) + 1,
                    totalSpent: (currentData.totalSpent || 0) + parseFloat(order.amount || 0),
                    lastOrderDate: order.date,
                    // Update address/city if provided and newer? 
                    // Let's keep the latest address info
                    city: order.city || currentData.city,
                    address: order.address || currentData.address,
                    name: order.customer || currentData.name
                });
            } else {
                // Create new client
                await addDoc(collection(db, 'clients'), {
                    name: order.customer,
                    phone: order.phone,
                    city: order.city || '',
                    address: order.address || '',
                    createdAt: new Date().toISOString(),
                    totalOrders: 1,
                    totalSpent: parseFloat(order.amount || 0),
                    lastOrderDate: order.date
                });
            }
        } catch (e) {
            console.error("Error syncing client from order: ", e);
        }
    };

    const value = {
        clients,
        loading,
        addClient,
        updateClientStats,
        findClientByPhone,
        syncClientFromOrder
    };

    return (
        <ClientContext.Provider value={value}>
            {children}
        </ClientContext.Provider>
    );
};
