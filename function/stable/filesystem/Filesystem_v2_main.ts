import { promises as fs } from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();

/**
 * Validates if a given path is within the project's root directory.
 * This is a security measure to prevent path traversal attacks.
 * @param relativePath The path to validate.
 * @returns The resolved, absolute path if it's safe, or null otherwise.
 */
const resolveSafePath = (relativePath: string): string | null => {
    const fullPath = path.resolve(PROJECT_ROOT, relativePath);
    if (!fullPath.startsWith(PROJECT_ROOT)) {
        console.error(`[Security] Path traversal attempt blocked: ${relativePath}`);
        return null;
    }
    return fullPath;
};


export interface FilesystemItem {
    name: string;
    path: string;
    type: 'file' | 'folder';
}

/**
 * @description Lists the contents of a directory in the project filesystem.
 * @param relativePath The path relative to the project root (e.g., "/apps").
 * @returns An array of filesystem items, or null if the path is invalid or does not exist.
 */
export const Filesystem_v2_getItemsInPath = async (relativePath: string): Promise<FilesystemItem[] | null> => {
    const fullPath = resolveSafePath(relativePath);
    if (!fullPath) return null;

    try {
        const items = await fs.readdir(fullPath, { withFileTypes: true });
        return items.map(item => ({
            name: item.name,
            path: path.join(relativePath, item.name),
            type: item.isDirectory() ? 'folder' : 'file',
        }));
    } catch (error) {
        console.error(`[Filesystem_v2_getItemsInPath] Error listing path ${relativePath}:`, error);
        return null;
    }
};

/**
 * @description Creates a new folder in the project filesystem.
 * @param relativePath The path where the new folder should be created.
 * @param folderName The name of the new folder.
 * @returns True if successful, false otherwise.
 */
export const Filesystem_v2_createFolder = async (relativePath: string, folderName: string): Promise<boolean> => {
    const fullPath = resolveSafePath(path.join(relativePath, folderName));
    if (!fullPath) return false;

    try {
        await fs.mkdir(fullPath);
        return true;
    } catch (error) {
        console.error(`[Filesystem_v2_createFolder] Error creating folder ${folderName} in ${relativePath}:`, error);
        return false;
    }
};

/**
 * @description Reads and parses a .app file from the filesystem.
 * @param relativePath The path of the .app file.
 * @returns The parsed JSON content of the file, or null if an error occurs.
 */
export const Filesystem_v2_readAppFile = async (relativePath: string): Promise<any | null> => {
    const fullPath = resolveSafePath(relativePath);
    if (!fullPath) return null;

    try {
        const content = await fs.readFile(fullPath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`[Filesystem_v2_readAppFile] Error reading or parsing app file ${relativePath}:`, error);
        return null;
    }
};

/**
 * @description Creates a new, empty text file in the project filesystem.
 * @param relativePath The path where the new file should be created.
 * @param fileName The name of the new file.
 * @returns True if successful, false otherwise.
 */
export const Filesystem_v2_createFile = async (relativePath: string, fileName: string): Promise<boolean> => {
    const fullPath = resolveSafePath(path.join(relativePath, fileName));
    if (!fullPath) return false;

    try {
        await fs.writeFile(fullPath, '', 'utf-8');
        return true;
    } catch (error) {
        console.error(`[Filesystem_v2_createFile] Error creating file ${fileName} in ${relativePath}:`, error);
        return false;
    }
};

/**
 * @description Deletes a file or folder from the project filesystem.
 * @param relativePath The path of the item to delete.
 * @returns True if successful, false otherwise.
 */
export const Filesystem_v2_deleteItem = async (relativePath: string): Promise<boolean> => {
    const fullPath = resolveSafePath(relativePath);
    if (!fullPath) return false;

    try {
        await fs.rm(fullPath, { recursive: true, force: true });
        return true;
    } catch (error) {
        console.error(`[Filesystem_v2_deleteItem] Error deleting item ${relativePath}:`, error);
        return false;
    }
};

/**
 * @description Renames a file or folder in the project filesystem.
 * @param relativePath The current path of the item.
 * @param newName The new name for the item.
 * @returns True if successful, false otherwise.
 */
export const Filesystem_v2_renameItem = async (relativePath: string, newName: string): Promise<boolean> => {
    const oldFullPath = resolveSafePath(relativePath);
    if (!oldFullPath) return false;

    const newFullPath = path.join(path.dirname(oldFullPath), newName);
    if (!newFullPath.startsWith(PROJECT_ROOT)) {
        console.error(`[Security] Path traversal attempt blocked during rename: ${newName}`);
        return false;
    }

    try {
        await fs.rename(oldFullPath, newFullPath);
        return true;
    } catch (error) {
        console.error(`[Filesystem_v2_renameItem] Error renaming item ${relativePath} to ${newName}:`, error);
        return false;
    }
};
