import React, { useState } from 'react';
import { useSecurity } from '../context/SecurityContext';
import { Lock } from 'lucide-react';

const LockScreen = () => {
    const { unlock } = useSecurity();
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (unlock(pin)) {
            setPin('');
            setError(false);
        } else {
            setError(true);
            setPin('');
            setTimeout(() => setError(false), 1000);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'hsl(var(--background))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
        }}>
            <div className="card p-6" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: 'hsl(var(--primary))',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    color: 'white'
                }}>
                    <Lock size={32} />
                </div>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Security Lock</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="Enter PIN Code"
                        maxLength={4}
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '1rem',
                            fontSize: '1.5rem',
                            textAlign: 'center',
                            letterSpacing: '0.5rem',
                            borderRadius: 'var(--radius)',
                            border: `2px solid ${error ? 'hsl(var(--destructive))' : 'hsl(var(--border))'}`,
                            marginBottom: '1.5rem',
                            outline: 'none'
                        }}
                    />
                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1.1rem' }}
                    >
                        Unlock System
                    </button>
                    {error && (
                        <p style={{ color: 'hsl(var(--destructive))', marginTop: '1rem' }}>
                            Incorrect PIN Code
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
};

export default LockScreen;
