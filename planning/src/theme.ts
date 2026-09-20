const THEME_KEY = 'planning-theme-v1';

export type Theme = 'light' | 'dark';

export function loadTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* ignore */
  }
  return 'dark';
}

export function saveTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme);
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}
