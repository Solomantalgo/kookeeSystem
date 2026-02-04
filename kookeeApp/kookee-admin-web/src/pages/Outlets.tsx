import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OUTLETS } from '../data/outlets';
import { Search, MapPin, Package, History, ChevronRight, Globe } from 'lucide-react';

export const Outlets = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOutlets = OUTLETS.filter((name: string) =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 lg:p-8 space-y-8 bg-gray-50/50 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">Outlet Directory</h1>
                    <p className="text-gray-500 font-medium text-sm lg:text-base">Comprehensive view of all retail locations</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by outlet name..."
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-blue-500 transition-all font-bold text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-y md:divide-y-0 md:gap-px bg-gray-100">
                    {filteredOutlets.map((name: string) => (
                        <div key={name} className="bg-white p-6 hover:bg-gray-50 transition-all group border-b border-gray-100 lg:border-r">
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:bg-black group-hover:border-black transition-all">
                                    <MapPin size={32} className="text-gray-400 group-hover:text-white transition-colors" />
                                </div>
                                <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-600">
                                    Active
                                </span>
                            </div>

                            <div className="space-y-1 mb-6">
                                <h3 className="text-lg font-black text-gray-900">{name}</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Retail Point</p>
                            </div>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Globe size={14} className="text-blue-500" />
                                    <span className="text-xs font-bold">Kampala, Uganda</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Package size={14} className="text-purple-500" />
                                    <span className="text-xs font-bold">Category: Modern Trade</span>
                                </div>
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/reports?outlet=${encodeURIComponent(name)}`); }}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <History size={16} />
                                    <span className="text-xs font-black uppercase tracking-widest">Visit History</span>
                                </div>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                {filteredOutlets.length === 0 && (
                    <div className="p-20 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
                            <MapPin size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">No Outlets Found</h3>
                        <p className="text-gray-500 font-bold text-sm max-w-xs">Try searching for a different name.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
