import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { openItem } from '../../store/thunks/openItemThunk';
import { fetchDesktopItems } from '../../store/thunks/desktopThunks';
import AppWindow from '../features/AppWindow';
import Icon, { isValidIcon } from '../features/Icon';
import { getAppDefinitionById } from '../../apps';
import { OpenApp, FilesystemItem } from '../../types';

const DesktopItem: React.FC<{
    item: FilesystemItem,
    isRenaming: boolean,
    renameValue: string,
    onRenameChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onRenameSubmit: () => void,
    onDoubleClick: (item: FilesystemItem) => void,
}> = ({ item, isRenaming, renameValue, onRenameChange, onRenameSubmit, onDoubleClick }) => {
    const [iconName, setIconName] = useState('fileGeneric');

    useEffect(() => {
        const determineIcon = async () => {
            if (item.type === 'folder') {
                setIconName('folder');
            } else if (item.name.endsWith('.txt') || item.name.endsWith('.md')) {
                setIconName('notebook');
            } else if (item.name.endsWith('.app') || item.name.endsWith('.shortcut')) {
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
            data-context-menu-type="desktop-item"
            data-context-menu-payload={JSON.stringify(item)}
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
    const desktopItems = useSelector((state: RootState) => state.desktop.items);
    const [hydratedApps, setHydratedApps] = useState<OpenApp[]>([]);
    const [renamingItem, setRenamingItem] = useState<{ path: string, value: string } | null>(null);
    const desktopRef = useRef<HTMLDivElement>(null);
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        dispatch(fetchDesktopItems());
    }, [dispatch]);

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

    const handleRenameSubmit = async () => {
        if (!renamingItem) return;
        if (await window.electronAPI.filesystem.renameItem(renamingItem.path, renamingItem.value)) {
            dispatch(fetchDesktopItems());
        }
        setRenamingItem(null);
    };

    const handleDoubleClick = (item: FilesystemItem) => {
        dispatch(openItem(item));
    };

    const handleDesktopClick = (e: React.MouseEvent) => {
        if (e.target === desktopRef.current && renamingItem) {
            handleRenameSubmit();
        }
    };

    return (
        <div
            ref={desktopRef}
            className="absolute inset-0 h-full w-full bg-blue-500"
            data-context-menu-type="desktop-background"
            onClick={handleDesktopClick}
        >
            <div className="p-2 grid grid-cols-[repeat(auto-fill,80px)] grid-rows-[repeat(auto-fill,80px)] gap-2">
                {desktopItems.map((item) => (
                    <DesktopItem
                        key={item.path}
                        item={item}
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
        </div>
    );
};

export default Desktop;
