// Default Templates (French) - Using user's specific formulations where available + snippet structure
export const DEFAULT_TEMPLATES = {
    'packing': "Bonjour [Client] 💖\nMerci pour votre commande chez [Store] !\n\nVoici les détails de votre commande :\n\n📞 Numéro joignable :\n[Phone]\n\n📍 Adresse de livraison :\n[Adresse], [Ville]\n\n💰 Total (articles + livraison) :\n[Total] DH\n\n[Ticket]\n\n💳 Paiement à la livraison.\n\n🚚 Livraison entre 24h et 48h maximum.\n\n👉 Merci de réagir avec un 👍 pour confirmer votre commande.\nLa livraison sera envoyée uniquement après votre confirmation.\n\n📦 Une fois votre commande arrivée dans votre ville, nous vous enverrons un message pour vous informer que vous serez livrée le jour même.\n\nMerci pour votre confiance et bienvenue dans l’univers LAHFA ✨🤍",
    'ramassage': "Bonjour [Client], votre commande est prête et sera bientôt remise au livreur.",
    'livraison': "Bonjour [Client] 🤍\nVotre commande est arrivée dans votre ville. Attendez l'appel du livreur très prochainement pour la livraison 🚚.\nMerci de rester joignable ! 🌸",
    'livré': "Bonjour [Client] ✨\nMerci infiniment 🌸\nNous espérons que votre commande vous apporte entière satisfaction 🤍\nCe message confirme la bonne réception de votre article Lahfa’h 💌",
    'pas de réponse client': "Bonjour [Client] 🌸, nous avons tenté de vous joindre concernant votre commande LAHFA mais sans succès. Quand seriez-vous disponible ? Merci ✨",
    'retour': "Bonjour [Client], votre commande nous a été retournée.",
    'annulé': "Bonjour [Client], votre commande a été annulée."
};

// Darija Templates
export const DARIJA_TEMPLATES = {
    'packing': "Salam [Client] 💖, wslatna la commande dialk f [Store] !\n\n📄 *Tafassil* :\n[Ticket]\n💰 Total: [Total] DH\n\nBach nsiftoha lik l [Ville], momkin t'akder lina l'adresse o lweqt ? Jawbna b 'OUI' bach nvalidiw. ✅\n\nIla kan kulchi howa hadak, dir lina pouce 👍",
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
    // Map granular statuses to template keys
    let key = 'packing';
    const s = (status || '').toLowerCase();

    if (s.includes('packing') || s.includes('attente') || s.includes('préparer') || s.includes('created')) {
        key = 'packing';
    }
    else if (s.includes('ramass') || s.includes('entrepôt') || s.includes('transit')) {
        key = 'ramassage';
    }
    else if (s.includes('cours de livraison') || s.includes('distribué') || s.includes('programmé') || s === 'livraison') {
        key = 'livraison';
    }
    else if (s.includes('livré')) { // Covers 'Livré' and 'Livré Partiellement'
        key = 'livré';
    }
    else if (s.includes('injoignable') || s.includes('reporté') || s.includes('réponse')) {
        key = 'pas de réponse client';
    }
    else if (s.includes('retour') || s.includes('refusé') || s.includes('changer')) {
        key = 'retour';
    }
    else if (s.includes('annulé')) {
        key = 'annulé';
    }

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

    // Ticket construction (Panier)
    let ticketText = "";
    if (order.items && order.items.length > 0) {
        ticketText = order.items.map(item => `- ${item.quantity || 1}x ${item.article || item.name || 'Article'}`).join('\n');
    } else {
        ticketText = `- ${order.quantity || 1}x ${order.article || 'Article'}`;
    }

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
