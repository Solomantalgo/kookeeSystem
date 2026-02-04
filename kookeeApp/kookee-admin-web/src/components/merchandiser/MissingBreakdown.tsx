import React from 'react';
import { X, Copy, AlertCircle, Clock, MapPin, User, ChevronRight } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import toast from 'react-hot-toast';

interface MissingOutlet {
    type: 'no_activity' | 'visit_started';
    outlet: string;
    merchandiser: string;
    status: string;
}

const MOCK_MISSING: MissingOutlet[] = [
    { type: 'no_activity', outlet: 'Arena Mall', merchandiser: 'John', status: 'No App Activity' },
    { type: 'no_activity', outlet: 'Metroplex Mall', merchandiser: 'Mary', status: 'No App Activity' },
    { type: 'visit_started', outlet: 'Acacia Mall', merchandiser: 'John', status: 'Visit Started, No Report' },
    { type: 'visit_started', outlet: 'Oasis Mall', merchandiser: 'Alex', status: 'Visit Started, No Report' },
];

export const MissingBreakdown: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { selectedDate } = useDashboard();

    if (!isOpen) return null;

    const handleCopyFollowup = (item: MissingOutlet) => {
        const text = `⚠️ FOLLOW-UP: ${item.outlet}\nMerchandiser: ${item.merchandiser}\nStatus: ${item.status}\nPlease update on the progress.`;
        navigator.clipboard.writeText(text);
        toast.success(`Follow-up text for ${item.merchandiser} copied!`);
    };

    const sections = [
        { title: 'No App Activity', icon: <AlertCircle className="text-red-500" />, items: MOCK_MISSING.filter(m => m.type === 'no_activity') },
        { title: 'Visit Started, No Report', icon: <Clock className="text-orange-500" />, items: MOCK_MISSING.filter(m => m.type === 'visit_started') },
    ];

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">MISSING OUTLETS – TODAY</h2>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mt-1">
                            {new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase()} Breakdown
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {sections.map(section => (
                        <div key={section.title} className="space-y-4">
                            <div className="flex items-center gap-2 px-2">
                                {section.icon}
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">{section.title} ({section.items.length})</h3>
                            </div>
                            <div className="space-y-3">
                                {section.items.map((item, idx) => (
                                    <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-gray-200 transition-all group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                                                    <MapPin size={18} className="text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900">{item.outlet}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <User size={12} className="text-gray-400" />
                                                        <span className="text-xs font-bold text-gray-500">{item.merchandiser}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight ${item.type === 'no_activity' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleCopyFollowup(item)}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-all border border-gray-100"
                                            >
                                                <Copy size={14} />
                                                Copy Follow-Up
                                            </button>
                                            <button className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-white hover:bg-gray-50 text-blue-600 rounded-xl text-xs font-bold transition-all border border-blue-50">
                                                View Details
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
