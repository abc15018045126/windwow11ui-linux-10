import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { toggleStartMenu } from '../../store/slices/uiSlice';
import { _openInternalApp, focusApp, toggleMinimizeApp } from '../../store/slices/windowSlice';
import { getAppDefinitions, getAppDefinitionById } from '../../apps';
import Icon from '../features/Icon';
import { AppDefinition, OpenApp } from '../../types';

const TASKBAR_HEIGHT = 48;

type TaskbarApp = (AppDefinition | OpenApp) & {
    isOpen: boolean;
    isActive: boolean;
};

const Taskbar: React.FC = () => {
    const dispatch = useDispatch();
    const { openApps, activeInstanceId, nextZIndex } = useSelector((state: RootState) => state.windows);
    const { pinnedApps } = useSelector((state: RootState) => state.ui);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [allApps, setAllApps] = useState<AppDefinition[]>([]);

    useEffect(() => {
        const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    useEffect(() => {
        const fetchApps = async () => {
            const definitions = await getAppDefinitions();
            setAllApps(definitions);
        };
        fetchApps();
    }, []);


    const taskbarApps = useMemo(() => {
        const runningInstanceAppIds = new Set(openApps.map(app => app.id));

        const pinnedAndNotRunning = pinnedApps
            .map(appId => allApps.find(def => def.id === appId))
            .filter((appDef): appDef is AppDefinition => !!appDef && !runningInstanceAppIds.has(appDef.id));

        const combined = [
            ...openApps.map(app => ({ ...app, isOpen: true, isActive: app.instanceId === activeInstanceId })),
            ...pinnedAndNotRunning.map(appDef => ({ ...appDef, isOpen: false, isActive: false })),
        ];

        return combined;
    }, [pinnedApps, openApps, allApps, activeInstanceId]);

    const handleToggleStartMenu = () => {
        dispatch(toggleStartMenu());
    };

    const handleAppIconClick = async (app: TaskbarApp) => {
        if (app.isOpen && 'instanceId' in app) {
            const openAppInstance = app as OpenApp;
            if (openAppInstance.isMinimized) {
                dispatch(toggleMinimizeApp(openAppInstance.instanceId));
            } else if (app.isActive) {
                dispatch(toggleMinimizeApp(openAppInstance.instanceId));
            } else {
                dispatch(focusApp(openAppInstance.instanceId));
            }
        } else {
            const appDef = await getAppDefinitionById(app.id);
            if (appDef) {
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
                    const { component, ...serializablePayload } = newApp;
                    dispatch(_openInternalApp(serializablePayload));
                }
            }
        }
    };

    return (
        <div
            className="fixed bottom-0 left-0 right-0 bg-gray-800 bg-opacity-80 backdrop-blur-md text-white flex items-center justify-between px-4"
            style={{ height: `${TASKBAR_HEIGHT}px` }}
        >
            <div className="flex-1 flex justify-center items-center h-full">
                <div className="flex items-center space-x-2 h-full">
                    <button onClick={handleToggleStartMenu} className="p-2 rounded hover:bg-white/20" title="Start">
                        <Icon iconName="start" className="w-6 h-6 text-blue-400" />
                    </button>

                    {taskbarApps.map(app => {
                        const buttonKey = 'instanceId' in app ? app.instanceId : app.id;
                        return (
                            <button
                                key={buttonKey}
                                onClick={() => handleAppIconClick(app)}
                                className={`p-2 rounded h-[calc(100%-8px)] flex items-center relative transition-colors duration-150 ease-in-out ${app.isActive ? 'bg-white/20' : 'hover:bg-white/10'}`}
                                title={app.name}
                            >
                                <Icon iconName={app.icon} className="w-5 h-5" isSmall />
                                {app.isOpen && (
                                    <span
                                        className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 rounded-t-sm bg-blue-400 ${app.isActive ? 'w-6' : 'w-4'}`}
                                    ></span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex items-center space-x-3 text-xs">
                <div>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div>{currentTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
            </div>
        </div>
    );
};

export default Taskbar;
