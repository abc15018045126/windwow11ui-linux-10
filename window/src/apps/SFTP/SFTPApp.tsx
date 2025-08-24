import React, { useState, useEffect, useCallback } from 'react';
import { AppDefinition, AppComponentProps } from '../../types';
import Icon from '../../components/features/Icon';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface SftpFile {
    name: string;
    path: string;
    type: 'file' | 'folder';
    size: number;
    modified: number;
}

const SFTPApp: React.FC<AppComponentProps> = ({ setTitle }) => {
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [host, setHost] = useState('127.0.0.1');
    const [port, setPort] = useState('22');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [statusMessage, setStatusMessage] = useState('Not connected.');
    const [sessionId, setSessionId] = useState<string | null>(null);

    const [currentPath, setCurrentPath] = useState('.');
    const [items, setItems] = useState<SftpFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setTitle(`SFTP - ${status}`);
    }, [setTitle, status]);

    const handleConnect = async () => {
        if (!host || !port || !username) {
            setErrorMsg('Host, Port, and Username are required.');
            return;
        }
        setStatus('connecting');
        setErrorMsg('');
        setStatusMessage(`Connecting to ${host}...`);

        const result = await window.electronAPI.sftp.connect({ host, port, username, password });

        if (result.success && result.sessionId) {
            setStatus('connected');
            setSessionId(result.sessionId);
            setStatusMessage('Connected. Listing home directory...');
            const fetchedItems = await window.electronAPI.sftp.list(result.sessionId, '.');
            setItems(fetchedItems || []);
        } else {
            setStatus('error');
            setErrorMsg(result.error || 'An unknown error occurred.');
            setStatusMessage('Connection failed.');
        }
    };

    const handleDisconnect = async () => {
        if (sessionId) {
            await window.electronAPI.sftp.disconnect(sessionId);
        }
        setStatus('disconnected');
        setSessionId(null);
        setItems([]);
        setStatusMessage('Disconnected.');
    };

    return (
        <div className="flex flex-col h-full bg-zinc-900 text-white select-none">
            <div className="flex-shrink-0 flex items-center space-x-2 text-sm p-2 border-b border-zinc-700">
                <span>Host:</span>
                <input type="text" value={host} onChange={e => setHost(e.target.value)} disabled={status !== 'disconnected'} className="w-32 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 disabled:opacity-50" />
                <span>Port:</span>
                <input type="text" value={port} onChange={e => setPort(e.target.value)} disabled={status !== 'disconnected'} className="w-16 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 disabled:opacity-50" />
                <span>User:</span>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} disabled={status !== 'disconnected'} className="w-24 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 disabled:opacity-50" />
                <span>Pass:</span>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={status !== 'disconnected'} onKeyDown={e => e.key === 'Enter' && handleConnect()} className="flex-grow bg-zinc-800 border border-zinc-700 rounded px-2 py-1 disabled:opacity-50" />
                {status === 'connected' ? (
                    <button onClick={handleDisconnect} className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded">Disconnect</button>
                ) : (
                    <button onClick={handleConnect} disabled={status === 'connecting'} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 rounded">
                        {status === 'connecting' ? 'Connecting...' : 'Connect'}
                    </button>
                )}
            </div>
            {errorMsg && <div className="flex-shrink-0 text-center py-1 bg-red-800/50 text-red-300 text-xs">{errorMsg}</div>}

            {status !== 'connected' ? (
                <div className="flex-grow flex items-center justify-center text-zinc-500"><p>Please connect to a server to begin.</p></div>
            ) : (
                <div className="flex-grow p-4 overflow-y-auto">
                    {isLoading ? <p>Loading...</p> : (
                        <ul>
                            {items.map(item => (
                                <li key={item.name} className="flex items-center p-1 hover:bg-white/10 rounded">
                                    <Icon iconName={item.type === 'folder' ? 'folder' : 'fileGeneric'} className="w-5 h-5 mr-2" />
                                    <span>{item.name}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            <div className="flex-shrink-0 h-8 border-t border-zinc-700 p-2 flex items-center text-xs">
                <p className="font-semibold mr-2">Status:</p>
                <div className="flex-grow text-zinc-400 truncate">{statusMessage}</div>
            </div>
        </div>
    );
};

export const appDefinition: AppDefinition = {
    id: 'sftp',
    name: 'SFTP Client',
    icon: 'sftp',
    component: SFTPApp,
    defaultSize: { width: 950, height: 650 },
};

export default SFTPApp;
