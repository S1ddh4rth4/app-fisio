import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserSession } from '../types/auth';

interface AuthContextType {
    user: UserSession | null;
    login: (data: { token: string; username: string; email: string; roles: string }) => void;
    logout: () => void;
    isAuthenticated: boolean;
    hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserSession | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        const email = localStorage.getItem('email');
        const rolesStr = localStorage.getItem('roles');

        if (token && username) {
            setUser({
                token,
                username,
                email: email || '',
                roles: rolesStr ? rolesStr.split(',') : [],
            });
        }
    }, []);

    const login = (data: { token: string; username: string; email: string; roles: string }) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('email', data.email);
        localStorage.setItem('roles', data.roles);

        setUser({
            token: data.token,
            username: data.username,
            email: data.email,
            roles: data.roles.split(','),
        });
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    const hasRole = (role: string) => {
        return user?.roles.includes(role) ?? false;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, hasRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth debe ser usado dentro de AuthProvider');
    return context;
};