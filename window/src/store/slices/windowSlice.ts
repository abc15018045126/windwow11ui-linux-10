import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getAppDefinitionById } from '../../apps';
import { OpenApp } from '../../types';

// This is the serializable version of OpenApp that lives in the Redux store.
// It does not contain the component function.
type OpenAppSerializable = Omit<OpenApp, 'component'>;

interface WindowState {
  openApps: OpenAppSerializable[];
  activeInstanceId: string | null;
  nextZIndex: number;
}

const initialState: WindowState = {
  openApps: [],
  activeInstanceId: null,
  nextZIndex: 10,
};

const windowSlice = createSlice({
  name: 'windows',
  initialState,
  reducers: {
    openApp: (state, action: PayloadAction<string>) => {
        const appId = action.payload;
        // This is a placeholder action. The actual logic will be handled
        // in a custom listener middleware or thunk that can perform async logic.
        // For now, we'll just log it. A proper implementation would require
        // more significant changes to the async flow.
        console.log(`Request to open app: ${appId}`);
    },
    _openInternalApp: (state, action: PayloadAction<OpenAppSerializable>) => {
        state.openApps.push(action.payload);
        state.activeInstanceId = action.payload.instanceId;
        state.nextZIndex += 1;
    },
    closeApp: (state, action: PayloadAction<string>) => {
      state.openApps = state.openApps.filter(
        (app) => app.instanceId !== action.payload
      );
      if (state.activeInstanceId === action.payload) {
        const topApp = state.openApps.reduce(
          (top, app) => (app.zIndex > (top?.zIndex || 0) ? app : top),
          null as OpenAppSerializable | null
        );
        state.activeInstanceId = topApp ? topApp.instanceId : null;
      }
    },
    focusApp: (state, action: PayloadAction<string>) => {
        const instanceId = action.payload;
        const app = state.openApps.find(app => app.instanceId === instanceId);
        if (app) {
            if (state.activeInstanceId === instanceId) return;
            app.zIndex = state.nextZIndex;
            state.nextZIndex += 1;
            state.activeInstanceId = instanceId;
        }
    },
    updateAppPosition: (state, action: PayloadAction<{ instanceId: string; position: { x: number; y: number } }>) => {
        const { instanceId, position } = action.payload;
        const app = state.openApps.find(app => app.instanceId === instanceId);
        if (app) {
            app.position = position;
        }
    },
    updateAppSize: (state, action: PayloadAction<{ instanceId: string; size: { width: number; height: number } }>) => {
        const { instanceId, size } = action.payload;
        const app = state.openApps.find(app => app.instanceId === instanceId);
        if (app) {
            app.size = size;
        }
    },
    toggleMaximize: (state, action: PayloadAction<string>) => {
        const instanceId = action.payload;
        const app = state.openApps.find(app => app.instanceId === instanceId);
        if (app) {
            if (app.isMaximized) {
                app.isMaximized = false;
                app.position = app.previousPosition || { x: 50, y: 50 };
                app.size = app.previousSize || { width: 600, height: 400 };
            } else {
                app.previousPosition = app.position;
                app.previousSize = app.size;
                app.isMaximized = true;
            }
        }
    },
    toggleMinimizeApp: (state, action: PayloadAction<string>) => {
        const instanceId = action.payload;
        const app = state.openApps.find(app => app.instanceId === instanceId);
        if (app) {
            app.isMinimized = !app.isMinimized;
            if (!app.isMinimized) {
                state.activeInstanceId = instanceId;
                app.zIndex = state.nextZIndex;
                state.nextZIndex += 1;
            }
            else if (state.activeInstanceId === instanceId) {
                const topApp = state.openApps
                    .filter(a => a.instanceId !== instanceId && !a.isMinimized)
                    .reduce((top, a) => (a.zIndex > (top?.zIndex || 0) ? a : top), null as OpenAppSerializable | null);
                state.activeInstanceId = topApp ? topApp.instanceId : null;
            }
        }
    },
  },
});

export const { openApp, _openInternalApp, closeApp, focusApp, updateAppPosition, updateAppSize, toggleMaximize, toggleMinimizeApp } = windowSlice.actions;

export default windowSlice.reducer;
