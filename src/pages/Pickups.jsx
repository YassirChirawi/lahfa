import React, { useState, useEffect } from 'react';
import { Truck, Calendar, Trash2, ExternalLink, Package, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPickups, cancelPickup } from '../services/senditService';
import { toast } from 'react-hot-toast';
import { useConfirmation } from '../context/ConfirmationContext';

const Pickups = () => {
    const [pickups, setPickups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState(null);
    const { confirm } = useConfirmation();

    useEffect(() => {
        fetchPickups();
    }, [page]);

    const fetchPickups = async () => {
        setLoading(true);
        try {
            const response = await getPickups(page);
            setPickups(response.data || response || []);
            setMeta(response.meta || null);
        } catch (error) {
            console.error("Fetch Pickups Error:", error);
            toast.error("Erreur lors de la récupération des ramassages");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!await confirm({
            title: 'Annuler le ramassage',
            message: 'Êtes-vous sûr de vouloir annuler cette demande de ramassage ?',
            confirmText: 'Annuler le ramassage',
            variant: 'danger'
        })) return;

        const toastId = toast.loading("Annulation en cours...");
        try {
            await cancelPickup(id);
            toast.success("Ramassage annulé avec succès", { id: toastId });
            fetchPickups(); // Refresh list
        } catch (error) {
            console.error("Cancel Pickup Error:", error);
            toast.error(error.message || "Erreur lors de l'annulation", { id: toastId });
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return "N/A";
        const str = dateValue.toString().replace(' ', 'T');
        const d = new Date(str);
        if (isNaN(d.getTime())) return dateValue;
        return d.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Truck className="text-orange-600" />
                    Gestion des Ramassages Sendit
                </h1>
                <button
                    onClick={() => fetchPickups()}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Actualiser
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="p-4 font-semibold text-gray-600">ID</th>
                                <th className="p-4 font-semibold text-gray-600">Date</th>
                                <th className="p-4 font-semibold text-gray-600">Contact</th>
                                <th className="p-4 font-semibold text-gray-600">Adresse</th>
                                <th className="p-4 font-semibold text-gray-600">Colis</th>
                                <th className="p-4 font-semibold text-gray-600">Statut</th>
                                <th className="p-4 font-semibold text-right text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {Array(7).fill(0).map((_, j) => (
                                            <td key={j} className="p-4"><div className="h-4 bg-gray-200 rounded w-full"></div></td>
                                        ))}
                                    </tr>
                                ))
                            ) : pickups.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-gray-500">
                                        Aucun ramassage trouvé.
                                    </td>
                                </tr>
                            ) : (
                                pickups.map((pickup, index) => {
                                    const deliveryList = Array.isArray(pickup.deliveries)
                                        ? pickup.deliveries
                                        : (typeof pickup.deliveries === 'object' && pickup.deliveries !== null ? Object.keys(pickup.deliveries) : []);
                                    const deliveryCount = pickup.deliveries_count || deliveryList.length;

                                    return (
                                        <tr key={pickup.id || index} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-sm font-medium">#{pickup.id}</td>
                                            <td className="p-4 text-sm">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Calendar size={14} />
                                                    {formatDate(pickup.created_at || pickup.date)}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm">
                                                <div className="font-semibold text-gray-800">{pickup.name}</div>
                                                <div className="text-xs text-gray-500">{pickup.phone}</div>
                                            </td>
                                            <td className="p-4 text-sm">
                                                <div className="max-w-xs truncate text-gray-600" title={pickup.address}>
                                                    {pickup.address}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Package size={14} className="text-orange-600" />
                                                    <span className="font-bold">{deliveryCount}</span>
                                                </div>
                                                {deliveryList.length > 0 && (
                                                    <div className="text-[10px] text-gray-400 mt-1 max-w-[150px] truncate">
                                                        {deliveryList.join(', ')}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(pickup.status)}`}>
                                                    {pickup.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleDelete(pickup.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Annuler le ramassage"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta && meta.last_page > 1 && (
                    <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Page {page} sur {meta.last_page} ({meta.total} ramassages)
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                                disabled={page === meta.last_page}
                                className="p-2 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Pickups;
