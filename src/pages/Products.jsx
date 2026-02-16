import React, { useState } from 'react';
import { useProducts } from '../context/ProductContext';
import { Plus, Search, Edit2, Trash2, Package, Upload, Loader2, Share2, RotateCcw } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { toast } from 'react-hot-toast';
import { useConfirmation } from '../context/ConfirmationContext';

const Products = () => {
    const { products, addProduct, updateProduct, deleteProduct, resolvePendingReturn, loading } = useProducts();
    const { confirm } = useConfirmation();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [filterColor, setFilterColor] = useState('');
    const [filterMinPrice, setFilterMinPrice] = useState('');
    const [filterMaxPrice, setFilterMaxPrice] = useState('');
    const [filterStock, setFilterStock] = useState('all');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock: '',
        image: '',
        size: '',
        color: '',
        category: '',
        badge: '',
        description: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    const filteredProducts = products
        .filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesColor = filterColor ? (p.color && p.color.toLowerCase().includes(filterColor.toLowerCase())) : true;
            const matchesMinPrice = filterMinPrice ? parseFloat(p.price) >= parseFloat(filterMinPrice) : true;
            const matchesMaxPrice = filterMaxPrice ? parseFloat(p.price) <= parseFloat(filterMaxPrice) : true;
            const matchesStock = filterStock === 'all'
                ? true
                : filterStock === 'in_stock'
                    ? p.stock > 0
                    : p.stock === 0;

            return matchesSearch && matchesColor && matchesMinPrice && matchesMaxPrice && matchesStock;
        })
        .sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'price':
                    comparison = parseFloat(a.price) - parseFloat(b.price);
                    break;
                case 'stock':
                    comparison = a.stock - b.stock;
                    break;
                default:
                    comparison = 0;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData(product);
            setImagePreview(product.image || '');
        } else {
            setEditingProduct(null);
            setFormData({ name: '', price: '', stock: '', image: '', size: '', color: '', category: '', badge: '', description: '' });
            setImagePreview('');
        }
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            let imageUrl = formData.image;

            if (imageFile) {
                const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
                const snapshot = await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(snapshot.ref);
            }

            const productData = { ...formData, image: imageUrl };

            if (editingProduct) {
                await updateProduct(editingProduct.id, productData);
            } else {
                await addProduct(productData);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving product:", error);
            alert('Error saving product');
        } finally {
            setUploading(false);
        }
    };

    const handleMagicWrite = async () => {
        if (!formData.name && !formData.category) {
            toast.error("Veuillez entrer au moins un nom et une catégorie pour inspirer l'IA ! 🧠");
            return;
        }

        const toastId = toast.loading("L'IA rédige votre description... ✨");
        try {
            // Import dynamique pour éviter les dépendances circulaires si nécessaire, 
            // ou juste utiliser l'import du haut si déjà fait.
            const { generateProductDescription } = await import('../services/aiService');

            const description = await generateProductDescription(
                formData.name,
                formData.category,
                formData.color,
                formData.image // Pass image URL mostly for future real API usage
            );

            setFormData(prev => ({ ...prev, description }));
            toast.success("Description générée avec succès ! 💖", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("L'IA a eu un petit  hoquet. Réessayez !", { id: toastId });
        }
    };


    const handleDelete = async (id) => {
        if (await confirm({
            title: 'Delete Product',
            message: 'Are you sure you want to delete this product?',
            confirmText: 'Delete',
            variant: 'danger'
        })) {
            await deleteProduct(id);
        }
    };

    const handleShareCatalog = () => {
        // ... (existing share logic)
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (filterColor) params.append('color', filterColor);
        if (filterMinPrice) params.append('minPrice', filterMinPrice);
        if (filterMaxPrice) params.append('maxPrice', filterMaxPrice);
        if (filterStock !== 'all') params.append('stock', filterStock);

        const url = `${window.location.origin}/#/catalogue?${params.toString()}`;
        navigator.clipboard.writeText(url);
        toast.success("Lien du catalogue copié !");
    };

    const handleResolveReturn = async (product) => {
        if (!product.pendingStock || product.pendingStock <= 0) return;
        if (await confirm({
            title: 'Réception retours',
            message: `Confirmer la réception de ${product.pendingStock} retours pour "${product.name}" ?\nCela va les ajouter au stock.`,
            confirmText: 'Confirmer',
            variant: 'info'
        })) {
            await resolvePendingReturn(product.id, product.pendingStock);
            toast.success("Stock mis à jour !");
        }
    };

    if (loading) return <div className="p-8">Loading products...</div>;

    return (
        <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                    <p className="text-gray-500">Manage your inventory</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleShareCatalog}
                        className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition shadow-sm"
                    >
                        <Share2 size={20} /> Share Catalog
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                    >
                        <Plus size={20} /> Add Product
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-3 items-center w-full">
                    {/* Search */}
                    <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-gray-50 w-full md:w-64">
                        <Search className="text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by reference..."
                            className="bg-transparent outline-none w-full text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Color Filter */}
                    <input
                        type="text"
                        placeholder="Filter by Color"
                        className="px-3 py-2 border rounded-lg text-sm bg-gray-50 w-32"
                        value={filterColor}
                        onChange={(e) => setFilterColor(e.target.value)}
                    />

                    {/* Price Filter */}
                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            placeholder="Min Price"
                            className="px-3 py-2 border rounded-lg text-sm bg-gray-50 w-24"
                            value={filterMinPrice}
                            onChange={(e) => setFilterMinPrice(e.target.value)}
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="number"
                            placeholder="Max Price"
                            className="px-3 py-2 border rounded-lg text-sm bg-gray-50 w-24"
                            value={filterMaxPrice}
                            onChange={(e) => setFilterMaxPrice(e.target.value)}
                        />
                    </div>

                    {/* Stock Filter */}
                    <select
                        className="px-3 py-2 border rounded-lg text-sm bg-gray-50"
                        value={filterStock}
                        onChange={(e) => setFilterStock(e.target.value)}
                    >
                        <option value="all">All Stock</option>
                        <option value="in_stock">In Stock</option>
                        <option value="out_of_stock">Out of Stock</option>
                    </select>

                    {/* Sort */}
                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-sm text-gray-500">Sort by:</span>
                        <select
                            className="px-3 py-2 border rounded-lg text-sm bg-gray-50 font-medium"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="name">Reference</option>
                            <option value="price">Price</option>
                            <option value="stock">Stock</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="p-2 border rounded-lg hover:bg-gray-50"
                            title={sortOrder === 'asc' ? "Ascending" : "Descending"}
                        >
                            {sortOrder === 'asc' ? "↑" : "↓"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                    <div key={product.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition">
                        <div className="h-48 bg-gray-100 relative">
                            {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <Package size={48} />
                                </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-1">
                                <button onClick={() => handleOpenModal(product)} className="p-2 bg-white/90 rounded-full hover:text-indigo-600 shadow-sm">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(product.id)} className="p-2 bg-white/90 rounded-full hover:text-red-600 shadow-sm">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-gray-900">{product.name}</h3>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-indigo-600 font-bold">{parseFloat(product.price).toFixed(2)} DH</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {product.stock} in stock
                                </span>
                            </div>
                            <div className="mt-3 flex gap-2 text-sm text-gray-500">
                                {product.color && <span className="bg-gray-100 px-2 py-1 rounded">{product.color}</span>}
                                {(product.pendingStock > 0) && (
                                    <button
                                        onClick={() => handleResolveReturn(product)}
                                        className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold border border-orange-200 flex items-center gap-1 hover:bg-orange-200"
                                        title="Cliquez pour valider le retour et remettre en stock"
                                    >
                                        <RotateCcw size={12} /> +{product.pendingStock} retour
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Edit Product' : 'New Product'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Image Upload */}
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-4 cursor-pointer hover:border-indigo-500 transition relative bg-gray-50">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="h-32 w-full object-contain rounded-lg" />
                                ) : (
                                    <div className="text-center text-gray-400">
                                        <Upload className="mx-auto mb-2" size={32} />
                                        <p className="text-sm">Click to upload image</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input required type="text" className="w-full p-2 border rounded-lg" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (DH)</label>
                                    <input required type="number" className="w-full p-2 border rounded-lg" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                    <input required type="number" className="w-full p-2 border rounded-lg" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                                    <input type="text" placeholder="e.g. M, 42" className="w-full p-2 border rounded-lg" value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                                    <input type="text" placeholder="e.g. Blue" className="w-full p-2 border rounded-lg" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="">Select Category...</option>
                                        <option value="Nuisettes">Nuisettes</option>
                                        <option value="Pyjamas">Pyjamas</option>
                                        <option value="Ensembles">Ensembles</option>
                                        <option value="Robes de chambre">Robes de chambre</option>
                                        <option value="Accessoires">Accessoires</option>
                                        <option value="Valentine">Valentine Special ❤️</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Badge (Promo)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 1 Acheté = 2 Offerts"
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.badge}
                                        onChange={e => setFormData({ ...formData, badge: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Description Field with Magic Write */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <button
                                        type="button"
                                        onClick={handleMagicWrite}
                                        className="text-xs bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-2 py-1 rounded-full flex items-center gap-1 hover:shadow-md transition animate-pulse-slow"
                                        title="Générer une description avec l'IA"
                                    >
                                        ✨ Magic Write
                                    </button>
                                </div>
                                <textarea
                                    className="w-full p-2 border rounded-lg h-24 text-sm resize-none"
                                    placeholder="Description du produit..."
                                    value={formData.description || ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                                >
                                    {uploading && <Loader2 size={16} className="animate-spin" />}
                                    {uploading ? 'Uploading...' : 'Save Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
