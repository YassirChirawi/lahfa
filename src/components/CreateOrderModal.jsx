import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useClients } from '../context/ClientContext';
import { useProducts } from '../context/ProductContext';

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
        status: 'Packing'
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const { clients } = useClients();

    // Product Search State
    const { products } = useProducts();
    const [productSearch, setProductSearch] = useState('');
    const [showProductSuggestions, setShowProductSuggestions] = useState(false);

    const [formData, setFormData] = useState(defaultState);

    // Effect to populate form when initialData changes or modal opens
    React.useEffect(() => {
        if (isOpen && initialData) {
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
                status: initialData.status || 'Packing',
                // Keep ID if needed for update logic outside
                id: initialData.id
            });
        } else if (isOpen && !initialData) {
            setFormData(defaultState);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'amount' || name === 'quantity' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
        // Reset handled by useEffect on next open
    };

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
            productId: product.id // Store reference
        }));
        setProductSearch('');
        setShowProductSuggestions(false);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content card">
                <div className="modal-header">
                    <h3>{initialData ? 'Modifier la Commande' : 'Create New Order'}</h3>
                    <button onClick={onClose} className="icon-btn">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    {/* Client Search/Select */}
                    <div className="form-group relative">
                        <label>Rechercher un Client existant</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowSuggestions(true);
                            }}
                            placeholder="Rechercher par nom ou téléphone..."
                            className="bg-gray-50 mb-2"
                        />
                        {showSuggestions && searchTerm && (
                            <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto top-full">
                                {filteredClients.map(client => (
                                    <div
                                        key={client.id}
                                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                                        onClick={() => handleClientSelect(client)}
                                    >
                                        <div className="font-medium">{client.name}</div>
                                        <div className="text-sm text-gray-500">{client.phone}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Nom du Client</label>
                            <input
                                type="text"
                                name="customer"
                                required
                                value={formData.customer}
                                onChange={handleChange}
                                placeholder="Nom complet"
                            />
                        </div>
                        <div className="form-group">
                            <label>Téléphone</label>
                            <input
                                type="tel"
                                name="phone"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="06..."
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Ville</label>
                            <input
                                type="text"
                                name="city"
                                required
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Ville"
                            />
                        </div>
                        <div className="form-group" style={{ flex: 2 }}>
                            <label>Adresse</label>
                            <input
                                type="text"
                                name="address"
                                required
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Adresse complète"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group relative" style={{ flex: 2 }}>
                            <label>Article (Rechercher Produit)</label>
                            <input
                                type="text"
                                value={productSearch}
                                onChange={(e) => {
                                    setProductSearch(e.target.value);
                                    setShowProductSuggestions(true);
                                    // Ensure we update the article field manually if typing new
                                    setFormData(prev => ({ ...prev, article: e.target.value }));
                                }}
                                onFocus={() => setShowProductSuggestions(true)}
                            // We display either the selected article or what is being typed. 
                            // Actually better design: Input is the article name. Search is overlay or typing triggers it.
                            // Let's try: Input binds to formData.article, but handler searches products.
                            // REVISION: Use a dedicated search box logic similar to Client, or just make the Article input a search box.
                            // Let's use the 'Search' approach: A typeahead.
                            />
                            {/* Hidden actual input sync? No, we just use the search input as the article name if no select. */}
                            {/* But wait, formData.article needs to be set. */}
                        </div>
                        {/* Redoing the block above to be cleaner implementation */}
                        <div className="form-group relative">
                            <label>Article</label>
                            <input
                                type="text"
                                name="article"
                                required
                                value={formData.article}
                                placeholder="Nom de l'article"
                                autoComplete="off"
                                onChange={(e) => {
                                    handleChange(e);
                                    setProductSearch(e.target.value);
                                    setShowProductSuggestions(true);
                                }}
                            />
                            {showProductSuggestions && productSearch && (
                                <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto top-full">
                                    {filteredProducts.length > 0 ? (
                                        filteredProducts.map(product => (
                                            <div
                                                key={product.id}
                                                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 flex justify-between items-center"
                                                onClick={() => handleProductSelect(product)}
                                            >
                                                <div>
                                                    <div className="font-medium">{product.name}</div>
                                                    <div className="text-xs text-gray-500">{product.size} - {product.color}</div>
                                                </div>
                                                <div className="text-sm font-bold text-indigo-600">
                                                    {product.price} DH (Stock: {product.stock})
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 text-gray-400 text-sm">No products found</div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <label>Taille</label>
                            <input
                                type="text"
                                name="size"
                                value={formData.size}
                                onChange={handleChange}
                                placeholder="S, M, L..."
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Couleur</label>
                            <input
                                type="text"
                                name="color"
                                value={formData.color}
                                onChange={handleChange}
                                placeholder="Rouge, Noir..."
                            />
                        </div>
                        <div className="form-group">
                            <label>Quantité</label>
                            <input
                                type="number"
                                name="quantity"
                                required
                                min="1"
                                value={formData.quantity}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Prix (DH)</label>
                            <input
                                type="number"
                                name="amount"
                                required
                                min="0"
                                step="0.01"
                                value={formData.amount}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Statut</label>
                            <select name="status" value={formData.status} onChange={handleChange}>
                                <option value="Packing">Packing</option>
                                <option value="Ramassage">Ramassage</option>
                                <option value="Livraison">Livraison</option>
                                <option value="Livré">Livré</option>
                                <option value="Pas de réponse client">Pas de réponse client</option>
                                <option value="Retour">Retour</option>
                            </select>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
                        <button type="submit" className="btn-primary">{initialData ? 'Mettre à jour' : 'Créer Commande'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateOrderModal;
