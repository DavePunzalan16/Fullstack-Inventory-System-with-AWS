/**
 * Auth slice (Req 11.6, 11.7, and Batch 4 guest mode): session user, token,
 * status, and a read-only guest flag.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { clearToken, setToken } from '@/lib/auth';
import type { SessionUser } from '@/types';

export type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'error';

interface AuthState {
  user: SessionUser | null;
  token: string | null;
  status: AuthStatus;
  error: string | null;
  /** True when browsing as an unauthenticated, read-only guest (Batch 4). */
  isGuest: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  status: 'idle',
  error: null,
  isGuest: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStart(state) {
      state.status = 'authenticating';
      state.error = null;
    },
    /** Stores the JWT + user on successful sign-in (Req 11.6). Clears guest mode. */
    authSuccess(state, action: PayloadAction<{ token: string; user: SessionUser | null }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.status = 'authenticated';
      state.error = null;
      state.isGuest = false;
      setToken(action.payload.token);
    },
    /** Records a sign-in failure and stores no token (Req 11.7). */
    authFailure(state, action: PayloadAction<string>) {
      state.status = 'error';
      state.error = action.payload;
      state.token = null;
      state.user = null;
    },
    setUser(state, action: PayloadAction<SessionUser | null>) {
      state.user = action.payload;
    },
    /** Enters read-only guest mode: no token, no user, browsing only (Batch 4). */
    enterGuestMode(state) {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
      state.isGuest = true;
      clearToken();
    },
    signOut(state) {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
      state.isGuest = false;
      clearToken();
    },
  },
});

export const { authStart, authSuccess, authFailure, setUser, enterGuestMode, signOut } = authSlice.actions;
export default authSlice.reducer;