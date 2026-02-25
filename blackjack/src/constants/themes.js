export const THEMES = {
  classic: {
    '--felt-dark':   '#1a3d2b',
    '--felt-mid':    '#1e4d35',
    '--felt-light':  '#225c3f',
    '--gold':        '#c9a84c',
    '--gold-light':  '#e2c97e',
    '--gold-dark':   '#8f6e28',
    '--cream':       '#fdf6e3',
  },
  midnight: {
    '--felt-dark':   '#0d1b2a',
    '--felt-mid':    '#112233',
    '--felt-light':  '#1a3050',
    '--gold':        '#a0a0b0',
    '--gold-light':  '#d0d0e0',
    '--gold-dark':   '#606070',
    '--cream':       '#e8eaf0',
  },
  crimson: {
    '--felt-dark':   '#2d0a0f',
    '--felt-mid':    '#3d1018',
    '--felt-light':  '#4f1a24',
    '--gold':        '#c9848c',
    '--gold-light':  '#e8b4bc',
    '--gold-dark':   '#8f4848',
    '--cream':       '#fdf0f0',
  },
};

export function applyTheme(themeKey) {
  const vars = THEMES[themeKey];
  if (!vars) return;
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}
