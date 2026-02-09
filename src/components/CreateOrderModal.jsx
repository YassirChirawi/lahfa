import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useClients } from '../context/ClientContext';
import { useProducts } from '../context/ProductContext';
import { Search, ChevronDown, Check, Plus, Trash2, Tag, Gift } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const CityAutocomplete = ({ value, onChange }) => {
    const [query, setQuery] = useState(value || '');
    const [cities, setCities] = useState([]);
    const [filteredCities, setFilteredCities] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    useEffect(() => {
        const fetchCities = async () => {
            try {
                const docRef = doc(db, 'settings', 'cities');
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setCities(snap.data().list || []);
                }
            } catch (e) {
                console.error("Cities fetch error", e);
            }
        };
        fetchCities();
    }, []);

    useEffect(() => {
        if (!query) {
            setFilteredCities([]);
            return;
        }
        const filtered = cities.filter(c =>
            c.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10); // Limit results
        setFilteredCities(filtered);
    }, [query, cities]);

    const handleSelect = (city) => {
        setQuery(city.name);
        onChange(city.name, city.id);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <input
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    onChange(e.target.value, null); // Reset ID if typing manual
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Chercher une ville..."
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
            {isOpen && filteredCities.length > 0 && (
                <div className="absolute z-50 w-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filteredCities.map(city => (
                        <div
                            key={city.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 flex justify-between items-center"
                            onClick={() => handleSelect(city)}
                        >
                            <span className="text-sm font-medium text-gray-800">{city.name}</span>
                            <div className="text-xs text-gray-500 flex flex-col items-end">
                                <span>{city.price} DH</span>
                                <span className="text-[10px] text-gray-400">{city.delais}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {isOpen && query && filteredCities.length === 0 && cities.length > 0 && (
                <div className="absolute z-50 w-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow p-3 text-xs text-gray-500">
                    Ville personnalisée (non listée)
                </div>
            )}
            {/* Backdrop to close */}
            {isOpen && <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)} />}
        </div>
    );
};

const CreateOrderModal = ({ isOpen, onClose, onSave, initialData = null }) => {
    // Default initial state
    const defaultState = {
        customer: '',
        phone: '',
        city: '',
        address: '',
        status: 'Packing',
        instagram: '',
        amount: 0,
        deliveryFee: 0,
        deliveryFee: 0,
        deliveryValues: {
            allowTry: false,
            allowOpen: false,
            isExchange: false
        }, // Sendit/Olivraison data
    };

    const [formData, setFormData] = useState(defaultState);
    const [items, setItems] = useState([]); // Array of { article, size, color, quantity, price }

    // Temporary state for adding new item
    const [currentItem, setCurrentItem] = useState({
        article: '',
        size: '',
        color: '',
        quantity: 1,
        price: 0
    });

    const { clients } = useClients();
    const { products } = useProducts();

    // Search States
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [showProductSuggestions, setShowProductSuggestions] = useState(false);

    // Manual Promotion State
    const [isBogoActive, setIsBogoActive] = useState(false);
    const [discount, setDiscount] = useState(0);

    // Effect to populate form when initialData changes or modal opens
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Populate basic info
                setFormData({
                    customer: initialData.customer || '',
                    phone: initialData.phone || '',
                    city: initialData.city || '',
                    address: initialData.address || '',
                    status: initialData.status || 'Packing',
                    instagram: initialData.instagram || '',
                    deliveryFee: initialData.deliveryFee || 0, // Legacy fee
                    id: initialData.id,
                    deliveryValues: initialData.deliveryValues || {}
                });

                // Populate Items
                if (initialData.items && initialData.items.length > 0) {
                    setItems(initialData.items);
                } else if (initialData.article) {
                    // Legacy single item
                    setItems([{
                        article: initialData.article,
                        size: initialData.size,
                        color: initialData.color,
                        quantity: initialData.quantity || 1,
                        price: parseFloat(initialData.amount) || 0 // Rough estimate if price not stored separately
                    }]);
                } else {
                    setItems([]);
                }

                // If editing, we might need to deduce protocol, but new orders default false
                setIsBogoActive(initialData.isBogo || false);

            } else {
                setFormData(defaultState);
                setItems([]);
                setSearchTerm('');
                setProductSearch('');
                setCurrentItem({ article: '', size: '', color: '', quantity: 1, price: 0 });
                setIsBogoActive(false);
            }
        }
    }, [isOpen, initialData]);

    // Calculate Totals Effect
    useEffect(() => {
        let subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 1)), 0);
        let calculatedDiscount = 0;
        let deliveryFee = parseFloat(formData.deliveryFee) || 0;

        if (isBogoActive) {
            // "1 acheté = 1 offert" logic: Customer pays ONLY for the first line item.
            if (items.length > 0) {
                const firstItemCost = parseFloat(items[0].price || 0) * parseInt(items[0].quantity || 1);
                calculatedDiscount = subtotal - firstItemCost;
            }
        }

        setDiscount(calculatedDiscount);

    }, [items, isBogoActive, formData.deliveryFee]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleClientSelect = (client) => {
        setFormData(prev => ({
            ...prev,
            customer: client.name,
            phone: client.phone,
            city: client.city,
            address: client.address,
            instagram: client.instagram
        }));
        setSearchTerm(client.name);
        setShowSuggestions(false);
    };

    const handleProductSelect = (product) => {
        setCurrentItem(prev => ({
            ...prev,
            article: product.name,
            price: product.price || 0,
            size: '', // Reset size/color on new product
            color: ''
        }));
        setProductSearch(product.name);
        setShowProductSuggestions(false);
    };

    const handleAddItem = () => {
        if (!currentItem.article) {
            alert("Veuillez sélectionner un produit");
            return;
        }
        setItems(prev => [...prev, { ...currentItem }]);
        // Reset current item input
        setCurrentItem({ article: '', size: '', color: '', quantity: 1, price: 0 });
        setProductSearch('');
    };

    const handleRemoveItem = (index) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleCityChange = (cityName, districtId) => {
        setFormData(prev => ({
            ...prev,
            city: cityName,
            deliveryValues: {
                ...prev.deliveryValues,
                districtId: districtId // Store for Sendit
            }
        }));
    };

    const handleDeliveryOptionChange = (option) => {
        setFormData(prev => ({
            ...prev,
            deliveryValues: {
                ...prev.deliveryValues,
                [option]: !prev.deliveryValues?.[option]
            }
        }));
    };



    const handleSubmit = async (e) => {
        e.preventDefault();

        // Final calculation
        const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 1)), 0);
        const totalAmount = subtotal - discount + (parseFloat(formData.deliveryFee) || 0);

        // Construct final object
        const finalOrder = {
            ...formData,
            items: items,
            amount: totalAmount,
            subtotal: subtotal,
            discount: discount,
            isBogo: isBogoActive,
            // Legacy compatibility (takes first item)
            article: items[0]?.article || 'Multi-items',
            size: items[0]?.size || '',
            color: items[0]?.color || '',
            quantity: items.reduce((sum, i) => sum + parseInt(i.quantity), 0)
        };

        onSave(finalOrder);
    };

    // Helper: Total calculation for display
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 1)), 0);
    const finalTotal = subtotal - discount + (parseFloat(formData.deliveryFee) || 0);


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Modifier la commande" : "Nouvelle commande"}>
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* --- Client Section --- */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Informations Client</h3>

                    {/* Client Search */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                placeholder="Rechercher ou nouveau client..."
                                value={searchTerm || formData.customer}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    handleChange({ target: { name: 'customer', value: e.target.value } });
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        </div>
                        {showSuggestions && searchTerm && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {clients
                                    .filter(c =>
                                        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        (c.phone && c.phone.includes(searchTerm))
                                    )
                                    .map(client => (
                                        <div
                                            key={client.id}
                                            className="p-3 hover:bg-gray-50 cursor-pointer text-sm"
                                            onClick={() => handleClientSelect(client)}
                                        >
                                            <div className="font-medium text-gray-900">{client.name}</div>
                                            <div className="text-gray-500 text-xs">{client.phone}</div>
                                            <div className="text-gray-400 text-[10px]">{client.city}</div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                            <input
                                type="text"
                                name="instagram"
                                value={formData.instagram}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                placeholder="@username"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                            <CityAutocomplete
                                value={formData.city}
                                onChange={handleCityChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* --- Products Section --- */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 flex justify-between">
                        <span>Articles & Panier ({items.length})</span>
                    </h3>

                    {/* Add Item Form */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                        <div className="relative">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Produit</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-md text-sm"
                                placeholder="Rechercher un produit..."
                                value={productSearch}
                                onChange={(e) => {
                                    setProductSearch(e.target.value);
                                    // Also allow manual typing
                                    setCurrentItem(prev => ({ ...prev, article: e.target.value }));
                                    setShowProductSuggestions(true);
                                }}
                                onFocus={() => setShowProductSuggestions(true)}
                            />
                            {showProductSuggestions && productSearch && (
                                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                    {products
                                        .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                                        .map(product => {
                                            const isOutOfStock = (Number(product.stock) || 0) <= 0;
                                            return (
                                                <div
                                                    key={product.id}
                                                    className={`p-2 text-sm flex justify-between items-center ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50 cursor-pointer'}`}
                                                    onClick={() => !isOutOfStock && handleProductSelect(product)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className={isOutOfStock ? 'text-gray-500' : ''}>{product.name}</span>
                                                        {isOutOfStock && (
                                                            <span className="text-[10px] font-medium bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                                                                Sold Out
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className={isOutOfStock ? "text-gray-400" : "text-gray-500"}>{product.price} DH</span>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Taille</label>
                                <input
                                    type="text"
                                    value={currentItem.size}
                                    onChange={(e) => setCurrentItem({ ...currentItem, size: e.target.value })}
                                    className="w-full px-2 py-2 border rounded-md text-sm"
                                    placeholder="S, M..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Couleur</label>
                                <input
                                    type="text"
                                    value={currentItem.color}
                                    onChange={(e) => setCurrentItem({ ...currentItem, color: e.target.value })}
                                    className="w-full px-2 py-2 border rounded-md text-sm"
                                    placeholder="Rouge..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Qté</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={currentItem.quantity}
                                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                                    className="w-full px-2 py-2 border rounded-md text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Prix U.</label>
                                <input
                                    type="number"
                                    value={currentItem.price}
                                    onChange={(e) => setCurrentItem({ ...currentItem, price: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-2 py-2 border rounded-md text-sm"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="w-full py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> Ajouter au panier
                        </button>
                    </div>

                    {/* Items List */}
                    {items.length > 0 ? (
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 border-b">
                                    <tr>
                                        <th className="px-3 py-2">Article</th>
                                        <th className="px-3 py-2">Détails</th>
                                        <th className="px-3 py-2 text-right">Prix</th>
                                        <th className="px-3 py-2 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-3 py-2 font-medium">{item.article}</td>
                                            <td className="px-3 py-2 text-gray-500">
                                                {item.size && <span className="mr-2">T: {item.size}</span>}
                                                {item.color && <span>C: {item.color}</span>}
                                                <div className="text-xs">x{item.quantity}</div>
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                {(item.price * item.quantity).toFixed(2)} DH
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(idx)}
                                                    className="text-red-500 hover:bg-red-50 p-1 rounded"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-gray-400 text-sm border-2 border-dashed rounded-lg">
                            Aucun article ajouté
                        </div>
                    )}
                </div>

                {/* --- Totals & Promo Section --- */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Sous-total</span>
                        <span className="font-medium">{subtotal.toFixed(2)} DH</span>
                    </div>

                    {/* Manual BOGO Toggle */}
                    <div className="flex justify-between items-center bg-pink-50 p-2 rounded border border-pink-100">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isBogoActive}
                                onChange={(e) => setIsBogoActive(e.target.checked)}
                                className="text-pink-600 rounded focus:ring-pink-500"
                            />
                            <span className="text-sm font-medium text-pink-700 flex items-center gap-1">
                                <Gift size={15} /> 1 Acheté = 1 Offert (Pack)
                            </span>
                        </label>
                        {isBogoActive && (
                            <span className="text-sm text-pink-600 font-bold">- {discount.toFixed(2)} DH</span>
                        )}
                    </div>

                    <div className="flex justify-between text-sm items-center">
                        <span className="text-gray-600">Livraison</span>
                        <input
                            type="number"
                            name="deliveryFee"
                            value={formData.deliveryFee}
                            onChange={handleChange}
                            className="w-20 text-right p-1 border rounded text-xs"
                        />
                    </div>

                    <div className="flex justify-between text-base font-bold border-t pt-2 mt-2">
                        <span>Total</span>
                        <span className="text-indigo-600">{finalTotal.toFixed(2)} DH</span>
                    </div>

                    {/* Delivery Options */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-gray-100">
                        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.deliveryValues?.allowTry || false}
                                onChange={() => handleDeliveryOptionChange('allowTry')}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            Autoriser l'essayage
                        </label>
                        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.deliveryValues?.isExchange || false}
                                onChange={() => handleDeliveryOptionChange('isExchange')}
                                className="rounded text-orange-500 focus:ring-orange-500"
                            />
                            Échange
                        </label>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <option value="Packing">Packing</option>
                        <option value="Ramassage">Ramassage</option>
                        <option value="Livraison">Livraison</option>
                        <option value="Livré">Livré</option>
                    </select>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <Check size={18} />
                            Enregistrer
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default CreateOrderModal;
