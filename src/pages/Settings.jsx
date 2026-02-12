import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Save, Lock, Truck, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../components/Button';
import { Tag, Calendar, Percent, ShoppingBag, Bell, Box } from 'lucide-react';
import usePushNotifications from '../hooks/usePushNotifications';
import { useProducts } from '../context/ProductContext';
import { useConfirmation } from '../context/ConfirmationContext';

const NotificationButton = () => {
    const { requestPermission, permission } = usePushNotifications();

    if (permission === 'granted') return <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Notifs Actives</span>;

    return (
        <button
            type="button"
            onClick={requestPermission}
            className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full hover:bg-indigo-100 transition-colors"
        >
            <Bell size={12} />
            Activer Notifs (iOS)
        </button>
    );
};

const PromotionSettings = () => {
    const { alert } = useConfirmation();
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
            await alert({ title: 'Succès', message: 'Promotions mises à jour !', variant: 'info' });
        } catch (error) {
            console.error("Error saving promotions:", error);
            await alert({ title: 'Erreur', message: 'Erreur lors de la sauvegarde.', variant: 'danger' });
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

const DeliverySettings = () => {
    const { alert } = useConfirmation();
    const [settings, setSettings] = useState({
        olivraison: { apiKey: '', secretKey: '', active: true, baseUrl: 'https://partners.olivraison.com' },
        sendit: {
            publicKey: '',
            secretKey: '',
            active: false,
            pickup_name: '',
            pickup_phone: '',
            pickup_address: '',
            pickup_district_id: ''
        }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncingCities, setSyncingCities] = useState(false);
    const [cityCount, setCityCount] = useState(null);
    const [lastSync, setLastSync] = useState(null);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchSettings();
        fetchCityStats();
    }, []);

    const fetchSettings = async () => {
        try {
            const docRef = doc(db, 'settings', 'delivery');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Merge with default structure to handle migrations
                setSettings(prev => ({
                    olivraison: { ...prev.olivraison, ...(data.olivraison || (data.apiKey ? data : {})) },
                    sendit: { ...prev.sendit, ...(data.sendit || {}) }
                }));
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCityStats = async () => {
        try {
            const docRef = doc(db, 'settings', 'cities');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCityCount(data.count || 0);
                setLastSync(data.lastSync ? new Date(data.lastSync).toLocaleDateString() : null);
            }
        } catch (e) { console.error("Stats error", e); }
    };

    const handleChange = (provider, field, value) => {
        setSettings(prev => ({
            ...prev,
            [provider]: {
                ...prev[provider],
                [field]: value
            }
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            await setDoc(doc(db, 'settings', 'delivery'), settings);
            setMessage({ type: 'success', text: 'Paramètres sauvegardés !' });
        } catch (error) {
            console.error("Error saving:", error);
            setMessage({ type: 'error', text: 'Erreur sauvegarde.' });
        } finally {
            setSaving(false);
        }
    };

    const handleSyncCities = async () => {
        setSyncingCities(true);
        setMessage(null);
        try {
            // Import dynamically to avoid circular deps if any, or just use standard import
            const { getAllDistricts } = await import('../services/senditService');

            // 1. Fetch from Sendit
            const districts = await getAllDistricts();

            // 2. Save to Firestore
            // We save a metadata doc and potentially the huge list in a separate collection if it's too big,
            // but for < 1000 cities, a single doc is fine (1MB limit). 
            // Districts usually have id, name, price. Short data.
            await setDoc(doc(db, 'settings', 'cities'), {
                list: districts,
                count: districts.length,
                lastSync: new Date().toISOString()
            });

            setCityCount(districts.length);
            setLastSync(new Date().toLocaleDateString());
            setMessage({ type: 'success', text: `${districts.length} villes synchronisées avec succès !` });

        } catch (error) {
            console.error("Sync Error:", error);
            setMessage({ type: 'error', text: "Erreur lors de la synchronisation des villes. Vérifiez les clés API." });
        } finally {
            setSyncingCities(false);
        }
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Configuration Livraison
                </h2>
            </div>

            <div className="p-6 space-y-8">
                {message && (
                    <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </div>
                )}

                {/* OLIVRAISON */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 border-l-4 border-indigo-500 pl-3">Olivraison</h3>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-indigo-600 rounded"
                                checked={settings.olivraison.active}
                                onChange={e => handleChange('olivraison', 'active', e.target.checked)}
                            />
                            <span className="text-sm text-gray-600">Actif</span>
                        </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="API Key"
                            value={settings.olivraison.apiKey || ''}
                            onChange={e => handleChange('olivraison', 'apiKey', e.target.value)}
                            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none"
                        />
                        <input
                            type="password"
                            placeholder="Secret Key"
                            value={settings.olivraison.secretKey || ''}
                            onChange={e => handleChange('olivraison', 'secretKey', e.target.value)}
                            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none"
                        />
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 border-l-4 border-orange-500 pl-3">Sendit.ma</h3>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-orange-600 rounded"
                                    checked={settings.sendit.active}
                                    onChange={e => handleChange('sendit', 'active', e.target.checked)}
                                />
                                <span className="text-sm text-gray-600">Actif</span>
                            </label>

                            <NotificationButton />

                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        const res = await fetch('/api/sendit-test-notification', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ message: "test notif a ziiiin" })
                                        });

                                        const data = await res.json();

                                        if (res.ok) {
                                            await alert({ title: 'Succès', message: "Succès: " + (data.message || "Notif envoyée !"), variant: 'info' });
                                        } else {
                                            await alert({ title: 'Erreur', message: "Erreur Serveur: " + (data.message || "Erreur inconnue") + "\n" + (data.error || ""), variant: 'danger' });
                                        }
                                    } catch (e) {
                                        await alert({ title: 'Erreur', message: "Erreur Réseau/Client: " + e.message, variant: 'danger' });
                                    }
                                }}
                                className="text-xs text-gray-400 hover:text-gray-600 underline"
                            >
                                Test Notif
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Public Key"
                            value={settings.sendit.publicKey || ''}
                            onChange={e => handleChange('sendit', 'publicKey', e.target.value)}
                            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-100 outline-none"
                        />
                        <input
                            type="password"
                            placeholder="Secret Key"
                            value={settings.sendit.secretKey || ''}
                            onChange={e => handleChange('sendit', 'secretKey', e.target.value)}
                            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-100 outline-none"
                        />
                    </div>

                    {/* Pickup Information */}
                    <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-100">
                        <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Box size={14} /> Information de Ramassage (Vendeur)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">Nom du Vendeur</label>
                                <input
                                    type="text"
                                    placeholder="ex: Lahfa Intimate"
                                    value={settings.sendit.pickup_name || ''}
                                    onChange={e => handleChange('sendit', 'pickup_name', e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-100 outline-none bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">Téléphone Ramassage</label>
                                <input
                                    type="text"
                                    placeholder="ex: 0612345678"
                                    value={settings.sendit.pickup_phone || ''}
                                    onChange={e => handleChange('sendit', 'pickup_phone', e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-100 outline-none bg-white"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">Adresse de Ramassage</label>
                                <input
                                    type="text"
                                    placeholder="ex: Appt 5, Immeuble B, Quartier Maarif"
                                    value={settings.sendit.pickup_address || ''}
                                    onChange={e => handleChange('sendit', 'pickup_address', e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-100 outline-none bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">Ville de Ramassage (Sendit ID)</label>
                                <select
                                    value={settings.sendit.pickup_district_id || ''}
                                    onChange={e => handleChange('sendit', 'pickup_district_id', e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-100 outline-none bg-white"
                                >
                                    <option value="">Sélectionner une ville...</option>
                                    {/* Try to get cities from Firestore metadata if available */}
                                    {/* Note: In a real app we'd fetch this list, but let's assume cityCount is there */}
                                    {/* For now, just show the selected ID or Casablanca as fallback if we can't easily map */}
                                    <option value="1">Casablanca (Général)</option>
                                    <option value={settings.sendit.pickup_district_id}>{settings.sendit.pickup_district_id ? `ID: ${settings.sendit.pickup_district_id}` : 'Autre...'}</option>
                                </select>
                                <p className="text-[10px] text-gray-400 mt-1 italic">* Synchronisez les villes ci-dessous pour trouver l'ID précis si besoin.</p>
                            </div>
                        </div>
                    </div>

                    {/* Sync Cities UI */}
                    <div className="bg-orange-50 rounded-lg p-4 flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-semibold text-orange-800">Synchronisation des Villes</h4>
                            <p className="text-xs text-orange-600 mt-1">
                                {cityCount ? `${cityCount} villes disponibles.` : 'Aucune ville synchronisée.'}
                                {lastSync && ` (Dernière: ${lastSync})`}
                            </p>
                        </div>
                        <Button
                            onClick={handleSyncCities}
                            disabled={syncingCities || !settings.sendit.publicKey}
                            variant="secondary"
                            className="text-xs"
                        >
                            {syncingCities ? 'Synchro...' : 'Synchroniser Villes'}
                        </Button>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <Button onClick={handleSave} disabled={saving} icon={Save} variant="primary">
                        {saving ? 'Sauvegarde...' : 'Enregistrer Configurations'}
                    </Button>
                </div>
            </div>
        </div >
    );
};

const Settings = () => {
    const { adjustStock, products } = useProducts();
    const { confirm, alert } = useConfirmation();

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6 pb-24">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <Truck className="w-8 h-8 text-indigo-600" />
                    <h1 className="text-2xl font-bold text-gray-800">Paramètres Généraux</h1>
                </div>
            </div>

            <DeliverySettings />
            <PromotionSettings />
        </div>
    );
};

export default Settings;
