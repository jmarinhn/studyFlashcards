import React, { useState } from 'react';
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from './firebase';

const Login = ({ onLoginSuccess }) => {
    const [error, setError] = useState('');

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            if (user.email.endsWith('@lynx-labs.com')) {
                onLoginSuccess(user);
            } else {
                await signOut(auth);
                setError('Access restricted to Lynx Labs users only.');
            }
        } catch (error) {
            console.error("Error signing in with Google", error);
            setError(`Failed to sign in. Error: ${error.code} - ${error.message}`);
        }
    };

    return (
        <div className="login-container">
            <h1>Welcome to flashcardMatch</h1>
            <p>Please sign in with your corporate account</p>

            {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            <button onClick={handleGoogleLogin} className="login-button" style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
                Sign in with Google
            </button>
        </div>
    );
};

export default Login;
