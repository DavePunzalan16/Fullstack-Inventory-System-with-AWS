/**
 * Auth slice (Req 11.6, 11.7): session user, token, and status.
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
}

const initialState: AuthState = {
  user: null,
  token: null,
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStart(state) {
      state.status = 'authenticating';
      state.error = null;
    },
    /** Stores the JWT + user on successful sign-in (Req 11.6). */
    authSuccess(state, action: PayloadAction<{ token: string; user: SessionUser | null }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.status = 'authenticated';
      state.error = null;
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
    signOut(state) {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
      clearToken();
    },
  },
});

export const { authStart, authSuccess, authFailure, setUser, signOut } = authSlice.actions;
export default authSlice.reducer;
