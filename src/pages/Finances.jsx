import React, { useState, useMemo } from 'react';
import { useOrders } from '../context/OrderContext';
import { useExpenses } from '../context/ExpenseContext';
import { DollarSign, TrendingUp, CreditCard, Activity, Plus, Trash2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

const KPICard = ({ title, value, icon: Icon, colorClass, subtext }) => (
    <div className="card p-6 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-2">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className={`text-2xl font-bold mt-1 ${title === 'Net Profit' ? (parseFloat(value) < 0 ? 'text-red-500' : 'text-green-500') : 'text-gray-900'}`}>{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${colorClass}`}>
                <Icon size={20} />
            </div>
        </div>
        {subtext && <p className="text-sm text-gray-400 mt-2">{subtext}</p>}
    </div>
);

const Finances = () => {
    const { orders } = useOrders();
    const { expenses, addExpense, deleteExpense } = useExpenses();
    const [newExpense, setNewExpense] = useState({ description: '', amount: '' });

    // --- KPI Calculations ---
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const ordersThisMonth = orders.filter(o => {
        const d = new Date(o.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const revenueThisMonth = ordersThisMonth
        .reduce((sum, o) => {
            if (o.status === 'Livré') {
                const amount = parseFloat(o.amount) || 0;
                const delivery = parseFloat(o.deliveryFee) || 0;
                return sum + Math.max(0, amount - delivery);
            }
            return sum;
        }, 0);

    const totalRevenue = orders.reduce((sum, o) => {
        if (o.status === 'Livré') {
            const amount = parseFloat(o.amount) || 0;
            const delivery = parseFloat(o.deliveryFee) || 0;
            return sum + Math.max(0, amount - delivery);
        }
        return sum;
    }, 0);

    const totalPendingRevenue = orders.reduce((sum, o) => {
        if (['Packing', 'Ramassage', 'Livraison'].includes(o.status)) {
            const amount = parseFloat(o.amount) || 0;
            const delivery = parseFloat(o.deliveryFee) || 0;
            return sum + Math.max(0, amount - delivery);
        }
        return sum;
    }, 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    // Active orders: not delivered, not cancelled/returned
    const activeOrders = orders.filter(o => ['Packing', 'Ramassage', 'Livraison'].includes(o.status)).length;

    // --- Chart Data Preparation ---

    // Revenue Trend (Last 7 Days)
    const revenueTrendData = useMemo(() => {
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            const dailyRevenue = orders
                .filter(o => o.date === dateStr)
                .reduce((sum, o) => {
                    if (o.status === 'Livré') {
                        const amount = parseFloat(o.amount) || 0;
                        const delivery = parseFloat(o.deliveryFee) || 0;
                        return sum + Math.max(0, amount - delivery);
                    }
                    return sum;
                }, 0);

            data.push({ name: dayLabel, revenue: dailyRevenue });
        }
        return data;
    }, [orders]);

    // Expenses Breakdown
    const expensesBreakdownData = useMemo(() => {
        const grouped = expenses.reduce((acc, e) => {
            const desc = e.description || 'Other';
            acc[desc] = (acc[desc] || 0) + parseFloat(e.amount || 0);
            return acc;
        }, {});

        return Object.entries(grouped).map(([name, value]) => ({ name, value }));
    }, [expenses]);


    // --- Handlers ---
    const handleAddExpense = (e) => {
        e.preventDefault();
        if (!newExpense.description || !newExpense.amount) return;
        addExpense({
            description: newExpense.description,
            amount: parseFloat(newExpense.amount),
            date: new Date().toISOString()
        });
        setNewExpense({ description: '', amount: '' });
    };

    return (
        <div className="space-y-8 p-8" style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
            {/* Header */}
            <div className="page-header">
                <h1>Finances & Analytics</h1>
                <p>Track revenue, expenses, and net profit.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <KPICard
                    title="Revenue (Month)"
                    value={`${revenueThisMonth.toFixed(2)} DH`}
                    icon={DollarSign}
                    colorClass="bg-blue-50 text-blue-600"
                />
                <KPICard
                    title="Net Profit"
                    value={`${netProfit.toFixed(2)} DH`}
                    icon={TrendingUp}
                    colorClass="bg-indigo-50 text-indigo-600"
                />
                <KPICard
                    title="Pending Total"
                    value={`${totalPendingRevenue.toFixed(2)} DH`}
                    icon={Activity}
                    colorClass="bg-orange-100 text-orange-700"
                />
                <KPICard
                    title="Total Expenses"
                    value={`${totalExpenses.toFixed(2)} DH`}
                    icon={CreditCard}
                    colorClass="bg-red-50 text-red-600"
                />
                <KPICard
                    title="Active Orders"
                    value={activeOrders}
                    icon={Activity}
                    colorClass="bg-yellow-50 text-yellow-600"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Area Chart: Revenue Trend */}
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend (Last 7 Days)</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <AreaChart data={revenueTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`${value} DH`, 'Revenue']}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#8884d8" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart: Expenses Breakdown */}
                <div className="card p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Expenses Breakdown</h3>
                    <div style={{ width: '100%', height: 300 }} className="flex justify-center items-center">
                        {expensesBreakdownData.length > 0 ? (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={expensesBreakdownData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {expensesBreakdownData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-gray-400 text-sm">No expenses recorded yet.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Expense Management Section (Collapsible or just below) */}
            <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Manage Expenses</h3>
                {/* Add Form */}
                <form onSubmit={handleAddExpense} className="flex flex-col sm:flex-row gap-4 mb-6 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium mb-1 text-gray-500">Description</label>
                        <input
                            type="text"
                            placeholder="Ex: Pub Facebook, Achat..."
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={newExpense.description}
                            onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                        />
                    </div>
                    <div className="w-full sm:w-32">
                        <label className="block text-sm font-medium mb-1 text-gray-500">Amount (DH)</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={newExpense.amount}
                            onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-medium w-full sm:w-auto">
                        <Plus size={18} /> Add
                    </button>
                </form>

                <div className="overflow-x-auto">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th className="text-right">Amount</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map(expense => (
                                <tr key={expense.id}>
                                    <td className="text-gray-500">{new Date(expense.date || new Date()).toLocaleDateString()}</td>
                                    <td className="font-medium text-gray-900">{expense.description}</td>
                                    <td className="text-red-500 font-medium text-right">- {parseFloat(expense.amount).toFixed(2)} DH</td>
                                    <td className="text-right">
                                        <button
                                            onClick={() => deleteExpense(expense.id)}
                                            className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {expenses.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center p-4 text-gray-500">No expenses recorded.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Finances;
