import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserSession } from '../types/auth';

interface AuthContextType {
    user: UserSession | null;
    login: (data: { token: string; username: string; email: string; roles: string; mustChangePassword?: boolean }) => void;
    logout: () => void;
    isAuthenticated: boolean;
    hasRole: (role: string) => boolean;
    clearMustChangePassword: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserSession | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        const email = localStorage.getItem('email');
        const rolesStr = localStorage.getItem('roles');
        const mustChange = localStorage.getItem('mustChangePassword') === 'true';

        if (token && username) {
            setUser({
                token,
                username,
                email: email || '',
                roles: rolesStr ? rolesStr.split(',') : [],
                mustChangePassword: mustChange,
            });
        }
    }, []);

    const login = (data: { token: string; username: string; email: string; roles: string; mustChangePassword?: boolean }) => {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('email', data.email);
        localStorage.setItem('roles', data.roles);
        localStorage.setItem('mustChangePassword', String(data.mustChangePassword ?? false));

        setUser({
            token: data.token,
            username: data.username,
            email: data.email,
            roles: data.roles.split(','),
            mustChangePassword: data.mustChangePassword ?? false,
        });
    };

    const clearMustChangePassword = () => {
        localStorage.setItem('mustChangePassword', 'false');
        setUser((prev) => prev ? { ...prev, mustChangePassword: false } : null);
    };

    const logout = () => {
        // Solo eliminamos los datos de la sesión activa, conservando los temas guardados
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('email');
        localStorage.removeItem('roles');
        localStorage.removeItem('mustChangePassword');
        setUser(null);
    };

    const hasRole = (role: string) => {
        return user?.roles.includes(role) ?? false;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, hasRole, clearMustChangePassword }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth debe ser usado dentro de AuthProvider');
    return context;
};