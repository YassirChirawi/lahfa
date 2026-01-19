import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy, deleteDoc } from 'firebase/firestore';

const ProductContext = createContext();

export function useProducts() {
    return useContext(ProductContext);
}

export function ProductProvider({ children }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'products'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProducts(productData);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const addProduct = async (productData) => {
        try {
            await addDoc(collection(db, 'products'), {
                ...productData,
                price: parseFloat(productData.price),
                stock: parseInt(productData.stock),
                createdAt: new Date()
            });
        } catch (error) {
            console.error("Error adding product: ", error);
            throw error;
        }
    };

    const updateProduct = async (id, data) => {
        try {
            const productRef = doc(db, 'products', id);
            await updateDoc(productRef, data);
        } catch (error) {
            console.error("Error updating product: ", error);
            throw error;
        }
    };

    const deleteProduct = async (id) => {
        try {
            await deleteDoc(doc(db, 'products', id));
        } catch (error) {
            console.error("Error deleting product: ", error);
            throw error;
        }
    }

    const updateStock = async (productId, quantityChange) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            const newStock = (product.stock || 0) - quantityChange;
            await updateProduct(productId, { stock: newStock });
        }
    };

    const value = {
        products,
        loading,
        addProduct,
        updateProduct,
        deleteProduct,
        updateStock
    };

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
}
