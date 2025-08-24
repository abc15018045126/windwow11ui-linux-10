import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isStartMenuOpen: boolean;
  pinnedApps: string[];
}

const initialState: UIState = {
  isStartMenuOpen: false,
  pinnedApps: ['notebook'], // Hardcode for now
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleStartMenu: (state) => {
      state.isStartMenuOpen = !state.isStartMenuOpen;
    },
    pinApp: (state, action: PayloadAction<string>) => {
        if (!state.pinnedApps.includes(action.payload)) {
            state.pinnedApps.push(action.payload);
        }
    },
    unpinApp: (state, action: PayloadAction<string>) => {
        state.pinnedApps = state.pinnedApps.filter(id => id !== action.payload);
    },
  },
});

export const { toggleStartMenu, pinApp, unpinApp } = uiSlice.actions;

export default uiSlice.reducer;
