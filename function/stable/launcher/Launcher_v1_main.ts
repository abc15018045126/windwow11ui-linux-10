import { spawn } from 'child_process';
import path from 'path';

/**
 * @description Launches an external, standalone Electron application.
 * @param relativeAppPath The path to the external app's directory, relative to the project root.
 * @returns True if the app was spawned successfully, false otherwise.
 */
export const Launcher_v1_launchExternal = (relativeAppPath: string): boolean => {
    try {
        const appDir = path.join(process.cwd(), relativeAppPath);
        const appName = path.basename(appDir);
        const spawnArgs = [appDir];

        console.log(`[Launcher_v1] Spawning: ${process.execPath} ${spawnArgs.join(' ')}`);

        const child = spawn(process.execPath, spawnArgs, {
            stdio: 'pipe',
            env: { ...process.env },
            detached: true, // Detach the child process
        });

        child.stdout.on('data', (data) => {
            console.log(`[${appName}] stdout: ${data.toString()}`);
        });

        child.stderr.on('data', (data) => {
            console.error(`[${appName}] stderr: ${data.toString()}`);
        });

        child.on('error', (err) => {
            console.error(`[Launcher_v1] Failed to start subprocess for ${appName}. Error: ${err.message}`);
        });

        child.unref(); // Allows the parent process to exit independently of the child

        return true;
    } catch (error) {
        console.error(`[Launcher_v1] Error launching external app for path ${relativeAppPath}:`, error);
        return false;
    }
};
