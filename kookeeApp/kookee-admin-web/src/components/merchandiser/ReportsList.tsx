import React from 'react';
import { X, Search, ChevronRight, FileText, Clock, User, Image as ImageIcon } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

interface MerchReport {
    id: string;
    merchandiser: string;
    outlet: string;
    time: string;
    status: 'Submitted';
    hasPhoto: boolean;
}

const MOCK_REPORTS: MerchReport[] = [
    { id: 'r1', merchandiser: 'John', outlet: 'Lugogo Mall', time: '09:45 AM', status: 'Submitted', hasPhoto: true },
    { id: 'r2', merchandiser: 'Mary', outlet: 'Arena Mall', time: '10:15 AM', status: 'Submitted', hasPhoto: true },
    { id: 'r3', merchandiser: 'Alex', outlet: 'Oasis Mall', time: '11:00 AM', status: 'Submitted', hasPhoto: true },
    { id: 'r4', merchandiser: 'John', outlet: 'Acacia Mall', time: '11:30 AM', status: 'Submitted', hasPhoto: true },
];

export const ReportsList: React.FC<{ isOpen: boolean; onClose: () => void; onSelect: (id: string) => void }> = ({ isOpen, onClose, onSelect }) => {
    const { selectedDate } = useDashboard();
    const [searchTerm, setSearchTerm] = React.useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-4 lg:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-lg lg:text-xl font-black text-gray-900 tracking-tight">MERCHANDISER REPORTS</h2>
                        <p className="text-[9px] lg:text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mt-1">
                            {new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase()} SUBMISSIONS
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
                            placeholder="Search by merchandiser or outlet..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 pl-12 pr-4 py-3 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-blue-500/10 outline-none font-bold text-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {MOCK_REPORTS.filter(r =>
                        r.merchandiser.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.outlet.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((report) => (
                        <button
                            key={report.id}
                            onClick={() => onSelect(report.id)}
                            className="w-full bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                    <FileText size={20} className="text-blue-600 group-hover:text-white transition-colors" />
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-gray-900">{report.outlet}</p>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase">
                                            <User size={10} />
                                            {report.merchandiser}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase">
                                            <Clock size={10} />
                                            {report.time}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {report.hasPhoto && (
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-400">
                                        <ImageIcon size={14} />
                                    </div>
                                )}
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                                    <ChevronRight size={18} />
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
