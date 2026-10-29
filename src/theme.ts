import { useSyncExternalStore } from 'react';

export type ThemeMode = 'dark' | 'light';

const palettes = {
  dark: {
    bg: '#09090b',
    bgTop: '#111923',
    panel: '#151517',
    panel2: '#1e1e20',
    panel3: '#242426',
    border: '#2d2d30',
    borderStrong: '#3d3d40',
    text: '#f2f1f1',
    muted: '#9c9999',
    muted2: '#747171',
    red: '#ff4b50',
    redSoft: '#30191b',
    redInk: '#ff5b5f',
    green: '#47d49b',
    greenSoft: '#0d2e24',
    blue: '#5bb8ef',
    blueSoft: '#12232f',
    warning: '#e9b45e',
    white: '#ffffff',
    shadow: '#000000',
    overlay: 'rgba(0,0,0,0.62)',
  },
  light: {
    bg: '#f3f1ee',
    bgTop: '#f5f0ed',
    panel: '#ffffff',
    panel2: '#faf9f7',
    panel3: '#f1eee9',
    border: '#e7e2db',
    borderStrong: '#d3ccc3',
    text: '#17150f',
    muted: '#736d65',
    muted2: '#948d84',
    red: '#e53935',
    redSoft: '#fdeae8',
    redInk: '#c62828',
    green: '#1c7a4c',
    greenSoft: '#e5f5ec',
    blue: '#1c5f8c',
    blueSoft: '#e6f2fa',
    warning: '#9a5b00',
    white: '#ffffff',
    shadow: '#17150f',
    overlay: 'rgba(12,10,8,0.45)',
  },
} as const;

type Palette = (typeof palettes)['dark'];
let currentMode: ThemeMode = 'dark';
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useThemeMode() {
  return useSyncExternalStore(subscribe, () => currentMode as ThemeMode, () => 'dark' as ThemeMode);
}

export function setThemeMode(mode: ThemeMode) {
  if (currentMode === mode) return;
  currentMode = mode;
  listeners.forEach((listener) => listener());
}

export function toggleTheme() {
  setThemeMode(currentMode === 'dark' ? 'light' : 'dark');
}

export const C = new Proxy({} as Palette, {
  get: (_target, property: keyof Palette) => palettes[currentMode][property],
});
