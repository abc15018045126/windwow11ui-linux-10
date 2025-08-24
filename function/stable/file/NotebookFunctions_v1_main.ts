import { promises as fs } from 'fs';
import path from 'path';

/**
 * @description Reads the content of a file. This function is self-contained and stable.
 * @param filePath The absolute path to the file.
 * @returns An object containing the file content, name, and path, or null if an error occurs.
 */
export const Notebook_v1_readFile = async (
  filePath: string
): Promise<{ content: string; name:string; path: string } | null> => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const name = path.basename(filePath);
    return { content, name, path: filePath };
  } catch (error) {
    console.error(`[Notebook_v1_readFile] Error reading file at ${filePath}:`, error);
    return null;
  }
};

/**
 * @description Saves content to a file. This function is self-contained and stable.
 * @param filePath The absolute path to the file.
 * @param content The content to save.
 * @returns True if the file was saved successfully, false otherwise.
 */
export const Notebook_v1_saveFile = async (
  filePath: string,
  content: string
): Promise<boolean> => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`[Notebook_v1_saveFile] Error saving file to ${filePath}:`, error);
    return false;
  }
};
