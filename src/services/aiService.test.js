import { expect, test, describe, vi } from 'vitest';

// Strategy: Isolate the logic function by reading the source or defining it here for testing if too entangled.
// OR: Mock the troublesome imports.
// aiService imports: db, storage from '../firebase'
// Let's mock '../firebase' completely.

vi.mock('../firebase', () => ({
    db: {},
    storage: {},
    auth: {}
}));

// It also imports knowledge.js
vi.mock('./knowledge', () => ({
    SHIPPING_INFO: {},
    SALES_SCRIPTS: {},
    FAQ: [],
    SYSTEM_PERSONA_INSTRUCTIONS: '',
    META_ADS_EXPERTISE: ''
}));

// Now import the service. 
// If it has top-level await or side effects, it might still fail, but let's try.
import { evaluateOrderRisk } from './aiService';

describe('aiService - evaluateOrderRisk', () => {
    test('should return Low risk for a complete order', () => {
        const order = {
            address: 'Boulevard Mohamed V, Casablanca',
            city: 'Casablanca',
            phone: '0612345678',
            amount: 450
        };
        const risk = evaluateOrderRisk(order);
        expect(risk.level).toBe('Low');
    });

    test('should return High risk for missing phone number', () => {
        const order = {
            address: 'Casablanca',
            city: 'Casablanca',
            phone: '',
            amount: 450
        };
        const risk = evaluateOrderRisk(order);
        expect(risk.level).toBe('High');
        expect(risk.reasons).toContain('Pas de téléphone ou numéro invalide');
    });
});

import { detectFinancialLeaks } from './aiService';

describe('aiService - detectFinancialLeaks', () => {
    test('should detect Ghost Order (Delivered > 15 days, not paid)', async () => {
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 20); // 20 days ago

        const orders = [{
            id: 'ord_123',
            status: 'Livré',
            updatedAt: oldDate.toISOString(),
            amount: 500,
            reconciled: false
        }];

        const leaks = await detectFinancialLeaks(orders, []);
        expect(leaks).toHaveLength(1);
        expect(leaks[0].type).toBe('GHOST_ORDER');
    });

    test('should detect Negative Margin', async () => {
        const products = [{ id: 'prod_1', name: 'Nuisette', costPrice: 100 }];
        const orders = [{
            id: 'ord_456',
            status: 'Livré',
            productId: 'prod_1',
            amount: 120, // Sell Price
            deliveryFee: 35
            // Cost: 100, CPA: 40 (hardcoded), Delivery: 35
            // Total Cost: 175. Net: 120 - 175 = -55
        }];

        const leaks = await detectFinancialLeaks(orders, products);
        expect(leaks).toHaveLength(1);
        expect(leaks[0].type).toBe('NEGATIVE_MARGIN');
    });
});
