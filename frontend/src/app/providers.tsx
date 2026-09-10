'use client';

/**
 * Client providers: Redux store + MUI theme bound to the theme slice.
 *
 * On mount, hydrates the persisted theme from localStorage before content is
 * meaningfully interactive (Req 9.4). The MUI palette mode follows the slice so
 * a theme toggle applies app-wide without a reload (Req 9.2).
 */

import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { Provider } from 'react-redux';

import { useAppDispatch, useAppSelector } from '@/state/hooks';
import { store } from '@/state/store';
import { hydrateTheme, readPersistedTheme } from '@/state/themeSlice';

function ThemedApp({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((s) => s.theme.mode);

  useEffect(() => {
    dispatch(hydrateTheme(readPersistedTheme()));
  }, [dispatch]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', mode);
    }
  }, [mode]);

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#c3b1ff' },
          background: {
            default: mode === 'dark' ? '#1e0031' : '#f5f5f7',
            paper: mode === 'dark' ? '#1a1a1a' : '#ffffff',
          },
        },
        typography: { fontFamily: 'var(--font-body), sans-serif' },
      }),
    [mode],
  );

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemedApp>{children}</ThemedApp>
    </Provider>
  );
}
