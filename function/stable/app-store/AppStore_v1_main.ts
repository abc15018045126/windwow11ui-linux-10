import { promises as fs, existsSync } from 'fs';
import path from 'path';

const APPS_ROOT = path.join(process.cwd(), 'apps');
const AUTOGEN_APP_ROOT = path.join(process.cwd(), 'window', 'src', 'apps');
const DESKTOP_PATH = path.join(process.cwd(), 'virtual-fs', 'Desktop');

/**
 * Describes an application that is available on the filesystem for installation.
 */
export interface AvailableApp {
    id: string; // The directory name, e.g., "Chrome5"
    name: string; // The name from package.json, e.g., "remote-electron-browser"
    version: string;
    description: string;
    path: string; // The relative path to the app's directory, e.g., "apps/Chrome5"
    isInstalled?: boolean;
}

const generateLauncherComponent = (appName: string, appDef: object): string => {
    const componentName = appName.charAt(0).toUpperCase() + appName.slice(1) + 'App';
    const appDefString = JSON.stringify(appDef, null, 2);

    return `// This is an auto-generated file for the ${appName} application.
// Do not edit manually.
import React from 'react';
import { AppDefinition, AppComponentProps } from '../../types';

const LauncherComponent: React.FC<AppComponentProps> = () => {
  // This component is a placeholder for an external application.
  // It will not be rendered directly. The 'isExternal' flag handles the launch.
  return null;
};

export const appDefinition: AppDefinition = ${appDefString};

export default LauncherComponent;
`;
};

/**
 * Scans the filesystem for apps that are available to be installed.
 */
export const AppStore_v1_discoverAvailableApps = async (): Promise<AvailableApp[]> => {
    try {
        const appFolders = await fs.readdir(APPS_ROOT, { withFileTypes: true });
        const availableApps: AvailableApp[] = [];

        for (const dirent of appFolders) {
            if (dirent.isDirectory()) {
                const packageJsonPath = path.join(APPS_ROOT, dirent.name, 'package.json');
                try {
                    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
                    const packageJson = JSON.parse(packageJsonContent);

                    if (packageJson.name && packageJson.main) {
                        const componentName = dirent.name.charAt(0).toUpperCase() + dirent.name.slice(1);
                        const launcherFilePath = path.join(AUTOGEN_APP_ROOT, `${componentName}App.tsx`);

                        availableApps.push({
                            id: dirent.name, // e.g., "Chrome5"
                            name: packageJson.name,
                            version: packageJson.version,
                            description: packageJson.description,
                            path: path.join('apps', dirent.name),
                            isInstalled: existsSync(launcherFilePath),
                        });
                    }
                } catch (e) {
                    // Ignore folders without a valid package.json
                }
            }
        }
        return availableApps;
    } catch (error) {
        console.error('[discoverAvailableApps] Error:', error);
        return [];
    }
};

/**
 * Installs an app by generating a .tsx launcher file for it AND a .app shortcut on the desktop.
 */
export const AppStore_v1_installExternalApp = async (app: AvailableApp): Promise<boolean> => {
    try {
        const componentName = app.id.charAt(0).toUpperCase() + app.id.slice(1); // "Chrome5"
        const launcherFilePath = path.join(AUTOGEN_APP_ROOT, `${componentName}App.tsx`);

        // 1. Generate the .tsx file
        if (!existsSync(launcherFilePath)) {
            const appDefinition = {
                id: app.id.toLowerCase(), // e.g., "chrome5"
                name: componentName, // Use the sanitized name like "Chrome5" for display
                icon: app.id.toLowerCase(), // Use the id for the icon name
                isExternal: true,
                externalPath: path.join(app.path, 'main.js'),
                component: null,
            };
            const launcherContent = generateLauncherComponent(componentName, appDefinition);
            await fs.writeFile(launcherFilePath, launcherContent, 'utf-8');
            console.log(`Successfully generated launcher for ${app.name} at ${launcherFilePath}`);
        } else {
             console.warn(`Launcher file for "${app.name}" already exists.`);
        }

        // 2. Generate the .app file on the desktop
        const desktopShortcutPath = path.join(DESKTOP_PATH, `${componentName}.app`);
        if (!existsSync(desktopShortcutPath)) {
            await fs.mkdir(DESKTOP_PATH, { recursive: true }); // Ensure desktop exists
            const shortcutContent = {
                appId: app.id.toLowerCase(),
                name: componentName,
                icon: app.id.toLowerCase(),
            };
            await fs.writeFile(desktopShortcutPath, JSON.stringify(shortcutContent, null, 2), 'utf-8');
            console.log(`Successfully created desktop shortcut for ${app.name} at ${desktopShortcutPath}`);
        } else {
            console.warn(`Desktop shortcut for "${app.name}" already exists.`);
        }

        return true;
    } catch (error) {
        console.error(`[installExternalApp] Error for app ${app.name}:`, error);
        return false;
    }
};
