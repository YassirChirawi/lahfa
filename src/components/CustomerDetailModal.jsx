import React from 'react';
import { X, User, Phone, MapPin, ShoppingBag, Calendar, AlertTriangle, CheckCircle, XCircle, PackageX } from 'lucide-react';

const CustomerDetailModal = ({ isOpen, onClose, customer }) => {
    if (!isOpen || !customer) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg relative overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900">Customer Details</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                            <User size={32} />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-gray-900">{customer.name}</h4>
                            <p className="text-sm text-gray-500">Customer ID: {customer.id}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                <Phone size={16} />
                                <span className="text-xs uppercase font-semibold">Phone</span>
                            </div>
                            <p className="font-medium text-gray-900">{customer.phone || 'N/A'}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                <MapPin size={16} />
                                <span className="text-xs uppercase font-semibold">City</span>
                            </div>
                            <p className="font-medium text-gray-900 capitalize">{customer.city || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Alert for Returns */}
                    {customer.stats?.returned > 0 && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-center gap-3">
                            <AlertTriangle className="text-red-600 h-5 w-5" />
                            <div>
                                <p className="text-sm font-bold text-red-800">Return Alert</p>
                                <p className="text-xs text-red-600">This customer has {customer.stats.returned} returned order(s).</p>
                            </div>
                        </div>
                    )}

                    <div className="border-t border-gray-100 pt-4">
                        <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <ShoppingBag size={18} className="text-gray-400" />
                            Overview
                        </h5>
                        <div className="grid grid-cols-3 gap-4 text-center mb-6">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Total Orders</p>
                                <p className="text-lg font-bold text-indigo-600">{customer.orderCount || 0}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Total Spent</p>
                                <p className="text-lg font-bold text-emerald-600">{customer.totalSpent ? `${customer.totalSpent.toFixed(2)} DH` : '0 DH'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Last Order</p>
                                <p className="text-sm font-bold text-gray-900">{customer.lastOrderDate || '-'}</p>
                            </div>
                        </div>

                        <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <CheckCircle size={18} className="text-gray-400" />
                            Order Statistics
                        </h5>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-3 bg-green-50 rounded-lg text-center">
                                <div className="flex justify-center mb-1"><CheckCircle className="h-5 w-5 text-green-600" /></div>
                                <p className="text-xs text-green-700 font-medium">Delivered</p>
                                <p className="text-lg font-bold text-green-800">{customer.stats?.delivered || 0}</p>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg text-center">
                                <div className="flex justify-center mb-1"><PackageX className="h-5 w-5 text-red-600" /></div>
                                <p className="text-xs text-red-700 font-medium">Returned</p>
                                <p className="text-lg font-bold text-red-800">{customer.stats?.returned || 0}</p>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-lg text-center">
                                <div className="flex justify-center mb-1"><XCircle className="h-5 w-5 text-orange-600" /></div>
                                <p className="text-xs text-orange-700 font-medium">No Response</p>
                                <p className="text-lg font-bold text-orange-800">{customer.stats?.cancelled || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium text-sm transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetailModal;
