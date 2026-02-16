import React, { useState, useMemo } from 'react';
import { useClients } from '../context/ClientContext';
import { useConfirmation } from '../context/ConfirmationContext';
import { useOrders } from '../context/OrderContext';
import { useClientSegmentation } from '../hooks/useClientSegmentation';
import { generateMarketingMessage } from '../services/aiService';
import { toast } from 'react-hot-toast';
import { Search, MapPin, Users, TrendingUp, Eye, UserPlus, Edit, Trash2, AlertTriangle, Sparkles, MessageCircle } from 'lucide-react';
import CustomerDetailModal from '../components/CustomerDetailModal';
import EditClientModal from '../components/EditClientModal';

export default function Clients() {
    const { clients, loading, addClient, updateClient, deleteClient } = useClients();
    const { confirm, prompt } = useConfirmation();
    const { orders } = useOrders();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [editingClient, setEditingClient] = useState(null);
    const [generatingId, setGeneratingId] = useState(null);

    // Use our new Smart Segmentation Hook
    const customersWithSegments = useClientSegmentation(clients, orders);

    const handleEditClient = (client) => {
        setEditingClient(client);
    };

    const handleSaveClient = async (id, data) => {
        await updateClient(id, data);
        setEditingClient(null);
    };

    const handleDeleteClient = async (id) => {
        if (await confirm({
            title: 'Delete Client',
            message: "Are you sure you want to delete this client? This cannot be undone.",
            confirmText: 'Delete',
            variant: 'danger'
        })) {
            await deleteClient(id);
        }
    };

    const handleGenerateMessage = async (client) => {
        setGeneratingId(client.id);
        try {
            const message = await generateMarketingMessage(client.segment?.name, client.name);

            // Copy to clipboard or open WhatsApp directly
            // For now, let's show in a toast with action
            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                <Sparkles className="h-10 w-10 text-indigo-500" />
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    AI Suggestion for {client.name}
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    {message}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex border-l border-gray-200">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(message);
                                toast.dismiss(t.id);
                                toast.success("Copié !");
                            }}
                            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            Copier
                        </button>
                    </div>
                </div>
            ), { duration: 5000 });

        } catch (error) {
            toast.error("Erreur de l'IA");
        } finally {
            setGeneratingId(null);
        }
    };

    const kpiStats = useMemo(() => {
        if (!clients.length) return { total: 0, ltv: 0, topCity: 'N/A' };

        const total = clients.length;
        const totalRevenue = clients.reduce((acc, c) => acc + (c.totalSpent || 0), 0);
        const ltv = total > 0 ? (totalRevenue / total) : 0;

        const cityCounts = clients.reduce((acc, c) => {
            const city = c.city || 'Unknown';
            acc[city] = (acc[city] || 0) + 1;
            return acc;
        }, {});

        const sortedCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);
        const topCity = sortedCities.length > 0 ? sortedCities[0][0] : 'N/A';

        return {
            total,
            ltv: ltv.toFixed(2),
            topCity
        };
    }, [clients]);

    const filteredCustomers = customersWithSegments.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone || '').includes(searchTerm) ||
        (c.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.segment?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddClient = async () => {
        const name = await prompt({
            title: 'Add Client',
            message: "Enter Client Name:",
            inputProps: { placeholder: 'Name' }
        });
        if (!name) return;

        const phone = await prompt({
            title: 'Add Client',
            message: "Enter Client Phone:",
            inputProps: { placeholder: 'Phone', type: 'tel' }
        });

        if (name && phone) {
            addClient({ name, phone, city: '', address: '', totalOrders: 0, totalSpent: 0 });
        }
    };

    return (
        <div className="space-y-8 p-8" style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 page-header">
                <div>
                    <h1>Customers & AI Insights</h1>
                    <p>View customer profiles, lifetime value, and smart segments.</p>
                </div>
                <button
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium"
                    onClick={handleAddClient}
                >
                    <UserPlus size={18} />
                    Add Client
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-6 flex flex-row items-center gap-4">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Clients</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{kpiStats.total}</p>
                    </div>
                </div>

                <div className="card p-6 flex flex-row items-center gap-4">
                    <div className="p-4 bg-green-50 text-green-600 rounded-xl">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Avg. Lifetime Value</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{kpiStats.ltv} DH</p>
                    </div>
                </div>

                <div className="card p-6 flex flex-row items-center gap-4">
                    <div className="p-4 bg-orange-50 text-orange-600 rounded-xl">
                        <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Top City</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1 capitalize">{kpiStats.topCity}</p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-11 pr-4 py-3 border-none leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
                        placeholder="Search by Name, Phone, City, or Segment (e.g., 'Champion')..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="card orders-table-container">
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Client</th>
                            <th>Segment (AI)</th>
                            <th>History</th>
                            <th>Total Spent</th>
                            <th>Last Order</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="px-6 py-5 text-center">Loading...</td></tr>
                        ) : filteredCustomers.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-5 text-center text-gray-500">No customers found.</td></tr>
                        ) : filteredCustomers.map((customer) => (
                            <tr key={customer.id} className={customer.stats?.returned > 0 ? 'bg-red-50' : ''}>
                                <td className="font-semibold text-gray-900">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            {customer.name}
                                            {customer.stats?.returned > 0 && (
                                                <div className="text-red-600" title={`Has ${customer.stats.returned} returned orders`}>
                                                    <AlertTriangle size={16} />
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 font-normal">{customer.phone}</span>
                                        <span className="text-xs text-gray-400 font-normal capitalize">{customer.city || '-'}</span>
                                    </div>
                                </td>
                                <td>
                                    {customer.segment && (
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${customer.segment.color}-100 text-${customer.segment.color}-800 border border-${customer.segment.color}-200`}>
                                            {customer.segment.name}
                                        </span>
                                    )}
                                </td>
                                <td className="text-gray-500">
                                    <div className="flex flex-col text-xs">
                                        <span>{customer.stats?.frequency || 0} Orders</span>
                                        {Object.entries(customer.stats || {}).map(([k, v]) => v > 0 && k !== 'total' && k !== 'recency' && k !== 'frequency' && k !== 'monetary' && k !== 'isLive' && (
                                            <span key={k} className={k === 'delivered' ? 'text-green-600' : 'text-red-500'}>
                                                {v} {k}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="font-medium text-green-600">
                                    {customer.stats?.monetary ? `${customer.stats.monetary.toFixed(2)} DH` : '0.00 DH'}
                                </td>
                                <td className="text-gray-500 text-sm">
                                    {customer.lastOrderDate || 'Never'}
                                    <div className="text-xs text-gray-400">
                                        {customer.stats?.recency !== 999 ? `${customer.stats.recency} days ago` : ''}
                                    </div>
                                </td>
                                <td className="text-right">
                                    {/* AI Action Button */}
                                    <button
                                        onClick={() => handleGenerateMessage(customer)}
                                        className="text-purple-600 hover:text-purple-900 p-2 hover:bg-purple-50 rounded-full transition-colors mr-1"
                                        title="AI Marketing Message"
                                        disabled={generatingId === customer.id}
                                    >
                                        {generatingId === customer.id ? (
                                            <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                                        ) : (
                                            <Sparkles className="h-4 w-4" />
                                        )}
                                    </button>

                                    <button
                                        onClick={() => handleEditClient(customer)}
                                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-full transition-colors mr-1"
                                        title="Edit"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClient(customer.id)}
                                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full transition-colors mr-1"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setSelectedCustomer(customer)}
                                        className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-full transition-colors"
                                        title="View Details"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <CustomerDetailModal
                isOpen={!!selectedCustomer}
                onClose={() => setSelectedCustomer(null)}
                customer={selectedCustomer}
            />

            <EditClientModal
                isOpen={!!editingClient}
                onClose={() => setEditingClient(null)}
                client={editingClient}
                onSave={handleSaveClient}
            />
        </div>
    );
}
