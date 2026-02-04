import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import { Navigation, MapPin } from 'lucide-react';

// Fix Leaflet Default Icon Issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const createAgentIcon = (color: string) => new L.DivIcon({
    className: 'agent-icon',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const ZoomButton = ({ lat, lng, agentId, focusedId, onFocus }: { lat: number, lng: number, agentId: string, focusedId: string | null, onFocus: (id: string | null) => void }) => {
    const map = useMap();
    const isFocused = focusedId === agentId;

    return (
        <button
            onClick={() => {
                if (isFocused) {
                    onFocus(null);
                } else {
                    onFocus(agentId);
                    map.setView([lat, lng], 18, { animate: true });
                }
            }}
            className={`w-full mt-3 py-2 px-3 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg ${isFocused
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-900/20'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/20'
                }`}
        >
            <Navigation size={12} className={isFocused ? '' : 'rotate-45'} />
            {isFocused ? 'Release Focus' : 'Focus & Zoom'}
        </button>
    );
};

const BoundsFitter = ({ locations, focusedId }: { locations: any[], focusedId: string | null }) => {
    const map = useMap();
    useEffect(() => {
        // ONLY fit bounds if no agent is currently focused
        if (focusedId) return;

        if (locations.length > 0) {
            const valid = locations.filter(l => l.latitude && l.longitude);
            if (valid.length > 0) {
                const bounds = L.latLngBounds(valid.map(l => [parseFloat(l.latitude), parseFloat(l.longitude)]));
                map.fitBounds(bounds, { padding: [100, 100], maxZoom: 15 });
            }
        }
    }, [locations, map, focusedId]);
    return null;
};

const AutoFollower = ({ locations, focusedId }: { locations: any[], focusedId: string | null }) => {
    const map = useMap();
    useEffect(() => {
        if (!focusedId) return;
        const agent = locations.find(a => a.user_id === focusedId);
        if (agent) {
            const lat = parseFloat(agent.latitude);
            const lng = parseFloat(agent.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
                map.panTo([lat, lng], { animate: true });
            }
        }
    }, [locations, focusedId, map]);
    return null;
};

export const LiveTrackingMap = () => {
    const [agents, setAgents] = useState<any[]>([]);
    const [focusedAgentId, setFocusedAgentId] = useState<string | null>(null);

    const fetchAgents = async () => {
        try {
            const response = await axios.get(`${API_URL}/sales/live-map`);
            setAgents(response.data);
        } catch (error) {
            console.error('Error fetching live agents:', error);
        }
    };

    useEffect(() => {
        fetchAgents();
        const interval = setInterval(fetchAgents, 10000);
        return () => clearInterval(interval);
    }, []);

    const getStatusInfo = (timestamp: string) => {
        const diff = (new Date().getTime() - new Date(timestamp).getTime()) / 1000;
        if (diff < 60) return { label: 'LIVE', color: '#10B981', bg: '#D1FAE5' };
        if (diff < 180) return { label: 'STALE', color: '#F59E0B', bg: '#FEF3C7' };
        return { label: 'OFFLINE', color: '#EF4444', bg: '#FEE2E2' };
    };

    return (
        <div className="space-y-4 h-full flex flex-col p-4 bg-gray-50">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <Navigation className="text-blue-600 rotate-45" size={24} />
                        Live Agent Tracking
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">Real-time GPS Monitoring (No Routing/Interpolation)</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider">System Active</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-200 relative">
                {focusedAgentId && (
                    <button
                        onClick={() => setFocusedAgentId(null)}
                        className="absolute top-4 left-4 z-[1000] bg-white px-4 py-2 rounded-xl shadow-2xl border-2 border-blue-500 font-black text-xs text-blue-600 flex items-center gap-2 hover:bg-blue-50 transition-colors"
                    >
                        <MapPin size={14} />
                        BACK TO GLOBAL VIEW
                    </button>
                )}

                <MapContainer center={[-1.2921, 36.8219]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; Google Maps'
                        url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                        subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                    />

                    <BoundsFitter locations={agents} focusedId={focusedAgentId} />
                    <AutoFollower locations={agents} focusedId={focusedAgentId} />

                    {agents.map(agent => {
                        const status = getStatusInfo(agent.timestamp);
                        const lat = parseFloat(agent.latitude);
                        const lng = parseFloat(agent.longitude);

                        if (isNaN(lat) || isNaN(lng)) return null;

                        return (
                            <Marker
                                key={agent.user_id}
                                position={[lat, lng]}
                                icon={createAgentIcon(status.label === 'LIVE' ? '#3B82F6' : (status.label === 'STALE' ? '#F59E0B' : '#6B7280'))}
                            >
                                <Popup className="custom-popup">
                                    <div className="p-2 min-w-[180px]">
                                        <div className="font-black text-gray-900 border-b pb-2 mb-2 flex justify-between items-center">
                                            <span>{agent.name}</span>
                                            <span style={{ backgroundColor: status.bg, color: status.color }} className="text-[9px] px-1.5 py-0.5 rounded font-black tracking-tighter">
                                                {status.label}
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
                                                <span>Employee ID</span>
                                                <span className="text-gray-900">{agent.employee_id}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
                                                <span>Last Seen</span>
                                                <span className="text-gray-900">{new Date(agent.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
                                                <span>Activity</span>
                                                <span className="text-gray-900 capitalize">{agent.status || 'traveling'}</span>
                                            </div>
                                        </div>
                                        <ZoomButton
                                            lat={lat}
                                            lng={lng}
                                            agentId={agent.user_id}
                                            focusedId={focusedAgentId}
                                            onFocus={setFocusedAgentId}
                                        />
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>

                {/* Status Legend */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg z-[1000] border border-gray-100 flex flex-col gap-2">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status Legend</div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-xs font-bold text-gray-700">LIVE (&lt;1m)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-xs font-bold text-gray-700">STALE (1-3m)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-xs font-bold text-gray-700">OFFLINE (&gt;3m)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
