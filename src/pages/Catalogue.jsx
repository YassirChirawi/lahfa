import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { ShoppingBag, Filter, Instagram, X, ZoomIn, Plus, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import CartDrawer from '../components/CartDrawer';

const Catalogue = () => {
    const { products } = useProducts();
    const [searchParams] = useSearchParams();
    const [zoomedProduct, setZoomedProduct] = useState(null);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Cart State
    const [cart, setCart] = useState(() => {
        try {
            const saved = localStorage.getItem('lahfa_cart');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    // Persist Cart
    useEffect(() => {
        localStorage.setItem('lahfa_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id && item.size === product.size && item.color === product.color);
            if (existing) {
                return prev.map(item =>
                    (item.id === product.id && item.size === product.size && item.color === product.color)
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        toast.success("Ajouté au panier ! 🛒", { position: 'bottom-center' });
    };

    const updateQuantity = (id, size, color, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id && item.size === size && item.color === color) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    const removeFromCart = (id, size, color) => {
        setCart(prev => prev.filter(item => !(item.id === id && item.size === size && item.color === color)));
    };

    // Extract filters from URL
    const filters = useMemo(() => ({
        category: searchParams.get('category'),
        minPrice: searchParams.get('minPrice'),
        maxPrice: searchParams.get('maxPrice'),
        color: searchParams.get('color'),
        size: searchParams.get('size'),
        search: searchParams.get('search')
    }), [searchParams]);

    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            // Category Filter
            if (filters.category && product.category !== filters.category) return false;

            // Price Filter
            const price = parseFloat(product.price);
            if (filters.minPrice && price < parseFloat(filters.minPrice)) return false;
            if (filters.maxPrice && price > parseFloat(filters.maxPrice)) return false;

            // Color Filter (Approximate match)
            if (filters.color && !product.color?.toLowerCase().includes(filters.color.toLowerCase())) return false;

            // Size Filter
            if (filters.size && !product.size?.toLowerCase().includes(filters.size.toLowerCase())) return false;

            // Search Text
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matchName = product.name.toLowerCase().includes(searchLower);
                if (!matchName) return false;
            }

            return true;
        }).sort((a, b) => {
            return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        });
    }, [products, filters]);

    const handleInstagram = (product) => {
        const refText = `Produit: ${product.name} - ${product.price}DH`;
        navigator.clipboard.writeText(refText).then(() => {
            toast.success("Référence copiée ! Envoyez-la sur Insta 📸", {
                duration: 4000,
                position: 'top-center',
                style: {
                    background: '#FDF2F8',
                    color: '#DB2777',
                    border: '1px solid #FBCFE8'
                }
            });
            setTimeout(() => {
                window.open("https://www.instagram.com/lahfa_intimate/", "_blank");
            }, 1000);
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <Toaster />
            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
            />

            {/* Header */}
            <header className="bg-pink-50/80 backdrop-blur-md sticky top-0 z-10 px-4 py-6 border-b border-pink-100">
                <div className="max-w-2xl mx-auto text-center space-y-2">
                    <div className="inline-flex items-center justify-center gap-2 mb-1">
                        <ShoppingBag size={24} className="text-pink-600" />
                        <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-wide">
                            Lahfa’h <span className="text-pink-600">intimate</span> ✨
                        </h1>
                    </div>
                </div>

                {/* Active Filters Badges - Centered */}
                <div className="hidden md:flex justify-center gap-2 mt-4">
                    {Object.entries(filters).map(([key, value]) => {
                        if (!value) return null;
                        return (
                            <span key={key} className="px-3 py-1 bg-white text-pink-600 rounded-full text-xs font-medium border border-pink-100 flex items-center gap-1 shadow-sm">
                                <Filter size={10} /> {key}: {value}
                            </span>
                        )
                    })}
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto p-4 md:p-8">
                {/* Mobile Filter Summary */}
                <div className="md:hidden mb-6 flex flex-wrap gap-2 justify-center">
                    {Object.entries(filters).map(([key, value]) => {
                        if (!value) return null;
                        return (
                            <span key={key} className="px-3 py-1 bg-pink-50 text-pink-600 rounded-full text-xs font-medium border border-pink-100">
                                {key}: {value}
                            </span>
                        )
                    })}
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <ShoppingBag size={64} className="mb-4 opacity-20" />
                        <h2 className="text-xl font-semibold mb-2">Aucun produit trouvé</h2>
                        <p>Essayez de modifier vos filtres.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                        {filteredProducts.map((product) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden"
                            >
                                {/* Image Placeholder or Real Image */}
                                <div
                                    className="aspect-square bg-gray-100 relative group overflow-hidden cursor-zoom-in"
                                    onClick={() => setZoomedProduct(product)}
                                >
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <ShoppingBag size={32} />
                                        </div>
                                    )}

                                    {/* Overlay Badge */}
                                    {product.stock <= 0 ? (
                                        (product.pendingStock > 0) ? (
                                            <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                                                Approvisionnement
                                            </div>
                                        ) : (
                                            <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                                                Épuisé
                                            </div>
                                        )
                                    ) : null}

                                    {/* Zoom Hint Icon */}
                                    <div className="absolute bottom-2 right-2 bg-black/30 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ZoomIn size={14} />
                                    </div>
                                </div>

                                <div className="p-3 flex-1 flex flex-col">
                                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight mb-1">{product.name}</h3>
                                    <div className="flex justify-between items-baseline mb-2">
                                        <span className="font-bold text-pink-600 text-sm">{product.price} DH</span>
                                        {/* Sizes/Colors simplified for compact view */}
                                        <div className="flex gap-1 text-[10px] text-gray-500">
                                            {product.size && <span className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-100">{product.size}</span>}
                                        </div>
                                    </div>

                                    <div className="mt-auto flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-1 transition-colors text-xs font-bold"
                                        >
                                            <Plus size={16} /> Ajouter
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleInstagram(product); }}
                                            className="w-10 bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 hover:opacity-90 text-white py-2 rounded-lg flex items-center justify-center transition-opacity"
                                        >
                                            <Instagram size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Floating Cart Button (FAB) */}
            <AnimatePresence>
                {cart.length > 0 && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsCartOpen(true)}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 z-30 hover:bg-black transition-colors"
                    >
                        <div className="relative">
                            <ShoppingCart size={20} />
                            <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                {cart.reduce((acc, item) => acc + item.quantity, 0)}
                            </span>
                        </div>
                        <span className="font-bold text-sm">Voir mon panier</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {zoomedProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setZoomedProduct(null)}
                        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
                    >
                        <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center animate-in fade-in zoom-in duration-300">
                            <button
                                onClick={() => setZoomedProduct(null)}
                                className="absolute -top-12 right-0 text-white/80 hover:text-white p-2"
                            >
                                <X size={32} />
                            </button>

                            <img
                                src={zoomedProduct.image}
                                alt={zoomedProduct.name}
                                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl bg-black"
                                onClick={(e) => e.stopPropagation()}
                            />

                            <div className="mt-4 text-center">
                                <h3 className="text-white text-xl font-bold">{zoomedProduct.name}</h3>
                                <p className="text-pink-400 font-medium text-lg">{zoomedProduct.price} DH</p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        addToCart(zoomedProduct);
                                        setZoomedProduct(null);
                                        setIsCartOpen(true);
                                    }}
                                    className="mt-4 bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 mx-auto"
                                >
                                    <Plus size={18} /> Ajouter au panier
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Catalogue;
