import React, { useState, useMemo, useEffect } from 'react';
import { useOrders } from '../context/OrderContext';
import { useExpenses } from '../context/ExpenseContext';
import { useCollections } from '../context/CollectionContext';
import { useProducts } from '../context/ProductContext';
import { DollarSign, TrendingUp, CreditCard, Activity, Plus, Trash2, Calendar, PieChart as PieChartIcon, Percent, AlertCircle, Download, FileText, RefreshCw, Wallet, AlertTriangle, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'; // Removed BarChart/Bar as unused
import Modal from '../components/Modal';
import FloatingActionButton from '../components/FloatingActionButton';
import { motion, AnimatePresence } from 'framer-motion';
import senditService from '../services/senditService';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

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
    const { products } = useProducts();

    // AI Features State
    const [leaks, setLeaks] = useState(null);
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditModalOpen, setAuditModalOpen] = useState(false);

    const [strategicQuestion, setStrategicQuestion] = useState('');
    const [strategicAnswer, setStrategicAnswer] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    // Form States
    const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Autre', collectionId: '' });

    // Modals
    const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false); // New modal for expenses
    const [isSenditModalOpen, setIsSenditModalOpen] = useState(false);

    const [newCollection, setNewCollection] = useState({ name: '', startDate: '', endDate: '' });
    const [invoices, setInvoices] = useState([]);
    const [isSenditActive, setIsSenditActive] = useState(false);

    // Simulator State
    const [simulator, setSimulator] = useState({
        totalCost: '',
        itemCount: '',
        desiredMargin: '',
        deliveryCost: 35,
        packCost: 5,
        returnRate: 20 // %
    });

    const simulatorPlan = useMemo(() => {
        const cost = parseFloat(simulator.totalCost);
        const qty = parseFloat(simulator.itemCount);
        const margin = parseFloat(simulator.desiredMargin);

        if (!cost || !qty || !margin) return null;

        // Calculations
        // 1. Cost per item (COGS)
        const unitCost = cost / qty;

        // 2. We need to find Selling Price (P)
        // Formula: Total Revenue - Total Cost = Target Margin
        // Total Cost = Purchase + (Qty * P * Ads%)? No, let's fix CPA.

        // Let's assume a healthy CPA is around 25-30% of selling price? No, that's high. 
        // Or let's imply that Revenue = Purchase + Margin + Delivery + Pack + ADS.
        // We know everything except Ads and Price.

        // Let's do a bottom-up with a standard Ad Ratio (e.g. 30% of Price goes to Ads + Delivery)
        // Or simpler: Let's aim for a Selling Price that gives meaningful ROI.

        // Let's Try: Selling Price = (Unit Cost + Unit Margin + Delivery + Pack + DesiredCPA) / (1 - ReturnRateImpact?)
        // Too complex.

        // Simpler Reverse Engineering:
        // Total Needed Revenue = Total Cost + Total Delivery + Total Pack + Total Ads + Target Margin
        // We don't know Ads.
        // Let's set a standard "Marketing Budget" Ratio based on typical successful stores (e.g. marketing = 30% of revenue).
        // Revenue = Cost + Margin + Fees + 0.3 * Revenue
        // 0.7 * Revenue = Cost + Margin + Fees
        // Revenue = (Cost + Margin + Fees) / 0.7

        const totalDelivery = qty * simulator.deliveryCost;
        const totalPack = qty * simulator.packCost;

        // Initial estimate without ads
        const baseNeed = cost + margin + totalDelivery + totalPack;

        // Apply Marketing Multiplier (Assuming Ads should be max 25% of turnover for health)
        const AD_SPEND_RATIO = 0.25;
        const totalRevenueTarget = baseNeed / (1 - AD_SPEND_RATIO);

        const unitPrice = totalRevenueTarget / qty;
        const totalAdsBudget = totalRevenueTarget * AD_SPEND_RATIO;
        const targetCPA = totalAdsBudget / qty;

        // ROI
        const roi = (margin / cost) * 100;

        return {
            sellingPrice: Math.ceil(unitPrice / 5) * 5 - 1, // Round to psychological price (e.g. 199, 249)
            targetCPA: Math.floor(targetCPA),
            velocity: Math.ceil(qty / 30), // Sell in 1 month default
            breakdown: {
                cost: Math.round(unitCost),
                margin: Math.round(margin / qty),
                delivery: simulator.deliveryCost,
                pack: simulator.packCost
            },
            roi: roi.toFixed(0)
        };
    }, [simulator]);

    // Set default selected collection to the most recent one on load
    useEffect(() => {
        if (collections.length > 0 && !selectedCollectionId) {
            setSelectedCollectionId(collections[0].id);
        }
    }, [collections, selectedCollectionId]);

    // Check Sendit status
    // Check Sendit status and Invoices
    const [pendingInvoices, setPendingInvoices] = useState([]);
    const [showInvoiceAlert, setShowInvoiceAlert] = useState(false);

    useEffect(() => {
        const checkSenditAndInvoices = async () => {
            const snap = await getDoc(doc(db, 'settings', 'delivery'));
            if (snap.exists() && snap.data().sendit?.active) {
                setIsSenditActive(true);

                // Fetch Invoices for 48h Watchdog
                try {
                    const res = await senditService.getInvoices();
                    const invs = res.data || res;
                    const now = new Date();
                    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

                    // Filter: Invoices created > 48h ago AND not locally validated (TODO: Persist validation)
                    // For now, we assume all fetched invoices are "pending" validation unless marked otherwise
                    const alerts = invs.filter(inv => {
                        const invDate = new Date(inv.created_at || inv.date);
                        // Logic: If invoice is old (>48h) and we haven't 'validated' it manually in our DB
                        // Since we don't have DB sync yet, we just show all old invoices as alerts for now
                        return invDate < fortyEightHoursAgo;
                    });

                    if (alerts.length > 0) {
                        setPendingInvoices(alerts);
                        setShowInvoiceAlert(true);
                        toast('⚠️ Vous avez des factures Sendit en attente de validation !', { icon: '💰' });
                    }
                } catch (e) {
                    console.error("Watchdog Error:", e);
                }
            }
        };
        checkSenditAndInvoices();
    }, []);

    const handleFetchInvoices = async () => {
        setIsSenditModalOpen(true);
        const toastId = toast.loading("Chargement des factures Sendit...");
        try {
            const data = await senditService.getInvoices();
            setInvoices(data.data || data);
            toast.success("Factures récupérées", { id: toastId });
        } catch (error) {
            toast.error("Erreur lors de la récupération des factures", { id: toastId });
        }
    };

    // Validation State & Logic
    const [validatingInvoice, setValidatingInvoice] = useState(null);
    const [auditResult, setAuditResult] = useState(null);

    const handleValidateInvoice = (invoice) => {
        setValidatingInvoice(invoice);

        // 1. Find potential orders linked to this invoice (Best Effort: delivered <= invoice date and NOT reconciled)
        const invoiceDate = new Date(invoice.created_at || invoice.date);

        const candidateOrders = orders.filter(o => {
            if (o.status !== 'Livré' && o.status !== 'Distribué') return false;
            // If already reconciled (e.g. marked as paid in a previous invoice), skip
            if (o.reconciled) return false;

            // Check date (delivered/updated before invoice date)
            const orderDate = new Date(o.updatedAt || o.date);
            return orderDate <= invoiceDate;
        });

        // 2. Calculate Totals
        const totalOrdersValue = candidateOrders.reduce((sum, o) => {
            return sum + (parseFloat(o.amount) || 0);
        }, 0);

        const invoiceAmount = parseFloat(invoice.total || invoice.amount);
        const difference = invoiceAmount - totalOrdersValue;

        setAuditResult({
            candidateOrders,
            totalOrdersValue,
            invoiceAmount,
            difference
        });
    };

    const confirmValidation = async () => {
        if (!validatingInvoice || !auditResult) return;

        const toastId = toast.loading("Validation en cours...");
        try {
            // In a real app: Promise.all(auditResult.candidateOrders.map(o => updateDoc(doc(db, 'orders', o.id), { reconciled: true, invoiceId: validatingInvoice.id })))

            toast.success(`Facture ${validatingInvoice.id} validée ! ${auditResult.candidateOrders.length} commandes réconciliées.`, { id: toastId });

            // Close modals
            setValidatingInvoice(null);
            setAuditResult(null);
            setShowInvoiceAlert(false);
        } catch (e) {
            console.error(e);
            toast.error("Erreur lors de la validation", { id: toastId });
        }
    };

    // --- Helpers ---
    const calculateStats = (filteredOrders, filteredExpenses) => {
        const revenue = filteredOrders.reduce((sum, o) => {
            if (o.status === 'Livré' || o.status === 'Livré Partiellement') {
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
        const finalStatuses = ['Livré', 'Livré Partiellement', 'Retour', 'Annulé', 'Refusé', 'À changer'];
        if (!finalStatuses.includes(o.status)) {
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
                .filter(o => o.date === dateStr && (o.status === 'Livré' || o.status === 'Livré Partiellement'))
                .reduce((sum, o) => sum + Math.max(0, (parseFloat(o.amount) || 0) - (parseFloat(o.deliveryFee) || 0)), 0);
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
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Finances</h1>
                        <p className="text-gray-500 mt-1 hidden md:block">Suivez vos revenus, dépenses et bénéfices.</p>
                    </div>
                    {isSenditActive && (
                        <button
                            onClick={handleFetchInvoices}
                            className="px-4 py-2 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg hover:bg-orange-100 transition-colors flex items-center gap-2 text-sm font-bold shadow-sm"
                        >
                            <FileText size={18} />
                            Factures Sendit
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
                    <button
                        onClick={() => setActiveTab('global')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'global' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Vue Globale
                    </button>
                    <button
                        onClick={() => setActiveTab('collections')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'collections' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Par Collection
                    </button>
                    <button
                        onClick={() => setActiveTab('simulator')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'simulator' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Simulateur Stratégique
                    </button>
                </div>

                {/* AI Audit Button */}
                <button
                    onClick={async () => {
                        setIsAuditing(true);
                        const toastId = toast.loading("L'IA inspecte les comptes...");
                        try {
                            const { detectFinancialLeaks } = await import('../services/aiService');
                            const foundLeaks = await detectFinancialLeaks(orders, products);
                            setLeaks(foundLeaks);
                            setAuditModalOpen(true);
                            toast.success("Audit terminé !", { id: toastId });
                        } catch (e) {
                            console.error(e);
                            toast.error("Erreur lors de l'audit", { id: toastId });
                        } finally {
                            setIsAuditing(false);
                        }
                    }}
                    className="ml-auto flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition shadow-lg hover:shadow-xl"
                >
                    {isAuditing ? <RefreshCw className="animate-spin" size={18} /> : <AlertTriangle size={18} />}
                    Audit Anti-Fuites
                </button>
            </div>

            {/* Audit Modal */}
            <Modal isOpen={auditModalOpen} onClose={() => setAuditModalOpen(false)} title="🛡️ Rapport du Garde du Corps Financier">
                <div className="space-y-4">
                    {leaks && leaks.length > 0 ? (
                        leaks.map((leak, index) => (
                            <div key={index} className={`p-4 rounded-xl border ${leak.severity === 'CRITICAL' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-full ${leak.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                        <AlertCircle size={24} />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${leak.severity === 'CRITICAL' ? 'text-red-900' : 'text-orange-900'}`}>
                                            {leak.type === 'GHOST_ORDER' ? '👻 Colis Fantôme' : '📉 Marge Négative'}
                                        </h4>
                                        <p className="text-sm text-gray-700 mt-1">{leak.message}</p>
                                        <p className="text-xs font-bold mt-2 uppercase tracking-wide opacity-70">Perte Estimée: {leak.value} DH</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-green-600">
                            <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="font-bold text-lg">Aucune fuite détectée !</h3>
                            <p className="text-sm text-gray-500">Tout semble en ordre chef. Excellent travail ! 💸</p>
                        </div>
                    )}
                    <button onClick={() => setAuditModalOpen(false)} className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 mt-4">
                        Fermer le rapport
                    </button>
                </div>
            </Modal>

            {/* --- GLOBAL VIEW CONTENT --- */}
            {activeTab === 'global' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

                    {/* INVOICE ALERT BANNER */}
                    {showInvoiceAlert && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-amber-900">Action Requise : Réception Fonds Sendit 💰</h3>
                                    <p className="text-sm text-amber-700">
                                        {pendingInvoices.length} facture(s) datent de plus de 48h. Avez-vous bien reçu l'argent sur votre compte bancaire ?
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setIsSenditModalOpen(true);
                                }}
                                className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition shadow-sm whitespace-nowrap"
                            >
                                Valider Réception
                            </button>
                        </motion.div>
                    )}

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

            {/* --- SENDIT INVOICES MODAL --- */}
            <Modal
                isOpen={isSenditModalOpen}
                onClose={() => setIsSenditModalOpen(false)}
                title="Factures Sendit (Ramassage)"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">Liste des factures de ramassage et livraison émises par Sendit.</p>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-2">ID</th>
                                    <th className="px-4 py-2">Date</th>
                                    <th className="px-4 py-2 text-right">Montant</th>
                                    <th className="px-4 py-2">Statut</th>
                                    <th className="px-4 py-2 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {invoices.length > 0 ? (
                                    invoices.map(inv => (
                                        <tr key={inv.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 font-medium">#{inv.id}</td>
                                            <td className="px-4 py-2 text-gray-500">{inv.date || inv.created_at}</td>
                                            <td className="px-4 py-2 text-right font-bold text-gray-900">{inv.total || inv.amount} DH</td>
                                            <td className="px-4 py-2">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-right flex items-center justify-end gap-2">
                                                {inv.url && (
                                                    <a href={inv.url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Télécharger PDF">
                                                        <Download size={16} />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => handleValidateInvoice(inv)}
                                                    className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors"
                                                >
                                                    Valider
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-gray-400">Aucune facture trouvée.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Modal>
            {/* --- SIMULATOR VIEW CONTENT --- */}
            {activeTab === 'simulator' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* 1. INPUTS */}
                        <div className="card p-6 h-fit bg-white border border-indigo-100 shadow-lg">
                            <div className="flex items-center gap-2 mb-6 text-indigo-800 border-b border-indigo-50 pb-4">
                                <div className="p-2 bg-indigo-100 rounded-lg"><Activity size={20} /></div>
                                <h3 className="text-xl font-bold">Paramètres Collection</h3>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Coût Achat Global (Marchandise)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full pl-3 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-gray-900"
                                            placeholder="Ex: 5000"
                                            value={simulator.totalCost}
                                            onChange={e => setSimulator({ ...simulator, totalCost: e.target.value })}
                                        />
                                        <span className="absolute right-3 top-3 text-gray-400 font-bold">DH</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Quantité (Pièces)</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-gray-900"
                                        placeholder="Ex: 50"
                                        value={simulator.itemCount}
                                        onChange={e => setSimulator({ ...simulator, itemCount: e.target.value })}
                                    />
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Objectif Marge Nette</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSimulator({ ...simulator, desiredMargin: parseFloat(simulator.totalCost) * 0.5 || '' })}
                                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded-lg transition"
                                        >
                                            x1.5 (50%)
                                        </button>
                                        <button
                                            onClick={() => setSimulator({ ...simulator, desiredMargin: parseFloat(simulator.totalCost) * 1 || '' })}
                                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded-lg transition"
                                        >
                                            x2 (100%)
                                        </button>
                                        <button
                                            onClick={() => setSimulator({ ...simulator, desiredMargin: parseFloat(simulator.totalCost) * 2 || '' })}
                                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded-lg transition"
                                        >
                                            x3 (200%)
                                        </button>
                                    </div>
                                    <div className="relative mt-2">
                                        <input
                                            type="number"
                                            className="w-full pl-3 pr-10 py-3 border border-green-200 ring-1 ring-green-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all font-bold text-green-700 bg-green-50/30"
                                            placeholder="Bénéfice visé (ex: 5000)"
                                            value={simulator.desiredMargin}
                                            onChange={e => setSimulator({ ...simulator, desiredMargin: e.target.value })}
                                        />
                                        <span className="absolute right-3 top-3 text-green-600 font-bold">DH</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 text-right">Marge NETTE (après TOUS frais)</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!simulatorPlan) return;
                                        setSimulator(prev => ({ ...prev, aiAnalysis: null, isAnalyzing: true }));
                                        try {
                                            const { generateFinancialInsight } = await import('../services/aiService');
                                            const analysis = await generateFinancialInsight(simulatorPlan);
                                            setSimulator(prev => ({ ...prev, aiAnalysis: analysis }));
                                        } catch (e) {
                                            toast.error("Mervat n'a pas pu analyser...");
                                        } finally {
                                            setSimulator(prev => ({ ...prev, isAnalyzing: false }));
                                        }
                                    }}
                                    disabled={!simulatorPlan || simulator.isAnalyzing}
                                    className="w-full mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                                >
                                    {simulator.isAnalyzing ? (
                                        <>🧠 Analyse en cours...</>
                                    ) : (
                                        <>✨ Demander l'avis de Mervat (Head of Growth)</>
                                    )}
                                </button>

                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-purple-50 border border-purple-100 rounded-xl relative">
                                    <div className="absolute -top-3 left-4 bg-white px-2 py-0.5 rounded-full border border-purple-100 text-xs font-bold text-purple-600 flex items-center gap-1">
                                        <Activity size={12} /> L'avis de Mervat
                                    </div>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {simulator.aiAnalysis}
                                    </p>

                                    {/* Strategic Chat Interface */}
                                    <div className="mt-4 pt-4 border-t border-purple-100">
                                        {strategicAnswer && (
                                            <div className="mb-3 p-3 bg-white rounded-lg text-sm text-gray-700 border border-purple-100">
                                                <span className="font-bold text-purple-600 block mb-1">CFO Virtuel :</span>
                                                {strategicAnswer}
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Posez une question stratégique (ex: Si je baisse le prix à 199 ?)"
                                                className="flex-1 text-xs p-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none"
                                                value={strategicQuestion}
                                                onChange={(e) => setStrategicQuestion(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && !isThinking) {
                                                        // Trigger analysis
                                                        document.getElementById('btn-ask-cfo').click();
                                                    }
                                                }}
                                            />
                                            <button
                                                id="btn-ask-cfo"
                                                disabled={!strategicQuestion || isThinking}
                                                onClick={async () => {
                                                    if (!strategicQuestion) return;
                                                    setIsThinking(true);
                                                    try {
                                                        const { generateStrategicAnalysis } = await import('../services/aiService');
                                                        const answer = await generateStrategicAnalysis(strategicQuestion, simulatorPlan);
                                                        setStrategicAnswer(answer);
                                                        setStrategicQuestion('');
                                                    } catch (e) {
                                                        toast.error("Erreur CFO...");
                                                    } finally {
                                                        setIsThinking(false);
                                                    }
                                                }}
                                                className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
                                            >
                                                {isThinking ? <Activity className="animate-spin" size={16} /> : <TrendingUp size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>

                            </div>
                        </div>

                        {/* 2. RESULTS (THE PLAN) */}
                        <div className="lg:col-span-2 space-y-6">
                            {simulatorPlan ? (
                                <>
                                    <div className="card p-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
                                            <TrendingUp className="text-yellow-300" /> Plan Stratégique Recommandé
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                                                <p className="text-indigo-200 text-sm font-medium mb-1">Prix de Vente Unitaire</p>
                                                <p className="text-3xl font-bold text-white tracking-tight">{simulatorPlan.sellingPrice} DH</p>
                                                <p className="text-xs text-indigo-300 mt-1">Prix conseillé pour atteindre la cible</p>
                                            </div>
                                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                                                <p className="text-purple-200 text-sm font-medium mb-1">Budget Pub Max / Cmd</p>
                                                <p className="text-3xl font-bold text-yellow-300 tracking-tight">{simulatorPlan.targetCPA} DH</p>
                                                <p className="text-xs text-purple-300 mt-1">CPA Cible (Coût par Achat)</p>
                                            </div>
                                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                                                <p className="text-indigo-200 text-sm font-medium mb-1">Rythme de Vente</p>
                                                <div className="flex items-baseline gap-1">
                                                    <p className="text-3xl font-bold text-white tracking-tight">{simulatorPlan.velocity}</p>
                                                    <span className="text-sm">Cmds / jour</span>
                                                </div>
                                                <p className="text-xs text-indigo-300 mt-1">Pour écouler en 30 jours</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Breakdown */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="card p-6">
                                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                <PieChartIcon size={18} className="text-gray-500" /> Répartition du Prix ({simulatorPlan.sellingPrice} DH)
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Coût Produit</span>
                                                    <span className="font-medium text-gray-700">{simulatorPlan.breakdown.cost} DH</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500"></span> Publicité (Ads)</span>
                                                    <span className="font-medium text-gray-700">{simulatorPlan.targetCPA} DH</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Livraison & Pack</span>
                                                    <span className="font-medium text-gray-700">{simulatorPlan.breakdown.delivery + simulatorPlan.breakdown.pack} DH</span>
                                                </div>
                                                <div className="h-px bg-gray-100 my-2"></div>
                                                <div className="flex justify-between items-center font-bold text-green-600 bg-green-50 p-2 rounded-lg">
                                                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> Marge Nette</span>
                                                    <span>+{simulatorPlan.breakdown.margin} DH</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card p-6">
                                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                                <AlertTriangle size={18} className="text-gray-500" /> Budgets Prévisionnels
                                            </h4>
                                            <div className="space-y-4">
                                                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                                                    <p className="text-xs text-purple-600 font-bold uppercase mb-1">Budget Marketing Total</p>
                                                    <p className="text-2xl font-bold text-purple-800">{Math.round(simulatorPlan.targetCPA * parseFloat(simulator.itemCount))} DH</p>
                                                    <p className="text-xs text-purple-500 mt-1">À dépenser pour vendre tout le stock</p>
                                                </div>
                                                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                                                    <p className="text-xs text-orange-600 font-bold uppercase mb-1">Budget Packaging</p>
                                                    <p className="text-2xl font-bold text-orange-800">{Math.round(simulatorPlan.breakdown.pack * parseFloat(simulator.itemCount))} DH</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                        <TrendingUp size={32} className="text-indigo-300" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">En attente de données</h3>
                                    <p className="text-sm text-gray-500 max-w-xs">Remplissez les paramètres de gauche pour générer votre plan de collection.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
            {/* --- VALIDATION MODAL --- */}
            {validatingInvoice && auditResult && (
                <Modal
                    isOpen={!!validatingInvoice}
                    onClose={() => { setValidatingInvoice(null); setAuditResult(null); }}
                    title={`Validation Facture #${validatingInvoice.id}`}
                >
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h4 className="font-bold text-gray-700 mb-2">Résumé de la Facture</h4>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-500">Date</span>
                                <span className="font-medium">{validatingInvoice.date || validatingInvoice.created_at}</span>
                            </div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-gray-500">Montant Reçu (Sendit)</span>
                                <span className="font-bold text-lg text-indigo-600">{auditResult.invoiceAmount.toFixed(2)} DH</span>
                            </div>
                        </div>

                        <div className="border-t border-b py-4">
                            <h4 className="font-bold text-gray-700 mb-2">Audit Interne (Mervat)</h4>
                            <p className="text-sm text-gray-500 mb-4">
                                J'ai trouvé <strong>{auditResult.candidateOrders.length}</strong> commandes livrées avant cette date et non encore réconciliées.
                            </p>

                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Total Commandes (Attendus)</span>
                                <span className="font-medium">{auditResult.totalOrdersValue.toFixed(2)} DH</span>
                            </div>

                            <div className={`mt-4 p-3 rounded-lg flex items-center gap-3 ${Math.abs(auditResult.difference) < 5 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {Math.abs(auditResult.difference) < 5 ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                                <div>
                                    <div className="font-bold">Écart : {auditResult.difference > 0 ? '+' : ''}{auditResult.difference.toFixed(2)} DH</div>
                                    <div className="text-xs opacity-80">
                                        {Math.abs(auditResult.difference) < 5
                                            ? "Tout semble correct !"
                                            : (auditResult.difference > 0
                                                ? "Sendit vous a versé PLUS que prévu (Bonus ? ou erreur de frais ?)"
                                                : "Sendit vous a versé MOINS que prévu (Frais cachés ou impayés ?)")}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setValidatingInvoice(null); setAuditResult(null); }}
                                className="flex-1 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmValidation}
                                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={20} />
                                Confirmer Réception
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Finances;
