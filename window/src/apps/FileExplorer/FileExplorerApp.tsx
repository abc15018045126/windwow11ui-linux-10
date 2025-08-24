import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { AppDefinition, AppComponentProps } from '../../types';
import { openItem as openItemThunk } from '../../store/thunks/openItemThunk';
import { AppDispatch } from '../../store/store';
import Icon from '../../components/features/Icon';
import ContextMenu, { ContextMenuItem } from '../../components/features/ContextMenu';

interface FilesystemItem {
    name: string;
    path: string;
    type: 'file' | 'folder';
}

const getFileIconName = (filename: string): string => {
    if (filename.endsWith('.txt') || filename.endsWith('.md')) return 'notebook';
    return 'fileGeneric';
};

const FileExplorerApp: React.FC<AppComponentProps> = ({ setTitle, initialData }) => {
    const dispatch = useDispatch<AppDispatch>();
    const startPath = initialData?.initialPath || '/Desktop';
    const [currentPath, setCurrentPath] = useState(startPath);
    const [history, setHistory] = useState([startPath]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [items, setItems] = useState<FilesystemItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item?: FilesystemItem } | null>(null);
    const [renamingItem, setRenamingItem] = useState<{ path: string, value: string } | null>(null);

    const fetchItems = useCallback(async () => {
        setIsLoading(true);
        const fetchedItems = await window.electronAPI.filesystem.getItemsInPath(currentPath);
        setItems(fetchedItems || []);
        setIsLoading(false);
    }, [currentPath]);

    useEffect(() => {
        const pathName = currentPath.split('/').pop() || 'File Explorer';
        setTitle(pathName);
        fetchItems();
    }, [currentPath, fetchItems, setTitle]);

    const navigateTo = useCallback((path: string) => {
        if (path === currentPath) return;
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(path);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setCurrentPath(path);
    }, [currentPath, history, historyIndex]);

    const goBack = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setCurrentPath(history[newIndex]);
        }
    };

    const goUp = () => {
        if (currentPath !== '/Desktop') {
            const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/Desktop';
            navigateTo(parentPath);
        }
    };

    const openItem = (item: FilesystemItem) => {
        if (item.type === 'folder') {
            navigateTo(item.path);
        } else {
            dispatch(openItemThunk(item));
        }
    };

    const handleContextMenu = (e: React.MouseEvent, item?: FilesystemItem) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, item: item });
    };

    const closeContextMenu = () => setContextMenu(null);

    const handleRenameSubmit = async () => {
        if (!renamingItem) return;
        if (await window.electronAPI.filesystem.renameItem(renamingItem.path, renamingItem.value)) {
            fetchItems();
        }
        setRenamingItem(null);
    };

    const generateContextMenuItems = (): ContextMenuItem[] => {
        if (contextMenu?.item) {
            const item = contextMenu.item;
            return [
                { type: 'item', label: 'Open', onClick: () => openItem(item) },
                { type: 'separator' },
                { type: 'item', label: 'Delete', onClick: async () => { if (await window.electronAPI.filesystem.deleteItem(item.path)) fetchItems(); } },
                { type: 'item', label: 'Rename', onClick: () => setRenamingItem({ path: item.path, value: item.name }) },
            ];
        }
        return [
            { type: 'item', label: 'New Folder', onClick: async () => { let n = 'New Folder', i = 0; while (items.some(item => item.name === n)) n = `New Folder (${++i})`; if (await window.electronAPI.filesystem.createFolder(currentPath, n)) fetchItems(); } },
            { type: 'item', label: 'New Text File', onClick: async () => { let n = 'New Text File.txt', i = 0; while (items.some(item => item.name === n)) n = `New Text File (${++i}).txt`; if (await window.electronAPI.filesystem.createFile(currentPath, n)) fetchItems(); } },
            { type: 'separator' },
            { type: 'item', label: 'Refresh', onClick: fetchItems },
        ];
    };

    const breadcrumbs = ['Desktop', ...currentPath.substring('/Desktop'.length).split('/').filter(p => p)];

    return (
        <div className="flex h-full bg-gray-800 text-zinc-200 select-none" onClick={() => { closeContextMenu(); if (renamingItem) handleRenameSubmit(); }}>
            <main className="flex-grow flex flex-col">
                <div className="flex-shrink-0 flex items-center space-x-2 p-2 border-b border-zinc-700">
                    <button onClick={goBack} disabled={historyIndex === 0} className="p-1.5 rounded hover:bg-zinc-700 disabled:opacity-50">Back</button>
                    <button onClick={goUp} disabled={currentPath === '/Desktop'} className="p-1.5 rounded hover:bg-zinc-700 disabled:opacity-50">Up</button>
                    <div className="flex items-center bg-zinc-900 rounded p-1 text-sm flex-grow">
                        {breadcrumbs.join(' > ')}
                    </div>
                </div>
                <div className="flex-grow p-4 overflow-y-auto" onContextMenu={handleContextMenu}>
                    {isLoading ? <p>Loading...</p> : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                            {items.map(item => (
                                <div key={item.path} onContextMenu={(e) => handleContextMenu(e, item)} onDoubleClick={() => openItem(item)} className="flex flex-col items-center p-2 rounded hover:bg-white/10 text-center">
                                    <Icon iconName={item.type === 'folder' ? 'folder' : getFileIconName(item.name)} className="w-12 h-12" />
                                    {renamingItem?.path === item.path ? (
                                        <input
                                            type="text"
                                            value={renamingItem.value}
                                            onChange={(e) => setRenamingItem({ ...renamingItem, value: e.target.value })}
                                            onBlur={handleRenameSubmit}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); }}
                                            className="text-xs text-center text-black bg-white w-full border border-blue-500 mt-1.5"
                                            autoFocus
                                            onFocus={e => e.target.select()}
                                            onClick={e => e.stopPropagation()}
                                        />
                                    ) : (
                                        <span className="text-xs mt-1.5 break-words w-full truncate">{item.name}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            {contextMenu && (
                <ContextMenu x={contextMenu.x} y={contextMenu.y} items={generateContextMenuItems()} onClose={closeContextMenu} />
            )}
        </div>
    );
};

export const appDefinition: AppDefinition = {
    id: 'fileExplorer',
    name: 'File Explorer',
    icon: 'fileExplorer',
    component: FileExplorerApp,
    defaultSize: { width: 800, height: 600 },
};

export default FileExplorerApp;
