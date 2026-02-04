import React from 'react';
import { X, MapPin, Search, ChevronRight, Package, Clock, History } from 'lucide-react';

interface OutletInfo {
    id: string;
    name: string;
    location: string;
    lastVisit: string;
    avgStock: string;
}

const MOCK_OUTLETS: OutletInfo[] = [
    { id: '1', name: 'Lugogo Mall', location: 'By-Pass Rd', lastVisit: 'Today, 09:45 AM', avgStock: '88%' },
    { id: '2', name: 'Arena Mall', location: 'Nsambya Rd', lastVisit: 'Today, 10:15 AM', avgStock: '92%' },
    { id: '3', name: 'Acacia Mall', location: 'John Babiiha Ave', lastVisit: 'Yesterday', avgStock: '75%' },
    { id: '4', name: 'Oasis Mall', location: 'Yusuf Lule Rd', lastVisit: 'Yesterday', avgStock: '90%' },
];

export const OutletDirectory: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [searchTerm, setSearchTerm] = React.useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">OUTLET DIRECTORY</h2>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mt-1">
                            Location Management & History
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100 bg-white">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Filter by name or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 pl-12 pr-4 py-3 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-blue-500/10 outline-none font-bold text-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {MOCK_OUTLETS.filter(o => o.name.toLowerCase().includes(searchTerm.toLowerCase())).map((o) => (
                        <div key={o.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 transition-all group flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:bg-blue-600 transition-colors">
                                    <MapPin size={24} className="text-gray-400 group-hover:text-white transition-colors" />
                                </div>
                                <div>
                                    <p className="font-black text-gray-900">{o.name}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                                            <Package size={10} />
                                            {o.avgStock} Stock Avg
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                                            <Clock size={10} />
                                            {o.lastVisit}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button className="p-3 bg-gray-50 rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                <History size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
