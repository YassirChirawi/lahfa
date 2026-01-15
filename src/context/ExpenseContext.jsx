import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

const ExpenseContext = createContext();

export const useExpenses = () => useContext(ExpenseContext);

export const ExpenseProvider = ({ children }) => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = collection(db, 'expenses');
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const expensesList = [];
            querySnapshot.forEach((doc) => {
                expensesList.push({ ...doc.data(), id: doc.id });
            });
            // Sort by date desc
            setExpenses(expensesList.sort((a, b) => new Date(b.date) - new Date(a.date)));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching expenses:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addExpense = async (expense) => {
        try {
            const newExpense = {
                ...expense,
                date: new Date().toISOString()
            };
            await addDoc(collection(db, 'expenses'), newExpense);
        } catch (e) {
            console.error("Error adding expense: ", e);
        }
    };

    const deleteExpense = async (id) => {
        try {
            await deleteDoc(doc(db, 'expenses', id));
        } catch (e) {
            console.error("Error deleting expense: ", e);
        }
    };

    const value = {
        expenses,
        loading,
        addExpense,
        deleteExpense
    };

    return (
        <ExpenseContext.Provider value={value}>
            {children}
        </ExpenseContext.Provider>
    );
};
