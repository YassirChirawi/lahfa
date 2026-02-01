import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';

const CollectionContext = createContext();

export const useCollections = () => useContext(CollectionContext);

export const CollectionProvider = ({ children }) => {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = collection(db, 'collections');
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const cols = [];
            querySnapshot.forEach((doc) => {
                cols.push({ ...doc.data(), id: doc.id });
            });
            // Sort by startDate desc
            setCollections(cols.sort((a, b) => new Date(b.startDate) - new Date(a.startDate)));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching collections:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addCollection = async (colData) => {
        try {
            await addDoc(collection(db, 'collections'), colData);
        } catch (e) {
            console.error("Error adding collection: ", e);
            throw e;
        }
    };

    const updateCollection = async (id, data) => {
        try {
            await updateDoc(doc(db, 'collections', id), data);
        } catch (e) {
            console.error("Error updating collection: ", e);
            throw e;
        }
    };

    const deleteCollection = async (id) => {
        try {
            await deleteDoc(doc(db, 'collections', id));
        } catch (e) {
            console.error("Error deleting collection: ", e);
            throw e;
        }
    };

    const value = {
        collections,
        loading,
        addCollection,
        updateCollection,
        deleteCollection
    };

    return (
        <CollectionContext.Provider value={value}>
            {children}
        </CollectionContext.Provider>
    );
};
