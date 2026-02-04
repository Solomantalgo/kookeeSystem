import axios, { InternalAxiosRequestConfig } from 'axios';
import type { LiveLocation, PerformanceMetrics, Visit, Route, Customer, Alert, Merchandiser, MerchandiserStats, Outlet, OutletAssignment, OutletReport } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('admin_token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const apiService = {
    // ===== LOCATIONS =====
    getLiveLocations: async (): Promise<LiveLocation[]> => {
        const response = await api.get('/sales/live-map');
        return response.data;
    },

    // ===== PERFORMANCE =====
    getUserPerformance: async (userId: string, date: string): Promise<PerformanceMetrics> => {
        const response = await api.get(`/analytics/performance/${userId}`, {
            params: { date },
        });
        return response.data;
    },

    getTeamPerformance: async (date: string): Promise<PerformanceMetrics[]> => {
        const response = await api.get('/analytics/team', {
            params: { date },
        });
        return response.data;
    },

    // ===== VISITS =====
    getUserVisits: async (userId: string, date: string): Promise<Visit[]> => {
        const response = await api.get(`/visits/user/${userId}`, {
            params: { date },
        });
        return response.data;
    },

    getDailyVisits: async (date: string): Promise<Visit[]> => {
        const response = await api.get(`/visits/daily/${date}`);
        return response.data;
    },

    // ===== ROUTES =====
    getAllRoutes: async (): Promise<Route[]> => {
        const response = await api.get('/routes');
        return response.data;
    },

    getRoute: async (routeId: string): Promise<Route> => {
        const response = await api.get(`/routes/${routeId}`);
        return response.data;
    },

    updateRoute: async (routeId: string, data: Partial<Route>): Promise<Route> => {
        const response = await api.put(`/routes/${routeId}`, data);
        return response.data;
    },

    createTerritory: async (name: string): Promise<any> => {
        const response = await api.post('/sales/territories', { name });
        return response.data;
    },

    createRoute: async (name: string, territoryId: string | number): Promise<any> => {
        const response = await api.post('/sales/routes', { name, territory_id: territoryId });
        return response.data;
    },

    assignRoute: async (userId: string, routeId: string | number): Promise<any> => {
        const response = await api.post('/sales/assignments', { user_id: userId, route_id: routeId });
        return response.data;
    },

    getSalesAgents: async (): Promise<any[]> => {
        const response = await api.get('/sales/agents');
        return response.data;
    },

    // ===== CUSTOMERS =====
    getRouteCustomers: async (routeId: string): Promise<Customer[]> => {
        const response = await api.get(`/routes/${routeId}/customers`);
        return response.data;
    },

    // ===== ALERTS =====
    getActiveAlerts: async (): Promise<Alert[]> => {
        const response = await api.get('/alerts/active');
        return response.data;
    },

    resolveAlert: async (alertId: string): Promise<void> => {
        await api.post(`/alerts/${alertId}/resolve`);
    },

    // ===== ANALYTICS =====
    getRouteEfficiency: async (date: string): Promise<any> => {
        const response = await api.get('/analytics/routes', {
            params: { date },
        });
        return response.data;
    },

    // ===== MERCHANDISER MODULE =====
    getMerchandisers: async (): Promise<Merchandiser[]> => {
        const response = await api.get('/staff');
        return response.data;
    },

    createMerchandiser: async (data: Partial<Merchandiser>): Promise<Merchandiser> => {
        const response = await api.post('/staff', data);
        return response.data;
    },

    updateMerchandiser: async (id: string, data: Partial<Merchandiser>): Promise<Merchandiser> => {
        const response = await api.put(`/staff/${id}`, data);
        return response.data;
    },

    getMerchandiserStats: async (merchandiserId: string, date: string): Promise<MerchandiserStats> => {
        const response = await api.get(`/merchandisers/${merchandiserId}/stats`, { params: { date } });
        return response.data;
    },

    // New Merchandiser API with filtering
    getMerchandiserReports: async (filters?: {
        date?: string;
        outlet_id?: string;
        merchandiser_id?: string;
    }): Promise<OutletReport[]> => {
        const response = await api.get('/merchandiser/reports', { params: filters });
        return response.data;
    },

    getMerchandiserDashboard: async (date: string) => {
        const response = await api.get('/merchandiser/dashboard', { params: { date } });
        return response.data;
    },

    // ===== OUTLETS =====
    getOutlets: async (): Promise<Outlet[]> => {
        const response = await api.get('/outlets');
        return response.data;
    },

    getOutletHistory: async (outletId: string): Promise<OutletReport[]> => {
        const response = await api.get(`/outlets/${outletId}/history`);
        return response.data;
    },

    // ===== ASSIGNMENTS =====
    getAssignments: async (date: string): Promise<OutletAssignment[]> => {
        const response = await api.get('/assignments', { params: { date } });
        return response.data;
    },

    getMissingAssignments: async (date: string): Promise<any[]> => {
        const response = await api.get('/assignments/missing', { params: { date } });
        return response.data;
    },

    assignOutlets: async (merchandiserId: string, outletIds: string[], date: string, instructions?: Record<string, string>) => {
        const response = await api.post('/assignments', {
            merchandiser_id: merchandiserId,
            outlet_ids: outletIds,
            date,
            instructions
        });
        return response.data;
    },

    // ===== REPORTS (Legacy) =====
    getReports: async (date: string): Promise<OutletReport[]> => {
        const response = await api.get('/reports', { params: { date } });
        return response.data;
    },

    getReport: async (id: string): Promise<OutletReport> => {
        const response = await api.get(`/reports/${id}`);
        return response.data;
    },

    // ===== STOCK MATRIX =====
    getStockMatrix: (outletId: string, startDate: string, endDate: string, merchandiserId?: string) => {
        const params = new URLSearchParams({
            outlet_id: outletId,
            start_date: startDate,
            end_date: endDate,
        });
        if (merchandiserId) {
            params.append('merchandiser_id', merchandiserId);
        }
        return api.get(`/merchandiser/stock-matrix?${params.toString()}`).then(res => res.data);
    },
};
