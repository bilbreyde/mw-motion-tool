import { useCallback, useEffect, useState } from 'react';

export type ThemeName = 'dark' | 'light' | 'high-contrast';

const STORAGE_KEY = 'mw-motion-tool-theme';
const DEFAULT_THEME: ThemeName = 'dark';

function isThemeName(value: string | null): value is ThemeName {
  return value === 'dark' || value === 'light' || value === 'high-contrast';
}

function readStoredTheme(): ThemeName {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isThemeName(stored) ? stored : DEFAULT_THEME;
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>(readStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const selectTheme = useCallback((next: ThemeName) => setTheme(next), []);

  return { theme, setTheme: selectTheme };
}
