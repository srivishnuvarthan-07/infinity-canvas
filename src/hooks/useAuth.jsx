import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '@/services/auth.service';
import { useBoardStore } from '@/hooks/useBoardStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is logged in on mount
    const checkAuth = useCallback(async () => {
        try {
            setLoading(true);
            const data = await authService.getCurrentUser();
            setUser(data?.data ?? null); // null = guest mode (401 returns null, not thrown)
        } catch (err) {
            setUser(null); // Real errors (5xx, network) also resolve to guest mode
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Sync with Board Store
    const setStoreUser = useBoardStore(state => state.setUser);
    useEffect(() => {
        setStoreUser(user);
    }, [user, setStoreUser]);

    // Login
    const login = async (email, password) => {
        try {
            setError(null);
            const data = await authService.login({ email, password });
            setUser(data.user);
            return data;
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
            throw err;
        }
    };

    // Register
    const register = async (name, email, password) => {
        try {
            setError(null);
            const data = await authService.register({ name, email, password });
            setUser(data.user);
            return data;
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
            throw err;
        }
    };

    // Logout
    const logout = async () => {
        try {
            await authService.logout();
            setUser(null);
        } catch (err) {
            console.error('Logout failed', err);
        }
    };

    const value = { user, loading, error, login, register, logout, checkAuth };

    return (
        <AuthContext.Provider value={value}>
            {children}
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
