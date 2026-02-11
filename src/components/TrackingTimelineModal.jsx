import React, { useState } from 'react';
import { X, Clock, MapPin, CheckCircle, AlertCircle, Package, Truck, Home, Copy, Check } from 'lucide-react';
import '../styles/modal.css';

const TrackingTimelineModal = ({ isOpen, onClose, trackingData, provider }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen || !trackingData) return null;

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            if (dateString.includes(',')) {
                return dateString; // Already formatted by Sendit
            }
            return new Date(dateString).toLocaleString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    };

    // Helper to translate status codes
    const getStatusLabel = (code) => {
        const statusMap = {
            'PENDING': 'En attente',
            'TO_PREPARE': 'À préparer',
            'NEW_DESTINATION': 'Nouvelle destination',
            'TO_PICKUP': 'Demande de ramassage',
            'PICKEDUP': 'Ramassé',
            'WAREHOUSE': 'Arrivé à l\'entrepôt',
            'TRANSIT': 'En transit',
            'DISTRIBUTED': 'Distribué',
            'DELIVERING': 'En cours de livraison',
            'UNREACHABLE': 'Injoignable',
            'POSTPONED': 'Reporté',
            'SCHEDULED': 'Programmé',
            'DELIVERED': 'Livré',
            'CANCELED': 'Annulé',
            'REJECTED': 'Refusé',
            'CREATED': 'Créé',
            'UPDATED': 'Mis à jour'
        };
        return statusMap[code?.toUpperCase()] || code || 'Inconnu';
    };

    // Helper to get icon and color based on status/event
    const getEventStyle = (status) => {
        const s = status?.toUpperCase() || '';
        if (s.includes('LIVRÉ') || s.includes('DELIVERED')) return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
        if (s.includes('RAMASSAGE') || s.includes('PICKED') || s.includes('PREPARE') || s.includes('PENDING')) return { icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' };
        if (s.includes('LIVRAISON') || s.includes('DELIVERING') || s.includes('OUT') || s.includes('TRANSIT')) return { icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-100' };
        if (s.includes('RETOUR') || s.includes('RETURN') || s.includes('CANCELED') || s.includes('REJECTED')) return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' };
        if (s.includes('ENTREPÔT') || s.includes('WAREHOUSE')) return { icon: Home, color: 'text-amber-600', bg: 'bg-amber-100' };
        if (s.includes('UNREACHABLE') || s.includes('POSTPONED')) return { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-100' };
        return { icon: MapPin, color: 'text-gray-600', bg: 'bg-gray-100' };
    };

    const handleCopy = () => {
        const code = trackingData.trackingID || trackingData.code;
        if (code) {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Extract history based on provider
    let history = [];
    if (provider === 'sendit') {
        const raw = trackingData.raw || trackingData;
        const data = raw.data || raw;
        history = data.audits || [];
    } else {
        history = trackingData.history || [];
    }

    const trackingCode = trackingData.trackingID || trackingData.code || 'N/A';

    return (
        <div className="modal-overlay">
            <div className="modal-content max-w-md w-full">
                <div className="modal-header">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Clock size={20} />
                        Suivi détaillé
                    </h2>
                    <button onClick={onClose} className="close-btn">
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body p-4 max-h-[600px] overflow-y-auto">
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center group relative overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                            style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '12px 12px' }}>
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Code de suivi</div>
                            <div className="font-mono font-bold text-2xl text-gray-800 tracking-tight">
                                {trackingCode}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 uppercase font-medium">
                                {provider}
                            </div>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-gray-400 hover:text-indigo-600 active:scale-95"
                            title="Copier le code"
                        >
                            {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                        </button>
                    </div>

                    <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 pb-4">
                        {history.length === 0 ? (
                            <div className="pl-6 text-gray-500 italic py-4">Aucun historique disponible</div>
                        ) : (
                            history.map((event, index) => {
                                // Extract the detailed status from the data object if available
                                const rawStatus = event.data?.status || event.status || event.event;
                                const statusLabel = getStatusLabel(rawStatus);

                                const date = event.created_at || event.date;
                                const user = event.user || 'Système';
                                const { icon: Icon, color, bg } = getEventStyle(rawStatus);

                                return (
                                    <div key={index} className="relative pl-8 group">
                                        {/* Connector Line Dot */}
                                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${bg} ${color} flex items-center justify-center z-10 shadow-sm group-hover:scale-110 transition-transform`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                        </div>

                                        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className={`font-bold ${color} text-sm uppercase tracking-wide`}>
                                                    {statusLabel}
                                                </div>
                                                <div className="text-xs text-gray-400 font-medium whitespace-nowrap bg-gray-50 px-2 py-0.5 rounded">
                                                    {formatDate(date)}
                                                </div>
                                            </div>

                                            {/* Additional Info / Comments */}
                                            {event.data?.comment && (
                                                <div className="text-sm text-gray-600 mt-2 bg-yellow-50 p-2 rounded border border-yellow-100 italic">
                                                    "{event.data.comment}"
                                                </div>
                                            )}

                                            {/* Contextual Data */}
                                            <div className="mt-2 flex items-center gap-3 text-xs text-gray-400 border-t border-gray-50 pt-2">
                                                <span>Par: <span className="font-medium text-gray-600">{user}</span></span>
                                                {event.data?.ville && (
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={10} /> {event.data.ville}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrackingTimelineModal;
