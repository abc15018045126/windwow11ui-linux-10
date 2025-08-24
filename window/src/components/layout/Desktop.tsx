import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { openItem } from '../../store/thunks/openItemThunk';
import { _openInternalApp } from '../../store/slices/windowSlice';
import { copyItem } from '../../store/slices/clipboardSlice';
import AppWindow from '../features/AppWindow';
import Icon, { isValidIcon } from '../features/Icon';
import ContextMenu, { ContextMenuItem } from '../features/ContextMenu';
import { getAppDefinitionById, getAppsForExtension } from '../../apps';
import { OpenApp, FilesystemItem } from '../../types';

const DesktopItem: React.FC<{
    item: FilesystemItem,
    isRenaming: boolean,
    renameValue: string,
    onRenameChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onRenameSubmit: () => void,
    onContextMenu: (e: React.MouseEvent, item: FilesystemItem) => void,
    onDoubleClick: (item: FilesystemItem) => void,
}> = ({ item, isRenaming, renameValue, onRenameChange, onRenameSubmit, onContextMenu, onDoubleClick }) => {
    const [iconName, setIconName] = useState('fileGeneric');

    useEffect(() => {
        const determineIcon = async () => {
            if (item.type === 'folder') {
                setIconName('folder');
            } else if (item.name.endsWith('.txt') || item.name.endsWith('.md')) {
                setIconName('notebook');
            } else if (item.name.endsWith('.app')) {
                const appInfo = await window.electronAPI.filesystem.readAppFile(item.path);
                if (appInfo && appInfo.icon && isValidIcon(appInfo.icon)) {
                    setIconName(appInfo.icon);
                } else {
                    setIconName('fileGeneric');
                }
            } else {
                setIconName('fileGeneric');
            }
        };
        determineIcon();
    }, [item]);

    return (
        <div
            className="flex flex-col items-center p-2 rounded cursor-pointer select-none w-20 h-20"
            title={item.name}
            onContextMenu={(e) => onContextMenu(e, item)}
            onDoubleClick={() => onDoubleClick(item)}
        >
            <Icon iconName={iconName} className="w-10 h-10 mb-1" />
            {isRenaming ? (
                <input
                    type="text"
                    value={renameValue}
                    onChange={onRenameChange}
                    onBlur={onRenameSubmit}
                    onKeyDown={(e) => { if (e.key === 'Enter') onRenameSubmit(); }}
                    className="text-xs text-center text-black bg-white w-full border border-blue-500 mt-1.5"
                    autoFocus
                    onFocus={e => e.target.select()}
                />
            ) : (
                <span className="text-xs text-center text-white shadow-black [text-shadow:1px_1px_2px_var(--tw-shadow-color)] truncate w-full">
                    {item.name}
                </span>
            )}
        </div>
    );
};

const Desktop: React.FC = () => {
    const { openApps: serializableApps, activeInstanceId, nextZIndex } = useSelector((state: RootState) => state.windows);
    const { copiedItem } = useSelector((state: RootState) => state.clipboard);
    const [hydratedApps, setHydratedApps] = useState<OpenApp[]>([]);
    const [desktopItems, setDesktopItems] = useState<FilesystemItem[]>([]);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
    const [renamingItem, setRenamingItem] = useState<{ path: string, value: string } | null>(null);
    const desktopRef = useRef<HTMLDivElement>(null);
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        const hydrateApps = async () => {
            const newHydratedApps: OpenApp[] = [];
            for (const serializableApp of serializableApps) {
                const appDef = await getAppDefinitionById(serializableApp.id);
                if (appDef) {
                    newHydratedApps.push({
                        ...serializableApp,
                        component: appDef.component,
                    });
                }
            }
            setHydratedApps(newHydratedApps);
        };
        hydrateApps();
    }, [serializableApps]);

    const fetchDesktopItems = useCallback(async () => {
        const items = await window.electronAPI.filesystem.getItemsInPath('/Desktop');
        if (items) setDesktopItems(items);
    }, []);

    useEffect(() => { fetchDesktopItems(); }, [fetchDesktopItems]);

    const closeContextMenu = () => setContextMenu(null);

    const handleRenameSubmit = async () => {
        if (!renamingItem) return;
        if (await window.electronAPI.filesystem.renameItem(renamingItem.path, renamingItem.value)) {
            fetchDesktopItems();
        }
        setRenamingItem(null);
    };

    const handleDoubleClick = (item: FilesystemItem) => {
        dispatch(openItem(item));
    };

    const openPropertiesFor = async (item: FilesystemItem) => {
        const appDef = await getAppDefinitionById('properties');
        if (!appDef) {
            console.error("Properties app definition not found.");
            return;
        }
        const instanceId = `${appDef.id}-${item.path}-${Date.now()}`;
        const newApp = {
            ...appDef,
            initialData: { path: item.path },
            instanceId,
            title: `Properties: ${item.name}`,
            isMinimized: false,
            isMaximized: false,
            position: { x: 150, y: 150 },
            size: appDef.defaultSize || { width: 400, height: 350 },
            zIndex: nextZIndex,
        };
        const { component, ...serializablePayload } = newApp;
        dispatch(_openInternalApp(serializablePayload));
    };

    const handleContextMenu = async (e: React.MouseEvent, item?: FilesystemItem) => {
        e.preventDefault();
        e.stopPropagation();
        closeContextMenu(); // Close any existing menu

        let menuItems: ContextMenuItem[] = [];

        if (item) { // Right-clicked on an item
            const openWithApps = item.type === 'file'
                ? await getAppsForExtension(item.name.split('.').pop() || '')
                : [];

            const openWithSubMenu: ContextMenuItem[] = openWithApps.map(app => ({
                type: 'item',
                label: app.name,
                onClick: () => dispatch(openItem({ ...item, openWithAppId: app.id })),
            }));

            menuItems = [
                { type: 'item', label: 'Open', onClick: () => handleDoubleClick(item) },
                { type: 'item', label: 'Open with', onClick: () => {}, disabled: openWithSubMenu.length === 0, items: openWithSubMenu },
                { type: 'separator' },
                { type: 'item', label: 'Copy', onClick: () => dispatch(copyItem(item)) },
                { type: 'item', label: 'Create shortcut', onClick: async () => { if (await window.electronAPI.filesystem.createShortcut(item.path)) fetchDesktopItems(); } },
                { type: 'separator' },
                { type: 'item', label: 'Delete', onClick: async () => { if (await window.electronAPI.filesystem.deleteItem(item.path)) fetchDesktopItems(); } },
                { type: 'item', label: 'Rename', onClick: () => setRenamingItem({ path: item.path, value: item.name }) },
                { type: 'separator' },
                { type: 'item', label: 'Properties', onClick: () => openPropertiesFor(item) },
            ];
        } else { // Right-clicked on the desktop background
            const desktopItem = { name: 'Desktop', path: '/Desktop', type: 'folder' as const };
            menuItems = [
                { type: 'item', label: 'Paste', onClick: async () => { if(copiedItem) { if (await window.electronAPI.filesystem.copyItem(copiedItem.path, '/Desktop')) fetchDesktopItems(); } }, disabled: !copiedItem },
                { type: 'separator' },
                { type: 'item', label: 'New Folder', onClick: async () => { let n = 'New Folder', i = 0; while (desktopItems.some(item => item.name === n)) n = `New Folder (${++i})`; if (await window.electronAPI.filesystem.createFolder('/Desktop', n)) fetchDesktopItems(); } },
                { type: 'item', label: 'New Text File', onClick: async () => { let n = 'New Text File.txt', i = 0; while (desktopItems.some(item => item.name === n)) n = `New Text File (${++i}).txt`; if (await window.electronAPI.filesystem.createFile('/Desktop', n)) fetchDesktopItems(); } },
                { type: 'separator' },
                { type: 'item', label: 'Refresh', onClick: fetchDesktopItems },
                { type: 'separator' },
                { type: 'item', label: 'Properties', onClick: () => openPropertiesFor(desktopItem) },
            ];
        }

        setContextMenu({ x: e.clientX, y: e.clientY, items: menuItems });
    };

    return (
        <div
            ref={desktopRef}
            className="absolute inset-0 h-full w-full bg-blue-500"
            onContextMenu={(e) => handleContextMenu(e)}
            onClick={() => { closeContextMenu(); if (renamingItem) handleRenameSubmit(); }}
        >
            <div className="p-2 grid grid-cols-[repeat(auto-fill,80px)] grid-rows-[repeat(auto-fill,80px)] gap-2">
                {desktopItems.map((item) => (
                    <DesktopItem
                        key={item.path}
                        item={item}
                        onContextMenu={handleContextMenu}
                        onDoubleClick={handleDoubleClick}
                        isRenaming={renamingItem?.path === item.path}
                        renameValue={renamingItem?.path === item.path ? renamingItem.value : ''}
                        onRenameChange={(e) => renamingItem && setRenamingItem({ ...renamingItem, value: e.target.value })}
                        onRenameSubmit={handleRenameSubmit}
                    />
                ))}
            </div>

            {hydratedApps.map((app) => (
                <AppWindow key={app.instanceId} app={app} isActive={app.instanceId === activeInstanceId} />
            ))}

            {contextMenu && (
                <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={closeContextMenu} />
            )}
        </div>
    );
};

export default Desktop;
