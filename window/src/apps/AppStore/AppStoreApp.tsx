import { useEffect, useState, useCallback } from 'react';
import { AppDefinition, AppComponentProps } from '../../types';
import type { AvailableApp } from '../../../function/stable/app-store/AppStore_v1_main';

export const appDefinition: AppDefinition = {
  id: 'app-store',
  name: 'App Store',
  icon: 'chrome', // Using 'chrome' as a substitute for 'store'
  component: () => null, // Placeholder, will be replaced by the default export
};

const AppStoreApp: React.FC<AppComponentProps> = () => {
  const [apps, setApps] = useState<AvailableApp[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    try {
      const availableApps = await window.electronAPI.appStore.discoverAvailableApps();
      setApps(availableApps);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const handleInstall = async (app: AvailableApp) => {
    try {
      const success = await window.electronAPI.appStore.installExternalApp(app);
      if (success) {
        alert(`App "${app.id}" installed successfully! You may need to restart the application to see it in the Start Menu.`);
        // Refresh the app list to update the button state
        fetchApps();
      } else {
        throw new Error('Installation returned false.');
      }
    } catch (e: any) {
      alert(`Error installing ${app.name}: ${e.message}`);
    }
  };

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4 bg-white h-full overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4">App Store</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.length > 0 ? (
          apps.map((app) => (
            <div key={app.id} className="border rounded-lg p-4 flex flex-col">
              <div className="flex-grow">
                <h2 className="text-xl font-semibold">{app.id}</h2>
                <p className="text-gray-600">v{app.version}</p>
                <p className="mt-2">{app.description || 'No description available.'}</p>
              </div>
              {app.isInstalled ? (
                <button
                  disabled
                  className="mt-4 bg-gray-400 text-white font-bold py-2 px-4 rounded cursor-not-allowed"
                >
                  Installed
                </button>
              ) : (
                <button
                  onClick={() => handleInstall(app)}
                  className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Install
                </button>
              )}
            </div>
          ))
        ) : (
          <p>No apps found available for installation.</p>
        )}
      </div>
    </div>
  );
};

export default AppStoreApp;
