"use client";

import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  useEffect(() => {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const shouldBeDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    setIsDarkTheme(shouldBeDark);
    
    // Apply theme to body immediately
    if (shouldBeDark) {
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
    }
    
    // Force a re-render to ensure theme is applied
    document.body.style.transition = 'all 0.3s ease';
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    
    // Save to localStorage
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    
    // Apply to body with smooth transition
    if (newTheme) {
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
    }
    
    // Force a re-render to ensure theme is applied
    document.body.style.transition = 'all 0.3s ease';
  };

  return {
    isDarkTheme,
    toggleTheme,
    themeIcon: isDarkTheme ? '🌙' : '☀️'
  };
}
