import React, { useState } from 'react';
import { X, Wand2, Loader2, Save, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateMagicPhoto } from '../services/aiService';
import { toast } from 'react-hot-toast';

const AIStudioModal = ({ isOpen, onClose, product, onSave }) => {
    const [prompt, setPrompt] = useState("Un mannequin femme hyper réaliste, élégante et naturelle, portant ce produit, lumière douce de studio, haute résolution, 4k, style magazine de mode.");
    const [apiKey, setApiKey] = useState("");
    const [generatedImage, setGeneratedImage] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen || !product) return null;

    const handleGenerate = async () => {
        if (!prompt) return toast.error("Le prompt est vide !");
        // if (!apiKey) return toast.error("Entre ta clé API 'Banana' d'abord !"); // Commenté pour tester sans clé si besoin mock

        setLoading(true);
        try {
            // On passe 'demo' comme clé si vide pour tester le mock
            const keyToUse = apiKey || "demo";
            const resultUrl = await generateMagicPhoto(prompt, product.image, keyToUse);
            setGeneratedImage(resultUrl);
        } catch (e) {
            // Error handled in service
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        if (generatedImage) {
            onSave(product.id, generatedImage);
            onClose();
            setGeneratedImage(null);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[80vh]"
                >
                    {/* Left: Preview Area */}
                    <div className="flex-1 bg-gray-900 relative flex items-center justify-center p-4">
                        <div className="relative w-full h-full flex flex-col gap-4">
                            {/* Original */}
                            <div className="flex-1 bg-black/50 rounded-xl overflow-hidden relative border border-gray-700">
                                <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">Original</span>
                                <img src={product.image} alt="Original" className="w-full h-full object-contain" />
                            </div>

                            {/* Generated */}
                            <div className="flex-1 bg-black/50 rounded-xl overflow-hidden relative border border-gray-700 flex items-center justify-center">
                                <span className="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded z-10">
                                    Resultat Gemini Nano Banana 🍌
                                </span>
                                {loading ? (
                                    <div className="flex flex-col items-center gap-3 text-indigo-400 animate-pulse">
                                        <Loader2 size={48} className="animate-spin" />
                                        <span className="font-mono text-sm">Génération en cours...</span>
                                    </div>
                                ) : generatedImage ? (
                                    <img src={generatedImage} alt="Generated" className="w-full h-full object-contain animate-in fade-in" />
                                ) : (
                                    <div className="text-gray-600 flex flex-col items-center">
                                        <ImageIcon size={48} />
                                        <span className="text-sm mt-2">L'image générée apparaîtra ici</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Controls */}
                    <div className="w-full md:w-96 bg-white p-6 flex flex-col border-l">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><Wand2 size={20} /></span>
                                Studio Magic
                            </h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4 flex-1 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Magique (Nani Banana)</label>
                                <textarea
                                    className="w-full p-3 border rounded-xl bg-gray-50 text-sm h-32 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Décris le résultat voulu..."
                                />
                                <p className="text-xs text-gray-400 mt-1">💡 Astuce: Sois précis sur l'ambiance et la lumière.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Clé API (Optionnel pour test)</label>
                                <input
                                    type="password"
                                    className="w-full p-3 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="sk-..."
                                />
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t space-y-3">
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                                Générer la Photo
                            </button>

                            {generatedImage && (
                                <button
                                    onClick={handleSave}
                                    className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                                >
                                    <Save size={18} />
                                    Sauvegarder & Remplacer
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AIStudioModal;
