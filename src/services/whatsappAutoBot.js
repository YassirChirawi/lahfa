import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import aiService from './aiService';

// --- CONFIGURATION ---
const STORE_NAME = "Lahfa'h";
const SUPPORT_PHONE = "0600000000";

// --- CORE LOGIC ---
const handleIncomingMessage = async (phoneNumber, message) => {
    // 1. Normalize Phone
    const cleanPhone = phoneNumber.replace(/\D/g, '').replace(/^212/, '0');
    const fullPhone = `212${cleanPhone.substring(1)}`;

    console.log(`[AutoBot] Phone: ${cleanPhone}, Msg: ${message}`);
    console.log(`[AutoBot] Searching for: ${cleanPhone} AND ${fullPhone}`);

    let reply = "";
    let action = null;
    let orderFound = null;

    try {
        // 2. FETCH CONTEXT (Order)
        const ordersRef = collection(db, 'orders');
        const q1 = query(ordersRef, where('phone', '==', cleanPhone));
        const q2 = query(ordersRef, where('phone', '==', fullPhone));

        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

        console.log(`[AutoBot] Query Results: Clean=${snap1.size}, Full=${snap2.size}`);

        let allOrders = [];
        snap1.forEach(doc => allOrders.push({ id: doc.id, ...doc.data() }));
        snap2.forEach(doc => allOrders.push({ id: doc.id, ...doc.data() }));

        allOrders = allOrders
            .filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i)
            .sort((a, b) => {
                const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                return dateB - dateA;
            });

        console.log(`[AutoBot] Total Unique Orders Found: ${allOrders.length}`);

        // 3. PREPARE AI PROMPT
        if (allOrders.length > 0) {
            orderFound = allOrders[0];
            const status = orderFound.status || 'Nouveau';
            const items = orderFound.cart?.map(i => `${i.count}x ${i.name}`).join(', ') || 'Articles';

            // --- EXTRACT TRACKING HISTORY & LINK ---
            let trackingHistory = "Pas de détails intermédiaires.";
            let trackingLink = "Non disponible";

            try {
                const dv = orderFound.deliveryValues || {};

                // 1. Get Link
                if (dv.trackingID) {
                    trackingLink = `https://app.sendit.ma/deliveries/${dv.trackingID}`;
                }

                // 2. Get History (Handle various Sendit structures)
                let events = [];
                if (dv.history) {
                    events = dv.history;
                } else if (dv.raw) {
                    // Sometimes raw.data.audits, sometimes raw.audits
                    events = dv.raw.data?.audits || dv.raw.audits || [];
                }

                if (events.length > 0) {
                    trackingHistory = events.map(e => {
                        const date = e.created_at || e.date || '';
                        const st = e.status || e.event || 'Info';
                        const loc = e.ville || e.data?.ville || '';
                        const com = e.comment || e.data?.comment || '';
                        // Format: [12/02 10:00] Status (Ville): Commentaire
                        return `- [${new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}] ${st} ${loc ? `(${loc})` : ''} ${com}`;
                    }).join('\n');
                }
            } catch (e) {
                console.error("Error parsing history:", e);
            }

            const prompt = `
            Tu es l'assistant service client de la boutique "${STORE_NAME}".
            Le client t'envoie ce message : "${message}".
            
            DONNÉES CLIENT / COMMANDE :
            - Statut Actuel : ${status}
            - Date Commande : ${orderFound.date?.toDate ? orderFound.date.toDate().toLocaleDateString() : 'Récemment'}
            - Lien de Suivi : ${trackingLink}
            
            HISTORIQUE DE SUIVI (Le plus récent en bas):
            ${trackingHistory}

            TÈS IMPORTANT - RÈGLES DE CONVERSATION :
            1. Si le client confirme la réception (ex: "oui", "bien reçu", "merci"), SOYEZ HEUREUX ! 
               -> Dites : "Génial ! Nous espérons que ça vous plaît ! 🥰 N'hésitez pas à nous envoyer une photo !" (Ne demandez PAS s'il a reçu).
            
            2. Si le client demande "C'est où ?" ou "Suivi détaillé" :
               -> Analysez l'HISTORIQUE DE SUIVI ci-dessus.
               -> Résumez la DERNIÈRE étape connue (ex: "Dernière info : Arrivé à Casa le 15/02").
               -> Donnez le LIEN DE SUIVI s'il est disponible.

            3. Si le statut est "Livré" mais le client dit "Je n'ai rien reçu" :
               -> "Oh mince ! Je vois pourtant qu'il est marqué livré. Je vais demander au livreur et revenir vers vous."

            4. Ton : Chaleureux, Emoji, Marocain Friendly (Darija accepté si le client en utilise), Court (2 phrases max).
            `;

            // 4. CALL GENAI
            const aiReply = await aiService.generateAIResponse(prompt);

            if (aiReply) {
                reply = aiReply;
            } else {
                // FALLBACK IF AI FAILS OR NO KEY
                reply = `Bonjour! Votre commande est actuellement : ${status}. \nUn agent va prendre le relais pour plus de détails.`;
            }

        } else {
            // NO ORDER FOUND CONTEXT
            const prompt = `
            Tu es l'assistant de "${STORE_NAME}". Le client dit : "${message}".
            Tu n'as trouvé aucune commande récente pour ce numéro de téléphone (${phoneNumber}).
            
            INSTRUCTIONS :
            - Dis poliment que tu ne trouves pas la commande.
            - Demande s'il a commandé avec un autre numéro.
            - Sois serviable et bref.
            `;

            const aiReply = await aiService.generateAIResponse(prompt);
            if (aiReply) {
                reply = aiReply;
            } else {
                reply = `Bonjour! Je ne trouve pas de commande avec ce numéro. Avez-vous utilisé un autre numéro ?`;
            }
        }

        // Action detection (heuristic)
        if (reply.toLowerCase().includes('agent') || reply.toLowerCase().includes('humain')) {
            action = 'NOTIFY_HUMAN';
        }

        return { reply, intent: 'AI_PROCESSED', action, order: orderFound };

    } catch (error) {
        console.error("AutoBot Error:", error);
        return {
            reply: "Oups, une petite erreur technique. Un humain va vous répondre bientôt !",
            intent: 'ERROR',
            action: 'NOTIFY_HUMAN'
        };
    }
};

export default {
    handleIncomingMessage
};
