import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { _openInternalApp } from '../../store/slices/windowSlice';
import { getAppDefinitions, getAppDefinitionById } from '../../apps';
import Icon from './Icon';
import { AppDefinition } from '../../types';
import { RootState } from '../../store/store';

const StartMenu: React.FC = () => {
  const dispatch = useDispatch();
  const [isShowingAllApps, setIsShowingAllApps] = useState(false);
  const [apps, setApps] = useState<AppDefinition[]>([]);
  const nextZIndex = useSelector((state: RootState) => state.windows.nextZIndex);

  useEffect(() => {
    const fetchApps = async () => {
      const definitions = await getAppDefinitions();
      setApps(definitions);
    };
    fetchApps();
  }, []);

  const handleOpenApp = async (appId: string) => {
    const appDef = await getAppDefinitionById(appId);
    if (!appDef) return;

    if (appDef.isExternal && appDef.externalPath) {
        window.electronAPI.launcher.launchExternal(appDef.externalPath);
    } else {
        const instanceId = `${appDef.id}-${Date.now()}`;
        const newApp = {
            ...appDef,
            instanceId,
            title: appDef.name,
            isMinimized: false,
            isMaximized: false,
            position: { x: 50, y: 50 },
            size: appDef.defaultSize || { width: 600, height: 400 },
            zIndex: nextZIndex,
        };
        // Omit the non-serializable component part before dispatching
        const { component, ...serializablePayload } = newApp;
        dispatch(_openInternalApp(serializablePayload));
    }
  };

  const pinnedApps = useMemo(() => apps.filter(app => app.isPinnedToTaskbar), [apps]);
  const sortedApps = useMemo(() => [...apps].sort((a, b) => a.name.localeCompare(b.name)), [apps]);

  return (
    <div
      className="fixed bottom-[52px] left-1/2 transform -translate-x-1/2 w-[580px] h-[650px] rounded-lg shadow-2xl flex flex-col p-6 bg-gray-800 bg-opacity-80 backdrop-blur-md text-white z-40"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex-shrink-0 mb-6">
        <input
          type="text"
          placeholder="Search for apps, files, and settings"
          className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 placeholder-gray-400 text-sm"
        />
      </div>

      <div className="flex-grow overflow-hidden">
        {isShowingAllApps ? (
            <div className="h-full flex flex-col">
                <div className="flex-shrink-0 flex justify-between items-center mb-3">
                    <h2 className="text-lg font-semibold">All Apps</h2>
                    <button onClick={() => setIsShowingAllApps(false)} className="px-3 py-1 text-xs bg-zinc-700/80 rounded-md hover:bg-zinc-700">
                        &lt; Back
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto pr-4">
                    <div className="space-y-1">
                        {sortedApps.map(app => (
                            <button key={`all-${app.id}`} onClick={() => handleOpenApp(app.id)} className="w-full flex items-center p-2 rounded-md hover:bg-white/10" title={app.name}>
                                <Icon iconName={app.icon} className="w-6 h-6 mr-4 flex-shrink-0" />
                                <span className="text-sm text-left truncate">{app.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        ) : (
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-sm font-semibold opacity-80">Pinned</h2>
                    <button onClick={() => setIsShowingAllApps(true)} className="px-3 py-1 text-xs bg-zinc-700/80 rounded-md hover:bg-zinc-700">
                        All apps &gt;
                    </button>
                </div>
                <div className="grid grid-cols-6 gap-4">
                    {pinnedApps.map((app) => (
                        <button key={app.id} onClick={() => handleOpenApp(app.id)} className="flex flex-col items-center justify-center p-2 rounded-md transition-colors aspect-square hover:bg-white/10" title={app.name}>
                            <Icon iconName={app.icon} className="w-8 h-8 mb-1.5" />
                            <span className="text-xs text-center truncate w-full">{app.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>

      <div className="flex-shrink-0 mt-auto pt-4 border-t border-white/10 flex justify-between items-center">
        <button className="flex items-center p-2 rounded-md hover:bg-white/10">
          <Icon iconName="user" className="w-7 h-7 rounded-full mr-2" />
          <span className="text-sm">User</span>
        </button>
        <div className="relative flex">
          <button title="Power" className="p-2 rounded-md hover:bg-white/10">
            <Icon iconName="start" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartMenu;
