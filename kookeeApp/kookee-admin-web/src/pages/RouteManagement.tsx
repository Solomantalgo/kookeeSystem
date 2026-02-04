import React, { useState } from 'react';
import { Route, Customer } from '../types';
import {
    Plus,
    MapPin,
    User,
    Calendar,
    Search,
    MoreVertical,
    Edit3,
    Trash2,
    Users
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const RouteManagement: React.FC = () => {
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Mock data for initial development (replace with apiService.getAllRoutes() when backend ready)
    const mockRoutes: Route[] = [
        {
            route_id: 'r1',
            name: 'Downtown Core',
            created_by: 'Admin',
            customer_order: ['c1', 'c2', 'c3'],
            created_at: '2024-01-15T10:00:00Z'
        },
        {
            route_id: 'r2',
            name: 'North Industrial',
            created_by: 'Admin',
            customer_order: ['c4', 'c5'],
            created_at: '2024-01-16T09:30:00Z'
        },
        {
            route_id: 'r3',
            name: 'East Retail Park',
            created_by: 'Manager',
            customer_order: ['c6', 'c7', 'c8', 'c9'],
            created_at: '2024-01-18T14:15:00Z'
        }
    ];

    const mockCustomers: Record<string, Customer> = {
        'c1': { customer_id: 'c1', name: 'Joe\'s Market', area: 'Downtown', gps_lat: 51.505, gps_lng: -0.09, photo_uri: '', location_notes: '', visit_notes: '', active: true },
        'c2': { customer_id: 'c2', name: 'Main St Grocer', area: 'Downtown', gps_lat: 51.506, gps_lng: -0.092, photo_uri: '', location_notes: '', visit_notes: '', active: true },
        'c3': { customer_id: 'c3', name: 'Corner Bodega', area: 'Downtown', gps_lat: 51.507, gps_lng: -0.089, photo_uri: '', location_notes: '', visit_notes: '', active: true },
        'c4': { customer_id: 'c4', name: 'Indus Supply', area: 'North', gps_lat: 51.515, gps_lng: -0.1, photo_uri: '', location_notes: '', visit_notes: '', active: true },
        'c5': { customer_id: 'c5', name: 'Factory Outlet', area: 'North', gps_lat: 51.516, gps_lng: -0.098, photo_uri: '', location_notes: '', visit_notes: '', active: true },
        // Add more mocks as needed
    };

    // Use React Query for fetching (commented out for now to interpret mock data)
    /*
    const { data: routes, isLoading: isLoadingRoutes } = useQuery({
        queryKey: ['routes'],
        queryFn: apiService.getAllRoutes,
    });
    */
    const routes = mockRoutes; // Using mock data

    const filteredRoutes = routes.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.route_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedRoute = routes.find(r => r.route_id === selectedRouteId);
    const selectedRouteCustomers = selectedRoute?.customer_order.map(cid => mockCustomers[cid]).filter(Boolean) || [];

    // Map Center calculation
    const mapCenter = selectedRouteCustomers.length > 0
        ? [selectedRouteCustomers[0].gps_lat, selectedRouteCustomers[0].gps_lng] as [number, number]
        : [51.505, -0.09] as [number, number];


    return (
        <div className="flex h-full bg-gray-50 overflow-hidden">
            {/* Left Sidebar: Route List */}
            <div className="w-96 bg-white border-r border-gray-200 flex flex-col z-10 shadow-sm">
                <div className="p-6 border-b border-gray-100 bg-white">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Routes</h2>
                        <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search routes..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredRoutes.map(route => (
                        <div
                            key={route.route_id}
                            onClick={() => setSelectedRouteId(route.route_id)}
                            className={`p-4 rounded-xl cursor-pointer border transition-all duration-200 ${selectedRouteId === route.route_id
                                ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-500/20'
                                : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-semibold ${selectedRouteId === route.route_id ? 'text-blue-700' : 'text-gray-800'}`}>
                                    {route.name}
                                </h3>
                                <span className="text-xs text-gray-400 font-mono">#{route.route_id}</span>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                <div className="flex items-center gap-1">
                                    <Users size={14} />
                                    <span>{route.customer_order.length} Stops</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <User size={14} />
                                    <span>{route.created_by}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1">
                                {route.customer_order.slice(0, 3).map((cid, idx) => (
                                    <span key={idx} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-md border border-gray-200">
                                        {mockCustomers[cid]?.name || cid}
                                    </span>
                                ))}
                                {route.customer_order.length > 3 && (
                                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-md border border-gray-200">
                                        +{route.customer_order.length - 3}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}

                    {filteredRoutes.length === 0 && (
                        <div className="text-center py-10 text-gray-400">
                            <MapPin size={40} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No routes found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-gray-50 h-full overflow-hidden relative">
                {selectedRoute ? (
                    <>
                        {/* Map Background (Full Height) */}
                        <div className="absolute inset-0 z-0 h-full w-full">
                            <MapContainer
                                key={selectedRouteId} // Force re-render on route change
                                center={mapCenter}
                                zoom={14}
                                style={{ height: '100%', width: '100%' }}
                                zoomControl={false}
                            >
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                />
                                {selectedRouteCustomers.map((cust, idx) => (
                                    <Marker
                                        key={cust.customer_id}
                                        position={[cust.gps_lat, cust.gps_lng]}
                                    >
                                        <Popup>
                                            <div className="p-1">
                                                <h4 className="font-bold text-sm">{idx + 1}. {cust.name}</h4>
                                                <p className="text-xs text-gray-500">{cust.area}</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}

                                {selectedRouteCustomers.length > 1 && (
                                    <Polyline
                                        positions={selectedRouteCustomers.map(c => [c.gps_lat, c.gps_lng])}
                                        pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.7, dashArray: '10, 10' }}
                                    />
                                )}
                            </MapContainer>
                        </div>

                        {/* Route Details overlay */}
                        <div className="absolute top-6 left-6 z-10 w-80 bg-white/95 backdrop-blur-sm shadow-xl rounded-xl border border-gray-200 overflow-hidden max-h-[calc(100vh-3rem)] flex flex-col">
                            <div className="p-4 border-b border-gray-100 bg-white">
                                <div className="flex justify-between items-start mb-1">
                                    <h1 className="text-xl font-bold text-gray-900">{selectedRoute.name}</h1>
                                    <div className="flex gap-1">
                                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <Edit3 size={16} />
                                        </button>
                                        <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Calendar size={14} />
                                    <span>Created {new Date(selectedRoute.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-0">
                                <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between items-center">
                                    <span>Route Sequence</span>
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px]">
                                        {selectedRouteCustomers.length} Stops
                                    </span>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {selectedRouteCustomers.map((cust, idx) => (
                                        <div key={cust.customer_id} className="p-3 hover:bg-gray-50 transition-colors flex gap-3 group">
                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-200 mt-0.5">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 truncate">{cust.name}</h4>
                                                <p className="text-xs text-gray-500 truncate">{cust.area}</p>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreVertical size={14} className="text-gray-400" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 border-t border-gray-100 bg-gray-50">
                                <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm">
                                    Assign to Salesperson
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 flex-col gap-4">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                            <RouteIcon size={40} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-500">Select a route to view details</h3>
                    </div>
                )}
            </div>
        </div>
    );
};

// Simple icon for empty state since I can't reuse the lucide import name easily in the JSX
const RouteIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="6" cy="19" r="3" />
        <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
        <circle cx="18" cy="5" r="3" />
    </svg>
);

export default RouteManagement;
