import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { openItem } from '../../store/thunks/openItemThunk';
import AppWindow from '../features/AppWindow';
import Icon, { isValidIcon } from '../features/Icon';
import ContextMenu, { ContextMenuItem } from '../features/ContextMenu';
import { getAppDefinitionById } from '../../apps';
import { OpenApp } from '../../types';

interface FilesystemItem {
    name: string;
    path: string;
    type: 'file' | 'folder';
}

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
    const { openApps: serializableApps, activeInstanceId } = useSelector((state: RootState) => state.windows);
    const [hydratedApps, setHydratedApps] = useState<OpenApp[]>([]);
    const [desktopItems, setDesktopItems] = useState<FilesystemItem[]>([]);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; targetItem?: FilesystemItem } | null>(null);
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

    const handleContextMenu = (e: React.MouseEvent, item?: FilesystemItem) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, targetItem: item });
    };

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

    const generateContextMenuItems = (): ContextMenuItem[] => {
        if (contextMenu?.targetItem) {
            const item = contextMenu.targetItem;
            return [
                { type: 'item', label: 'Open', onClick: () => handleDoubleClick(item) },
                { type: 'separator' },
                { type: 'item', label: 'Delete', onClick: async () => { if (await window.electronAPI.filesystem.deleteItem(item.path)) fetchDesktopItems(); } },
                { type: 'item', label: 'Rename', onClick: () => setRenamingItem({ path: item.path, value: item.name }) },
            ];
        }
        return [
            { type: 'item', label: 'New Folder', onClick: async () => { let n = 'New Folder', i = 0; while (desktopItems.some(item => item.name === n)) n = `New Folder (${++i})`; if (await window.electronAPI.filesystem.createFolder('/Desktop', n)) fetchDesktopItems(); } },
            { type: 'item', label: 'New Text File', onClick: async () => { let n = 'New Text File.txt', i = 0; while (desktopItems.some(item => item.name === n)) n = `New Text File (${++i}).txt`; if (await window.electronAPI.filesystem.createFile('/Desktop', n)) fetchDesktopItems(); } },
            { type: 'separator' },
            { type: 'item', label: 'Refresh', onClick: fetchDesktopItems },
        ];
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
                <ContextMenu x={contextMenu.x} y={contextMenu.y} items={generateContextMenuItems()} onClose={closeContextMenu} />
            )}
        </div>
    );
};

export default Desktop;
