import React, { useRef, useEffect } from 'react';
import { X, AlertTriangle, Info, HelpCircle } from 'lucide-react';

const ConfirmationDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'confirm', // confirm, alert, prompt
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    variant = 'danger', // danger, info, warning
    inputProps = {}
}) => {
    const inputRef = useRef(null);
    const [inputValue, setInputValue] = React.useState('');

    useEffect(() => {
        if (isOpen && type === 'prompt') {
            setInputValue(inputProps.defaultValue || '');
            // Focus input after a short delay to allow modal animation
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, type, inputProps.defaultValue]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(type === 'prompt' ? inputValue : true);
    };

    const getIcon = () => {
        switch (variant) {
            case 'danger': return <AlertTriangle className="w-6 h-6 text-red-600" />;
            case 'warning': return <AlertTriangle className="w-6 h-6 text-amber-600" />;
            case 'info': return <Info className="w-6 h-6 text-blue-600" />;
            default: return <HelpCircle className="w-6 h-6 text-gray-600" />;
        }
    };

    const getColors = () => {
        switch (variant) {
            case 'danger': return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
            case 'warning': return 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500';
            case 'info': return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
            default: return 'bg-gray-800 hover:bg-gray-900 focus:ring-gray-500';
        }
    };

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Overlay */}
                <div
                    className="fixed inset-0 transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                >
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                {/* Modal positioning trick */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                {/* Modal Content */}
                <div
                    className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-headline"
                >
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${variant === 'danger' ? 'bg-red-100' :
                                        variant === 'warning' ? 'bg-amber-100' :
                                            'bg-blue-100'
                                    }`}>
                                    {getIcon()}
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                                        {title}
                                    </h3>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500 whitespace-pre-line">
                                            {message}
                                        </p>
                                    </div>

                                    {type === 'prompt' && (
                                        <div className="mt-4">
                                            <input
                                                ref={inputRef}
                                                type={inputProps.type || 'text'}
                                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                                placeholder={inputProps.placeholder}
                                                value={inputValue}
                                                onChange={(e) => setInputValue(e.target.value)}
                                                required={inputProps.required}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="submit"
                                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm transition-colors ${getColors()}`}
                            >
                                {confirmText}
                            </button>

                            {type !== 'alert' && (
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                                    onClick={onClose}
                                >
                                    {cancelText}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationDialog;
