/**
 * Tiny theme manager: stores preference in localStorage, applies a
 * `data-theme` attribute on <html>. CSS variables do the rest.
 */
const KEY = 'gymcord-theme';
export type Theme = 'dark' | 'light';

export function getInitialTheme(): Theme {
    if (typeof window === 'undefined') return 'dark';
    const stored = window.localStorage.getItem(KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    // Default to dark — matches the design.
    return 'dark';
}

export function applyTheme(theme: Theme) {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
    try {
        window.localStorage.setItem(KEY, theme);
    } catch {
        // ignore (private mode etc.)
    }
}
