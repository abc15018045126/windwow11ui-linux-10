import { createAsyncThunk } from '@reduxjs/toolkit';
import { _openInternalApp } from '../slices/windowSlice';
import { getAppDefinitionById } from '../../apps';
import { AppDefinition } from '../../types';
import { RootState } from '../store';

interface FilesystemItem {
    name: string;
    path: string;
    type: 'file' | 'folder';
}

export const openItem = createAsyncThunk(
    'windows/openItem',
    async (item: FilesystemItem, { dispatch, getState }) => {
        const state = getState() as RootState;
        const nextZIndex = state.windows.nextZIndex;

        const openAppWithDef = (appDef: AppDefinition, initialData?: object) => {
            if (appDef.isExternal && appDef.externalPath) {
                window.electronAPI.launcher.launchExternal(appDef.externalPath);
            } else {
                const instanceId = `${appDef.id}-${Date.now()}`;
                const newApp = {
                    ...appDef,
                    ...(initialData && { initialData }),
                    instanceId,
                    title: appDef.name,
                    isMinimized: false,
                    isMaximized: false,
                    position: { x: 50, y: 50 },
                    size: appDef.defaultSize || { width: 600, height: 400 },
                    zIndex: nextZIndex,
                };
                const { component, ...serializablePayload } = newApp;
                dispatch(_openInternalApp(serializablePayload));
            }
        };

        if (item.type === 'folder') {
            const appDef = await getAppDefinitionById('fileExplorer');
            if (appDef) {
                openAppWithDef(appDef, { initialPath: item.path });
            }
            return;
        }

        if (item.name.endsWith('.app')) {
            const appInfo = await window.electronAPI.filesystem.readAppFile(item.path);
            if (appInfo && appInfo.appId) {
                const baseAppDef = await getAppDefinitionById(appInfo.appId);
                if (baseAppDef) {
                    const finalAppDef: AppDefinition = { ...baseAppDef, ...appInfo };
                    openAppWithDef(finalAppDef);
                    return;
                }
            }
            console.error(`Invalid or unreadable .app file: ${item.path}`);
            return;
        }

        const notebookDef = await getAppDefinitionById('notebook');
        if (notebookDef) {
            openAppWithDef(notebookDef, { filePath: item.path });
        }
    }
);
