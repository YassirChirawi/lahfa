import React, { useState } from 'react';
import { useOrders } from '../context/OrderContext';
import CreateOrderModal from '../components/CreateOrderModal';
import { Plus, Search, Filter } from 'lucide-react';
import '../styles/orders.css';
import '../styles/modal.css';

const Orders = () => {
    const { orders, addOrder, updateOrderStatus, updateOrder, deleteOrder } = useOrders();
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);

    const filteredOrders = orders.filter(order => {
        const matchesFilter = filter === 'All' || order.status === filter;
        const matchesSearch =
            (order.customer && order.customer.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.id && order.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.phone && order.phone.includes(searchTerm));
        return matchesFilter && matchesSearch;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Livré': return 'status-success';
            case 'Packing': return 'status-warning';
            case 'Ramassage': return 'status-info';
            case 'Livraison': return 'status-primary'; // You might need to add this class or use another
            case 'Retour': return 'status-danger';
            case 'Pas de réponse client': return 'status-default';
            default: return 'status-default';
        }
    };

    const handleSaveOrder = async (orderData) => {
        if (editingOrder) {
            await updateOrder(editingOrder.id, orderData);
        } else {
            await addOrder(orderData);
        }
        setIsModalOpen(false);
        setEditingOrder(null);
    };

    const openEditModal = (order) => {
        setEditingOrder(order);
        setIsModalOpen(true);
    };

    return (
        <div className="orders-page">
            <div className="page-header">
                <h1>Orders</h1>
                <button className="btn-primary" onClick={() => { setEditingOrder(null); setIsModalOpen(true); }}>
                    <Plus size={18} />
                    Create Order
                </button>
            </div>

            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <Filter size={18} />
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="card orders-table-container">
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>N° Commande</th>
                            <th>Date</th>
                            <th>Client</th>
                            <th>Téléphone</th>
                            <th>Ville</th>
                            <th>Adresse</th>
                            <th>Article</th>
                            <th>Taille</th>
                            <th>Couleur</th>
                            <th>Qté</th>
                            <th>Prix (DH)</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length > 0 ? (
                            filteredOrders.map(order => {
                                // Backward compatibility helper
                                const items = order.items || [{
                                    article: order.article,
                                    size: order.size,
                                    color: order.color,
                                    quantity: order.quantity
                                }];

                                return (
                                    <tr key={order.id} style={{ verticalAlign: 'top' }}>
                                        <td className="font-medium">{order.displayId || order.id}</td>
                                        <td>{order.date}</td>
                                        <td>{order.customer}</td>
                                        <td>{order.phone}</td>
                                        <td>{order.city || '-'}</td>
                                        <td>{order.address}</td>

                                        {/* Multi-item Columns */}
                                        <td>
                                            {items.map((item, i) => (
                                                <div key={i} style={{ marginBottom: '4px' }}>{item.article || '-'}</div>
                                            ))}
                                        </td>
                                        <td>
                                            {items.map((item, i) => (
                                                <div key={i} style={{ marginBottom: '4px' }}>{item.size || '-'}</div>
                                            ))}
                                        </td>
                                        <td>
                                            {items.map((item, i) => (
                                                <div key={i} style={{ marginBottom: '4px' }}>{item.color || '-'}</div>
                                            ))}
                                        </td>
                                        <td>
                                            {items.map((item, i) => (
                                                <div key={i} style={{ marginBottom: '4px' }}>{item.quantity || 1}</div>
                                            ))}
                                        </td>

                                        <td>{order.amount ? `${order.amount.toFixed(2)} DH` : '-'}</td>
                                        <td>
                                            <span className={`status-badge ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="actions-cell">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                    className="status-select"
                                                >
                                                    <option value="Packing">Packing</option>
                                                    <option value="Ramassage">Ramassage</option>
                                                    <option value="Livraison">Livraison</option>
                                                    <option value="Livré">Livré</option>
                                                    <option value="Pas de réponse client">Pas de réponse</option>
                                                    <option value="Retour">Retour</option>
                                                </select>
                                                <button className="icon-btn-sm" onClick={() => openEditModal(order)} title="Modifier">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                                </button>
                                                <button className="icon-btn-sm" onClick={() => deleteOrder(order.id)} title="Supprimer">
                                                    &times;
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="12" className="text-center p-6">Aucune commande trouvée.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <CreateOrderModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingOrder(null); }}
                onSave={handleSaveOrder}
                initialData={editingOrder}
            />
        </div>
    );
};

export default Orders;
