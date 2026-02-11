// Default Templates (French) - Using user's specific formulations where available + snippet structure
export const DEFAULT_TEMPLATES = {
    'packing': "Bonjour [Client] 💖\nMerci pour votre commande chez [Store] !\n\nVoici les détails\n\nNuméro joignable :\n[Phone]\n\nAdresse de livraison :\n[Adresse] [Ville]\n\nTotal (articles + livraison) :\n[Total] DH\n\n💳 Paiement à la livraison.\n\nMerci pour votre confiance et bienvenue dans l’univers LAHFA ✨\n\nSi vous confirmez les infos de la commande réagissez avec un pouce 👍",
    'ramassage': "Bonjour [Client], votre commande est prête et sera bientôt remise au livreur.",
    'livraison': "Bonjour [Client] 🤍\nVotre commande est déjà arrivée dans votre ville. Voici le numéro du livreur :\n[DeliveryManPhone]\n\nN’hésitez pas à l’appeler si vous souhaitez lui préciser l’heure qui vous arrange pour la livraison. Merci 🌸",
    'livré': "Bonjour [Client] ✨\nMerci infiniment 🌸\nNous espérons que votre commande vous apporte entière satisfaction 🤍\nCe message confirme la bonne réception de votre article Lahfa’h 💌",
    'pas de réponse client': "Bonjour [Client] 🌸, nous avons tenté de vous joindre concernant votre commande LAHFA mais sans succès. Quand seriez-vous disponible ? Merci ✨",
    'retour': "Bonjour [Client], votre commande nous a été retournée.",
    'annulé': "Bonjour [Client], votre commande a été annulée."
};

// Darija Templates
export const DARIJA_TEMPLATES = {
    'packing': "Salam [Client] 💖, wslatna la commande dialk f [Store] !\n\n📄 *Tafassil* :\n[Ticket]\n\nBach nsiftoha lik l [Ville], momkin t'akder lina l'adresse o lweqt ? Jawbna b 'OUI' bach nvalidiw. ✅\n\nIla kan kulchi howa hadak, dir lina pouce 👍",
    'ramassage': "Salam [Client] 📦, commande dialk wjdat bach n3tiwha l livreur.",
    'livraison': "Salam [Client] 🤍, ra livreur jay 3endk l [Ville].\n7di m3a ton tel ghadi i3eyet lik 9rib 📞.\nChokran 🌸",
    'livré': "Salam [Client] ✨\nCommande dialk wslatek. Chokran hit teqti fina o ntmenaw ikon produit 3ejbek 💌\nMerhba bik f [Store] 🌸",
    'pas de réponse client': "Salam [Client] 🌸, livreur 3eyet likom o malqakomch 📞. Mazal baghin la commande ? Chokran ✨.",
    'retour': "Salam [Client], commande dialk atrje3 lina ↩️. Ila mazal baghiha 3eyet lina f aqreb weqt chokran.",
    'annulé': "Salam [Client], commande dialk tghat (annulée) ❌."
};

/**
 * Generates the WhatsApp message content
 * @param {string} status 
 * @param {object} order - Full order object
 * @param {string} lang - 'fr' or 'darija'
 * @param {object} overrides - Optional overrides for dynamic fields { clientName, phone, city, address, product, total }
 */
export const getWhatsappMessage = (status, order, lang = 'fr', overrides = {}) => {
    // Map local status to template keys if needed
    // Local statuses: 'Packing', 'Ramassage', 'Livraison', 'Livré', 'Pas de réponse client', 'Retour'
    // Template keys need to match.
    // Normalized key: lowercase
    const key = status ? status.toLowerCase() : 'packing';

    // Fallback mapping if keys don't perfectly match (e.g. 'ramassage' vs 'Ramassage' handled by toLowerCase)
    // 'Pas de réponse client' -> 'pas de réponse client'

    const defaults = lang === 'darija' ? DARIJA_TEMPLATES : DEFAULT_TEMPLATES;
    const rawTemplate = defaults[key] || defaults['packing'] || "";

    const clientName = overrides.clientName ?? (order.customer || "Client");
    const storeName = "LAHFA";
    const cityName = overrides.city ?? (order.city || "");
    const address = overrides.address ?? (order.address || "");
    const phone = overrides.phone ?? (order.phone || "");
    const deliveryManPhone = order.deliveryValues?.deliveryManPhone || "_______";
    const total = overrides.price ?? (order.amount ? order.amount.toFixed(2) : "0.00");

    // Product Name Logic
    let productName = overrides.product;
    if (!productName) {
        if (order.items && order.items.length > 0) {
            productName = order.items.map(i => i.article || i.name).join(', ');
        } else {
            productName = order.article || "Article";
        }
    }

    // Ticket construction for Darija 'Packing' template which uses [Ticket]
    let ticketText = "";
    if (order.items && order.items.length > 0) {
        ticketText = order.items.map(item => `- ${item.quantity || 1}x ${item.article || item.name || 'Article'}`).join('\n');
    } else {
        ticketText = `- ${order.quantity || 1}x ${order.article || 'Article'}`;
    }
    // Add Total to ticket
    ticketText += `\n💰 Total: ${total} DH`;

    let message = rawTemplate
        .replace(/\[Client\]/g, clientName)
        .replace(/\[Store\]/g, storeName)
        .replace(/\[Ville\]/g, cityName)
        .replace(/\[Adresse\]/g, address)
        .replace(/\[Phone\]/g, phone)
        .replace(/\[DeliveryManPhone\]/g, deliveryManPhone)
        .replace(/\[Total\]/g, total)
        .replace(/\[Ticket\]/g, ticketText)
        .replace(/\[Produit\]/g, productName)
        .replace(/\[Commande\]/g, order.displayId || order.id || "");

    return message;
};

export const getWhatsAppUrl = (order, lang = 'fr') => {
    if (!order || !order.phone) return null;

    // 1. Remove spaces, dashes, parentheses
    let cleanPhone = order.phone.replace(/[\s\-\(\)]/g, '');

    // 2. Format to international
    if (cleanPhone.startsWith('+')) {
        cleanPhone = cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('00')) {
        cleanPhone = cleanPhone.substring(2);
    } else if (cleanPhone.startsWith('0') && cleanPhone.length > 9) {
        cleanPhone = '212' + cleanPhone.substring(1);
    }

    const message = getWhatsappMessage(order.status, order, lang);

    // Use wa.me
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};
