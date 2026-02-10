import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { usePromotions } from '../hooks/usePromotions';
import { ShoppingBag, Filter, Instagram, X, ZoomIn, Plus, ShoppingCart, Heart, Sparkles, Phone, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import CartDrawer from '../components/CartDrawer';
import BannerCarousel from '../components/BannerCarousel';
import DecorativeBackground from '../components/DecorativeBackground';

const Catalogue = () => {
    const { products } = useProducts();
    const { promo } = usePromotions();
    const [searchParams] = useSearchParams();
    const [zoomedProduct, setZoomedProduct] = useState(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

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

        // Custom animated toast
        toast.custom((t) => (
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white/90 backdrop-blur-md border border-pink-200 p-4 rounded-2xl shadow-xl flex items-center gap-4"
            >
                <div className="bg-pink-100 p-2 rounded-full">
                    <ShoppingBag className="text-pink-600" size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-gray-900">Ajouté au panier ! 💖</h4>
                    <p className="text-sm text-gray-500">Excellent choix, ma belle !</p>
                </div>
            </motion.div>
        ), { duration: 3000, position: 'bottom-center' });
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
                    border: '1px solid #FBCFE8',
                    borderRadius: '16px'
                }
            });
            setTimeout(() => {
                window.open("https://www.instagram.com/lahfa_intimate/", "_blank");
            }, 1000);
        });
    };

    return (
        <div className="min-h-screen bg-pink-50/30 font-sans pb-20 overflow-x-hidden">
            <Toaster />
            <DecorativeBackground />

            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
            />

            {/* Header */}
            {/* Header - Professional Layout */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 transition-all duration-300 h-20">
                <div className="max-w-7xl mx-auto px-4 h-full grid grid-cols-[auto_1fr_auto] items-center gap-4 md:gap-8">

                    {/* Left: Logo */}
                    <div className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <img
                            src="/logo.jpg"
                            alt="Lahfa"
                            className="h-8 md:h-12 w-auto object-contain mix-blend-multiply"
                        />
                    </div>

                    {/* Center: Minimal Banner */}
                    <div className="hidden md:flex justify-center items-center h-full border-x border-dashed border-gray-100 px-8">
                        <BannerCarousel />
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-4 justify-end">
                        {/* Mobile Filter Toggle */}
                        <button
                            className="md:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter size={20} />
                        </button>

                        <button
                            className="relative p-2 text-gray-800 hover:text-pink-600 transition-colors group"
                            onClick={() => setIsCartOpen(true)}
                        >
                            <ShoppingBag size={22} strokeWidth={1.5} />
                            {cart.length > 0 && (
                                <span className="absolute top-0 right-0 bg-black text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                    {cart.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Banner (Below Header) */}
            <div className="md:hidden bg-pink-50/50 border-b border-pink-100 py-3 px-4">
                <BannerCarousel />
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto p-4 md:p-8 relative z-10">

                {filteredProducts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white/50 rounded-3xl backdrop-blur-sm border border-pink-100 mx-4"
                    >
                        <ShoppingBag size={64} className="mb-4 text-pink-200" />
                        <h2 className="text-xl font-bold text-gray-600 mb-2">Oups, aucun trésor trouvé !</h2>
                        <p className="text-pink-400">Essaie de changer tes filtres, ma belle.</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                        {filteredProducts.map((product, index) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                className="group bg-white rounded-3xl shadow-sm border border-pink-50/50 hover:border-pink-200 hover:shadow-pink-100/50 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative"
                            >
                                {/* Image Container */}
                                <div
                                    className="aspect-[4/5] bg-gray-50 relative overflow-hidden cursor-zoom-in"
                                    onClick={() => setZoomedProduct(product)}
                                >
                                    {product.image ? (
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-pink-200">
                                            <ShoppingBag size={48} />
                                        </div>
                                    )}

                                    {/* Overlay Gradient on Hover */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    {/* Badges */}
                                    <div className="absolute top-3 right-3 flex flex-col gap-1 items-end z-10">
                                        {/* Dynamic Global Promo Badge */}
                                        {(product.badge || (promo.isActive && promo.badgeText)) && (
                                            <div className="bg-pink-600/90 backdrop-blur-sm text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                                                {product.badge || promo.badgeText}
                                            </div>
                                        )}

                                        {/* Stock Status */}
                                        {product.stock <= 0 ? (
                                            (product.pendingStock > 0) ? (
                                                <div className="bg-orange-400/90 backdrop-blur-sm text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded-full shadow-lg">
                                                    Approvisionnement
                                                </div>
                                            ) : (
                                                <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs md:text-sm tracking-wide uppercase font-extrabold px-4 py-2 rounded-full shadow-xl shadow-pink-500/40 border-2 border-white/20 animate-pulse">
                                                    Victime de son succès 💎
                                                </div>
                                            )
                                        ) : null}
                                    </div>

                                    {/* Quick Actions (Appear on Hover) */}
                                    <div className="absolute bottom-3 right-3 flex flex-col gap-2 translate-y-10 group-hover:translate-y-0 transition-transform duration-300">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setZoomedProduct(product); }}
                                            className="bg-white text-gray-800 p-2 rounded-full shadow-lg hover:bg-pink-50 hover:text-pink-600 transition-colors"
                                        >
                                            <ZoomIn size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleInstagram(product); }}
                                            className="bg-white text-gray-800 p-2 rounded-full shadow-lg hover:bg-pink-50 hover:text-pink-600 transition-colors"
                                        >
                                            <Instagram size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-gray-800 text-sm md:text-base line-clamp-1 group-hover:text-pink-600 transition-colors">{product.name}</h3>
                                    </div>

                                    <div className="flex justify-between items-center mb-3">
                                        <span className="font-extrabold text-lg text-pink-600 font-serif">{product.price} <span className="text-xs font-sans font-normal text-gray-500">DH</span></span>
                                        <div className="flex gap-1">
                                            {product.size && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full border border-gray-200">
                                                    {product.size}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (product.stock > 0) addToCart(product);
                                        }}
                                        disabled={product.stock <= 0}
                                        className={`mt-auto w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 font-medium text-sm shadow-lg
                                            ${product.stock > 0
                                                ? 'bg-gray-900 group-hover:bg-pink-600 text-white shadow-gray-200 group-hover:shadow-pink-200 active:scale-95'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                            }`}
                                    >
                                        {product.stock > 0 ? (
                                            <>
                                                <Plus size={16} /> Ajouter au panier
                                            </>
                                        ) : (
                                            <>
                                                <X size={16} /> Rupture de Stock
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-pink-100 py-12 relative z-10 mt-auto">
                <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center gap-6">

                    {/* Logo (Grayscale/Muted) */}
                    <img src="/logo.jpg" alt="Lahfa" className="h-10 w-auto object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500" />

                    {/* Tagline */}
                    <p className="text-pink-400 font-serif italic text-lg">
                        "Des pièces délicates pour sublimer votre féminité 🎀"
                    </p>

                    {/* Socials & Contact */}
                    <div className="flex gap-4">
                        <a
                            href="https://www.instagram.com/lahfa_intimate/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-pink-50 text-pink-600 p-3 rounded-full hover:bg-pink-600 hover:text-white transition-all duration-300 shadow-sm"
                            title="Instagram"
                        >
                            <Instagram size={20} />
                        </a>
                        <a
                            href="https://wa.me/212691924932"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-50 text-green-600 p-3 rounded-full hover:bg-green-600 hover:text-white transition-all duration-300 shadow-sm"
                            title="WhatsApp"
                        >
                            <Phone size={20} />
                        </a>
                        <a
                            href="mailto:lahfaintimate@gmail.com"
                            className="bg-blue-50 text-blue-600 p-3 rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-sm"
                            title="Email"
                        >
                            <Mail size={20} />
                        </a>
                    </div>

                    {/* Copyright */}
                    <div className="text-gray-400 text-sm font-light">
                        <p>© {new Date().getFullYear()} Lahfa Intimate. Tous droits réservés.</p>
                        <p className="text-[10px] mt-1">Fait avec amour & élégance.</p>
                    </div>
                </div>
            </footer>

            {/* Floating Cart Button (FAB) */}
            <AnimatePresence>
                {cart.length > 0 && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0, y: 100 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0, y: 100 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsCartOpen(true)}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-30 border border-gray-800 hover:bg-black transition-colors ring-4 ring-pink-500/20"
                    >
                        <div className="relative">
                            <ShoppingCart size={20} className="text-pink-300" />
                            <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-gray-900">
                                {cart.reduce((acc, item) => acc + item.quantity, 0)}
                            </span>
                        </div>
                        <span className="font-bold text-sm tracking-wide">Mon Panier 🛍️</span>
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
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                transition={{ type: "spring", damping: 20 }}
                                className="relative bg-white p-2 rounded-2xl shadow-2xl overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => setZoomedProduct(null)}
                                    className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                                >
                                    <X size={24} />
                                </button>

                                <img
                                    src={zoomedProduct.image}
                                    alt={zoomedProduct.name}
                                    className="max-w-full max-h-[70vh] object-contain rounded-xl bg-gray-50"
                                />

                                <div className="p-6 text-center">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-1 font-serif">{zoomedProduct.name}</h3>
                                    <p className="text-pink-600 font-bold text-xl mb-4">{zoomedProduct.price} DH</p>

                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={() => {
                                                if (zoomedProduct.stock > 0) {
                                                    addToCart(zoomedProduct);
                                                    setZoomedProduct(null);
                                                }
                                            }}
                                            disabled={zoomedProduct.stock <= 0}
                                            className={`px-8 py-3 rounded-full font-bold transition-all flex items-center gap-2 shadow-lg
                                                ${zoomedProduct.stock > 0
                                                    ? 'bg-black text-white hover:bg-gray-800 hover:shadow-xl active:scale-95'
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                                }`}
                                        >
                                            {zoomedProduct.stock > 0 ? (
                                                <>
                                                    <ShoppingBag size={18} /> Ajouter
                                                </>
                                            ) : (
                                                <>
                                                    <X size={18} /> Rupture
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleInstagram(zoomedProduct)}
                                            className="bg-pink-100 text-pink-600 px-4 py-3 rounded-full font-bold hover:bg-pink-200 transition-colors"
                                        >
                                            <Instagram size={20} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Catalogue;
