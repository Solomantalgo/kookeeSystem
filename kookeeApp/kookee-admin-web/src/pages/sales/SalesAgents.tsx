import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, User, Plus, X, Power, Save, Edit2, ChevronRight, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:3000/api';

export const SalesAgents = () => {
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // UI State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<any | null>(null); // For View/Edit Modal
    const [isEditMode, setIsEditMode] = useState(false); // Inside View Modal, toggle edit form

    // Form State
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        employee_id: '',
        password: '',
        replaced_agent_id: ''
    });

    const [isReplacing, setIsReplacing] = useState(false);

    const fetchAgents = async () => {
        try {
            const response = await axios.get(`${API_URL}/sales/agents`);
            setAgents(response.data);
        } catch (error) {
            toast.error('Failed to load agents');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/sales/agents`, formData);
            toast.success('Agent registered successfully');
            setIsAddModalOpen(false);
            setFormData({ first_name: '', last_name: '', email: '', phone_number: '', employee_id: '', password: '', replaced_agent_id: '' });
            setIsReplacing(false);
            fetchAgents();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create agent');
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAgent) return;
        try {
            const res = await axios.put(`${API_URL}/sales/agents/${selectedAgent.id}`, formData);
            toast.success('Agent updated successfully');
            setIsEditMode(false);
            setSelectedAgent(res.data); // Update local view
            fetchAgents(); // Refresh list
        } catch (error: any) {
            toast.error('Failed to update agent');
        }
    };

    const toggleStatus = async () => {
        if (!selectedAgent) return;
        try {
            const newStatus = !selectedAgent.is_active;
            const res = await axios.put(`${API_URL}/sales/agents/${selectedAgent.id}`, { is_active: newStatus });
            setSelectedAgent(res.data); // Update local view (modal)
            setAgents(agents.map(a => a.id === selectedAgent.id ? res.data : a)); // Update list
            toast.success(`Agent ${newStatus ? 'Activated' : 'Deactivated'}`);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const openAddModal = () => {
        setFormData({ first_name: '', last_name: '', email: '', phone_number: '', employee_id: '', password: '', replaced_agent_id: '' });
        setIsReplacing(false);
        setIsAddModalOpen(true);
    };

    const openViewModal = (agent: any) => {
        setSelectedAgent(agent);
        setIsEditMode(false);
        // Pre-fill form data just in case they switch to edit
        setFormData({
            first_name: agent.first_name || '',
            last_name: agent.last_name || '',
            email: agent.email || '',
            employee_id: agent.employee_id || '',
            phone_number: agent.phone_number || '',
            password: '', // Don't show hash
            replaced_agent_id: ''
        });
        setIsReplacing(false);
    };

    const filteredAgents = agents.filter(a =>
        a.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Sales Agents</h1>
                    <p className="text-gray-500 text-sm">Manage sales force access and status</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Add Agent
                </button>
            </div>

            {/* List View (Kept as requested, but clickable) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search agents by name, email, or ID..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="divide-y divide-gray-100">
                    {filteredAgents.map((agent) => (
                        <div
                            key={agent.id}
                            onClick={() => openViewModal(agent)}
                            className="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${agent.is_active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                    {agent.first_name ? agent.first_name[0] : <User size={20} />}
                                </div>
                                <div>
                                    <h3 className={`font-bold ${agent.is_active ? 'text-gray-900' : 'text-gray-400'}`}>{agent.display_name}</h3>
                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                        <span className="flex items-center gap-1 font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">ID: {agent.employee_id || 'N/A'}</span>
                                        <span className="flex items-center gap-1"><Mail size={12} />{agent.email}</span>
                                        {agent.phone_number && <span className="flex items-center gap-1"><Phone size={12} />{agent.phone_number}</span>}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${agent.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {agent.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                                <ChevronRight className="text-gray-300 group-hover:text-blue-500" size={20} />
                            </div>
                        </div>
                    ))}
                    {!loading && filteredAgents.length === 0 && (
                        <div className="p-8 text-center text-gray-400">No agents found.</div>
                    )}
                </div>
            </div>

            {/* ADD AGENT MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleCreate} className="bg-white w-full max-w-lg rounded-2xl p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="absolute right-6 top-6 text-gray-400 hover:text-gray-900"><X size={24} /></button>
                        <h2 className="text-2xl font-bold mb-6">Register New Agent</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">First Name</label>
                                    <input required className="w-full p-3 bg-gray-50 rounded-lg border-transparent focus:bg-white focus:ring-2 ring-blue-500 outline-none"
                                        value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Last Name</label>
                                    <input required className="w-full p-3 bg-gray-50 rounded-lg border-transparent focus:bg-white focus:ring-2 ring-blue-500 outline-none"
                                        value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Employee ID (Login ID)</label>
                                <input required type="text" className="w-full p-3 bg-gray-50 rounded-lg border-transparent focus:bg-white focus:ring-2 ring-blue-500 outline-none"
                                    value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                <input type="email" required className="w-full p-3 bg-gray-50 rounded-lg border-transparent focus:bg-white focus:ring-2 ring-blue-500 outline-none"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                                <input type="tel" className="w-full p-3 bg-gray-50 rounded-lg border-transparent focus:bg-white focus:ring-2 ring-blue-500 outline-none"
                                    value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Initial Password</label>
                                <input type="text" placeholder="Default: 1234" className="w-full p-3 bg-gray-50 rounded-lg border-transparent focus:bg-white focus:ring-2 ring-blue-500 outline-none"
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div className="pt-2 border-t border-gray-100">
                                <label className="flex items-center gap-2 cursor-pointer mb-3">
                                    <input
                                        type="checkbox"
                                        checked={isReplacing}
                                        onChange={e => {
                                            setIsReplacing(e.target.checked);
                                            if (!e.target.checked) setFormData({ ...formData, replaced_agent_id: '' });
                                        }}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Replacing an existing agent? (Take over routes)</span>
                                </label>

                                {isReplacing && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Agent to Replace</label>
                                        <select
                                            className="w-full p-3 bg-red-50 text-red-900 border border-red-100 rounded-lg outline-none focus:ring-2 ring-red-200"
                                            value={formData.replaced_agent_id}
                                            onChange={e => setFormData({ ...formData, replaced_agent_id: e.target.value })}
                                            required={isReplacing}
                                        >
                                            <option value="">-- Select Agent --</option>
                                            {agents.filter(a => a.is_active).map(agent => (
                                                <option key={agent.id} value={agent.id}>
                                                    {agent.display_name} ({agent.employee_id || 'No ID'})
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-red-500 mt-1">
                                            * This will deactivate the selected agent and transfer all their pending route assignments to the new agent.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex justify-center gap-2 mt-4">
                                <Save size={20} /> Register Agent
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* VIEW / EDIT AGENT MODAL (Pop-out) */}
            {selectedAgent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button onClick={() => setSelectedAgent(null)} className="absolute right-6 top-6 text-gray-400 hover:text-gray-900"><X size={24} /></button>

                        {/* Header Section */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                                <User size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{selectedAgent.display_name}</h2>
                                <p className="text-gray-500 text-sm font-medium">{selectedAgent.email}</p>
                                <p className="text-gray-500 text-xs font-mono mt-1">ID: {selectedAgent.employee_id}</p>
                            </div>
                        </div>

                        {isEditMode ? (
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input placeholder="First Name" required className="p-3 bg-gray-50 rounded-lg outline-none" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                                    <input placeholder="Last Name" required className="p-3 bg-gray-50 rounded-lg outline-none" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                                </div>
                                <input placeholder="Employee ID" required className="w-full p-3 bg-gray-50 rounded-lg outline-none" value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })} />
                                <input placeholder="Phone" className="w-full p-3 bg-gray-50 rounded-lg outline-none" value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} />
                                <input placeholder="New Password (Optional)" className="w-full p-3 bg-gray-50 rounded-lg outline-none" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />

                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setIsEditMode(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl">Save Changes</button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-50 p-4 rounded-2xl text-center">
                                        <div className="text-xs font-bold text-gray-400 uppercase mb-1">Status</div>
                                        <div className={`text-lg font-black ${selectedAgent.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                            {selectedAgent.is_active ? 'Active' : 'Inactive'}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-2xl text-center">
                                        <div className="text-xs font-bold text-gray-400 uppercase mb-1">Phone</div>
                                        <div className="text-sm font-bold text-gray-800">{selectedAgent.phone_number || 'N/A'}</div>
                                    </div>
                                </div>

                                <button onClick={() => setIsEditMode(true)} className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-colors">
                                    <Edit2 size={18} /> Edit Details
                                </button>
                                <button onClick={toggleStatus} className={`w-full py-4 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors ${selectedAgent.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                                    <Power size={18} /> {selectedAgent.is_active ? 'Deactivate Account' : 'Activate Account'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
