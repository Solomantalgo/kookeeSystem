import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import { Navigation, MapPin, Clock, ArrowLeft } from 'lucide-react';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

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

const Routing = ({ origin, destination }: { origin: [number, number], destination: [number, number] }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !origin || !destination) return;

        // Ensure coordinates are not dummy / zero
        if (origin[0] === 0 || destination[0] === 0) return;

        console.log(`🗺️ Calculating route from ${origin} to ${destination}`);

        // @ts-ignore
        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(origin[0], origin[1]),
                L.latLng(destination[0], destination[1])
            ],
            lineOptions: {
                styles: [{ color: '#3B82F6', weight: 6, opacity: 0.8 }],
                extendToWaypoints: true,
                missingRouteTolerance: 10
            },
            // @ts-ignore
            createMarker: () => null,
            addWaypoints: false,
            routeWhileDragging: false,
            fitSelectedRoutes: true,
            showAlternatives: false,
            draggableWaypoints: false,
            collapsible: true,
            // @ts-ignore
            show: false, // Hide the instructions panel
        }).addTo(map);

        return () => {
            try {
                map.removeControl(routingControl);
            } catch (e) { }
        };
    }, [map, origin, destination]);

    return null;
};

export const CustomerNavigationMap = () => {
    const { id } = useParams();
    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Dynamic origin for Admin (starting with Nairobi default)
    const [adminOrigin, setAdminOrigin] = useState<[number, number]>([-1.286389, 36.817223]);

    useEffect(() => {
        // Attempt to get browser geolocation for precise directions
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log(`📍 Admin location detected: ${latitude}, ${longitude}`);
                    setAdminOrigin([latitude, longitude]);
                },
                (error) => {
                    console.warn('⚠️ Geolocation access denied or failed. Using default origin.', error.message);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        }

        const fetchCustomer = async () => {
            try {
                const response = await axios.get(`${API_URL}/sales/customers/${id}`);
                setCustomer(response.data);
            } catch (error) {
                console.error('Error fetching customer for nav:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomer();
    }, [id]);

    if (loading) return <div className="p-8 text-center text-gray-500">Retrieving customer coordinates...</div>;
    if (!customer) return <div className="p-8 text-center text-red-500 font-bold">Customer data not found</div>;

    const dest: [number, number] = [parseFloat(customer.latitude), parseFloat(customer.longitude)];

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
                            <MapPin className="text-emerald-600" size={24} />
                            Navigating to: {customer.name}
                        </h1>
                        <p className="text-sm text-gray-500 font-medium">{customer.area || 'Active Outlet'}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${dest[0]},${dest[1]}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                        Open in Google Maps
                    </a>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-200 relative">
                <MapContainer center={dest} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; Google Maps'
                        url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                        subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                    />

                    <Routing origin={adminOrigin} destination={dest} />

                    <Marker position={dest}>
                        <Popup>
                            <div className="p-1">
                                <div className="font-black text-gray-900 text-sm border-b pb-1 mb-1">{customer.name}</div>
                                <div className="text-[10px] text-gray-500 font-bold uppercase">{customer.area}</div>
                            </div>
                        </Popup>
                    </Marker>
                </MapContainer>

                {/* Info Panel */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur p-4 rounded-2xl shadow-2xl z-[1000] border border-gray-100 w-72">
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 border-b pb-2">Destination Details</div>
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <MapPin size={16} />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Address / Notes</div>
                                <div className="text-sm font-bold text-gray-900 leading-tight">
                                    {customer.location_notes || 'No specific address provided'}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Clock size={16} />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Verification</div>
                                <div className="text-sm font-bold text-gray-900">
                                    GPS Records Stable
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
