import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';
import type { LiveLocation } from '../types';

export const useLiveLocations = () => {
    const [locations, setLocations] = useState<LiveLocation[]>([]);

    // Initial fetch
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['live-locations'],
        queryFn: apiService.getLiveLocations,
        refetchInterval: 10000, // Refetch every 10 seconds for real-time parity
    });

    useEffect(() => {
        if (data) {
            setLocations(data);
        }
    }, [data]);

    // Real-time updates via WebSocket
    useEffect(() => {
        const handleLocationUpdate = (updatedLocation: LiveLocation) => {
            setLocations((prev) => {
                const index = prev.findIndex((l) => l.user_id === updatedLocation.user_id);
                if (index >= 0) {
                    const newLocations = [...prev];
                    newLocations[index] = updatedLocation;
                    return newLocations;
                } else {
                    return [...prev, updatedLocation];
                }
            });
        };

        wsService.on('location-update', handleLocationUpdate);

        return () => {
            wsService.off('location-update', handleLocationUpdate);
        };
    }, []);

    return { locations, isLoading, error, refetch };
};
