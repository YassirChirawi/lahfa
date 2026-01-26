import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Save, Lock, Truck, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../components/Button';

const Settings = () => {
    const [formData, setFormData] = useState({
        apiKey: '',
        secretKey: '',
        baseUrl: 'https://partners.olivraison.com',
        webhookUrl: '', // Read-only, generated example or manual input if we were doing webhooks
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const docRef = doc(db, 'settings', 'delivery');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setFormData({ ...formData, ...docSnap.data() });
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            setMessage({ type: 'error', text: 'Impossible de charger les paramètres.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            await setDoc(doc(db, 'settings', 'delivery'), formData);
            setMessage({ type: 'success', text: 'Paramètres sauvegardés avec succès !' });
        } catch (error) {
            console.error("Error saving settings:", error);
            setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Chargement...</div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-3 mb-6">
                <Truck className="w-8 h-8 text-primary" />
                <h1 className="text-2xl font-bold text-gray-800">Intégration Olivraison</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Configuration API
                    </h2>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Secured</span>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {message && (
                        <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            {message.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                <input
                                    type="text"
                                    name="apiKey"
                                    value={formData.apiKey}
                                    onChange={handleChange}
                                    placeholder="Ex: api-U2FsdGVk..."
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                                <input
                                    type="password"
                                    name="secretKey"
                                    value={formData.secretKey}
                                    onChange={handleChange}
                                    placeholder="Ex: U2FsdGVkX1..."
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                                <input
                                    type="text"
                                    name="baseUrl"
                                    value={formData.baseUrl}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
                                    disabled // Usually fixed, but good to show
                                />
                                <p className="text-xs text-gray-500 mt-1">L'URL par défaut de l'API Olivraison.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={saving}
                            icon={Save}
                        >
                            {saving ? 'Sauvegarde...' : 'Sauvegarder les clés'}
                        </Button>
                    </div>
                </form>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                <h3 className="text-blue-900 font-medium mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Information Importante
                </h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                    Pour obtenir vos clés API, connectez-vous à votre tableau de bord <strong>Olivraison Partners</strong>.
                    Assurez-vous de ne jamais partager votre Secret Key.
                </p>
            </div>
        </div>
    );
};

export default Settings;
