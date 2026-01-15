import React, { useState } from 'react';
import { X } from 'lucide-react';

const CreateOrderModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        customer: '',
        phone: '',
        address: '',
        article: '',
        size: '',
        color: '',
        quantity: 1,
        amount: '',
        status: 'Packing'
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'amount' || name === 'quantity' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
        setFormData({
            customer: '',
            phone: '',
            address: '',
            article: '',
            size: '',
            color: '',
            quantity: 1,
            amount: '',
            status: 'Packing'
        });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content card">
                <div className="modal-header">
                    <h3>Create New Order</h3>
                    <button onClick={onClose} className="icon-btn">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Nom du Client</label>
                            <input
                                type="text"
                                name="customer"
                                required
                                value={formData.customer}
                                onChange={handleChange}
                                placeholder="Nom complet"
                            />
                        </div>
                        <div className="form-group">
                            <label>Téléphone</label>
                            <input
                                type="tel"
                                name="phone"
                                required
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="06..."
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Adresse</label>
                        <input
                            type="text"
                            name="address"
                            required
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Adresse complète"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group" style={{ flex: 2 }}>
                            <label>Article</label>
                            <input
                                type="text"
                                name="article"
                                required
                                value={formData.article}
                                onChange={handleChange}
                                placeholder="Nom de l'article"
                            />
                        </div>
                        <div className="form-group">
                            <label>Taille</label>
                            <input
                                type="text"
                                name="size"
                                value={formData.size}
                                onChange={handleChange}
                                placeholder="S, M, L..."
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Couleur</label>
                            <input
                                type="text"
                                name="color"
                                value={formData.color}
                                onChange={handleChange}
                                placeholder="Rouge, Noir..."
                            />
                        </div>
                        <div className="form-group">
                            <label>Quantité</label>
                            <input
                                type="number"
                                name="quantity"
                                required
                                min="1"
                                value={formData.quantity}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Prix (DH)</label>
                            <input
                                type="number"
                                name="amount"
                                required
                                min="0"
                                step="0.01"
                                value={formData.amount}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Statut</label>
                            <select name="status" value={formData.status} onChange={handleChange}>
                                <option value="Packing">Packing</option>
                                <option value="Ramassage">Ramassage</option>
                                <option value="Livraison">Livraison</option>
                                <option value="Livré">Livré</option>
                                <option value="Pas de réponse client">Pas de réponse client</option>
                                <option value="Retour">Retour</option>
                            </select>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
                        <button type="submit" className="btn-primary">Créer Commande</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateOrderModal;
