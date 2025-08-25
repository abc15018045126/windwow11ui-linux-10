import { configureStore } from '@reduxjs/toolkit';
import windowReducer from './slices/windowSlice';
import uiReducer from './slices/uiSlice';
import clipboardReducer from './slices/clipboardSlice';
import contextMenuReducer from './slices/contextMenuSlice';
import desktopReducer from './slices/desktopSlice';

export const store = configureStore({
  reducer: {
    windows: windowReducer,
    ui: uiReducer,
    clipboard: clipboardReducer,
    contextMenu: contextMenuReducer,
    desktop: desktopReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
