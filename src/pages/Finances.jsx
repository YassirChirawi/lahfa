import React, { useState } from 'react';
import { useOrders } from '../context/OrderContext';
import { useExpenses } from '../context/ExpenseContext';
import { DollarSign, TrendingUp, Calendar, ShoppingBag, Plus, Trash2 } from 'lucide-react';

const KPICard = ({ title, value, icon: Icon, subtext }) => (
    <div className="card p-6 flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-sm text-gray-400 font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg bg-primary/10 text-primary`}>
                <Icon size={20} color="white" />
            </div>
        </div>
        {subtext && <p className="text-sm text-gray-400">{subtext}</p>}
    </div>
);

const Finances = () => {
    const { orders } = useOrders();
    const { expenses, addExpense, deleteExpense } = useExpenses();
    const [newExpense, setNewExpense] = useState({ description: '', amount: '' });

    // --- KPI Calculations ---
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const ordersToday = orders.filter(o => o.date.startsWith(today));
    const ordersThisMonth = orders.filter(o => {
        const d = new Date(o.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const revenueToday = ordersToday
        .reduce((sum, o) => sum + (o.status === 'Livré' ? o.amount : 0), 0);

    const revenueThisMonth = ordersThisMonth
        .reduce((sum, o) => sum + (o.status === 'Livré' ? o.amount : 0), 0);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.status === 'Livré' ? o.amount : 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const netProfit = totalRevenue - totalExpenses;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // --- Handlers ---
    const handleAddExpense = (e) => {
        e.preventDefault();
        if (!newExpense.description || !newExpense.amount) return;
        addExpense({
            description: newExpense.description,
            amount: parseFloat(newExpense.amount)
        });
        setNewExpense({ description: '', amount: '' });
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Finances & Rentabilité</h1>

            {/* Daily/Monthly KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <KPICard
                    title="Chiffre d'Affaires (Aujourd'hui)"
                    value={`${revenueToday.toFixed(2)} DH`}
                    icon={DollarSign}
                    subtext={`${ordersToday.length} commandes`}
                />
                <KPICard
                    title="Chiffre d'Affaires (Ce Mois)"
                    value={`${revenueThisMonth.toFixed(2)} DH`}
                    icon={Calendar}
                    subtext={`${ordersThisMonth.length} commandes`}
                />
                <KPICard
                    title="Total Dépenses"
                    value={`${totalExpenses.toFixed(2)} DH`}
                    icon={TrendingUp} // Using TrendingUp as a generic chart icon
                />
                <KPICard
                    title="Bénéfice Net"
                    value={`${netProfit.toFixed(2)} DH`}
                    icon={ShoppingBag} // Generic money bag
                    subtext={`Marge: ${netMargin.toFixed(1)}%`}
                />
            </div>

            {/* Main Content: Calculator & Expenses */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* Result Visualizer */}
                <div className="card p-6 h-fit bg-gradient-to-br from-slate-800 to-slate-900 border-none">
                    <h3 className="font-bold mb-4 text-xl">Résultat Net</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-green-400">
                            <span>Total Ventes (Livré)</span>
                            <span className="font-bold">+ {totalRevenue.toFixed(2)} DH</span>
                        </div>
                        <div className="flex justify-between items-center text-red-400">
                            <span>Total Charges</span>
                            <span className="font-bold">- {totalExpenses.toFixed(2)} DH</span>
                        </div>
                        <div className="h-px bg-white/20 my-4"></div>
                        <div className="flex justify-between items-center text-2xl font-bold">
                            <span>Résultat</span>
                            <span className={netProfit >= 0 ? 'text-green-500' : 'text-red-500'}>
                                {netProfit.toFixed(2)} DH
                            </span>
                        </div>
                    </div>
                </div>

                {/* Expense Manager */}
                <div className="card p-6 lg:col-span-2">
                    <h3 className="font-bold mb-4">Gestion des Charges</h3>

                    {/* Add Form */}
                    <form onSubmit={handleAddExpense} className="flex gap-4 mb-6 items-end">
                        <div className="flex-1">
                            <label className="block text-sm mb-1 text-gray-400">Description</label>
                            <input
                                type="text"
                                placeholder="Ex: Pub Facebook, Achat..."
                                className="w-full"
                                value={newExpense.description}
                                onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                            />
                        </div>
                        <div className="w-32">
                            <label className="block text-sm mb-1 text-gray-400">Montant (DH)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="w-full"
                                value={newExpense.amount}
                                onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn-primary flex items-center gap-2">
                            <Plus size={18} /> Ajouter
                        </button>
                    </form>

                    {/* Expenses List */}
                    <div className="orders-table-container">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Montant</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map(expense => (
                                    <tr key={expense.id}>
                                        <td>{new Date(expense.date).toLocaleDateString()}</td>
                                        <td>{expense.description}</td>
                                        <td className="text-red-400 font-medium">- {expense.amount.toFixed(2)} DH</td>
                                        <td>
                                            <button
                                                onClick={() => deleteExpense(expense.id)}
                                                className="icon-btn-sm text-red-400 hover:bg-red-500/10"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {expenses.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="text-center p-4 text-gray-500">Aucune dépense enregistrée.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Finances;
