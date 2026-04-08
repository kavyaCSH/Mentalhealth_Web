import { io, Socket } from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_BASE_DOMAIN || 'http://localhost:5000/api/v1';
const SOCKET_URL = import.meta.env.VITE_API_URL || BASE_URL.replace('/api/v1', '').replace(/\/$/, '');

class SocketService {
    private socket: Socket | null = null;
    private static instance: SocketService;

    private constructor() {}

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public async connect(): Promise<Socket> {
        return new Promise((resolve, reject) => {
            if (this.socket?.connected) {
                resolve(this.socket);
                return;
            }

            const token = localStorage.getItem('token');

            if (!token) {
                reject(new Error('No auth token available for socket connection'));
                return;
            }

            const apiKey = import.meta.env.VITE_API_TOKEN || '';
            this.socket = io(SOCKET_URL, {
                auth: { token, 'x-api-key': apiKey },
                transports: ['polling', 'websocket'],
                path: '/socket.io/',
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5,
            });

            this.socket.on('connect', () => {
                console.log('[SocketService] Connected:', this.socket?.id);
                resolve(this.socket!);
            });

            this.socket.on('connect_error', (error) => {
                console.error('[SocketService] Connection Error:', error);
                
                // Allow fallback to polling if websocket fails
                if (this.socket) {
                    this.socket.io.opts.transports = ['polling', 'websocket'];
                }
                
                // Don't reject immediately to allow reconnection attempts
                // But log the error
            });

            this.socket.on('disconnect', (reason) => {
                console.log('[SocketService] Disconnected:', reason);
            });
            
            // Timeout if connection takes too long
            setTimeout(() => {
                if (!this.socket?.connected) {
                    reject(new Error('Socket connection timeout'));
                }
            }, 5000);
        });
    }

    public getSocket(): Socket | null {
        return this.socket;
    }

    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = SocketService.getInstance();
export const connectSocket = () => socketService.connect();
export const getSocket = () => socketService.getSocket();
export const disconnectSocket = () => socketService.disconnect();
