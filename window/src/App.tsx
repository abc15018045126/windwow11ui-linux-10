import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from './store/store';
import Desktop from './components/layout/Desktop';
import Taskbar, { TaskbarApp } from './components/layout/Taskbar';
import StartMenu from './components/features/StartMenu';
import ContextMenu from './components/features/ContextMenu';
import { openContextMenu, closeContextMenu } from './store/slices/contextMenuSlice';
import { getAppsForExtension } from './apps';
import { openItem } from './store/thunks/openItemThunk';
import { fetchDesktopItems } from './store/thunks/desktopThunks';
import { copyItem } from './store/slices/clipboardSlice';
import { FilesystemItem } from './types';
import { pinApp, unpinApp } from './store/slices/uiSlice';
import { toggleMaximize, toggleMinimizeApp, closeApp as closeWindowApp } from './store/slices/windowSlice';

// This file is becoming a central hub for event handling, as requested.

// --- Menu Generation Logic ---

const generateDesktopItemBackgroundMenu = async (dispatch: AppDispatch, item: FilesystemItem): Promise<any[]> => {
    const openWithApps = item.type === 'file'
        ? await getAppsForExtension(item.name.split('.').pop() || '')
        : [];

    const openWithSubMenu = openWithApps.map(app => ({
        type: 'item',
        label: app.name,
        onClick: () => dispatch(openItem({ ...item, openWithAppId: app.id })),
    }));

    return [
        { type: 'item', label: 'Open', onClick: () => dispatch(openItem(item)) },
        { type: 'item', label: 'Open with', onClick: () => {}, disabled: openWithSubMenu.length === 0, items: openWithSubMenu },
        { type: 'separator' },
        { type: 'item', label: 'Copy', onClick: () => dispatch(copyItem(item)) },
        { type: 'item', label: 'Create shortcut', onClick: async () => { if (await window.electronAPI.filesystem.createShortcut(item.path)) dispatch(fetchDesktopItems()); } },
        { type: 'separator' },
        { type: 'item', label: 'Delete', onClick: async () => { if (await window.electronAPI.filesystem.deleteItem(item.path)) dispatch(fetchDesktopItems()); } },
        { type: 'separator' },
        { type: 'item', label: 'Properties', onClick: () => dispatch(openItem({ name: 'Properties', path: item.path, type: 'file', appId: 'properties' } as any)) },
    ];
};

const generateDesktopBackgroundMenu = (dispatch: AppDispatch, clipboardItem: FilesystemItem | null): any[] => {
    const desktopItem = { name: 'Desktop', path: '/Desktop', type: 'folder' as const };
    return [
        { type: 'item', label: 'Paste', onClick: async () => { if(clipboardItem) { if (await window.electronAPI.filesystem.copyItem(clipboardItem.path, '/Desktop')) dispatch(fetchDesktopItems()); } }, disabled: !clipboardItem },
        { type: 'separator' },
        { type: 'item', label: 'New Folder', onClick: async () => { let n = 'New Folder'; if (await window.electronAPI.filesystem.createFolder('/Desktop', n)) dispatch(fetchDesktopItems()); } },
        { type: 'item', label: 'New Text File', onClick: async () => { let n = 'New Text File.txt'; if (await window.electronAPI.filesystem.createFile('/Desktop', n)) dispatch(fetchDesktopItems()); } },
        { type: 'separator' },
        { type: 'item', label: 'Refresh', onClick: () => dispatch(fetchDesktopItems()) },
        { type: 'separator' },
        { type: 'item', label: 'Properties', onClick: () => dispatch(openItem({ name: 'Properties', path: '/Desktop', type: 'file', appId: 'properties' } as any)) },
    ];
};

const generateTaskbarAppMenu = (dispatch: AppDispatch, app: TaskbarApp, pinnedApps: string[]): any[] => {
    const isPinned = pinnedApps.includes(app.id);
    const isOpen = 'instanceId' in app && app.isOpen;
    const menuItems: any[] = [];

    menuItems.push({ type: 'item', label: app.name, disabled: true, onClick: () => {} });
    menuItems.push({ type: 'separator' });

    if (isOpen) {
        const openApp = app as any;
        if (!openApp.isMaximized) {
            menuItems.push({ type: 'item', label: 'Maximize', onClick: () => dispatch(toggleMaximize(openApp.instanceId)) });
        } else {
            menuItems.push({ type: 'item', label: 'Restore', onClick: () => dispatch(toggleMaximize(openApp.instanceId)) });
        }
        if (!openApp.isMinimized) {
            menuItems.push({ type: 'item', label: 'Minimize', onClick: () => dispatch(toggleMinimizeApp(openApp.instanceId)) });
        }
        menuItems.push({ type: 'item', label: 'Close', onClick: () => dispatch(closeWindowApp(openApp.instanceId)) });
        menuItems.push({ type: 'separator' });
    }

    if (isPinned) {
        menuItems.push({ type: 'item', label: 'Unpin from taskbar', onClick: () => dispatch(unpinApp(app.id)) });
    } else {
        menuItems.push({ type: 'item', label: 'Pin to taskbar', onClick: () => dispatch(pinApp(app.id)) });
    }
    return menuItems;
};

const generateTaskbarBackgroundMenu = (): any[] => {
    return [{ type: 'item', label: 'Taskbar settings', onClick: () => {}, disabled: true }];
};


function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { isStartMenuOpen, pinnedApps } = useSelector((state: RootState) => state.ui);
  const { copiedItem } = useSelector((state: RootState) => state.clipboard);
  const contextMenuState = useSelector((state: RootState) => state.contextMenu);

  const handleGlobalContextMenu = async (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch(closeContextMenu()); // Close any previous menu

    const targetElement = e.target as HTMLElement;
    const contextTarget = targetElement.closest('[data-context-menu-type]') as HTMLElement | null;

    if (!contextTarget) return;

    const type = contextTarget.dataset.contextMenuType;
    const payload = contextTarget.dataset.contextMenuPayload ? JSON.parse(contextTarget.dataset.contextMenuPayload) : null;

    let items: any[] = [];

    // This is the main delegation logic
    switch (type) {
        case 'desktop-item':
            items = await generateDesktopItemBackgroundMenu(dispatch, payload);
            break;
        case 'desktop-background':
            items = generateDesktopBackgroundMenu(dispatch, copiedItem);
            break;
        case 'taskbar-app':
            items = generateTaskbarAppMenu(dispatch, payload, pinnedApps);
            break;
        case 'taskbar-background':
            items = generateTaskbarBackgroundMenu();
            break;
        default:
            return;
    }

    if (items.length > 0) {
        dispatch(openContextMenu({ x: e.clientX, y: e.clientY, items }));
    }
  };

  return (
    <div
      className="h-screen w-screen bg-black"
      onContextMenu={handleGlobalContextMenu}
      onClick={() => dispatch(closeContextMenu())}
    >
      <Desktop />
      {isStartMenuOpen && <StartMenu />}
      <Taskbar />

      {contextMenuState.isOpen && (
        <ContextMenu
          x={contextMenuState.x}
          y={contextMenuState.y}
          items={contextMenuState.items}
          onClose={() => dispatch(closeContextMenu())}
        />
      )}
    </div>
  );
}

export default App;
