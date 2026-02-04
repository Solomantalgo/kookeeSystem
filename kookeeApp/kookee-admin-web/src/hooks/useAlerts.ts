import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';
import toast from 'react-hot-toast';
import type { Alert } from '../types';

export const useAlerts = () => {
    const [alerts, setAlerts] = useState<Alert[]>([]);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['active-alerts'],
        queryFn: apiService.getActiveAlerts,
        refetchInterval: 60000, // Refetch every minute
    });

    useEffect(() => {
        if (data) {
            setAlerts(data);
        }
    }, [data]);

    // Real-time alert notifications
    useEffect(() => {
        const handleNewAlert = (alert: Alert) => {
            setAlerts((prev) => [alert, ...prev]);

            // Show toast notification
            const toastType = alert.severity === 'high' ? toast.error :
                alert.severity === 'medium' ? toast.error : // Medium is also error
                    toast.success;

            toastType(alert.message, {
                duration: 5000,
                position: 'top-right',
            });
        };

        wsService.on('new-alert', handleNewAlert);

        return () => {
            wsService.off('new-alert', handleNewAlert);
        };
    }, []);

    const resolveAlert = async (alertId: string) => {
        await apiService.resolveAlert(alertId);
        setAlerts((prev) => prev.filter((a) => a.alert_id !== alertId));
        refetch();
    };

    return { alerts, isLoading, resolveAlert, refetch };
};
