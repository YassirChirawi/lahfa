
/**
 * Maps Sendit specific statuses to dashboard display statuses.
 * @param {string} senditStatus 
 * @returns {string|null} Dashboard Status
 */
export const mapSenditStatus = (senditStatus) => {
    if (!senditStatus) return null;
    const normalized = senditStatus.toUpperCase();

    // Granular Mapping to match Sendit exactly
    if (normalized.includes('LIVRÉ') || normalized === 'DELIVERED') return 'Livré';
    if (normalized.includes('PARTIELLEMENT')) return 'Livré Partiellement';

    // Negative Statuses - Keep them distinct
    if (normalized === 'CANCELED' || normalized === 'ANNULÉ') return 'Annulé';
    if (normalized === 'REFUSÉ' || normalized === 'REJECTED') return 'Refusé';
    if (normalized.includes('RETOUR')) return 'Retour';
    if (normalized === 'A_CHANGER' || normalized === 'À CHANGER') return 'À changer';

    if (normalized === 'EN COURS DE LIVRAISON' || normalized === 'DELIVERING' || normalized === 'DISTRIBUTED' || normalized === 'DISTRIBUÉ') return 'En cours de livraison';

    if (normalized === 'INJOIGNABLE' || normalized === 'UNREACHABLE') return 'Injoignable';
    if (normalized === 'REPORTÉ' || normalized === 'POSTPONED') return 'Reporté';
    if (normalized === 'PROGRAMMÉ' || normalized === 'SCHEDULED') return 'Programmé';

    if (normalized === 'ENTREPÔT' || normalized === 'WAREHOUSE') return 'Entrepôt';
    if (normalized === 'EN TRANSIT' || normalized === 'TRANSIT') return 'En transit';

    if (normalized === 'RAMASSÉ' || normalized === 'PICKED_UP' || normalized === 'PICKEDUP') return 'Ramassé';
    if (normalized === 'RAMASSAGE EN COURS' || normalized === 'PICKING_UP') return 'Ramassage en cours';

    if (normalized === 'À PRÉPARER' || normalized === 'TO_PREPARE') return 'À préparer';
    if (normalized === 'EN ATTENTE' || normalized === 'PENDING' || normalized === 'CREATED') return 'En attente';

    // Fallback
    return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
};

/**
 * Checks if a status should trigger a stock return
 * @param {string} status 
 * @returns {boolean}
 */
export const isReturnStatus = (status) => {
    return ['Retour', 'Annulé', 'Refusé', 'À changer'].includes(status);
};
