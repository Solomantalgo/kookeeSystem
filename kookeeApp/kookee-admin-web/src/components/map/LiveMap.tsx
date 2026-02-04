import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useLiveLocations } from '../../hooks/useLiveLocations';
import type { LiveLocation } from '../../types';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons based on status
const getMarkerIcon = (status: LiveLocation['status']) => {
    const colors = {
        in_visit: '#22c55e', // green
        traveling: '#3b82f6', // blue
        idle: '#f59e0b', // orange
    };

    return L.divIcon({
        className: 'custom-marker',
        html: `
      <div style="
        width: 30px;
        height: 30px;
        background: ${colors[status]};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      "></div>
    `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    });
};

export const LiveMap: React.FC = () => {
    const { locations, isLoading } = useLiveLocations();
    const [selectedRep, setSelectedRep] = useState<string | null>(null);

    if (isLoading) {
        return <div className="flex items-center justify-center h-[calc(100vh-64px)]">Loading map...</div>;
    }

    return (
        <div className="relative h-[calc(100vh-64px)] w-full">
            <MapContainer
                center={[0.3476, 32.5825]} // Kampala
                zoom={12}
                className="h-full w-full z-0"
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {locations.map((rep) => (
                    <Marker
                        key={rep.user_id}
                        position={[rep.latitude, rep.longitude]}
                        icon={getMarkerIcon(rep.status)}
                        eventHandlers={{
                            click: () => setSelectedRep(rep.user_id),
                        }}
                    >
                        <Popup>
                            <div className="p-2 min-w-[200px]">
                                <h3 className="font-bold text-lg">{rep.name}</h3>
                                <div className="mt-2 space-y-1 text-sm">
                                    <p>
                                        <span className="font-semibold">Status:</span>{' '}
                                        <span className={`px-2 py-0.5 rounded text-white ${rep.status === 'in_visit' ? 'bg-green-500' :
                                                rep.status === 'traveling' ? 'bg-blue-500' :
                                                    'bg-orange-500'
                                            }`}>
                                            {rep.status.replace('_', ' ')}
                                        </span>
                                    </p>
                                    {rep.current_customer_name && (
                                        <p>
                                            <span className="font-semibold">Current Customer:</span> {rep.current_customer_name}
                                        </p>
                                    )}
                                    <p>
                                        <span className="font-semibold">Last Update:</span>{' '}
                                        {new Date(rep.timestamp).toLocaleTimeString()}
                                    </p>
                                </div>
                                <button
                                    className="mt-3 w-full bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700"
                                    onClick={() => window.location.href = `/performance?user=${rep.user_id}`}
                                >
                                    View Details
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Sidebar with salesperson list */}
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg w-80 max-h-[80vh] overflow-y-auto z-[1000]">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Active Salespeople ({locations.length})</h2>
                </div>
                <div className="divide-y">
                    {locations.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No active salespeople</div>
                    ) : (
                        locations.map((rep) => (
                            <div
                                key={rep.user_id}
                                className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedRep === rep.user_id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                    }`}
                                onClick={() => setSelectedRep(rep.user_id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{rep.name}</h3>
                                        <p className="text-xs text-gray-500">{rep.employee_id}</p>
                                    </div>
                                    <div
                                        className={`w-3 h-3 rounded-full ${rep.status === 'in_visit' ? 'bg-green-500' :
                                                rep.status === 'traveling' ? 'bg-blue-500' :
                                                    'bg-orange-500'
                                            }`}
                                    />
                                </div>
                                {rep.current_customer_name && (
                                    <p className="text-sm text-gray-600 mt-1">📍 {rep.current_customer_name}</p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
