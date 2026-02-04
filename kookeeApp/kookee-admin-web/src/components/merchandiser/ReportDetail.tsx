import { X, MapPin, Package, Image as ImageIcon, CheckCircle2, ChevronLeft } from 'lucide-react';

interface ReportDetailProps {
    reportId: string;
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
}

export const ReportDetail: React.FC<ReportDetailProps> = ({ reportId, isOpen, onClose, onBack }) => {
    if (!isOpen) return null;

    // Mock Detail Data
    const detail = {
        outlet: 'Lugogo Mall',
        merchandiser: 'John',
        time: '09:45 AM',
        date: '29 JAN',
        photo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
        stock: [
            { item: 'Kookee Original 50g', price: 'UGX 1,500', stock: '24 Units', visible: true },
            { item: 'Kookee Chocolate 50g', price: 'UGX 1,500', stock: '12 Units', visible: true },
            { item: 'Kookee Vanilla 50g', price: 'UGX 1,500', stock: '0 Units', visible: false },
        ]
    };

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200 text-gray-400">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">REPORT DETAILS – #{reportId}</h2>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mt-1">
                                SUBMITTED BY {detail.merchandiser} • {detail.time}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                        {/* Left: Info & Stock */}
                        <div className="space-y-6 lg:space-y-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                                        <MapPin size={24} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xl lg:text-2xl font-black text-gray-900">{detail.outlet}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Kampala Central District</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] lg:text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Package size={14} />
                                    Stock Audit Results
                                </h3>
                                <div className="bg-gray-50 rounded-2xl lg:rounded-3xl border border-gray-100 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[300px]">
                                            <thead>
                                                <tr className="border-b border-gray-200/50">
                                                    <th className="p-3 lg:p-4 text-[9px] lg:text-[10px] font-black text-gray-400 uppercase">Product</th>
                                                    <th className="p-3 lg:p-4 text-[9px] lg:text-[10px] font-black text-gray-400 uppercase">Price</th>
                                                    <th className="p-3 lg:p-4 text-[9px] lg:text-[10px] font-black text-gray-400 uppercase">Stock</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detail.stock.map((s, i) => (
                                                    <tr key={i} className="border-b border-gray-200/50 last:border-0 hover:bg-white transition-colors">
                                                        <td className="p-3 lg:p-4">
                                                            <p className="text-xs lg:text-sm font-black text-gray-800">{s.item}</p>
                                                            <span className={`text-[8px] lg:text-[9px] font-black uppercase ${s.visible ? 'text-green-500' : 'text-red-500'}`}>
                                                                {s.visible ? 'Visible' : 'Out of Stock'}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 lg:p-4 text-xs lg:text-sm font-bold text-gray-600 whitespace-nowrap">{s.price}</td>
                                                        <td className="p-3 lg:p-4 text-xs lg:text-sm font-black text-gray-900">{s.stock}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Photo Proof */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] lg:text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <ImageIcon size={14} />
                                Shelf Photo Proof
                            </h3>
                            <div className="aspect-[4/5] sm:aspect-video lg:aspect-[4/5] bg-gray-50 rounded-3xl border border-gray-100 overflow-hidden shadow-inner flex items-center justify-center group relative">
                                <img
                                    src={detail.photo}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    alt="Shelf proof"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button className="px-6 py-3 bg-white text-gray-900 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all">
                                        VIEW FULLSIZE
                                    </button>
                                </div>
                                <div className="absolute bottom-4 lg:bottom-6 left-4 lg:left-6 right-4 lg:right-6 p-3 lg:p-4 bg-white/90 backdrop-blur-md rounded-xl lg:rounded-2xl border border-white/20 shadow-xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-green-500" />
                                            <span className="text-[9px] lg:text-[10px] font-black text-gray-900 uppercase">Verified Submission</span>
                                        </div>
                                        <span className="text-[9px] lg:text-[10px] font-black text-gray-400 uppercase">{detail.date} @ {detail.time}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
