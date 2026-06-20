import {  createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { getCurrentUser, logout as logoutService } from '../services/AuthService';

type userProfile = {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    profilePictureUrl: string | null;
  };

type AuthContextType = {
    user: userProfile | null;
    setUser: (user: userProfile | null) => void;
    loading: boolean;
    logout: () => Promise<void>;
}
export const AuthContext = createContext<AuthContextType>({
    user: null,
    setUser: () => {},
    loading: true,
    logout: async () => {},
});

export const AuthProvider = ({ children } : {children: ReactNode}) => {
    const [user, setUser] = useState<userProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // Fetch user info from API on mount using auth cookie
        const fetchUser = async () => {
            try {
                // Check if user just logged out (logout flag in sessionStorage)
                const justLoggedOut = sessionStorage.getItem('justLoggedOut');
                if (justLoggedOut === 'true') {
                    console.log('[AuthProvider] User just logged out, clearing state');
                    sessionStorage.removeItem('justLoggedOut');
                    setUser(null);
                    setLoading(false);
                    return;
                }

                const userData = await getCurrentUser();
                if (userData) {
                    setUser({
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        username: userData.userName,
                        email: userData.email,
                        profilePictureUrl: userData.profilePictureUrl
                    });
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Failed to fetch user:', error);
                // User is not authenticated, keep user as null
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    console.log('AuthProvider - user:', user, 'loading:', loading);

    const handleLogout = async () => {
        try {
            await logoutService();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always clear user state, even if logout API fails
            setUser(null);
            // Set flag to prevent re-authentication on next mount
            sessionStorage.setItem('justLoggedOut', 'true');
            // Clear other cached auth data
            localStorage.removeItem('authToken');
            console.log('[AuthProvider] Logout completed, state cleared');
        }
    };

    return (
        <AuthContext.Provider value={{user, setUser, loading, logout: handleLogout}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);
