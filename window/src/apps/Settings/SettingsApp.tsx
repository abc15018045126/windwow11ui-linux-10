import React, { useEffect } from 'react';
import { AppDefinition, AppComponentProps } from '../../types';

const SettingsApp: React.FC<AppComponentProps> = ({ setTitle }) => {
    useEffect(() => {
        setTitle('Settings');
    }, [setTitle]);

    return (
        <div className="p-6 h-full overflow-y-auto bg-gray-900 text-white">
            <h1 className="text-2xl font-semibold mb-6">Settings</h1>

            <div className="mb-8 p-4 rounded-lg bg-white/5">
                <h2 className="text-lg font-medium mb-3">Themes</h2>
                <p className="text-sm opacity-80">
                    Theme selection is under construction.
                </p>
            </div>

            <div className="mb-8 p-4 rounded-lg bg-white/5">
                <h2 className="text-lg font-medium mb-3">About</h2>
                <p className="text-sm opacity-80">
                    Win11 React Clone Reimagined v1.0.0
                </p>
            </div>

            <div className="text-center text-xs text-zinc-500 mt-auto pt-4">
                Settings App v1.0.0
            </div>
        </div>
    );
};

export const appDefinition: AppDefinition = {
    id: 'settings',
    name: 'Settings',
    icon: 'settings',
    component: SettingsApp,
    defaultSize: { width: 700, height: 500 },
};

export default SettingsApp;
