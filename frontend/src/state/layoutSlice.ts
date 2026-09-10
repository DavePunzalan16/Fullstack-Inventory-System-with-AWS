/**
 * Layout slice (Req 10.4, 10.5): sidebar/drawer open state.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface LayoutState {
  isSidebarOpen: boolean;
}

const initialState: LayoutState = { isSidebarOpen: false };

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.isSidebarOpen = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarOpen } = layoutSlice.actions;
export default layoutSlice.reducer;
