import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export type AccentColor = 'teal' | 'blue' | 'purple' | 'rose' | 'amber';
export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    theme: ThemeMode;
    color: AccentColor;
    toggleTheme: () => void;
    setColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const username = user?.username;

    const [theme, setTheme] = useState<ThemeMode>('light');
    const [color, setColorState] = useState<AccentColor>('teal');

    // Al cambiar de usuario, cargar de inmediato su configuración personal
    // Si no hay sesión iniciada, la pantalla SIEMPRE debe ser blanca (modo claro original)
    useEffect(() => {
        const root = document.documentElement;

        if (!username) {
            setTheme('light');
            setColorState('teal');
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
            root.setAttribute('data-color', 'teal');
            return;
        }

        const key = `_${username}`;
        const savedTheme = (localStorage.getItem(`theme_mode${key}`) as ThemeMode) || 'light';
        const savedColor = (localStorage.getItem(`theme_color${key}`) as AccentColor) || 'teal';

        setTheme(savedTheme);
        setColorState(savedColor);

        if (savedTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        root.setAttribute('data-color', savedColor);
    }, [username]);

    const toggleTheme = () => {
        const nextTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';
        setTheme(nextTheme);

        const root = document.documentElement;
        if (nextTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        const key = username ? `_${username}` : '_guest';
        localStorage.setItem(`theme_mode${key}`, nextTheme);
    };

    const setColor = (newColor: AccentColor) => {
        setColorState(newColor);
        document.documentElement.setAttribute('data-color', newColor);

        const key = username ? `_${username}` : '_guest';
        localStorage.setItem(`theme_color${key}`, newColor);
    };

    return (
        <ThemeContext.Provider value={{ theme, color, toggleTheme, setColor }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
    }
    return context;
};