import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import ConfirmationDialog from '../components/ConfirmationDialog';

const ConfirmationContext = createContext();

export const useConfirmation = () => {
    const context = useContext(ConfirmationContext);
    if (!context) {
        throw new Error('useConfirmation must be used within a ConfirmationProvider');
    }
    return context;
};

export const ConfirmationProvider = ({ children }) => {
    const [state, setState] = useState({
        isOpen: false,
        type: 'confirm', // confirm, alert, prompt
        title: '',
        message: '',
        confirmText: 'Confirmer',
        cancelText: 'Annuler',
        variant: 'danger',
        inputProps: {},
    });

    const resolver = useRef(null);

    const resetState = () => {
        setState({
            isOpen: false,
            type: 'confirm',
            title: '',
            message: '',
            confirmText: 'Confirmer',
            cancelText: 'Annuler',
            variant: 'danger',
            inputProps: {},
        });
    };

    const confirm = useCallback((options = {}) => {
        return new Promise((resolve) => {
            setState({
                isOpen: true,
                type: 'confirm',
                title: options.title || 'Confirmation',
                message: options.message || 'Êtes-vous sûr ?',
                confirmText: options.confirmText || 'Confirmer',
                cancelText: options.cancelText || 'Annuler',
                variant: options.variant || 'danger',
                inputProps: {},
            });
            resolver.current = resolve;
        });
    }, []);

    const alert = useCallback((options = {}) => {
        return new Promise((resolve) => {
            setState({
                isOpen: true,
                type: 'alert',
                title: options.title || 'Attention',
                message: options.message || '',
                confirmText: options.confirmText || 'OK',
                cancelText: '',
                variant: options.variant || 'info',
                inputProps: {},
            });
            resolver.current = resolve;
        });
    }, []);

    const prompt = useCallback((options = {}) => {
        return new Promise((resolve) => {
            setState({
                isOpen: true,
                type: 'prompt',
                title: options.title || 'Saisie requise',
                message: options.message || '',
                confirmText: options.confirmText || 'Valider',
                cancelText: options.cancelText || 'Annuler',
                variant: options.variant || 'info',
                inputProps: options.inputProps || {},
            });
            resolver.current = resolve;
        });
    }, []);

    const handleConfirm = (value) => {
        if (resolver.current) {
            resolver.current(value);
        }
        resetState();
    };

    const handleClose = () => {
        if (resolver.current) {
            resolver.current(state.type === 'prompt' ? null : false);
        }
        resetState();
    };

    return (
        <ConfirmationContext.Provider value={{ confirm, alert, prompt }}>
            {children}
            <ConfirmationDialog
                isOpen={state.isOpen}
                onClose={handleClose}
                onConfirm={handleConfirm}
                {...state}
            />
        </ConfirmationContext.Provider>
    );
};
