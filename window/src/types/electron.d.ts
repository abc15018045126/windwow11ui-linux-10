interface FilesystemItem {
    name: string;
    path: string;
    type: 'file' | 'folder';
}

export interface DiscoveredApp {
    name: string;
    path: string;
    description?: string;
    version?: string;
}

export interface IElectronAPI {
  notebook: {
    readFile: (filePath: string) => Promise<{ content: string; name: string; path: string } | null>;
    saveFile: (filePath: string, content: string) => Promise<boolean>;
  };
  filesystem: {
    getItemsInPath: (path: string) => Promise<FilesystemItem[] | null>;
    createFolder: (path: string, folderName: string) => Promise<boolean>;
    createFile: (path: string, fileName: string) => Promise<boolean>;
    deleteItem: (path: string) => Promise<boolean>;
    renameItem: (path: string, newName: string) => Promise<boolean>;
    readAppFile: (path: string) => Promise<any | null>;
  };
  sftp: {
    connect: (config: any) => Promise<{ success: boolean; sessionId?: string; error?: string }>;
    disconnect: (sessionId: string) => void;
    list: (sessionId: string, path: string) => Promise<any[] | null>;
    download: (sessionId: string, path: string) => Promise<string | null>;
  };
  launcher: {
    launchExternal: (path: string) => Promise<boolean>;
  };
  appStore: {
    discoverApps: () => Promise<DiscoveredApp[]>;
    installApp: (app: DiscoveredApp) => Promise<boolean>;
  }
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
