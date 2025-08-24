import { createAsyncThunk } from '@reduxjs/toolkit';
import { _openInternalApp } from '../slices/windowSlice';
import { getAppDefinitionById } from '../../apps';
import { AppDefinition, FilesystemItem } from '../../types';
import { RootState } from '../store';

interface OpenItemPayload extends FilesystemItem {
    openWithAppId?: string;
}

export const openItem = createAsyncThunk(
    'windows/openItem',
    async (payload: OpenItemPayload, { dispatch, getState }) => {
        const { openWithAppId, ...item } = payload;
        const state = getState() as RootState;
        const nextZIndex = state.windows.nextZIndex;

        if (openWithAppId) {
            const appDef = await getAppDefinitionById(openWithAppId);
            if (appDef) {
                openAppWithDef(appDef, { filePath: item.path });
            } else {
                console.error(`App definition not found for id: ${openWithAppId}`);
            }
            return;
        }

        if (item.name.endsWith('.shortcut')) {
            const targetPath = await window.electronAPI.filesystem.readShortcutFile(item.path);
            if (!targetPath) {
                console.error(`Could not resolve shortcut: ${item.path}`);
                return;
            }
            const targetProperties = await window.electronAPI.filesystem.getItemProperties(targetPath);
            if (!targetProperties) {
                console.error(`Target of shortcut not found: ${targetPath}`);
                return;
            }
            dispatch(openItem(targetProperties));
            return;
        }

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
