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
    const startPath = initialData?.initialPath || '/';
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
    }, [currentPath, setTitle]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

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
        if (currentPath !== '/') {
            const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
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

    const breadcrumbParts = currentPath === '/' ? [] : currentPath.substring(1).split('/');

    const handleBreadcrumbClick = (index: number) => {
        const newPath = '/' + breadcrumbParts.slice(0, index + 1).join('/');
        navigateTo(newPath);
    };

    const shortcuts = [
        { name: 'Home', path: '/', icon: 'home' },
        { name: 'Apps', path: '/apps', icon: 'appfolder' },
        { name: 'Services', path: '/services', icon: 'appfolder' },
        { name: 'Window', path: '/window', icon: 'appfolder' },
    ];

    return (
        <div className="flex h-full bg-zinc-900 text-white select-none flex-col" onClick={() => { closeContextMenu(); if (renamingItem) handleRenameSubmit(); }}>
            {/* Toolbar */}
            <div className="flex-shrink-0 flex items-center space-x-1 p-2 border-b border-zinc-700 bg-zinc-800">
                <button onClick={goBack} disabled={historyIndex === 0} className="p-1.5 rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </button>
                <button onClick={goUp} disabled={currentPath === '/'} className="p-1.5 rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                </button>

                <div className="flex items-center bg-zinc-900 rounded p-1 text-sm flex-grow border border-zinc-700">
                    <Icon iconName="home" className="w-4 h-4 mx-1" />
                    <button onClick={() => navigateTo('/')} className="hover:underline">Home</button>
                    {breadcrumbParts.map((part, index) => (
                        <React.Fragment key={index}>
                            <span className="mx-1 text-zinc-500">/</span>
                            <button onClick={() => handleBreadcrumbClick(index)} className="hover:underline">{part}</button>
                        </React.Fragment>
                    ))}
                </div>

                 <button onClick={fetchItems} className="p-1.5 rounded hover:bg-zinc-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l1.5 1.5A9 9 0 0120.5 15M20 20l-1.5-1.5A9 9 0 003.5 9" /></svg>
                </button>
            </div>

            <div className="flex flex-grow overflow-hidden">
                {/* Left Navigation Pane */}
                <aside className="w-48 bg-zinc-800/50 p-2 flex-shrink-0 overflow-y-auto">
                    <nav>
                        <ul>
                            {shortcuts.map(shortcut => (
                                <li key={shortcut.name}>
                                    <button onClick={() => navigateTo(shortcut.path)} className={`w-full text-left flex items-center p-2 rounded my-1 ${currentPath === shortcut.path ? 'bg-blue-600' : 'hover:bg-zinc-700'}`}>
                                        <Icon iconName={shortcut.icon} className="w-5 h-5 mr-2" />
                                        <span>{shortcut.name}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-grow flex flex-col">
                    <div className="flex-grow p-4 overflow-y-auto" onContextMenu={handleContextMenu}>
                        {isLoading ? <p>Loading...</p> : (
                            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-4">
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
            </div>

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
