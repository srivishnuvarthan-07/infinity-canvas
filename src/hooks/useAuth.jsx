import { createContext, useContext, useState, useEffect } from 'react';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    signInWithPopup,
    updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '@/config/firebase';
import { useBoardStore } from '@/hooks/useBoardStore';
import api from '@/lib/api';

const AuthContext = createContext(null);

// Helper to format ugly Firebase error messages
const getFriendlyErrorMessage = (err) => {
    if (!err) return "An unknown error occurred";
    
    // If it's our own custom thrown string or backend error
    if (err.response?.data?.error) return err.response.data.error;
    
    const msg = err.message || "";
    if (msg.includes('auth/invalid-credential')) return "Invalid email or password.";
    if (msg.includes('auth/user-not-found')) return "No account found with this email.";
    if (msg.includes('auth/wrong-password')) return "Incorrect password.";
    if (msg.includes('auth/email-already-in-use')) return "An account already exists with this email.";
    if (msg.includes('auth/weak-password')) return "Password must be at least 6 characters.";
    if (msg.includes('auth/network-request-failed')) return "Network error. Please check your connection.";
    if (msg.includes('auth/operation-not-allowed')) return "Email/Password sign-in is disabled. Please enable it in the Firebase Console (Build -> Authentication -> Sign-in method).";
    
    // Remove the "Firebase: Error (" wrapper if it exists
    return msg.replace(/^Firebase:\s*(.*?)\s*\(auth\/.*?\)\.?$/, '$1').trim() || "Authentication failed.";
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Sync with Board Store
    const setStoreUser = useBoardStore(state => state.setUser);
    useEffect(() => {
        setStoreUser(user);
    }, [user, setStoreUser]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Sync with backend MongoDB
                    const response = await api.post('/auth/firebase-sync', {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                        photoURL: firebaseUser.photoURL
                    });
                    
                    if (response.data.token) {
                        localStorage.setItem('token', response.data.token);
                    }
                    
                    const backendUser = response.data.user;
                    setUser({
                        id: backendUser._id,
                        email: backendUser.email,
                        name: backendUser.name,
                        photoURL: firebaseUser.photoURL,
                        role: backendUser.role,
                        avatarColor: backendUser.avatarColor,
                        defaultStorage: backendUser.defaultStorage
                    });
                } catch (err) {
                    console.error("Failed to sync Firebase user with backend", err);
                    // Fallback to Firebase user data if backend sync fails
                    setUser({
                        id: firebaseUser.uid,
                        email: firebaseUser.email,
                        name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                        photoURL: firebaseUser.photoURL,
                    });
                }
            } else {
                // Not logged into Firebase. Check if we have a local JWT token (from manual email/password auth)
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        const res = await api.get('/auth/me');
                        if (res.data.success) {
                            setUser(res.data.data);
                        } else {
                            setUser(null);
                            localStorage.removeItem('token');
                        }
                    } catch (err) {
                        setUser(null);
                        localStorage.removeItem('token');
                    }
                } else {
                    setUser(null);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Login with Email (Manual Backend)
    const login = async (email, password) => {
        try {
            setError(null);
            const res = await api.post('/auth/login', { email, password });
            if (res.data.success && res.data.token) {
                localStorage.setItem('token', res.data.token);
                const backendUser = res.data.user;
                setUser({
                    id: backendUser._id,
                    email: backendUser.email,
                    name: backendUser.name,
                    role: backendUser.role,
                    avatarColor: backendUser.avatarColor,
                    defaultStorage: backendUser.defaultStorage
                });
                return backendUser;
            }
        } catch (err) {
            const errorMessage = getFriendlyErrorMessage(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    // Register with Email (Manual Backend)
    const register = async (name, email, password) => {
        try {
            setError(null);
            const res = await api.post('/auth/register', { name, email, password });
            if (res.data.success && res.data.token) {
                localStorage.setItem('token', res.data.token);
                const backendUser = res.data.user;
                setUser({
                    id: backendUser._id,
                    email: backendUser.email,
                    name: backendUser.name,
                    role: backendUser.role,
                    avatarColor: backendUser.avatarColor,
                    defaultStorage: backendUser.defaultStorage
                });
                return backendUser;
            }
        } catch (err) {
            const errorMessage = getFriendlyErrorMessage(err);
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    // Login with Google
    const loginWithGoogle = async () => {
        try {
            setError(null);
            const userCredential = await signInWithPopup(auth, googleProvider);
            return userCredential.user;
        } catch (err) {
            setError(err.message || 'Google login failed');
            throw err;
        }
    };

    // Login with GitHub
    const loginWithGithub = async () => {
        try {
            setError(null);
            const userCredential = await signInWithPopup(auth, githubProvider);
            return userCredential.user;
        } catch (err) {
            setError(err.message || 'GitHub login failed');
            throw err;
        }
    };

    // Logout
    const logout = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.error('Firebase logout failed', err);
        } finally {
            setUser(null);
            localStorage.removeItem('token');
            try {
                await api.get('/auth/logout');
            } catch (e) {}
        }
    };

    const value = { 
        user, 
        loading, 
        error, 
        login, 
        register, 
        loginWithGoogle, 
        loginWithGithub, 
        logout 
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        console.error("useAuth: AuthContext is missing! Make sure AuthProvider is wrapping the app.");
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
