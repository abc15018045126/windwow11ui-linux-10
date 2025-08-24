import React, { useState, useEffect } from 'react';
import { AppDefinition, AppComponentProps } from '../../types';

interface FileProperties {
    name: string;
    path: string;
    type: 'file' | 'folder';
    size: number;
    createdAt: string;
    modifiedAt: string;
}

const PropertiesApp: React.FC<AppComponentProps> = ({ initialData }) => {
    const [properties, setProperties] = useState<FileProperties | null>(null);
    const [error, setError] = useState<string | null>(null);
    const itemPath = initialData?.path;

    useEffect(() => {
        if (!itemPath) {
            setError('No item path provided.');
            return;
        }

        const fetchProperties = async () => {
            try {
                const props = await window.electronAPI.filesystem.getItemProperties(itemPath);
                if (props) {
                    setProperties(props);
                } else {
                    setError('Could not retrieve properties for the item.');
                }
            } catch (e) {
                setError('An error occurred while fetching properties.');
                console.error(e);
            }
        };

        fetchProperties();
    }, [itemPath]);

    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    return (
        <div className="p-4 bg-zinc-800 text-white h-full select-text">
            <h1 className="text-lg font-bold mb-4 border-b border-zinc-600 pb-2">Properties</h1>
            {error && <p className="text-red-500">{error}</p>}
            {properties ? (
                <div className="space-y-2 text-sm">
                    <div className="flex">
                        <span className="w-28 font-semibold">Name:</span>
                        <span>{properties.name}</span>
                    </div>
                    <div className="flex">
                        <span className="w-28 font-semibold">Type:</span>
                        <span>{properties.type}</span>
                    </div>
                    <div className="flex">
                        <span className="w-28 font-semibold">Path:</span>
                        <span className="break-all">{properties.path}</span>
                    </div>
                    <div className="flex">
                        <span className="w-28 font-semibold">Size:</span>
                        <span>{formatBytes(properties.size)}</span>
                    </div>
                    <div className="flex">
                        <span className="w-28 font-semibold">Created:</span>
                        <span>{new Date(properties.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex">
                        <span className="w-28 font-semibold">Modified:</span>
                        <span>{new Date(properties.modifiedAt).toLocaleString()}</span>
                    </div>
                </div>
            ) : (
                !error && <p>Loading properties...</p>
            )}
        </div>
    );
};

export const appDefinition: AppDefinition = {
    id: 'properties',
    name: 'Properties',
    icon: 'settings', // Using settings icon as a placeholder
    component: PropertiesApp,
    defaultSize: { width: 400, height: 350 },
};

export default PropertiesApp;
