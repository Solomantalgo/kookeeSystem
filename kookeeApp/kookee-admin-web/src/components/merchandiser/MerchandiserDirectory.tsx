import React from 'react';
import { X, MapPin, Search, Package, Clock, History } from 'lucide-react';

interface Merchandiser {
    id: string;
    name: string;
    phone: string;
    status: 'Active' | 'Inactive';
    lastActive: string;
    coverage: string;
}

const MOCK_MERCH: Merchandiser[] = [
    { id: 'm1', name: 'John Doe', phone: '+256 701 000 001', status: 'Active', lastActive: 'Now', coverage: '85%' },
    { id: 'm2', name: 'Mary Smith', phone: '+256 701 000 002', status: 'Active', lastActive: '10m ago', coverage: '92%' },
    { id: 'm3', name: 'Alex Johnson', phone: '+256 701 000 003', status: 'Inactive', lastActive: '2d ago', coverage: '45%' },
];

export const MerchandiserDirectory: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [searchTerm, setSearchTerm] = React.useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">MERCHANDISER TEAM</h2>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mt-1">
                            Staff Directory & Coverage
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
                            placeholder="Filter by name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 pl-12 pr-4 py-3 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-blue-500/10 outline-none font-bold text-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {MOCK_MERCH.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone.includes(searchTerm)).map((m) => (
                        <div key={m.id} className="bg-white border border-gray-100 rounded-2xl p-4 lg:p-5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gray-50 rounded-xl sm:rounded-2xl flex items-center justify-center border border-gray-100 group-hover:bg-blue-600 transition-colors">
                                    <User size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-black text-gray-900 text-sm lg:text-base">{m.name}</p>
                                        <span className={`w-2 h-2 rounded-full ${m.status === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                        <div className="flex items-center gap-1 text-[9px] lg:text-[10px] font-bold text-gray-400 uppercase">
                                            <Phone size={10} />
                                            {m.phone}
                                        </div>
                                        <div className="flex items-center gap-1 text-[9px] lg:text-[10px] font-bold text-gray-400 uppercase">
                                            <Calendar size={10} />
                                            {m.lastActive}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-left sm:text-right border-t sm:border-t-0 border-gray-50 pt-3 sm:pt-0">
                                <p className="text-lg lg:text-xl font-black text-gray-900">{m.coverage}</p>
                                <p className="text-[9px] lg:text-[10px] font-black text-gray-400 uppercase tracking-wider">Target Coverage</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
