/**
 * Redux store (Req 15.1, 15.5).
 *
 * Combines the RTK Query API reducer with the theme/layout/auth slices and
 * wires the API middleware for caching, invalidation, and polling.
 */

import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { api } from './api';
import authReducer from './authSlice';
import layoutReducer from './layoutSlice';
import themeReducer from './themeSlice';

export function makeStore() {
  const store = configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      theme: themeReducer,
      layout: layoutReducer,
      auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware),
  });
  setupListeners(store.dispatch);
  return store;
}

export const store = makeStore();

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
