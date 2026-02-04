import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { ArrowLeft, User, Clock, Package, CheckCircle2, AlertCircle } from 'lucide-react';

export const ReportDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: report, isLoading, error } = useQuery({
        queryKey: ['report', id],
        queryFn: () => apiService.getReport(id!),
        enabled: !!id,
    });

    if (isLoading) return (
        <div className="h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error || !report) return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
            <AlertCircle size={48} className="text-red-500" />
            <h2 className="text-2xl font-black text-gray-900">Report Not Found</h2>
            <button
                onClick={() => navigate('/reports')}
                className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold"
            >
                Back to Reports
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-all font-bold text-sm group"
            >
                <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-gray-900 group-hover:text-white transition-all">
                    <ArrowLeft size={16} />
                </div>
                <span>Back to List</span>
            </button>

            <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-[40px] p-8 lg:p-12 shadow-sm border border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                                <CheckCircle2 size={12} />
                                Verified Submission
                            </div>
                            <h1 className="text-3xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                                {report.outlet_name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-6 text-gray-400">
                                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                                    <User size={16} className="text-blue-500" />
                                    <span>{report.merchandiser_name}</span>
                                </div>
                                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                                    <Clock size={16} className="text-purple-500" />
                                    <span>{new Date(report.submitted_at).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stock Table */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                                <Package size={24} className="text-blue-600" />
                                Stock Inventory Count
                            </h3>
                            <span className="px-4 py-2 bg-gray-50 rounded-2xl text-xs font-black text-gray-600">
                                {report.products.length} Products Tracked
                            </span>
                        </div>

                        <div className="bg-gray-50/50 rounded-3xl overflow-hidden border border-gray-100">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Description</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Qty in Stock</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {(() => {
                                        let lastCategory = '';
                                        let lastSubCategory = '';

                                        return report.products.map((item: any, idx: number) => {
                                            const categoryChanged = (item.category || 'General') !== lastCategory;
                                            const subCategoryChanged = (item.subcategory || 'General') !== lastSubCategory || categoryChanged;
                                            
                                            const rows = [];

                                            if (categoryChanged) {
                                                lastCategory = item.category || 'General';
                                                rows.push(
                                                    <tr key={`cat-${lastCategory}`} className="bg-blue-50/50">
                                                        <td colSpan={2} className="px-6 py-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                                            {lastCategory}
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            if (subCategoryChanged) {
                                                lastSubCategory = item.subcategory || 'General';
                                                rows.push(
                                                    <tr key={`sub-${lastCategory}-${lastSubCategory}`} className="bg-gray-50/50">
                                                        <td colSpan={2} className="px-8 py-1.5 text-[10px] font-bold text-gray-500 italic">
                                                            {lastSubCategory}
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            rows.push(
                                                <tr key={`prod-${idx}`} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-5">
                                                        <p className="font-black text-gray-900">{item.product_name}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Inventory Unit</p>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <span className={`inline-block px-4 py-2 rounded-xl font-black text-sm ${item.quantity === 0
                                                            ? 'bg-red-50 text-red-600'
                                                            : 'bg-green-50 text-green-600'
                                                            }`}>
                                                            {item.quantity}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                            
                                            return rows;
                                        });
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
