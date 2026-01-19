import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = collection(db, 'products');
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productsList = [];
            snapshot.forEach((doc) => {
                productsList.push({ ...doc.data(), id: doc.id });
            });
            setProducts(productsList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching products:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addProduct = async (productData) => {
        try {
            await addDoc(collection(db, 'products'), {
                ...productData,
                createdAt: new Date().toISOString(),
                stock: parseInt(productData.stock) || 0,
                price: parseFloat(productData.price) || 0
            });
        } catch (e) {
            console.error("Error adding product: ", e);
            throw e;
        }
    };

    const updateProduct = async (id, updatedData) => {
        try {
            const productRef = doc(db, 'products', id);
            await updateDoc(productRef, updatedData);
        } catch (e) {
            console.error("Error updating product: ", e);
            throw e;
        }
    };

    const deleteProduct = async (id) => {
        try {
            await deleteDoc(doc(db, 'products', id));
        } catch (e) {
            console.error("Error deleting product: ", e);
            throw e;
        }
    };

    const decrementStock = async (productId, quantity) => {
        try {
            // We need to fetch current stock to decrement accurately if we want to be atomic,
            // or rely on what we have in state if single user. For now, let's use the local state to find current, then update.
            // Ideally Firestore transactions are better for inventory.
            // Simplified MVP:
            const product = products.find(p => p.id === productId);
            if (!product) return;

            const newStock = Math.max(0, (product.stock || 0) - quantity);
            await updateProduct(productId, { stock: newStock });
        } catch (e) {
            console.error("Error decrementing stock: ", e);
        }
    };

    const value = {
        products,
        loading,
        addProduct,
        updateProduct,
        deleteProduct,
        decrementStock
    };

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
};
