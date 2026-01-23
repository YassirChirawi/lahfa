import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { Clock, Activity, CheckCircle, Trash2, Edit } from 'lucide-react';

const History = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'logs'),
            orderBy('timestamp', 'desc'),
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setLogs(logsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getIcon = (action) => {
        switch (action) {
            case 'ORDER_CREATED': return <CheckCircle size={18} className="text-green-500" />;
            case 'STATUS_CHANGED': return <Activity size={18} className="text-blue-500" />;
            case 'ORDER_DELETED': return <Trash2 size={18} className="text-red-500" />;
            default: return <Clock size={18} className="text-gray-500" />;
        }
    };

    const formatDate = (isoString) => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        return date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Historique d'Activité</h1>
                <p className="text-gray-500 text-sm mt-1">Suivi des actions et changements d'état</p>
            </div>

            <div className="card overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm">
                            <th className="p-4 font-medium">Date & Heure</th>
                            <th className="p-4 font-medium">Action</th>
                            <th className="p-4 font-medium">Détails</th>
                            <th className="p-4 font-medium">Utilisateur</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {loading ? (
                            <tr><td colSpan="4" className="p-6 text-center text-gray-500">Chargement...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan="4" className="p-6 text-center text-gray-500">Aucune activité enregistrée.</td></tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-gray-600 font-mono text-xs">{formatDate(log.timestamp)}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 font-medium text-gray-700">
                                            {getIcon(log.action)}
                                            {log.action.replace(/_/g, ' ')}
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-800">{log.details}</td>
                                    <td className="p-4 text-gray-500 text-xs badge">{log.user || 'System'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default History;
