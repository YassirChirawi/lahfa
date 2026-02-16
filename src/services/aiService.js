import { toast } from 'react-hot-toast';

// Configuration "Gemini Nano Banana" 🍌✨
const API_CONFIG = {
    // Remplacer par la vraie URL de l'API (ex: OpenAI, Replicate, ou ton backend)
    endpoint: "https://api.openai.com/v1/images/generations",
    // endpoint: "https://api.replicate.com/v1/predictions", // Si utilisation de Replicate
    model: "dall-e-3" // ou un modèle spécifique sur Replicate
};

/**
 * Génère une "Magic Photo" à partir d'un prompt et (optionnellement) d'une image de référence.
 * @param {string} prompt - Le prompt "Nani Banana" (ex: "mannequin femme réaliste...")
 * @param {string} originalImage - L'URL de l'image produit originale
 * @param {string} apiKey - La clé API fournie par l'utilisateur
 */
export const generateMagicPhoto = async (prompt, originalImage, apiKey) => {
    if (!apiKey) {
        toast.error("Il manque la clé magique (API Key) ! 🔑");
        throw new Error("API Key missing");
    }

    try {
        console.log("🍌 Lancement de l'opération Gemini Nano Banana...");
        console.log("Prompt:", prompt);
        console.log("Image Source:", originalImage);

        // Simulation d'un appel API (Mock)
        // À remplacer par le vrai fetch vers l'API choisie

        // Simuler un délai de réseau (3s)
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Note pour Yassir:
        // Ici, il faut implémenter le vrai appel. 
        // Exemple pour OpenAI DALL-E (Text-to-Image simple, pas Image-to-Image direct) :
        /*
        const response = await fetch(API_CONFIG.endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024"
            })
        });
        const data = await response.json();
        return data.data[0].url;
        */

        // Pour l'instant, on retourne une image placeholders "Noel/Mannequin" pour tester l'UI
        // C'est juste pour montrer que ça marche "visuellement"
        const mockImages = [
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80", // Mannequin fashion
            "https://images.unsplash.com/photo-1529139574466-a302c2d3621c?w=800&q=80", // Mannequin esthetique
            "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80"  // Fashion 
        ];

        const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)];

        toast.success("Magie accomplie ! ✨🍌");
        return randomImage;

    } catch (error) {
        console.error("Erreur Gemini Nano Banana:", error);
        toast.error("Oups, la magie a échoué... Réessaie !");
        throw error;
    }
};

/**
 * Génère un message marketing personnalisé pour un segment client.
 * @param {string} segment - Le segment du client (ex: "Champion", "At Risk")
 * @param {string} customerName - Le nom du client
 */
/**
 * Génère un message marketing personnalisé pour un segment client.
 * @param {string} segment - Le segment du client (ex: "Champion", "At Risk")
 * @param {string} customerName - Le nom du client
 */
export const generateMarketingMessage = async (segment, customerName) => {
    // Simulation d'un délai pour l'effet "AI Thinking"
    await new Promise(resolve => setTimeout(resolve, 1500));

    const firstName = customerName ? customerName.split(' ')[0] : 'Client';

    // Style "LAHFA" inspiré de whatsappUtils.js
    // Mix Darija/Français poli et chaleureux avec emojis

    switch (segment) {
        case 'Champion 🏆':
            return `Salam ${firstName} 💖 !\n\nMerci d'être un(e) client(e) fidèle de LAHFA ✨.\nPour vous remercier, on vous offre un code exclusif *VIP20* pour -20% sur votre prochaine commande ! 🎁\n\nProfitez-en vite ici : [Lien_Site]\n\nMerci pour votre confiance 🌸`;

        case 'Loyal':
            return `Bonjour ${firstName} ✨\n\nOn espère que vous allez bien ! 🌸\nComme vous aimez nos produits, on voulait vous montrer nos dernières nouveautés en avant-première 👀.\n\nJetez un coup d'œil ici : [Lien_Collection]\n\nÀ très vite ! 🤍`;

        case 'At Risk ⚠️':
            return `Salam ${firstName} 👋,\n\nÇa fait longtemps qu'on ne vous a pas vu par ici ! Vous nous manquez 🥺.\n\nRevenez nous voir avec le code *WEMISSYOU* pour profiter de -15% sur tout le site 🎁.\n\n👉 [Lien_Site]\n\nOn espère vous revoir bientôt ! 🌸`;

        case 'Hibernating zzz':
            return `Toc toc ${firstName} ? 👋\n\nOn a fait le plein de nouveautés chez LAHFA qui pourraient vous plaire ✨.\n\nVenez découvrir notre nouvelle collection ici : [Lien_Site]\n\nBonne journée ! ☀️`;

        case 'New Lead':
            return `Bienvenue ${firstName} dans l'univers LAHFA ! ✨🤍\n\nPour fêter votre arrivée, la livraison est *OFFERTE* sur votre première commande avec le code *WELCOME* 🚚💨.\n\nCommandez ici : [Lien_Site]\n\nÀ bientôt ! 🌸`;

        case 'Promising':
            return `Salam ${firstName} 💖\n\nMerci encore pour votre première commande ! On espère qu'elle vous a plu ✨.\n\nPour la prochaine, voici un petit cadeau : -10% avec le code *MERCI10* 🎁.\n\nEn profiter ici : [Lien_Site]\n\nBelle journée ! ☀️`;

        default:
            return `Bonjour ${firstName} ✨\n\nDécouvrez nos offres spéciales du moment chez LAHFA ! 🌸\n\n👉 [Lien_Site]`;
    }
};

/**
 * Génère une description produit attractive basée sur ses caractéristiques et (optionnellement) sa photo.
 * @param {string} name - Nom du produit
 * @param {string} category - Catégorie
 * @param {string} color - Couleur
 * @param {string} image - URL de l'image (pour analyse multimodale future)
 */
export const generateProductDescription = async (name, category, color, image) => {
    // Simulation délai AI
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Construction du prompt contextuel (Simulation de la réponse AI)
    // On s'assure que la couleur est bien mentionnée !

    const colorText = color ? `d'une magnifique couleur ${color}` : "au design élégant";
    const categoryText = category ? category.toLowerCase() : "article";

    const templates = [
        `Découvrez notre ${name}, un ${categoryText} incontournable pour votre garde-robe. Conçu ${colorText}, il allie confort absolu et style raffiné. Parfait pour vos moments de détente, ce modèle mettra en valeur votre silhouette avec douceur. ✨`,

        `Craquez pour l'élégance du ${name}. Ce ${categoryText} ${colorText} est la pièce maîtresse qu'il vous manquait. Tissu doux, coupe parfaite et finitions soignées... Laissez-vous séduire par la qualité LAHFA. 💖`,

        `Envie de nouveauté ? Le ${name} est fait pour vous ! En ${color || 'toute simplicité'}, ce ${categoryText} vous offre un look chic et décontracté. Idéal pour offrir ou se faire plaisir. 🎁`
    ];

    // Si on a une image, on pourrait (dans le futur avec une vraie API) analyser le style visuel.
    // Pour l'instant on retourne une variante textuelle riche.

    return templates[Math.floor(Math.random() * templates.length)];
};
