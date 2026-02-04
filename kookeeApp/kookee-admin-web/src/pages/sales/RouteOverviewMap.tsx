import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import { Truck, MapPin, ArrowLeft, Info } from 'lucide-react';

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

const createCustomerIcon = (number: number) => new L.DivIcon({
    className: 'custom-customer-icon',
    html: `
        <div style="background-color: #059669; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 900;">
            ${number}
        </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
});

const BoundsFitter = ({ locations }: { locations: any[] }) => {
    const map = useMap();
    useEffect(() => {
        if (locations.length > 0) {
            const valid = locations.filter(l => l.latitude && l.longitude);
            if (valid.length > 0) {
                const bounds = L.latLngBounds(valid.map(l => [parseFloat(l.latitude), parseFloat(l.longitude)]));
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [locations, map]);
    return null;
};

export const RouteOverviewMap = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const routeName = searchParams.get('name') || 'Unnamed Route';
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRouteCustomers = async () => {
            try {
                const response = await axios.get(`${API_URL}/sales/routes/${id}/customers`);
                setCustomers(response.data);
            } catch (error) {
                console.error('Error fetching route customers:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRouteCustomers();
    }, [id]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading route sequence...</div>;

    const positions: [number, number][] = customers.map(c => [parseFloat(c.latitude), parseFloat(c.longitude)]);

    return (
        <div className="space-y-4 h-full flex flex-col p-4 bg-gray-50">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => window.history.back()}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <Truck className="text-indigo-600" size={24} />
                            Route Overview: {routeName}
                        </h1>
                        <p className="text-sm text-gray-500 font-medium">Planned Path & Sequence Visualization</p>
                    </div>
                </div>
                <div className="flex bg-gray-100 px-4 py-2 rounded-xl border border-gray-200 gap-6">
                    <div className="text-center">
                        <div className="text-[10px] font-black text-gray-400 uppercase">Stops</div>
                        <div className="text-lg font-black text-gray-900">{customers.length}</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-200 relative">
                <MapContainer center={positions.length > 0 ? positions[0] : [-1.2921, 36.8219]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; Google Maps'
                        url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                        subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                    />

                    <BoundsFitter locations={customers} />

                    {positions.length > 1 && (
                        <Polyline
                            positions={positions}
                            color="#6366F1"
                            weight={3}
                            dashArray="10, 10"
                            opacity={0.6}
                        />
                    )}

                    {customers.map((customer, idx) => (
                        <Marker
                            key={customer.id}
                            position={[parseFloat(customer.latitude), parseFloat(customer.longitude)]}
                            icon={createCustomerIcon(idx + 1)}
                        >
                            <Popup>
                                <div className="p-1 text-center">
                                    <div className="text-[10px] font-black text-gray-400 uppercase mb-0.5">STOP #{idx + 1}</div>
                                    <div className="font-black text-gray-900">{customer.name}</div>
                                    {idx === 0 && <div className="mt-1 text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-black uppercase">Start Point</div>}
                                    {idx === customers.length - 1 && <div className="mt-1 text-[9px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-black uppercase">End Point</div>}
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {/* Sidebar Sequence List */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur p-4 rounded-2xl shadow-xl z-[1000] border border-gray-100 w-64 max-h-[80%] overflow-y-auto hidden lg:block">
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b pb-2 flex items-center justify-between">
                        <span>Sequence List</span>
                        <Info size={14} className="text-gray-300" />
                    </div>
                    <div className="space-y-2">
                        {customers.map((c, i) => (
                            <div key={c.id} className="flex gap-3 items-center group cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-all">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black flex items-center justify-center border border-emerald-200">
                                    {i + 1}
                                </div>
                                <div className="text-xs font-bold text-gray-700 truncate group-hover:text-indigo-600">
                                    {c.name}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
