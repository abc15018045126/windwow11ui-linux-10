import { promises as fs } from 'fs';
import path from 'path';

const VIRTUAL_FS_ROOT = path.join(process.cwd(), 'virtual-fs');

export interface FilesystemItem {
    name: string;
    path: string;
    type: 'file' | 'folder';
}

/**
 * @description Lists the contents of a directory in the virtual filesystem.
 * @param relativePath The path relative to the virtual filesystem root (e.g., "/Desktop").
 * @returns An array of filesystem items, or null if the path does not exist.
 */
export const Filesystem_v1_getItemsInPath = async (relativePath: string): Promise<FilesystemItem[] | null> => {
    try {
        const fullPath = path.join(VIRTUAL_FS_ROOT, relativePath);
        const items = await fs.readdir(fullPath, { withFileTypes: true });
        return items.map(item => ({
            name: item.name,
            path: path.join(relativePath, item.name),
            type: item.isDirectory() ? 'folder' : 'file',
        }));
    } catch (error) {
        console.error(`[Filesystem_v1_getItemsInPath] Error listing path ${relativePath}:`, error);
        return null;
    }
};

/**
 * @description Creates a new folder in the virtual filesystem.
 * @param relativePath The path where the new folder should be created.
 * @param folderName The name of the new folder.
 * @returns True if successful, false otherwise.
 */
export const Filesystem_v1_createFolder = async (relativePath: string, folderName: string): Promise<boolean> => {
    try {
        const fullPath = path.join(VIRTUAL_FS_ROOT, relativePath, folderName);
        await fs.mkdir(fullPath);
        return true;
    } catch (error) {
        console.error(`[Filesystem_v1_createFolder] Error creating folder ${folderName} in ${relativePath}:`, error);
        return false;
    }
};

/**
 * @description Reads and parses a .app file.
 * @param relativePath The path of the .app file.
 * @returns The parsed JSON content of the file, or null if an error occurs.
 */
export const Filesystem_v1_readAppFile = async (relativePath: string): Promise<any | null> => {
    try {
        const fullPath = path.join(VIRTUAL_FS_ROOT, relativePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`[Filesystem_v1_readAppFile] Error reading or parsing app file ${relativePath}:`, error);
        return null;
    }
};

/**
 * @description Creates a new, empty text file in the virtual filesystem.
 * @param relativePath The path where the new file should be created.
 * @param fileName The name of the new file.
 * @returns True if successful, false otherwise.
 */
export const Filesystem_v1_createFile = async (relativePath: string, fileName: string): Promise<boolean> => {
    try {
        const fullPath = path.join(VIRTUAL_FS_ROOT, relativePath, fileName);
        await fs.writeFile(fullPath, '', 'utf-8');
        return true;
    } catch (error) {
        console.error(`[Filesystem_v1_createFile] Error creating file ${fileName} in ${relativePath}:`, error);
        return false;
    }
};

/**
 * @description Deletes a file or folder from the virtual filesystem.
 * @param relativePath The path of the item to delete.
 * @returns True if successful, false otherwise.
 */
export const Filesystem_v1_deleteItem = async (relativePath: string): Promise<boolean> => {
    try {
        const fullPath = path.join(VIRTUAL_FS_ROOT, relativePath);
        await fs.rm(fullPath, { recursive: true, force: true });
        return true;
    } catch (error) {
        console.error(`[Filesystem_v1_deleteItem] Error deleting item ${relativePath}:`, error);
        return false;
    }
};

/**
 * @description Renames a file or folder in the virtual filesystem.
 * @param relativePath The current path of the item.
 * @param newName The new name for the item.
 * @returns True if successful, false otherwise.
 */
export const Filesystem_v1_renameItem = async (relativePath: string, newName: string): Promise<boolean> => {
    try {
        const oldFullPath = path.join(VIRTUAL_FS_ROOT, relativePath);
        const newFullPath = path.join(path.dirname(oldFullPath), newName);
        await fs.rename(oldFullPath, newFullPath);
        return true;
    } catch (error) {
        console.error(`[Filesystem_v1_renameItem] Error renaming item ${relativePath} to ${newName}:`, error);
        return false;
    }
};
