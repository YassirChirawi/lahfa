import React, { createContext, useContext, useState, useEffect } from 'react';

const SecurityContext = createContext();

export const useSecurity = () => useContext(SecurityContext);

export const SecurityProvider = ({ children }) => {
    const [isLocked, setIsLocked] = useState(true); // Locked by default on refresh
    const [lastActivity, setLastActivity] = useState(Date.now());
    const LOCK_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    const [hasBiometrics, setHasBiometrics] = useState(false);

    // Check for biometric availability on mount
    useEffect(() => {
        if (window.PublicKeyCredential) {
            PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
                .then(available => setHasBiometrics(available))
                .catch(err => console.error("Bio Check Error:", err));
        }
    }, []);

    const unlock = (code) => {
        if (code === '1907') {
            setIsLocked(false);
            setLastActivity(Date.now());
            return true;
        }
        return false;
    };

    const verifyBiometrics = async () => {
        try {
            if (!window.PublicKeyCredential) return false;

            // "Security Theater" trick: Attempt to create a credential to force User Verification (FaceID/TouchID)
            // We don't save this credential, just use the side-effect of the OS prompt.
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            await navigator.credentials.create({
                publicKey: {
                    challenge,
                    rp: {
                        name: "Lahfa'h Admin",
                    },
                    user: {
                        id: new Uint8Array(16),
                        name: "admin",
                        displayName: "Admin User",
                    },
                    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
                    timeout: 60000,
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required", // This forces FaceID/TouchID/PIN
                    },
                    attestation: "none",
                },
            });

            // If we get here, the user successfully authenticated with the OS
            setIsLocked(false);
            setLastActivity(Date.now());
            return true;
        } catch (error) {
            console.error("Biometric Auth Failed:", error);
            return false;
        }
    };

    const resetActivity = () => {
        if (!isLocked) {
            setLastActivity(Date.now());
        }
    };

    useEffect(() => {
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];


        const handleActivity = () => {
            resetActivity();
        };

        events.forEach(event => window.addEventListener(event, handleActivity));

        const interval = setInterval(() => {
            if (!isLocked && Date.now() - lastActivity > LOCK_TIMEOUT) {
                setIsLocked(true);
            }
        }, 10000); // Check every 10 seconds

        return () => {
            events.forEach(event => window.removeEventListener(event, handleActivity));
            clearInterval(interval);
        };
    }, [isLocked, lastActivity]);

    return (
        <SecurityContext.Provider value={{ isLocked, unlock, verifyBiometrics, hasBiometrics }}>
            {children}
        </SecurityContext.Provider>
    );
};
