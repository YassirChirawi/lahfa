export const getStatusColor = (status) => {
    if (!status) return 'status-default';
    const s = status.toLowerCase();

    // Success - Green
    if (s.includes('livré') && !s.includes('partie')) return 'status-success';

    // Warning - Orange/Yellow
    if (s.includes('partie')) return 'status-warning';
    if (s.includes('injoignable') || s.includes('reporté') || s.includes('programmé')) return 'status-warning';

    // Danger - Red
    if (s.includes('retour') || s === 'annulé' || s === 'refusé' || s.includes('changer')) return 'status-danger';

    // Info - Blue
    if (s.includes('cours de livraison') || s.includes('distribué')) return 'status-primary'; // Bleu vif
    if (s.includes('entrepôt') || s.includes('transit') || s.includes('ramassé')) return 'status-info'; // Bleu clair
    if (s.includes('ramassage en cours')) return 'status-info';

    // Default - Grey
    if (s.includes('attente') || s.includes('préparer') || s === 'packing') return 'status-default';

    return 'status-default';
};
