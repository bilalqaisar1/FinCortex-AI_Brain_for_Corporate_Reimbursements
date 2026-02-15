"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    isDarkTheme: boolean;
    toggleTheme: () => void;
    themeIcon: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('dark');

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

        setTheme(initialTheme);
        applyTheme(initialTheme);
    }, []);

    const applyTheme = (newTheme: Theme) => {
        if (newTheme === 'dark') {
            document.body.classList.remove('light-theme');
        } else {
            document.body.classList.add('light-theme');
        }
        document.body.style.transition = 'all 0.3s ease';
    };

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    };

    const value = {
        theme,
        isDarkTheme: theme === 'dark',
        toggleTheme,
        themeIcon: theme === 'dark' ? '☀️' : '🌙'
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useThemeContext() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useThemeContext must be used within a ThemeProvider');
    }
    return context;
}
