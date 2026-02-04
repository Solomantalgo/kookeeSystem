import { io, Socket } from 'socket.io-client';
import type { LiveLocation, Alert } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

class WebSocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Set<Function>> = new Map();

    connect() {
        if (this.socket?.connected) return;

        this.socket = io(WS_URL, {
            auth: {
                token: localStorage.getItem('admin_token'),
            },
        });

        this.socket.on('connect', () => {
            console.log('[WebSocket] Connected');
        });

        this.socket.on('disconnect', () => {
            console.log('[WebSocket] Disconnected');
        });

        // Listen for location updates
        this.socket.on('location-update', (location: LiveLocation) => {
            this.emit('location-update', location);
        });

        // Listen for new alerts
        this.socket.on('new-alert', (alert: Alert) => {
            this.emit('new-alert', alert);
        });

        // Listen for visit completions
        this.socket.on('visit-completed', (visit: any) => {
            this.emit('visit-completed', visit);
        });
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }

    on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);
    }

    off(event: string, callback: Function) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.delete(callback);
        }
    }

    private emit(event: string, data: any) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach((callback) => callback(data));
        }
    }
}

export const wsService = new WebSocketService();
