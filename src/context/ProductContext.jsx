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

    const adjustStock = async (productId, delta) => {
        try {
            const product = products.find(p => p.id === productId);
            if (!product) return;

            const currentStock = parseInt(product.stock) || 0;
            // Delta is change. If we sold 1, delta is -1.
            // But wait, convention: usually 'decrement' means passed positive number to subtract.
            // Let's stick to: adjustStock(id, quantityChange).
            // If I sold 2, change is -2.

            const newStock = Math.max(0, currentStock + delta);
            await updateProduct(productId, { stock: newStock });
        } catch (e) {
            console.error("Error adjusting stock: ", e);
        }
    };

    // Backward compatibility wrapper if needed, or just replace usage.
    const decrementStock = async (productId, quantity) => {
        return adjustStock(productId, -Math.abs(quantity));
    };

    const addPendingReturn = async (productId, quantity) => {
        try {
            const product = products.find(p => p.id === productId);
            if (!product) return;
            // Parse existing pendingStock, default to 0
            const currentPending = parseInt(product.pendingStock) || 0;
            const qtyToAdd = parseInt(quantity) || 1;

            await updateProduct(productId, { pendingStock: currentPending + qtyToAdd });
        } catch (e) {
            console.error("Error adding pending return: ", e);
        }
    };

    const resolvePendingReturn = async (productId, quantity) => {
        try {
            const product = products.find(p => p.id === productId);
            if (!product) return;

            const currentPending = parseInt(product.pendingStock) || 0;
            const currentStock = parseInt(product.stock) || 0;
            const qtyToResolve = parseInt(quantity) || 1;

            // Validate we don't resolve more than pending (unless forced, but safer to clamp)
            // If user resolves 1 but pending is 0, nothing happens to pending, but stock still up? 
            // Let's assume user knows what they are doing but prevent negative pending.
            const validResolveQty = Math.min(qtyToResolve, currentPending);

            if (validResolveQty <= 0) return;

            await updateProduct(productId, {
                pendingStock: currentPending - validResolveQty,
                stock: currentStock + validResolveQty
            });
        } catch (e) {
            console.error("Error resolving pending return: ", e);
        }
    };

    const cancelPendingReturn = async (productId, quantity) => {
        try {
            const product = products.find(p => p.id === productId);
            if (!product) return;

            const currentPending = parseInt(product.pendingStock) || 0;
            const qtyToCancel = parseInt(quantity) || 1;
            const newPending = Math.max(0, currentPending - qtyToCancel);

            await updateProduct(productId, { pendingStock: newPending });
        } catch (e) {
            console.error("Error cancelling pending return: ", e);
        }
    };

    const value = {
        products,
        loading,
        addProduct,
        updateProduct,
        deleteProduct,
        decrementStock,
        adjustStock,
        addPendingReturn,
        resolvePendingReturn,
        cancelPendingReturn
    };

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
};
