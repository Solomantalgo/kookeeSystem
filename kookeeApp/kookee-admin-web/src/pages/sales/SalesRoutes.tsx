import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, MapPin, Truck, Map as MapIcon, User, Plus, UserPlus, Eye, X, Pencil } from 'lucide-react';
import { apiService } from '../../services/api';
import axios from 'axios';

// Interfaces
interface SalesCustomer {
    id: string | number;
    name: string;
    sequence: number;
    type: 'customer';
}

interface SalesRoute {
    id: string | number;
    name: string;
    description?: string;
    assigned_to?: string;
    assigned_user_id?: string | number;
    children: SalesCustomer[];
    type: 'route';
    territory_id?: string | number;
}

interface SalesTerritory {
    id: string | number;
    name: string;
    assigned_user_id?: string | number;
    children: SalesRoute[];
    type: 'territory';
}

export const SalesRoutes = () => {
    const navigate = useNavigate();
    const [treeData, setTreeData] = useState<SalesTerritory[]>([]);
    const [salesAgents, setSalesAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [showEditRouteModal, setShowEditRouteModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);

    // Selection States
    const [selectedRoute, setSelectedRoute] = useState<SalesRoute | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

    // Form Data
    const [newItemName, setNewItemName] = useState('');
    const [editItemName, setEditItemName] = useState('');
    // Filter Data
    const [filterAgentId, setFilterAgentId] = useState('');


    const [assignAgentId, setAssignAgentId] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch Tree (Using raw axios for now as apiService might wrap differently or use types I need to match)
            // But let's verify if apiService has it. Step 960 didn't show getTree.
            // Using existing endpoint logic
            // Fetch Tree (Using relative path to respect API_URL config)
            const routesRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/sales/routes/tree`);
            setTreeData(routesRes.data);

            const agents = await apiService.getSalesAgents();
            setSalesAgents(agents);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoute = async () => {
        if (!newItemName) return;
        try {
            // Ensure there's a territory to link to. 
            // The treeData currently contains Routes (flat list), but we need a Territory ID.
            // If the backend /routes/tree returns routes with territory_id, we can find one.
            // Or better: check salesAgents/territories if we had them.
            // For now, let's look for any route with a territory_id or create a default.

            let targetTerritoryId = 1; // Default
            if (treeData && treeData.length > 0) {
                const firstWithTerritory = treeData.find(r => r.territory_id);
                if (firstWithTerritory) targetTerritoryId = firstWithTerritory.territory_id as number;
            }

            // Create actual route
            await apiService.createRoute(newItemName, targetTerritoryId);
            setShowRouteModal(false);
            setNewItemName('');
            fetchData();
        } catch (e) {
            alert('Failed to create route');
        }
    };

    const handleUpdateRoute = async () => {
        if (!selectedRoute || !editItemName) return;
        try {
            await axios.put(`http://localhost:3000/api/sales/routes/${selectedRoute.id}`, { name: editItemName });
            setShowEditRouteModal(false);
            setEditItemName('');
            fetchData();
        } catch (e) {
            alert('Failed to update route');
        }
    };

    const handleAssignRoute = async () => {
        if (!selectedRoute || !assignAgentId) return;
        try {
            await apiService.assignRoute(assignAgentId, selectedRoute.id);
            setShowAssignModal(false);
            setAssignAgentId('');
            fetchData();
            alert('Agent assigned successfully!');
        } catch (e: any) {
            alert(e.response?.data?.message || 'Failed to assign route');
        }
    };

    const openAssignModal = (route: SalesRoute) => {
        setSelectedRoute(route);
        setAssignAgentId('');
        setShowAssignModal(true);
    };

    const openEditRouteModal = (route: SalesRoute) => {
        setSelectedRoute(route);
        setEditItemName(route.name);
        setShowEditRouteModal(true);
    };

    const handleNavigateRoute = (route: SalesRoute) => {
        navigate(`/sales/route-overview/${route.id}?name=${encodeURIComponent(route.name)}`);
    };

    const handleViewCustomerPath = (customer: any) => {
        navigate(`/sales/customer-nav/${customer.id}`);
    };

    // Filter Tree Data based on Selected Agent
    const filteredTreeData = React.useMemo(() => {
        if (!filterAgentId) return treeData;

        // Tree is now flat list of Routes
        return treeData.filter(route =>
            route.assigned_user_id == filterAgentId
        );
    }, [treeData, filterAgentId]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading routes...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Route Management</h1>
                    <p className="text-gray-500 text-sm">Routes &gt; Customers</p>
                </div>
                <div className="flex gap-4">
                    {/* Agent Filter */}
                    <select
                        className="px-4 py-2 border rounded-lg bg-white"
                        value={filterAgentId}
                        onChange={(e) => setFilterAgentId(e.target.value)}
                    >
                        <option value="">All Agents</option>
                        {salesAgents.map(agent => (
                            <option key={agent.id} value={agent.id}>{agent.display_name}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => { setNewItemName(''); setShowRouteModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        <Plus size={18} />
                        Add Route
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {filteredTreeData.map((route) => (
                    <TreeNode
                        key={route.id}
                        node={route}
                        level={0}
                        onNavigate={handleNavigateRoute}
                        onEditRoute={openEditRouteModal}
                        onAssign={(r) => openAssignModal(r)}
                        onViewCustomer={(c) => setSelectedCustomer(c)}
                        onViewPath={handleViewCustomerPath}
                    />
                ))}
                {filteredTreeData.length === 0 && (
                    <div className="p-8 text-center text-gray-400 italic">No routes found.</div>
                )}
            </div>

            {/* Create Route Modal (Renamed from Territory) */}
            {showRouteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h3 className="text-lg font-bold mb-4">Create Route</h3>
                        <input
                            className="w-full p-2 border rounded mb-4"
                            placeholder="Route Name"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowRouteModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                            <button onClick={handleCreateRoute} className="px-4 py-2 bg-indigo-600 text-white rounded">Create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Agent Modal */}
            {showAssignModal && selectedRoute && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h3 className="text-lg font-bold mb-2">Assign Agent</h3>
                        <p className="text-sm text-gray-500 mb-4">Assigning to: {selectedRoute.name}</p>

                        <select
                            className="w-full p-2 border rounded mb-4"
                            value={assignAgentId}
                            onChange={(e) => setAssignAgentId(e.target.value)}
                        >
                            <option value="">Select Agent...</option>
                            {salesAgents.map(agent => (
                                <option key={agent.id} value={agent.id}>
                                    {agent.display_name} ({agent.employee_id})
                                </option>
                            ))}
                        </select>

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                            <button onClick={handleAssignRoute} className="px-4 py-2 bg-blue-600 text-white rounded">Assign Agent</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Route Modal */}
            {showEditRouteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
                        <h3 className="text-lg font-bold mb-4">Edit Route Name</h3>
                        <input
                            className="w-full p-2 border rounded mb-4"
                            placeholder="Route Name"
                            value={editItemName}
                            onChange={(e) => setEditItemName(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowEditRouteModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                            <button onClick={handleUpdateRoute} className="px-4 py-2 bg-indigo-600 text-white rounded font-bold">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Customer Detail Modal */}
            {selectedCustomer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="bg-indigo-600 p-6 text-white relative">
                            <button
                                onClick={() => setSelectedCustomer(null)}
                                className="absolute right-4 top-4 text-white/80 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                            <h3 className="text-xl font-bold">{selectedCustomer.name}</h3>
                            <p className="text-indigo-100 text-sm">{selectedCustomer.area || 'Unknown Area'}</p>
                        </div>

                        <div className="p-6 space-y-4">
                            {selectedCustomer.photo_uri && (
                                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                                    <img
                                        src={selectedCustomer.photo_uri.startsWith('http') ? selectedCustomer.photo_uri : `http://localhost:3000${selectedCustomer.photo_uri}`}
                                        alt={selectedCustomer.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone</p>
                                    <p className="text-gray-900 font-medium">{selectedCustomer.phone_primary || selectedCustomer.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">TIN Number</p>
                                    <p className="text-gray-900 font-medium">{selectedCustomer.tin_number || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="pt-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Location Notes</p>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    {selectedCustomer.location_notes || 'No notes available'}
                                </p>
                            </div>

                            <div className="pt-2 flex items-center gap-2 text-xs text-gray-400">
                                <MapPin size={14} />
                                <span>Lat: {selectedCustomer.latitude}, Lng: {selectedCustomer.longitude}</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 flex justify-end">
                            <button
                                onClick={() => setSelectedCustomer(null)}
                                className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Recursive Tree Node Component
const TreeNode = ({
    node,
    level = 0,
    onNavigate,
    onEditRoute,
    onAssign,
    onViewCustomer,
    onViewPath
}: {
    node: any,
    level?: number,
    onNavigate?: (r: any) => void,
    onEditRoute?: (r: any) => void,
    onAssign?: (r: any) => void,
    onViewCustomer?: (c: any) => void,
    onViewPath?: (c: any) => void
}) => {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = node.children && node.children.length > 0;

    const getIcon = () => {
        if (node.type === 'route') return <Truck className="text-emerald-600" size={18} />;
        return <MapPin className="text-orange-500" size={16} />;
    };

    return (
        <div className="">
            <div
                className={`
                    flex items-center justify-between p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors
                    ${node.type === 'route' ? 'bg-gray-50/50' : ''}
                `}
                style={{ paddingLeft: `${level * 20 + 12}px` }}
            >
                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => hasChildren && setExpanded(!expanded)}>
                    <div className="w-5 text-gray-400">
                        {hasChildren ? (
                            expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                        ) : null}
                    </div>

                    {getIcon()}

                    <div className="flex flex-col">
                        <span className={`
                            ${node.type === 'route' ? 'font-bold text-gray-800' : ''}
                            ${node.type === 'customer' ? 'text-gray-600 text-sm' : ''}
                        `}>
                            {node.name}
                        </span>

                        {node.type === 'route' && (
                            <span className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                <User size={10} /> Assigned: <span className="font-medium">{node.assigned_to || 'Unassigned'}</span>
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 pr-4">
                    {node.type === 'route' && onEditRoute && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEditRoute(node); }}
                            className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                            title="Edit Route"
                        >
                            <Pencil size={16} />
                        </button>
                    )}

                    {node.type === 'route' && onAssign && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAssign(node); }}
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                            title="Assign Agent"
                        >
                            <UserPlus size={18} />
                        </button>
                    )}

                    {node.type === 'customer' && (
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full uppercase tracking-tight">
                                Seq: {node.sequence}
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); onViewCustomer && onViewCustomer(node); }}
                                className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                                title="View Customer Details"
                            >
                                <Eye size={16} />
                            </button>
                            {onViewPath && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onViewPath(node); }}
                                    className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold"
                                    title="View Path"
                                >
                                    <MapPin size={14} />
                                    Path
                                </button>
                            )}
                        </div>
                    )}

                    {node.type === 'route' && onNavigate && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onNavigate(node); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                            <Truck size={14} />
                            Navigate
                        </button>
                    )}
                </div>
            </div>

            {expanded && hasChildren && (
                <div>
                    {node.children.map((child: any) => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            level={level + 1}
                            onNavigate={onNavigate}
                            onAssign={onAssign}
                            onViewCustomer={onViewCustomer}
                            onViewPath={onViewPath}
                            onEditRoute={onEditRoute}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
