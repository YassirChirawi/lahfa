import React, { useMemo } from 'react';
import { usePromotions } from '../hooks/usePromotions';
import { X, Minus, Plus, Trash2, ShoppingBag, MessageCircle, ArrowRight, Instagram, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const CartDrawer = ({ isOpen, onClose, cart, onUpdateQuantity, onRemove }) => {
    const { promo } = usePromotions();

    // Promo Logic: Dynamic based on settings
    const { finalTotal, originalTotal, discount } = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

        if (!promo.isActive) {
            return { finalTotal: subtotal, originalTotal: subtotal, discount: 0 };
        }

        // BOGO Logic
        if (promo.type === 'bogo') {
            // Flatten cart items to apply "1 Bought = 1 Free" logic on pairs
            const allItems = cart.flatMap(item => Array(item.quantity).fill(item));

            // Sort by price descending to maximize customer value
            allItems.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));

            let promoTotal = 0;
            allItems.forEach((item, index) => {
                // Even indices (0, 2, 4...) are paid. Odd indices (1, 3...) are free.
                if (index % 2 === 0) {
                    promoTotal += parseFloat(item.price);
                }
            });

            return {
                finalTotal: promoTotal,
                originalTotal: subtotal,
                discount: subtotal - promoTotal
            };
        }

        // Percentage Logic
        if (promo.type === 'percentage' && promo.value > 0) {
            const discountAmount = (subtotal * promo.value) / 100;
            return {
                finalTotal: subtotal - discountAmount,
                originalTotal: subtotal,
                discount: discountAmount
            };
        }

        // Default or other types
        return { finalTotal: subtotal, originalTotal: subtotal, discount: 0 };

    }, [cart, promo]);

    const generateMessage = () => {
        const promoLabel = promo.isActive ? ` (Promo ${promo.type === 'bogo' ? '1 Acheté = 1 Offert' : '-' + promo.value + '%'} ❤️)` : '';
        let message = `Bonjour, je souhaite commander${promoLabel} :\n\n`;
        cart.forEach(item => {
            message += `- ${item.quantity}x ${item.name} (${item.size ? item.size : 'Standard'}${item.color ? ', ' + item.color : ''}) - ${item.price} DH\n`;
        });

        if (discount > 0) {
            message += `\nSous-total : ${originalTotal.toFixed(2)} DH`;
            message += `\nRemise (${promo.type === 'bogo' ? '1 Acheté = 1 Offert' : '-' + promo.value + '%'}) : -${discount.toFixed(2)} DH`;
        }

        message += `\n*TOTAL : ${finalTotal.toFixed(2)} DH*`;
        return message;
    };

    const handleWhatsAppCheckout = () => {
        if (cart.length === 0) return;
        const message = generateMessage();
        const url = `https://wa.me/212691924932?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const handleInstagramCheckout = () => {
        if (cart.length === 0) return;
        const message = generateMessage();
        navigator.clipboard.writeText(message).then(() => {
            toast.success("Panier copié ! Envoyez-le sur Insta 📸", {
                duration: 4000,
                position: 'bottom-center',
                style: {
                    background: '#FDF2F8',
                    color: '#DB2777',
                    border: '1px solid #FBCFE8'
                },
                icon: '📋'
            });
            setTimeout(() => {
                window.open("https://www.instagram.com/lahfa_intimate/", "_blank");
            }, 1000);
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="text-pink-600" size={24} />
                                <h2 className="text-lg font-bold text-gray-900">Mon Panier ({cart.reduce((acc, item) => acc + item.quantity, 0)})</h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X size={24} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                                    <ShoppingBag size={64} className="opacity-20" />
                                    <p className="text-lg font-medium">Votre panier est vide</p>
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-2 bg-pink-50 text-pink-600 rounded-full font-medium hover:bg-pink-100 transition-colors"
                                    >
                                        Commencer mon shopping
                                    </button>
                                </div>
                            ) : (
                                cart.map((item, index) => (
                                    <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-4 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                        {/* Image */}
                                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <ShoppingBag size={20} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</h3>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {item.size && <span className="bg-gray-100 px-1.5 py-0.5 rounded mr-1">{item.size}</span>}
                                                    {item.color && <span>{item.color}</span>}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center mt-2">
                                                <span className="font-bold text-pink-600">{item.price} DH</span>

                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                                                    <button
                                                        onClick={() => onUpdateQuantity(item.id, item.size, item.color, -1)}
                                                        className="p-1 hover:bg-white rounded-md transition-colors shadow-sm disabled:opacity-50"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus size={14} className="text-gray-600" />
                                                    </button>
                                                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => onUpdateQuantity(item.id, item.size, item.color, 1)}
                                                        className="p-1 hover:bg-white rounded-md transition-colors shadow-sm"
                                                    >
                                                        <Plus size={14} className="text-gray-600" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Remove */}
                                        <button
                                            onClick={() => onRemove(item.id, item.size, item.color)}
                                            className="text-gray-300 hover:text-red-500 transition-colors self-start p-1"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer / Checkout */}
                        {cart.length > 0 && (
                            <div className="p-4 border-t bg-white safe-area-bottom">
                                {/* Discount logic display */}
                                {discount > 0 && (
                                    <div className="mb-2 space-y-1">
                                        <div className="flex justify-between items-center text-sm text-gray-500">
                                            <span>Sous-total</span>
                                            <span className="line-through">{originalTotal.toFixed(2)} DH</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm text-pink-600 font-bold">
                                            <span>Promo ({promo.type === 'bogo' ? '1 Acheté = 1 Offert' : '-' + promo.value + '%'})</span>
                                            <span>-{discount.toFixed(2)} DH</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-gray-500 font-medium">Total</span>
                                    <span className="text-2xl font-bold text-gray-900">{finalTotal.toFixed(2)} DH</span>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleWhatsAppCheckout}
                                        className="flex-1 bg-green-500 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 active:scale-95"
                                    >
                                        <MessageCircle size={22} />
                                        WhatsApp
                                    </button>
                                    <button
                                        onClick={handleInstagramCheckout}
                                        className="flex-1 bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-pink-500/20 active:scale-95"
                                    >
                                        <Instagram size={22} />
                                        Instagram
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
