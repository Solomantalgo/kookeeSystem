import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { useDashboard } from '../context/DashboardContext';
import { Search, Check, Copy, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateAssignmentSummary, generateGlobalAssignmentSummary, copyToClipboard } from '../utils/whatsapp';
import { OUTLETS } from '../data/outlets';

export const AssignOutlets = () => {
    const { selectedDate } = useDashboard();
    const queryClient = useQueryClient();
    const [merchandiserId, setMerchandiserId] = useState('');
    const [selectedOutlets, setSelectedOutlets] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [customOutlets, setCustomOutlets] = useState<string[]>([]);
    const [applyToAll, setApplyToAll] = useState(false);
    const [tasks, setTasks] = useState<Record<string, string>>({}); // name -> task string

    const { data: assignments = [] } = useQuery({
        queryKey: ['assignments', selectedDate],
        queryFn: () => apiService.getAssignments(selectedDate),
    });

    const { data: merchandisers = [] } = useQuery({
        queryKey: ['merchandisers'],
        queryFn: apiService.getMerchandisers,
    });

    const allOutletNames = useMemo(() => {
        return Array.from(new Set([...OUTLETS, ...customOutlets]));
    }, [customOutlets]);

    const filteredOutlets = useMemo(() => {
        if (!searchTerm) return allOutletNames;
        return allOutletNames.filter(name =>
            name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allOutletNames, searchTerm]);

    const assignMutation = useMutation({
        mutationFn: async () => {
            if (applyToAll) {
                // Bulk assign to all merchandisers
                const promises = merchandisers.map(m =>
                    apiService.assignOutlets(m.merchandiser_id, selectedOutlets, selectedDate, tasks)
                );
                return Promise.all(promises);
            } else {
                return apiService.assignOutlets(merchandiserId, selectedOutlets, selectedDate, tasks);
            }
        },
        onSuccess: () => {
            toast.success(applyToAll ? 'Assigned to all merchandisers!' : 'Assignments saved successfully');
            queryClient.invalidateQueries({ queryKey: ['assignments', selectedDate] });
            setSelectedOutlets([]);
            setTasks({}); // Reset tasks
            setApplyToAll(false);
        },
        onError: () => {
            toast.error('Failed to save assignments');
        }
    });

    const handleCopyGlobalWhatsApp = () => {
        if (assignments.length === 0) {
            toast.error('No assignments found for today');
            return;
        }
        const text = generateGlobalAssignmentSummary(assignments as any, selectedDate);
        copyToClipboard(text);
    };

    const toggleOutlet = (name: string) => {
        setSelectedOutlets(prev =>
            prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
        );
    };

    const handleAddCustom = () => {
        if (!searchTerm) return;
        if (!allOutletNames.includes(searchTerm)) {
            setCustomOutlets(prev => [...prev, searchTerm]);
            setSelectedOutlets(prev => [...prev, searchTerm]);
            toast.success(`Added & Selected: ${searchTerm}`);
            setSearchTerm('');
        }
    };

    const handleCopyWhatsApp = () => {
        if (!merchandiserId || selectedOutlets.length === 0) {
            toast.error('Select a merchandiser and at least one outlet');
            return;
        }
        const merchName = merchandisers.find(m => m.merchandiser_id === merchandiserId)?.name || '';
        const outletData = selectedOutlets.map(name => ({
            name,
            task: tasks[name]
        }));
        const text = generateAssignmentSummary(merchName, outletData, selectedDate);
        copyToClipboard(text);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">ASSIGN OUTLETS</h1>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">Creation & WhatsApp Sync</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Select Merchandiser</label>
                            <select
                                value={merchandiserId}
                                onChange={(e) => setMerchandiserId(e.target.value)}
                                className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-black/5"
                            >
                                <option value="">Choose team member...</option>
                                {merchandisers.map(m => (
                                    <option key={m.merchandiser_id} value={m.merchandiser_id}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2 px-1 pt-2">
                            <input
                                type="checkbox"
                                id="applyAll"
                                checked={applyToAll}
                                onChange={(e) => setApplyToAll(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="applyAll" className="text-xs font-bold text-gray-600 uppercase cursor-pointer">Apply to ALL Staff</label>
                        </div>

                        <div className="pt-2 space-y-3">
                            <button
                                onClick={() => assignMutation.mutate()}
                                disabled={(!merchandiserId && !applyToAll) || selectedOutlets.length === 0 || assignMutation.isPending}
                                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {assignMutation.isPending ? 'Saving...' : applyToAll ? 'Assign to ALL' : 'Save Assignments'}
                            </button>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleCopyWhatsApp}
                                    title="Copy single staff summary"
                                    className="py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-gray-50 transition-all border-b-4 active:border-b-0 active:translate-y-1"
                                >
                                    <Copy size={14} />
                                    Single
                                </button>
                                <button
                                    onClick={handleCopyGlobalWhatsApp}
                                    title="Copy global summary for all staff"
                                    className="py-4 bg-blue-600 border border-blue-700 text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-blue-700 transition-all border-b-4 active:border-b-0 active:translate-y-1"
                                >
                                    <Copy size={14} />
                                    Global
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Outlet Selection */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Filter outlets..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-50 pl-11 pr-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-black/5 outline-none font-bold text-sm"
                                />
                            </div>
                            <div className="ml-4 px-4 py-2 bg-blue-50 rounded-xl">
                                <span className="text-xs font-black text-blue-600 uppercase">{selectedOutlets.length} Selected</span>
                            </div>
                        </div>

                        {/* Add Custom Outlet Logic */}
                        {searchTerm && !allOutletNames.some(n => n.toLowerCase() === searchTerm.toLowerCase()) && (
                            <button
                                onClick={handleAddCustom}
                                className="w-full mb-4 p-4 bg-blue-50 border border-dashed border-blue-200 rounded-2xl flex items-center justify-between group hover:bg-blue-100 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg text-blue-600"><Plus size={16} /></div>
                                    <span className="text-sm font-black text-blue-700 uppercase">Add & Use: "{searchTerm}"</span>
                                </div>
                                <Check size={16} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        )}

                        <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredOutlets.map(name => (
                                <div key={name} className="space-y-2">
                                    <button
                                        onClick={() => toggleOutlet(name)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${selectedOutlets.includes(name)
                                            ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm ring-1 ring-blue-100'
                                            : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'
                                            }`}
                                    >
                                        <div>
                                            <p className="text-sm font-black">{name}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Retail Outlet</p>
                                        </div>
                                        <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selectedOutlets.includes(name)
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'bg-white border-gray-200'
                                            }`}>
                                            {selectedOutlets.includes(name) && <Check size={14} className="text-white" />}
                                        </div>
                                    </button>

                                    {selectedOutlets.includes(name) && (
                                        <div className="px-1 pb-2">
                                            <input
                                                type="text"
                                                placeholder="Task: e.g. Full Audit, Restock..."
                                                value={tasks[name] || ''}
                                                onChange={(e) => setTasks(prev => ({ ...prev, [name]: e.target.value }))}
                                                className="w-full text-[10px] font-bold bg-white border border-blue-100 rounded-lg px-3 py-2 outline-none focus:border-blue-300 text-blue-800 placeholder:text-blue-200"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
