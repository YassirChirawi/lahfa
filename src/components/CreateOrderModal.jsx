import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useClients } from '../context/ClientContext';
import { useProducts } from '../context/ProductContext';
import { Search } from 'lucide-react';

const CreateOrderModal = ({ isOpen, onClose, onSave, initialData = null }) => {
    // Default initial state
    const defaultState = {
        customer: '',
        phone: '',
        city: '',
        address: '',
        article: '',
        size: '',
        color: '',
        quantity: 1,
        amount: '',
        deliveryFee: 0,
        status: 'Packing',
        instagram: ''
    };

    const [formData, setFormData] = useState(defaultState);
    const { clients } = useClients();
    const { products } = useProducts();

    // Search States
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [showProductSuggestions, setShowProductSuggestions] = useState(false);

    // Effect to populate form when initialData changes or modal opens
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    customer: initialData.customer || '',
                    phone: initialData.phone || '',
                    city: initialData.city || '',
                    address: initialData.address || '',
                    article: initialData.article || (initialData.items && initialData.items[0]?.article) || '',
                    size: initialData.size || (initialData.items && initialData.items[0]?.size) || '',
                    color: initialData.color || (initialData.items && initialData.items[0]?.color) || '',
                    quantity: initialData.quantity || (initialData.items && initialData.items[0]?.quantity) || 1,
                    amount: initialData.amount || '',
                    deliveryFee: initialData.deliveryFee || 0,
                    status: initialData.status || 'Packing',
                    instagram: initialData.instagram || '',
                    id: initialData.id
                });
            } else {
                setFormData(defaultState);
                setSearchTerm('');
                setProductSearch('');
            }
        }
    }, [isOpen, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'amount' || name === 'quantity' || name === 'deliveryFee' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    // Client Selection Logic
    const filteredClients = clients ? clients.filter(client =>
        (client.name && client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.phone && client.phone.includes(searchTerm))
    ) : [];

    const handleClientSelect = (client) => {
        setFormData(prev => ({
            ...prev,
            customer: client.name,
            phone: client.phone,
            city: client.city || prev.city,
            address: client.address || prev.address
        }));
        setSearchTerm('');
        setShowSuggestions(false);
    };

    // Product Selection Logic
    const filteredProducts = products ? products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase())
    ) : [];

    const handleProductSelect = (product) => {
        setFormData(prev => ({
            ...prev,
            article: product.name,
            size: product.size || prev.size,
            color: product.color || prev.color,
            amount: product.price || prev.amount,
            productId: product.id
        }));
        setProductSearch('');
        setShowProductSuggestions(false);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Modifier la Commande' : 'Nouvelle Commande'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* --- CLIENT SEARCH SECTION --- */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 relative">
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Rechercher Client Existant</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowSuggestions(true);
                            }}
                            placeholder="Nom ou téléphone..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    </div>
                    {showSuggestions && searchTerm && (
                        <div className="absolute z-10 w-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredClients.map(client => (
                                <div
                                    key={client.id}
                                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                                    onClick={() => handleClientSelect(client)}
                                >
                                    <div className="font-medium text-sm text-gray-900">{client.name}</div>
                                    <div className="text-xs text-gray-500">{client.phone}</div>
                                </div>
                            ))}
                            {filteredClients.length === 0 && <div className="p-3 text-xs text-gray-400">Aucun client trouvé</div>}
                        </div>
                    )}
                </div>

                {/* --- CLIENT DETAILS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600">Nom du Client</label>
                        <input
                            type="text"
                            name="customer"
                            required
                            value={formData.customer}
                            onChange={handleChange}
                            placeholder="Nom complet"
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600">Téléphone</label>
                        <input
                            type="tel"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="06..."
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600">Instagram (Optionnel)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-400">@</span>
                            <input
                                type="text"
                                name="instagram"
                                value={formData.instagram}
                                onChange={handleChange}
                                placeholder="username"
                                className="w-full border rounded-lg p-2 pl-7 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600">Ville</label>
                        <input
                            type="text"
                            name="city"
                            required
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Ville"
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1 text-gray-600">Adresse</label>
                        <input
                            type="text"
                            name="address"
                            required
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Adresse complète"
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* --- PRODUCT DETAILS --- */}
                <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-gray-600">Article / Produit</label>
                    <input
                        type="text"
                        name="article"
                        required
                        value={formData.article}
                        placeholder="Nom de l'article"
                        autoComplete="off"
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        onChange={(e) => {
                            handleChange(e);
                            setProductSearch(e.target.value);
                            setShowProductSuggestions(true);
                        }}
                    />
                    {showProductSuggestions && productSearch && (
                        <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(product => (
                                    <div
                                        key={product.id}
                                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 flex justify-between items-center"
                                        onClick={() => handleProductSelect(product)}
                                    >
                                        <div>
                                            <div className="font-medium text-sm">{product.name}</div>
                                            <div className="text-xs text-gray-500">{product.size} - {product.color}</div>
                                        </div>
                                        <div className="text-sm font-bold text-indigo-600">
                                            {product.price} DH
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-3 text-gray-400 text-sm">Aucun produit trouvé</div>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600">Taille</label>
                        <input
                            type="text"
                            name="size"
                            value={formData.size}
                            onChange={handleChange}
                            placeholder="S, M..."
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600">Couleur</label>
                        <input
                            type="text"
                            name="color"
                            value={formData.color}
                            onChange={handleChange}
                            placeholder="Rge..."
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600">Qté</label>
                        <input
                            type="number"
                            name="quantity"
                            required
                            min="1"
                            value={formData.quantity}
                            onChange={handleChange}
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600">Prix Total</label>
                        <input
                            type="number"
                            name="amount"
                            required
                            min="0"
                            step="0.01"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="DH"
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-gray-800"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-600">Livraison</label>
                        <input
                            type="number"
                            name="deliveryFee"
                            min="0"
                            step="1"
                            value={formData.deliveryFee}
                            onChange={handleChange}
                            placeholder="DH"
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium mb-1 text-gray-600">Statut</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white"
                        >
                            <option value="Packing">Packing</option>
                            <option value="Ramassage">Ramassage</option>
                            <option value="Livraison">Livraison</option>
                            <option value="Livré">Livré</option>
                            <option value="Pas de réponse client">Pas de réponse</option>
                            <option value="Retour">Retour</option>
                        </select>
                    </div>
                </div>

                <div className="pt-4 pb-2">
                    <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-bold shadow-lg shadow-indigo-200">
                        {initialData ? 'Mettre à jour' : 'Confirmer la Commande'}
                    </button>
                </div>

            </form>
        </Modal>
    );
};

export default CreateOrderModal;
