import React, { useState, useMemo, useEffect } from 'react';
import { useOrders } from '../context/OrderContext';
import { useExpenses } from '../context/ExpenseContext';
import { useCollections } from '../context/CollectionContext';
import { DollarSign, TrendingUp, CreditCard, Activity, Plus, Trash2, Calendar, PieChart as PieChartIcon, Percent, AlertCircle, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'; // Removed BarChart/Bar as unused
import Modal from '../components/Modal';
import FloatingActionButton from '../components/FloatingActionButton';
import { motion } from 'framer-motion';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const EXPENSE_CATEGORIES = ['Marketing', 'Stock', 'Livraison', 'Salaire', 'Autre'];

const KPICard = ({ title, value, icon: Icon, colorClass, subtext, alert }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`card p-6 flex flex-col justify-between h-full ${alert ? 'border-red-300 ring-2 ring-red-100' : ''}`}
    >
        <div className="flex justify-between items-start mb-2">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className={`text-2xl font-bold mt-1 ${title.includes('Bénéfice') ? (parseFloat(value) < 0 ? 'text-red-500' : 'text-green-500') : 'text-gray-900'}`}>{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${colorClass}`}>
                <Icon size={20} />
            </div>
        </div>
        {subtext && <p className="text-sm text-gray-400 mt-2">{subtext}</p>}
    </motion.div>
);

const Finances = () => {
    const { orders: allOrders } = useOrders();
    const orders = useMemo(() => allOrders.filter(o => !o.deleted), [allOrders]);
    const { expenses, addExpense, deleteExpense } = useExpenses();
    const { collections, addCollection } = useCollections();

    // UI States
    const [activeTab, setActiveTab] = useState('global'); // 'global' | 'collections'
    const [selectedCollectionId, setSelectedCollectionId] = useState('');

    // Form States
    const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Autre', collectionId: '' });

    // Modals
    const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false); // New modal for expenses

    const [newCollection, setNewCollection] = useState({ name: '', startDate: '', endDate: '' });

    // Set default selected collection to the most recent one on load
    useEffect(() => {
        if (collections.length > 0 && !selectedCollectionId) {
            setSelectedCollectionId(collections[0].id);
        }
    }, [collections, selectedCollectionId]);

    // --- Helpers ---
    const calculateStats = (filteredOrders, filteredExpenses) => {
        const revenue = filteredOrders.reduce((sum, o) => {
            if (o.status === 'Livré') {
                const amount = parseFloat(o.amount) || 0;
                const delivery = parseFloat(o.deliveryFee) || 0;
                return sum + Math.max(0, amount - delivery);
            }
            return sum;
        }, 0);

        const expensesTotal = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        const netProfit = revenue - expensesTotal;
        const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

        // Return Rate
        const totalClosedOrders = filteredOrders.filter(o => ['Livré', 'Retour'].includes(o.status)).length;
        const returnedOrders = filteredOrders.filter(o => o.status === 'Retour').length;
        const returnRate = totalClosedOrders > 0 ? (returnedOrders / totalClosedOrders) * 100 : 0;

        // Marketing Spend (if categories used)
        const marketingSpend = filteredExpenses
            .filter(e => e.category === 'Marketing')
            .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

        // CPA (Cost Per Acquisition) - Approx: Marketing / Delivered orders
        const deliveredCount = filteredOrders.filter(o => o.status === 'Livré').length;
        const cpa = deliveredCount > 0 ? marketingSpend / deliveredCount : 0;

        return { revenue, expensesTotal, netProfit, margin, returnRate, marketingSpend, cpa, deliveredCount };
    };

    // --- DATA PREPARATION: Global ---
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const globalOrdersThisMonth = orders.filter(o => {
        const d = new Date(o.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const globalStats = calculateStats(orders, expenses);
    const monthStats = calculateStats(globalOrdersThisMonth, expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }));

    const totalPendingRevenue = orders.reduce((sum, o) => {
        if (['Packing', 'Ramassage', 'Livraison'].includes(o.status)) {
            const amount = parseFloat(o.amount) || 0;
            const delivery = parseFloat(o.deliveryFee) || 0;
            return sum + Math.max(0, amount - delivery);
        }
        return sum;
    }, 0);

    // --- DATA PREPARATION: Collections ---
    const currentCollection = collections.find(c => c.id === selectedCollectionId);

    const collectionStats = useMemo(() => {
        if (!currentCollection) return null;

        const start = new Date(currentCollection.startDate);
        const end = new Date(currentCollection.endDate);
        end.setHours(23, 59, 59, 999);

        const colOrders = orders.filter(o => {
            const d = new Date(o.date);
            return d >= start && d <= end;
        });

        const colExpenses = expenses.filter(e => {
            if (e.collectionId === currentCollection.id) return true;
            if (!e.collectionId) {
                const d = new Date(e.date);
                return d >= start && d <= end;
            }
            return false;
        });

        return {
            ...calculateStats(colOrders, colExpenses),
            orders: colOrders, // Expose for export
            expenses: colExpenses
        };
    }, [currentCollection, orders, expenses]);

    // --- Chart Data ---
    const revenueTrendData = useMemo(() => {
        const data = [];
        const days = 7;
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayLabel = date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });

            const dailyRevenue = orders
                .filter(o => o.date === dateStr && o.status === 'Livré')
                .reduce((sum, o) => sum + (parseFloat(o.amount) || 0) - (parseFloat(o.deliveryFee) || 0), 0);
            data.push({ name: dayLabel, revenue: dailyRevenue });
        }
        return data;
    }, [orders]);

    const expensesBreakdownData = useMemo(() => {
        const targetExpenses = activeTab === 'collections' && currentCollection && collectionStats
            ? collectionStats.expenses
            : expenses;

        const grouped = targetExpenses.reduce((acc, e) => {
            const cat = e.category || 'Autre';
            acc[cat] = (acc[cat] || 0) + parseFloat(e.amount || 0);
            return acc;
        }, {});

        return Object.entries(grouped).map(([name, value]) => ({ name, value }));
    }, [expenses, activeTab, currentCollection, collectionStats]);


    // --- Handlers ---
    const handleAddExpense = (e) => {
        e.preventDefault();
        if (!newExpense.description || !newExpense.amount) return;

        addExpense({
            description: newExpense.description,
            amount: parseFloat(newExpense.amount),
            category: newExpense.category,
            collectionId: newExpense.collectionId,
        });
        setNewExpense({ description: '', amount: '', category: 'Autre', collectionId: '' });
        setIsExpenseModalOpen(false); // Close modal after add
    };

    const handleCreateCollection = async (e) => {
        e.preventDefault();
        if (!newCollection.name || !newCollection.startDate || !newCollection.endDate) return;

        try {
            await addCollection(newCollection);
            setNewCollection({ name: '', startDate: '', endDate: '' });
            setIsCollectionModalOpen(false);
        } catch (error) {
            alert("Erreur lors de la création de la collection");
        }
    };

    const handleExportCSV = () => {
        if (!currentCollection || !collectionStats) return;

        // 1. Export Summary
        const summary = [
            ['Rapport Collection', currentCollection.name],
            ['Période', `${currentCollection.startDate} au ${currentCollection.endDate}`],
            ['Chiffre d\'Affaires', collectionStats.revenue],
            ['Dépenses', collectionStats.expensesTotal],
            ['Bénéfice Net', collectionStats.netProfit],
            ['Marge %', collectionStats.margin],
            []
        ];

        // 2. Export Expenses Linked
        const expenseHeaders = ['Date', 'Description', 'Categorie', 'Montant'];
        const expenseRows = collectionStats.expenses.map(e => [
            new Date(e.date).toLocaleDateString(),
            e.description,
            e.category,
            e.amount
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + summary.map(e => e.join(",")).join("\n")
            + "\nDETAILS DEPENSES\n"
            + expenseHeaders.join(",") + "\n"
            + expenseRows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Rapport_${currentCollection.name.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 p-4 md:p-8" style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', paddingBottom: '80px' }}>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Finances</h1>
                    <p className="text-gray-500 mt-1 hidden md:block">Suivez vos revenus, dépenses et bénéfices.</p>
                </div>

                {/* Tabs */}
                <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('global')}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'global' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Vue Globale
                    </button>
                    <button
                        onClick={() => setActiveTab('collections')}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'collections' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Par Collection
                    </button>
                </div>
            </div>

            {/* --- GLOBAL VIEW CONTENT --- */}
            {activeTab === 'global' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                        <KPICard title="CA Total (Global)" value={`${globalStats.revenue.toFixed(2)} DH`} icon={DollarSign} colorClass="bg-indigo-50 text-indigo-600" />
                        <KPICard title="CA (Mois actuel)" value={`${monthStats.revenue.toFixed(2)} DH`} icon={DollarSign} colorClass="bg-blue-50 text-blue-600" />
                        <KPICard title="Bénéfice Net (Total)" value={`${globalStats.netProfit.toFixed(2)} DH`} icon={TrendingUp} colorClass="bg-green-50 text-green-600" subtext={`Marge: ${globalStats.margin.toFixed(1)}%`} />
                        <KPICard title="Revenus en Attente" value={`${totalPendingRevenue.toFixed(2)} DH`} icon={Activity} colorClass="bg-orange-50 text-orange-600" />
                        <KPICard title="Dépenses Totales" value={`${globalStats.expensesTotal.toFixed(2)} DH`} icon={CreditCard} colorClass="bg-red-50 text-red-600" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="card p-4 md:p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Évolution du Revenu (7 jours)</h3>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <AreaChart data={revenueTrendData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} stroke="#9CA3AF" />
                                        <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="#9CA3AF" />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                        <Area type="monotone" dataKey="revenue" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="card p-4 md:p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Dépenses par Catégorie</h3>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={expensesBreakdownData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                            {expensesBreakdownData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* --- COLLECTIONS VIEW CONTENT --- */}
            {activeTab === 'collections' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    {/* Controls */}
                    <div className="card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
                            <div className="relative w-full md:w-auto">
                                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Collection</label>
                                <select
                                    value={selectedCollectionId}
                                    onChange={(e) => setSelectedCollectionId(e.target.value)}
                                    className="block w-full md:w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border bg-white"
                                >
                                    {collections.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                    {collections.length === 0 && <option>Aucune collection</option>}
                                </select>
                            </div>
                            {currentCollection && (
                                <div className="text-sm text-gray-500 md:mt-5 text-center md:text-left">
                                    <span className="font-medium">{new Date(currentCollection.startDate).toLocaleDateString()}</span>
                                    {' '}&rarr;{' '}
                                    <span className="font-medium">{new Date(currentCollection.endDate).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button
                                onClick={handleExportCSV}
                                className="flex-1 md:flex-none btn-secondary flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg"
                                disabled={!currentCollection}
                            >
                                <Download size={18} /> Export
                            </button>
                            <button
                                onClick={() => setIsCollectionModalOpen(true)}
                                className="flex-1 md:flex-none btn-primary flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                            >
                                <Plus size={18} /> Nouvelle
                            </button>
                        </div>
                    </div>

                    {currentCollection && collectionStats ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                <KPICard title="Chiffre d'Affaires" value={`${collectionStats.revenue.toFixed(2)} DH`} icon={DollarSign} colorClass="bg-blue-50 text-blue-600" />
                                <KPICard title="Dépenses Totales" value={`${collectionStats.expensesTotal.toFixed(2)} DH`} icon={CreditCard} colorClass="bg-red-50 text-red-600" />
                                <KPICard title="Bénéfice Net" value={`${collectionStats.netProfit.toFixed(2)} DH`} icon={TrendingUp} colorClass="bg-green-50 text-green-600" subtext={`${collectionStats.margin.toFixed(1)}% Marge`} />
                                <KPICard
                                    title="Taux de Retour"
                                    value={`${collectionStats.returnRate.toFixed(1)}%`}
                                    icon={AlertCircle}
                                    colorClass={collectionStats.returnRate > 15 ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-600"}
                                    alert={collectionStats.returnRate > 20}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <KPICard title="Budget Marketing" value={`${collectionStats.marketingSpend.toFixed(2)} DH`} icon={PieChartIcon} colorClass="bg-purple-50 text-purple-600" subtext={`CPA: ${collectionStats.cpa.toFixed(2)} DH / Commande`} />
                                <KPICard title="Commandes Livrées" value={collectionStats.deliveredCount} icon={Activity} colorClass="bg-indigo-50 text-indigo-600" />
                                <div className="card p-6 flex flex-col justify-center items-center text-center text-gray-400 border-2 border-dashed border-gray-200 bg-gray-50/50">
                                    <p>ROAS (Retour Pub) requiert des données externes</p>
                                    <small>Bientôt disponible</small>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            Sélectionnez ou créez une collection pour voir les stats.
                        </div>
                    )}
                </motion.div>
            )}

            {/* --- EXPENSE MANAGEMENT (Desktop List) --- */}
            <div className="card p-4 md:p-6 mt-8 hidden md:block">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Dernières Dépenses</h3>
                    <button
                        onClick={() => setIsExpenseModalOpen(true)}
                        className="btn-primary flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700"
                    >
                        <Plus size={16} /> Ajouter
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                            <tr>
                                <th className="px-4 py-2">Date</th>
                                <th className="px-4 py-2">Description</th>
                                <th className="px-4 py-2">Catégorie</th>
                                <th className="px-4 py-2">Collection</th>
                                <th className="px-4 py-2 text-right">Montant</th>
                                <th className="px-4 py-2 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {expenses.slice(0, 10).map(expense => {
                                const colName = collections.find(c => c.id === expense.collectionId)?.name || '-';
                                return (
                                    <tr key={expense.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-gray-500">{new Date(expense.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-2 font-medium text-gray-900">{expense.description}</td>
                                        <td className="px-4 py-2">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">{expense.category || 'Autre'}</span>
                                        </td>
                                        <td className="px-4 py-2 text-gray-500 text-xs">{colName}</td>
                                        <td className="px-4 py-2 text-red-500 font-medium text-right text-base">- {parseFloat(expense.amount).toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right">
                                            <button onClick={() => deleteExpense(expense.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile FAB */}
            <FloatingActionButton onClick={() => setIsExpenseModalOpen(true)} />

            {/* --- ADD EXPENSE MODAL (Mobile + Desktop) --- */}
            <Modal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                title="Ajouter une Dépense"
            >
                <form onSubmit={handleAddExpense} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-500">Description</label>
                        <input
                            type="text"
                            placeholder="Ex: Pub Facebook, Emballage..."
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={newExpense.description}
                            onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-500">Montant (DH)</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={newExpense.amount}
                            onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-500">Catégorie</label>
                        <select
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                            value={newExpense.category}
                            onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                        >
                            {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-500">Collection</label>
                        <select
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                            value={newExpense.collectionId}
                            onChange={e => setNewExpense({ ...newExpense, collectionId: e.target.value })}
                        >
                            <option value="">Général (Aucune)</option>
                            {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="pt-4">
                        <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-bold text-lg shadow-lg shadow-indigo-200">
                            <Plus size={20} /> Ajouter
                        </button>
                    </div>
                </form>
            </Modal>

            {/* --- CREATE COLLECTION MODAL --- */}
            <Modal
                isOpen={isCollectionModalOpen}
                onClose={() => setIsCollectionModalOpen(false)}
                title="Nouvelle Collection"
            >
                <form onSubmit={handleCreateCollection} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600">Nom de la Collection</label>
                        <input
                            type="text"
                            placeholder="Ex: Collection Hiver 2024"
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            value={newCollection.name}
                            onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-600">Date de Début</label>
                            <input
                                type="date"
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                value={newCollection.startDate}
                                onChange={(e) => setNewCollection({ ...newCollection, startDate: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-600">Date de Fin</label>
                            <input
                                type="date"
                                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                value={newCollection.endDate}
                                onChange={(e) => setNewCollection({ ...newCollection, endDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsCollectionModalOpen(false)} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
                        <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">Créer</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Finances;
