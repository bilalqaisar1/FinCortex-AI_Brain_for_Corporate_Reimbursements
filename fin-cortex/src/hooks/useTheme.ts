"use client";

import { useThemeContext } from '@/context/ThemeContext';

export function useTheme() {
  const { isDarkTheme, toggleTheme, themeIcon } = useThemeContext();

  return {
    isDarkTheme,
    toggleTheme,
    themeIcon
  };
}
