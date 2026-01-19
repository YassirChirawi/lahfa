import React, { useState, useMemo } from 'react';
import { useClients } from '../context/ClientContext';
import { Search, MapPin, Users, TrendingUp, Eye, UserPlus } from 'lucide-react';
import CustomerDetailModal from '../components/CustomerDetailModal';

export default function Clients() {
    const { clients, loading, addClient } = useClients();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);

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

    const filteredCustomers = clients.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone || '').includes(searchTerm) ||
        (c.city || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddClient = () => {
        const name = prompt("Enter Client Name:");
        const phone = prompt("Enter Client Phone:");
        if (name && phone) {
            addClient({ name, phone, city: '', address: '', totalOrders: 0, totalSpent: 0 });
        }
    };

    return (
        <div className="space-y-8 p-8" style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 page-header">
                <div>
                    <h1>Customers</h1>
                    <p>View customer profiles, lifetime value, and history.</p>
                </div>
                {/* Optional Add Client Button (kept for functionality, though not in screenshot) */}
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
                        placeholder="Search by Name, Phone, or City..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden orders-table-container">
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Client</th>
                            <th>Phone</th>
                            <th>City</th>
                            <th>Total Orders</th>
                            <th>Total Spent</th>
                            <th>Last Order</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" className="px-6 py-5 text-center">Loading...</td></tr>
                        ) : filteredCustomers.length === 0 ? (
                            <tr><td colSpan="7" className="px-6 py-5 text-center text-gray-500">No customers found.</td></tr>
                        ) : filteredCustomers.map((customer) => (
                            <tr key={customer.id}>
                                <td className="font-semibold text-gray-900">{customer.name}</td>
                                <td className="text-gray-500">{customer.phone}</td>
                                <td className="text-gray-500">{customer.city || '-'}</td>
                                <td className="text-gray-500">{customer.totalOrders || customer.orderCount || 0}</td>
                                <td className="font-medium text-green-600">
                                    {customer.totalSpent ? `${customer.totalSpent.toFixed(2)} DH` : '0.00 DH'}
                                </td>
                                <td className="text-gray-500">{customer.lastOrderDate || '-'}</td>
                                <td className="text-right">
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
        </div>
    );
}
