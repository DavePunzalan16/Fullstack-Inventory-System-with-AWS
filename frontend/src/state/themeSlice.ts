/**
 * Theme slice (Req 9.1–9.6, Property 20).
 *
 * Persists the selected theme to localStorage so it is retained across
 * sessions (Property 20). Dark is the default when no preference exists
 * (Req 9.5). If persistence fails, the theme stays applied for the session and
 * a message flag is set (Req 9.6).
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'theme.mode';

/** Reads the persisted theme; defaults to dark when absent/unreadable (Req 9.4, 9.5). */
export function readPersistedTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

/** Persists the theme; returns false if storage failed (Req 9.6). */
export function persistTheme(mode: ThemeMode): boolean {
  if (typeof window === 'undefined') return true;
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
    return true;
  } catch {
    return false;
  }
}

interface ThemeState {
  mode: ThemeMode;
  /** Set when persistence failed so the UI can surface a message (Req 9.6). */
  persistenceFailed: boolean;
}

const initialState: ThemeState = { mode: 'dark', persistenceFailed: false };

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    /** Applies a persisted preference at load time without re-persisting. */
    hydrateTheme(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
    },
    /** Sets a theme and persists it, recording any persistence failure. */
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
      state.persistenceFailed = !persistTheme(action.payload);
    },
    toggleTheme(state) {
      const next: ThemeMode = state.mode === 'dark' ? 'light' : 'dark';
      state.mode = next;
      state.persistenceFailed = !persistTheme(next);
    },
  },
});

export const { hydrateTheme, setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
