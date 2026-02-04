import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { useDashboard } from '../context/DashboardContext';
import { AlertCircle, Clock, MapPin, User, Copy, ChevronRight } from 'lucide-react';
import { generateFollowUp, copyToClipboard } from '../utils/whatsapp';

export const MissingReports = () => {
    const { selectedDate } = useDashboard();

    const { data: missingReports = [] } = useQuery({
        queryKey: ['missing-assignments', selectedDate],
        queryFn: () => apiService.getMissingAssignments(selectedDate),
    });

    const sections = [
        {
            title: 'No App Activity',
            icon: <AlertCircle className="text-red-500" size={20} />,
            items: missingReports.filter((m: any) => m.type === 'no_activity'),
            bgColor: 'bg-red-50',
            textColor: 'text-red-700'
        },
        {
            title: 'Visit Started, No Report',
            icon: <Clock className="text-orange-500" size={20} />,
            items: missingReports.filter((m: any) => m.type === 'visit_started'),
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-700'
        },
    ];

    const handleFollowUp = (item: any) => {
        const text = generateFollowUp(item.outlet, item.merchandiser);
        copyToClipboard(text);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">MISSING REPORTS</h1>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">Today's Performance Gaps</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {sections.map(section => (
                    <div key={section.title} className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                            <div className={`p-2 rounded-xl ${section.bgColor}`}>
                                {section.icon}
                            </div>
                            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">
                                {section.title} ({section.items.length})
                            </h3>
                        </div>

                        <div className="space-y-4">
                            {section.items.map((item, idx) => (
                                <div key={idx} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 group-hover:bg-black group-hover:border-black transition-colors">
                                                <MapPin size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-900 text-base">{item.outlet}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <User size={12} className="text-gray-400" />
                                                    <span className="text-xs font-bold text-gray-500">{item.merchandiser}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight ${section.bgColor} ${section.textColor}`}>
                                            {item.status}
                                        </span>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleFollowUp(item)}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-black transition-all border border-gray-100"
                                        >
                                            <Copy size={16} />
                                            Copy Follow-Up
                                        </button>
                                        <button className="flex-1 flex items-center justify-center gap-1 py-3 bg-white hover:bg-gray-50 text-blue-600 rounded-xl text-xs font-black transition-all border border-blue-50">
                                            View Profile
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
