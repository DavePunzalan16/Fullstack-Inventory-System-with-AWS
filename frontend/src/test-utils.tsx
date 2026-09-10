/**
 * Test helper: renders a component tree wrapped in a fresh Redux store,
 * optionally seeding the auth user so role-gated UI can be exercised.
 */

import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Provider } from 'react-redux';

import { api } from '@/state/api';
import authReducer, { setUser } from '@/state/authSlice';
import layoutReducer from '@/state/layoutSlice';
import themeReducer from '@/state/themeSlice';
import type { SessionUser } from '@/types';

export function makeTestStore() {
  return configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      theme: themeReducer,
      layout: layoutReducer,
      auth: authReducer,
    },
    middleware: (getDefault) => getDefault().concat(api.middleware),
  });
}

export function renderWithStore(
  ui: ReactElement,
  options?: { user?: SessionUser | null },
) {
  const store = makeTestStore();
  if (options?.user !== undefined) {
    store.dispatch(setUser(options.user));
  }
  return {
    store,
    ...render(<Provider store={store}>{ui}</Provider>),
  };
}
