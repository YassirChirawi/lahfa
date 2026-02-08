import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Save, Lock, Truck, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../components/Button';
import { Tag, Calendar, Percent, ShoppingBag } from 'lucide-react';

const PromotionSettings = () => {
    const [promo, setPromo] = useState({
        isActive: false,
        type: 'none',
        value: 0,
        badgeText: '',
        bannerText: '',
        freeDeliveryThreshold: 300,
        endDate: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPromo();
    }, []);

    const fetchPromo = async () => {
        try {
            const docRef = doc(db, 'settings', 'promotions');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setPromo(docSnap.data());
            }
        } catch (error) {
            console.error("Error fetching promotions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'promotions'), promo);
            alert('Promotions mises à jour !');
        } catch (error) {
            console.error("Error saving promotions:", error);
            alert('Erreur lors de la sauvegarde.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-pink-50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-pink-700 flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Marketing & Promotions
                </h2>
                <span className="text-xs text-pink-500 bg-pink-100 px-2 py-1 rounded font-bold">Dynamic</span>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
                <div className="flex items-center gap-4 mb-4 bg-gray-50 p-4 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                            checked={promo.isActive}
                            onChange={e => setPromo({ ...promo, isActive: e.target.checked })}
                        />
                        <span className="font-bold text-gray-800">Activer la Promotion</span>
                    </label>
                    <span className="text-sm text-gray-500">
                        {promo.isActive ? 'Actuellement visible sur le site' : 'Désactivée'}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type de Promo</label>
                        <select
                            className="w-full px-4 py-2 rounded-lg border border-gray-300"
                            value={promo.type}
                            onChange={e => setPromo({ ...promo, type: e.target.value })}
                        >
                            <option value="none">Aucune</option>
                            <option value="bogo">1 Acheté = 1 Offert</option>
                            <option value="percentage">Réduction en %</option>
                        </select>
                    </div>

                    {promo.type === 'percentage' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Valeur (%)</label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300"
                                value={promo.value}
                                onChange={e => setPromo({ ...promo, value: parseInt(e.target.value) })}
                                placeholder="ex: 20"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Texte du Badge (Produit)</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300"
                            value={promo.badgeText}
                            onChange={e => setPromo({ ...promo, badgeText: e.target.value })}
                            placeholder="ex: -50% SOLDES"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Texte Bannière</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300"
                            value={promo.bannerText}
                            onChange={e => setPromo({ ...promo, bannerText: e.target.value })}
                            placeholder="ex: SOLDES D'HIVER"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sous-titre Bannière</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300"
                            value={promo.subtitle}
                            onChange={e => setPromo({ ...promo, subtitle: e.target.value })}
                            placeholder="ex: Profitez de -50% !"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Livraison Gratuite (DH)</label>
                        <input
                            type="number"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300"
                            value={promo.freeDeliveryThreshold}
                            onChange={e => setPromo({ ...promo, freeDeliveryThreshold: parseInt(e.target.value) })}
                            placeholder="ex: 300"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin (Optionnel)</label>
                        <input
                            type="date"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300"
                            value={promo.endDate}
                            onChange={e => setPromo({ ...promo, endDate: e.target.value })}
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={saving}
                        icon={Save}
                    >
                        {saving ? 'Sauvegarde...' : 'Appliquer la Promo'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

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

            <PromotionSettings />

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
