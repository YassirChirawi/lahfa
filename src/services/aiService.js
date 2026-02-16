import { toast } from 'react-hot-toast';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiKey = async () => {
    const docRef = doc(db, 'settings', 'ai');
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().active && snap.data().apiKey) {
        return snap.data().apiKey;
    }
    return null;
};

// ... existing code ...

/**
 * Génère une réponse intelligente pour le Support WhatsApp.
 * @param {string} prompt - Le contexte + instruction (ex: "Tu es Lahfa'h, le client demande X...")
 */
// Liste des modèles à tester par ordre de préférence (Mise à jour pour Gemini Live)
const MODELS_TO_TRY = [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash"
];

export const generateAIResponse = async (prompt) => {
    try {
        const apiKey = await getGeminiKey();
        if (!apiKey) {
            console.warn("[AI] Pas de clé API configurée ou IA inactive. Fallback manuel.");
            return null; // Signals caller to use fallback
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Essayer les modèles un par un
        for (const modelName of MODELS_TO_TRY) {
            try {
                console.log(`[AI] Tentative avec le modèle : ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                console.log(`[AI] Succès avec ${modelName} ! Réponse:`, text);
                return text.trim();
            } catch (innerError) {
                console.warn(`[AI] Échec avec ${modelName}:`, innerError.message);
                // On continue à la boucle suivante
            }
        }

        // --- DIAGNOSTIC: List available models if all fail ---
        console.warn("[AI] Tous les modèles ont échoué. Tentative de diagnostic...");
        try {
            const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
            const response = await fetch(listModelsUrl);
            const data = await response.json();
            console.log("[AI] Modèles disponibles pour cette clé :", data);
            if (data.models) {
                return `Erreur de configuration AI. Modèles disponibles : ${data.models.map(m => m.name).join(', ')}`;
            } else {
                return `Erreur API : ${JSON.stringify(data)}`;
            }
        } catch (diagError) {
            console.error("[AI] Diagnostic impossible :", diagError);
        }

        throw new Error("Aucun modèle n'a fonctionné.");

    } catch (error) {
        console.error("[AI] Erreur fatale Gemini AI:", error);
        return null; // Fallback
    }
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
 * @param {string} language - 'fr' (défaut) ou 'darija' (pour le local)
 */
export const generateProductDescription = async (name, category, color, image, language = 'fr') => {
    // Simulation délai AI
    await new Promise(resolve => setTimeout(resolve, 2000));

    const colorText = color ? `d'une magnifique couleur ${color}` : "au design élégant";
    const categoryText = category ? category.toLowerCase() : "article";

    // Génération d'un titre accrocheur selon la langue
    const adjectivesFr = ["Céleste", "Passion", "Douceur", "Élégance", "Charme", "Prestige", "Confort", "Divin"];
    const adjectivesDarija = ["Hmamq", "Wa3r", "Luxe", "Top", "Chic", "Nda"];

    const adjectives = language === 'darija' ? adjectivesDarija : adjectivesFr;
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const title = `${category} ${color || ''} ${randomAdjective}`.trim();

    let templates = [];

    if (language === 'darija') {
        // Templates Darija/Français (Street Smart)
        templates = [
            `Slam, had ${name} li khtartizi men la gamme ${categoryText} ra 7aja luxe! ✨\n\nConçu ${colorText}, kayji m3a koulchi. Tissu rtb w confort total. \n\nParfait bach tban fl top wla t3tiha cadeau l chi 7d 3ziz. 🎁\n\nStock limité, matratich l'occasion! 🚀`,

            `Choufi l'élégance dyal ${name}! 😍\n\nHada houwa ${categoryText} li khassk. Design ${colorText} w qualité wa3ra bzaf. \n\nKayn ghir 3nd LAHFA. Tlbou daba w twslk htal dar! 🚚💨`,

            `Jdid fl collection! 🌟\n\n${name} b'design ${colorText}, confort w anaka mjmou3in. \n\nMithali l dar wla l khrujat. Thllay f rask b a7san qualité. 💖`
        ];
    } else {
        // Templates Français
        templates = [
            `Découvrez notre ${title}, un ${categoryText} incontournable... Conçu ${colorText}...`,
            `Craquez pour l'élégance du ${title}. Ce ${categoryText} ${colorText} est la pièce maîtresse...`,
            `Envie de nouveauté ? Le ${title} est fait pour vous ! En ${color || 'toute simplicité'}...`
        ];
    }

    const description = templates[Math.floor(Math.random() * templates.length)];

    return {
        title: title,
        description: description + `\n\nRef: ${name}`
    };
};

/**
 * Analyse une commande pour détecter les risques de retour (Anti-Retour AI).
 * @param {object} order - L'objet commande complet.
 * @returns {object} - { score: number, level: 'Low'|'Medium'|'High', reasons: string[] }
 */
export const evaluateOrderRisk = (order) => {
    let riskScore = 0;
    const reasons = [];

    // 1. Analyse de l'adresse (40%)
    const address = (order.address || '').toLowerCase().trim();
    if (address.length < 10) {
        riskScore += 30;
        reasons.push("Adresse trop courte");
    }
    if (!address.includes('rue') && !address.includes('hay') && !address.includes('quartier') && !address.includes('imm')) {
        riskScore += 10;
        reasons.push("Format d'adresse imprécis");
    }

    // 2. Analyse de la ville (20%)
    if (!order.city || order.city.length < 3) {
        riskScore += 20;
        reasons.push("Ville manquante ou invalide");
    }

    // 3. Analyse du téléphone (20%)
    // (Check simple de longueur pour l'exemple)
    const phone = (order.phone || '').replace(/\s/g, '');
    if (phone.length < 10) {
        riskScore += 20;
        reasons.push("Numéro de téléphone suspect");
    }

    // 4. Analyse du panier (20%)
    // Si grosse commande (> 1000 DH) ou beaucoup d'articles (> 5), risque modéré
    if (order.amount > 2000) {
        riskScore += 10;
        reasons.push("Montant élevé (vérification recommandée)");
    }

    // Détermination du niveau
    let level = 'Low';
    if (riskScore >= 50) level = 'Medium';
    if (riskScore >= 80) level = 'High';

    return { score: riskScore, level, reasons };
};

/**
 * Génère un rapport flash (Daily Stats) pour le Copilot.
 * @param {Array} orders - Liste des commandes
 * @param {Array} clients - Liste des clients
 */
/**
 * Analyse un message pour extraire une intention de création de commande.
 * @param {string} text - Message de l'utilisateur
 */
export const parseOrderIntent = async (text) => {
    const prompt = `
    Analyse ce message et extrais les informations de commande pour une boutique E-commerce au Maroc.
    RETOURNE UNIQUEMENT UN OBJET JSON.

    Champs obligatoires pour conformité Sendit :
    - customer: Nom complet du client
    - phone: 10 chiffres (ex: 0612345678)
    - city: Ville du Maroc (ESSENTIEL)
    - address: Adresse précise ou quartier (ESSENTIEL)
    - product: Nom de l'article
    - quantity: Nombre (défaut 1)
    - amount: Prix total en DH (chiffre uniquement)

    Message: "${text}"
    
    IMPORTANT: Si une information manque (surtout ville ou téléphone), essaie de la deviner via le contexte ou laisse vide, mais ne l'invente pas. 
    Retourne "null" si ce n'est manifestement pas une commande.
    `;

    try {
        const response = await generateAIResponse(prompt);
        if (!response || response.toLowerCase().includes('null')) return null;

        // Clean markdown if AI wrapped it in code blocks
        const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("ParseIntent Error:", e);
        return null;
    }
};

export const generateCopilotStats = async (orders = [], clients = []) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(o => o.date === today && !o.deleted);

        const totalRevenue = todayOrders.reduce((acc, o) => acc + (parseFloat(o.total || o.amount) || 0), 0);
        const deliveredToday = todayOrders.filter(o => o.status === 'Livré' || o.status === 'Delivered').length;
        const pendingToday = todayOrders.filter(o => o.status === 'Packing' || o.status === 'Nouveau').length;

        const topClient = [...clients].sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))[0];

        const prompt = `
        Tu es Mervat. Génère un "Rapport Flash" ultra-rapide et motivant pour l'administrateur.🌸✨
        
        STATS D'AUJOURD'HUI (${today}) :
        - Nombre de commandes : ${todayOrders.length}
        - Chiffre d'affaires : ${totalRevenue} DH
        - Livrées : ${deliveredToday}
        - En attente : ${pendingToday}
        
        INFO CLIENT :
        - Meilleur client de tous les temps : ${topClient ? topClient.name : 'Non disponible'} (${topClient ? topClient.totalSpent : 0} DH cumulés)

        INSTRUCTIONS :
        1. Fais un résumé très court (3-4 points max).
        2. Utilise des emojis (🚀, 💰, 📦).
        3. Ajoute une petite phrase d'encouragement à la fin en Darija.
        4. Si les stats sont à 0, sois encourageant quand même (ex: "La journée ne fait que commencer !").
        `;

        const response = await generateAIResponse(prompt);
        return response || "Erreur lors de la génération des stats.";
    } catch (e) {
        console.error("Stats Error:", e);
        return "Désolé, je n'ai pas pu compiler les statistiques pour le moment. 📊";
    }
};

export const generateCopilotResponse = async (userMessage, pageContext) => {
    const prompt = `
    Tu es "Mervat", la petite assistante personnelle adorée de **maman Eya** 💖.
    Ta mission est d'aider maman Eya à gérer sa boutique Lahfa avec beaucoup d'amour, de douceur et d'efficacité. ✨🌸

    INSTRUCTIONS SPÉCIALES :
    - Adresse-toi TOUJOURS à l'utilisatrice en l'appelant "maman Eya".
    - Sois comme une petite fille serviable, polie et très intelligente.

    CONTEXTE ACTUEL :
    - Page affichée : ${pageContext}
    - Rôle : Assistante Experte E-commerce (Maroc)

    INSTRUCTIONS DE RÉPONSE :
    1. Sois proactive, chaleureuse et utile. 🌸
    2. Utilise des emojis girly (💖, ✨, 🌸, 👗).
    3. Si l'utilisateur pose une question sur ses données, dis que tu es prêt à les analyser (même si l'intégration data poussée arrive bientôt).
    4. Tu connais quelques commandes : 
       - /nav [orders|products|clients|finance|settings]
       - /stats (pour un résumé)
       - /search [terme]
    5. Réponds en Français avec des touches de Darija si approprié.

    Message de l'administrateur : "${userMessage}"
    `;

    const response = await generateAIResponse(prompt);
    return response || "Désolé, je rencontre une petite difficulté technique. Je reste à votre disposition ! 🤖";
};

export default {
    generateMagicPhoto,
    augmentOrderRisk: evaluateOrderRisk, // Alias for backward compatibility
    evaluateOrderRisk,
    generateAIResponse,
    generateMarketingMessage,
    generateProductDescription,
    generateCopilotResponse,
    generateCopilotStats,
    parseOrderIntent
};
