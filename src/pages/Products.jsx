import React, { useState } from 'react';
import { useProducts } from '../context/ProductContext';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';

const Products = () => {
    const { products, addProduct, updateProduct, deleteProduct, loading } = useProducts();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock: '',
        image: '',
        size: '',
        color: ''
    });

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData(product);
        } else {
            setEditingProduct(null);
            setFormData({ name: '', price: '', stock: '', image: '', size: '', color: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, formData);
            } else {
                await addProduct(formData);
            }
            setIsModalOpen(false);
        } catch (error) {
            alert('Error saving product');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this product?')) {
            await deleteProduct(id);
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
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition"
                >
                    <Plus size={20} /> Add Product
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3 w-full md:w-96">
                <Search className="text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search products..."
                    className="outline-none w-full"
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
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
                                {product.size && <span className="bg-gray-100 px-2 py-1 rounded">{product.size}</span>}
                                {product.color && <span className="bg-gray-100 px-2 py-1 rounded">{product.color}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
                        <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Edit Product' : 'New Product'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                <input type="text" placeholder="https://..." className="w-full p-2 border rounded-lg" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
