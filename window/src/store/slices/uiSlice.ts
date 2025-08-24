import { createSlice } from '@reduxjs/toolkit';

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
  },
});

export const { toggleStartMenu } = uiSlice.actions;

export default uiSlice.reducer;
