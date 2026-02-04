import React, { useState } from 'react';
import { X, Copy, Check, Search } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import toast from 'react-hot-toast';

interface Outlet {
    id: string;
    name: string;
}

const MOCK_OUTLETS: Outlet[] = [
    { id: '1', name: 'Lugogo Mall' },
    { id: '2', name: 'Arena Mall' },
    { id: '3', name: 'Acacia Mall' },
    { id: '4', name: 'Oasis Mall' },
    { id: '5', name: 'Metroplex Mall' },
];

const MOCK_MERCHANDISERS = [
    { id: 'm1', name: 'John' },
    { id: 'm2', name: 'Mary' },
    { id: 'm3', name: 'Alex' },
];

interface AssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({ isOpen, onClose }) => {
    const { selectedDate } = useDashboard();
    const [merchandiserId, setMerchandiserId] = useState('');
    const [selectedOutlets, setSelectedOutlets] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    if (!isOpen) return null;

    const toggleOutlet = (id: string) => {
        setSelectedOutlets(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const getMerchandiserName = () => MOCK_MERCHANDISERS.find(m => m.id === merchandiserId)?.name || '';

    const generateWhatsAppText = () => {
        const name = getMerchandiserName();
        const outlets = MOCK_OUTLETS
            .filter(o => selectedOutlets.includes(o.id))
            .map((o, i) => `${i + 1}. ${o.name}`)
            .join('\n');

        const dateFormatted = new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();

        return `📍 DAILY OUTLET ASSIGNMENT – ${dateFormatted}\nMerchandiser: ${name}\n\n${outlets}`;
    };

    const handleCopyWhatsApp = () => {
        if (!merchandiserId || selectedOutlets.length === 0) {
            toast.error('Select merchandiser and at least one outlet');
            return;
        }
        const text = generateWhatsAppText();
        navigator.clipboard.writeText(text);
        toast.success('WhatsApp summary copied to clipboard!');
    };

    const handleSave = () => {
        if (!merchandiserId || selectedOutlets.length === 0) {
            toast.error('Please complete the assignment');
            return;
        }
        toast.success(`Assignment saved for ${getMerchandiserName()}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">ASSIGN OUTLETS</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                            Task Creation & WhatsApp Sync
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Date & Merchandiser Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Date</label>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700">
                                {new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Merchandiser</label>
                            <select
                                value={merchandiserId}
                                onChange={(e) => setMerchandiserId(e.target.value)}
                                className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none"
                            >
                                <option value="">Select Team Member</option>
                                {MOCK_MERCHANDISERS.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Outlet Checklist */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Select Outlets</label>
                            <span className="text-[10px] font-black text-blue-600 uppercase">{selectedOutlets.length} Selected</span>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                type="text"
                                placeholder="Filter outlets..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-50 pl-9 pr-4 py-2 text-xs font-bold rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {MOCK_OUTLETS.filter(o => o.name.toLowerCase().includes(searchTerm.toLowerCase())).map(outlet => (
                                <button
                                    key={outlet.id}
                                    onClick={() => toggleOutlet(outlet.id)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selectedOutlets.includes(outlet.id)
                                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                                        : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'
                                        }`}
                                >
                                    <span className="text-sm font-bold">{outlet.name}</span>
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${selectedOutlets.includes(outlet.id)
                                        ? 'bg-blue-600 border-blue-600'
                                        : 'bg-white border-gray-300'
                                        }`}>
                                        {selectedOutlets.includes(outlet.id) && <Check size={12} className="text-white" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-3">
                    <button
                        onClick={handleSave}
                        className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-xl active:scale-[0.98] transition-all hover:bg-black"
                    >
                        Save Assignment
                    </button>
                    <button
                        onClick={handleCopyWhatsApp}
                        className="w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                    >
                        <Copy size={16} />
                        Copy WhatsApp Summary
                    </button>
                </div>
            </div>
        </div>
    );
};
