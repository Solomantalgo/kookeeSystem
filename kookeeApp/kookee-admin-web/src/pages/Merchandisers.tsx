import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Merchandiser } from '../types';
import { useNavigate } from 'react-router-dom';
import { Search, User, Phone, ChevronRight, Activity, Plus, X, Power, Save } from 'lucide-react';

export const Merchandisers = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMerch, setSelectedMerch] = useState<Merchandiser | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newMerch, setNewMerch] = useState({ name: '', employee_id: '', phone: '', password: '' });
    const [editingMerch, setEditingMerch] = useState<Merchandiser | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { data: merchandisers = [], isLoading } = useQuery<Merchandiser[]>({
        queryKey: ['merchandisers'],
        queryFn: apiService.getMerchandisers,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: apiService.createMerchandiser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['merchandisers'] });
            setIsAddModalOpen(false);
            setNewMerch({ name: '', employee_id: '', phone: '', password: '' });
            setError(null);
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || "Failed to create merchandiser");
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<Merchandiser> }) =>
            apiService.updateMerchandiser(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['merchandisers'] });
            setSelectedMerch(data);
        }
    });

    const filteredMerch = (merchandisers as Merchandiser[]).filter((m: Merchandiser) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!newMerch.name || !newMerch.employee_id) {
            setError("Name and Employee ID are required");
            return;
        }
        createMutation.mutate(newMerch);
    };

    const toggleStatus = (merch: Merchandiser) => {
        updateMutation.mutate({
            id: merch.merchandiser_id,
            data: { active: !merch.active }
        });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMerch) return;
        updateMutation.mutate({
            id: editingMerch.merchandiser_id,
            data: newMerch
        }, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setEditingMerch(null);
                setNewMerch({ name: '', employee_id: '', phone: '', password: '' });
                setError(null);
            }
        });
    };

    const closeAddModal = () => {
        setIsAddModalOpen(false);
        setNewMerch({ name: '', employee_id: '', phone: '', password: '' });
        setError(null);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setEditingMerch(null);
        setNewMerch({ name: '', employee_id: '', phone: '', password: '' });
        setError(null);
    };

    const openEdit = (merch: Merchandiser) => {
        setEditingMerch(merch);
        setNewMerch({
            name: merch.name,
            employee_id: merch.employee_id,
            phone: merch.phone || '',
            password: merch.password || '1234'
        });
        setError(null);
        setIsEditModalOpen(true);
    };

    return (
        <div className="p-4 lg:p-8 space-y-8 bg-gray-50/50 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Merchandiser Directory</h1>
                    <p className="text-gray-500 font-medium text-sm lg:text-base">Monitor staff activity and performance</p>
                </div>
                <button
                    onClick={() => {
                        setNewMerch({ name: '', employee_id: '', phone: '', password: '' });
                        setError(null);
                        setIsAddModalOpen(true);
                    }}
                    className="px-6 py-3 bg-blue-600 text-white font-black text-sm rounded-2xl hover:bg-black transition-all shadow-lg flex items-center gap-2 group"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    New Merchandiser
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-center sm:text-left">
                <div className="p-6 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name or employee ID..."
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-blue-500 transition-all font-bold text-sm text-gray-900 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-y md:divide-y-0 md:gap-px bg-gray-100">
                    {filteredMerch.map((m: Merchandiser) => (
                        <div
                            key={m.merchandiser_id}
                            onClick={() => setSelectedMerch(m)}
                            className={`bg-white p-6 hover:bg-gray-50 transition-all group border-b border-gray-100 lg:border-r cursor-pointer ${!m.active ? 'opacity-60' : ''}`}
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:bg-black group-hover:border-black transition-all">
                                    <User size={32} className="text-gray-400 group-hover:text-white transition-colors" />
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${m.active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                                    }`}>
                                    {m.active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="space-y-1 mb-6">
                                <h3 className="text-lg font-black text-gray-900">{m.name}</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{m.employee_id}</p>
                            </div>

                            <div className="flex items-center gap-4 text-gray-500 mb-8">
                                <div className="flex items-center gap-2">
                                    <Phone size={14} className="text-blue-500" />
                                    <span className="text-xs font-bold">{m.phone || 'No phone'}</span>
                                </div>
                            </div>

                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/reports?merchandiserId=${m.merchandiser_id}`);
                                }}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all cursor-pointer"
                            >
                                <span className="text-xs font-black uppercase tracking-widest">Daily Progress</span>
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    ))}
                </div>

                {!isLoading && filteredMerch.length === 0 && (
                    <div className="p-20 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
                            <Activity size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">No Merchandisers Found</h3>
                        <p className="text-gray-500 font-bold text-sm max-w-xs">Adjust your search to find the staff member you're looking for.</p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedMerch && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-[40px] p-8 lg:p-12 shadow-2xl animate-in fade-in zoom-in duration-300 relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectedMerch(null); }}
                            className="absolute right-8 top-8 w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-gray-900 hover:text-white transition-all font-black text-xs"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-6 mb-12">
                            <div className="w-20 h-20 bg-gray-900 text-white rounded-[28px] flex items-center justify-center">
                                <User size={40} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedMerch.name}</h2>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{selectedMerch.employee_id}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-12">
                            <div className="bg-gray-50 p-6 rounded-3xl text-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Status</p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${selectedMerch.active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                    <p className="text-lg font-black text-gray-900">{selectedMerch.active ? 'Available' : 'Deactivated'}</p>
                                </div>
                            </div>
                            <div className="bg-blue-50 p-6 rounded-3xl text-center">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Access Pin</p>
                                <p className="text-lg font-black text-blue-600">{selectedMerch.password || '1234'}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={() => openEdit(selectedMerch)}
                                className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <Plus size={18} />
                                Edit Personal Details
                            </button>
                            <button
                                onClick={() => toggleStatus(selectedMerch)}
                                className={`w-full py-5 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 ${selectedMerch.active
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                    : 'bg-green-600 text-white hover:bg-black'
                                    }`}>
                                <Power size={18} />
                                {selectedMerch.active ? 'Deactivate Account' : 'Activate Account'}
                            </button>
                            <button
                                onClick={() => setSelectedMerch(null)}
                                className="w-full py-5 bg-white border border-gray-100 text-gray-400 rounded-2xl font-black text-sm hover:text-gray-900 transition-all"
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form
                        onSubmit={handleCreate}
                        className="bg-white w-full max-w-lg rounded-[40px] p-8 lg:p-12 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-300 relative"
                    >
                        <button
                            type="button"
                            onClick={closeAddModal}
                            className="absolute right-8 top-8 w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-gray-900 hover:text-white transition-all font-black"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-10">
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Register Staff</h2>
                            <p className="text-gray-500 font-bold">New personnel for the Merchandiser Portal</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold">
                                {error}
                            </div>
                        )}

                        <div className="space-y-6 mb-10">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-blue-500 transition-all font-bold text-sm text-gray-900 outline-none"
                                    placeholder="e.g. John Kamau"
                                    value={newMerch.name}
                                    onChange={e => setNewMerch({ ...newMerch, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Employee ID (Username)</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-blue-500 transition-all font-bold text-sm text-gray-900 outline-none"
                                    placeholder="e.g. JK001"
                                    value={newMerch.employee_id}
                                    onChange={e => setNewMerch({ ...newMerch, employee_id: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                                <input
                                    type="tel"
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-blue-500 transition-all font-bold text-sm text-gray-900 outline-none"
                                    placeholder="e.g. +254 7XX XXX XXX"
                                    value={newMerch.phone}
                                    onChange={e => setNewMerch({ ...newMerch, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Secret Pin / Password</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-blue-500 transition-all font-bold text-sm text-gray-900 outline-none"
                                    placeholder="e.g. 1234"
                                    value={newMerch.password}
                                    onChange={e => setNewMerch({ ...newMerch, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="w-full py-6 bg-blue-600 text-white rounded-[28px] font-black text-sm shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:bg-gray-400"
                        >
                            {createMutation.isPending ? 'Registering...' : (
                                <>
                                    <Save size={20} />
                                    Register Merchandiser
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form
                        onSubmit={handleEdit}
                        className="bg-white w-full max-w-lg rounded-[40px] p-8 lg:p-12 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-300 relative"
                    >
                        <button
                            type="button"
                            onClick={closeEditModal}
                            className="absolute right-8 top-8 w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center hover:bg-gray-900 hover:text-white transition-all font-black"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-10">
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Modify Staff</h2>
                            <p className="text-gray-500 font-bold">Update records for {editingMerch?.name}</p>
                        </div>

                        <div className="space-y-6 mb-10">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-blue-500 transition-all font-bold text-sm text-gray-900 outline-none"
                                    value={newMerch.name}
                                    onChange={e => setNewMerch({ ...newMerch, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Employee ID</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-blue-500 transition-all font-bold text-sm text-gray-900 outline-none"
                                    value={newMerch.employee_id}
                                    onChange={e => setNewMerch({ ...newMerch, employee_id: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                                <input
                                    type="tel"
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-blue-500 transition-all font-bold text-sm text-gray-900 outline-none"
                                    value={newMerch.phone}
                                    onChange={e => setNewMerch({ ...newMerch, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Secret Pin</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-blue-500 transition-all font-bold text-sm text-gray-900 outline-none"
                                    value={newMerch.password}
                                    onChange={e => setNewMerch({ ...newMerch, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="w-full py-6 bg-blue-600 text-white rounded-[28px] font-black text-sm shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            {updateMutation.isPending ? 'Saving...' : 'Update Records'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};
