import { SFTPWrapper } from 'ssh2';

export interface SftpFile {
    name: string;
    path: string;
    type: 'file' | 'folder';
    size: number;
    modified: number;
}

/**
 * @description Lists a directory on a remote SFTP server.
 * @param sftp The active sftp session object.
 * @param remotePath The path on the remote server to list.
 * @returns An array of file objects, or null on error.
 */
export const SFTP_v1_listDirectory = (sftp: SFTPWrapper, remotePath: string): Promise<SftpFile[] | null> => {
    return new Promise((resolve) => {
        sftp.readdir(remotePath, (err: any, list: any) => {
            if (err) {
                console.error(`[SFTP_v1_listDirectory] Error:`, err);
                resolve(null);
                return;
            }
            const items = list.map((item: any) => ({
                name: item.filename,
                path: remotePath === '/' ? `/${item.filename}` : `${remotePath}/${item.filename}`,
                type: item.longname.startsWith('d') ? 'folder' : 'file',
                size: item.attrs.size,
                modified: item.attrs.mtime,
            }));
            resolve(items);
        });
    });
};

/**
 * @description Downloads the content of a remote file.
 * @param sftp The active sftp session object.
 * @param remotePath The path of the file to download.
 * @returns The file content as a string, or null on error.
 */
export const SFTP_v1_downloadFile = (sftp: SFTPWrapper, remotePath: string): Promise<string | null> => {
    return new Promise((resolve) => {
        const stream = sftp.createReadStream(remotePath);
        const chunks: Buffer[] = [];
        stream.on('data', (chunk: any) => chunks.push(chunk as Buffer));
        stream.on('error', (err: any) => {
            console.error(`[SFTP_v1_downloadFile] Error:`, err);
            resolve(null);
        });
        stream.on('end', () => {
            resolve(Buffer.concat(chunks).toString('utf8'));
        });
    });
};
