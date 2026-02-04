import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { useDashboard } from '../context/DashboardContext';
import { OutletReport } from '../types';
import { Search, FileText, ChevronRight, Zap, LayoutGrid, List, Printer, TrendingUp, TrendingDown, Minus, Download } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StockMatrixData {
    product_name: string;
    category?: string;
    subCategory?: string;
    days: { [date: string]: number };
    trend: 'increasing' | 'decreasing' | 'stable';
}

export const ReportsList = () => {
    const { selectedDate } = useDashboard();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // View Mode State: 'matrix' (default) or 'list'
    const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');

    // Shared Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMerchandiser, setSelectedMerchandiser] = useState<string>('');
    const [selectedOutlet, setSelectedOutlet] = useState<string>('');

    // Handle incoming filters from URL (e.g. from Merchandisers page or Outlets page)
    useEffect(() => {
        const merchId = searchParams.get('merchandiserId');
        const outletName = searchParams.get('outlet');

        if (merchId) {
            setSelectedMerchandiser(merchId);
            setViewMode('list');
        }

        if (outletName) {
            setSearchTerm(outletName);
            // We'll resolve the ID in the next useEffect once outlets are loaded
        }
    }, [searchParams]);


    // Common Data - Outlets & Merchandisers
    const { data: merchandisers = [] } = useQuery({
        queryKey: ['merchandisers'],
        queryFn: () => apiService.getMerchandisers(),
    });
    const { data: outlets = [] } = useQuery({
        queryKey: ['outlets'],
        queryFn: () => apiService.getOutlets(),
    });

    // Resolve outlet name to ID for Matrix View selection
    useEffect(() => {
        const outletName = searchParams.get('outlet');
        if (outletName && outlets.length > 0) {
            const found = outlets.find(o => o.name.toLowerCase() === outletName.toLowerCase());
            if (found) {
                setSelectedOutlet(found.outlet_id);
                console.log('🎯 Auto-selected outlet for Matrix:', found.name);
            }
        }
    }, [outlets, searchParams]);

    // MATRIX VIEW LOGIC
    // -------------------------------------------------------------------------
    const [daysBack, setDaysBack] = useState(7);
    // Allow future dates (e.g. for testing or planning) by setting endDate to 30 days ahead
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Ensure an outlet is selected for Matrix View if not already
    // (Optional: Could default to first outlet)

    const { data: matrixData, isLoading: isMatrixLoading, error: matrixError } = useQuery<StockMatrixData[]>({
        queryKey: ['stock-matrix', selectedOutlet, startDate, endDate, selectedMerchandiser],
        queryFn: () => {
            console.log('🔍 Fetching stock matrix for:', { selectedOutlet, startDate, endDate, selectedMerchandiser });
            return apiService.getStockMatrix(selectedOutlet, startDate, endDate, selectedMerchandiser || undefined);
        },
        enabled: viewMode === 'matrix' && !!selectedOutlet,
    });

    // Log matrix data for debugging
    console.log('📊 Matrix State:', { matrixData, isMatrixLoading, matrixError: matrixError?.message, enabled: viewMode === 'matrix' && !!selectedOutlet });

    // Generate headers dynamically based on ACTUAL data present (User Request: "date where no report was submitted should not be in the matrix")
    // Collect all unique dates from the data
    const uniqueDates = new Set<string>();
    if (matrixData) {
        matrixData.forEach(item => {
            Object.keys(item.days).forEach(date => uniqueDates.add(date));
        });
    }
    // Sort dates ascending
    const dateHeaders = Array.from(uniqueDates).sort();

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'increasing': return <TrendingUp size={16} className="text-green-600" />;
            case 'decreasing': return <TrendingDown size={16} className="text-red-600" />;
            default: return <Minus size={16} className="text-gray-400" />;
        }
    };

    const getCellColor = (current: number, previous: number | undefined) => {
        if (previous === undefined) return 'bg-gray-50';
        if (current > previous) return 'bg-green-50 text-green-900 font-bold';
        if (current < previous) return 'bg-red-50 text-red-900 font-bold';
        return 'bg-gray-50';
    };

    const handleExportPdf = () => {
        if (!selectedOutlet || !matrixData) return;

        const outletName = outlets.find(o => o.outlet_id === selectedOutlet)?.name || 'Unknown Outlet';
        const MAX_DAYS = 13;

        // 1. Sort dates chronologically (Earliest -> Latest)
        const sortedDates = [...dateHeaders].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        // 2. Take the last (most recent) 13 days for the matrix
        const reportDates = sortedDates.slice(-MAX_DAYS);
        const emptyColumnsNeeded = MAX_DAYS - reportDates.length;

        // 3. Prepare headers (MM/DD/YY format)
        const formattedDates = reportDates.map(d => {
            const dateObj = new Date(d);
            return `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear().toString().slice(2)}`;
        });
        const placeholderHeaders = Array(emptyColumnsNeeded).fill("NO UPDATE");
        const header = ["Item", ...formattedDates, ...placeholderHeaders];

        const doc = new jsPDF({ orientation: "landscape" });
        const body: any[] = [];

        // 4. Build Body with Category Grouping & Carry-over Logic
        let lastCategory = '';
        let lastSubCategory = '';

        matrixData.forEach((product) => {
            const categoryChanged = (product.category || '') !== lastCategory;
            const subCategoryChanged = (product.subCategory || '') !== lastSubCategory || categoryChanged;

            if (categoryChanged) {
                lastCategory = product.category || '';
                body.push([
                    {
                        content: lastCategory.toUpperCase(),
                        colSpan: MAX_DAYS + 1,
                        styles: { fillColor: [239, 246, 255], textColor: [30, 58, 138], fontStyle: 'bold', fontSize: 8, halign: 'left' }
                    }
                ]);
            }

            if (subCategoryChanged) {
                lastSubCategory = product.subCategory || '';
                body.push([
                    {
                        content: lastSubCategory,
                        colSpan: MAX_DAYS + 1,
                        styles: { fillColor: [240, 253, 250], textColor: [15, 118, 110], fontStyle: 'italic', fontSize: 7, halign: 'left' }
                    }
                ]);
            }

            // Row Data with Carry-over Logic (Matching strategy from Merchandiser App)
            const rowData: string[] = [];
            let currentKnownQty = "0";

            // Process all known dates to establish carry-over, but only show report window
            sortedDates.forEach(date => {
                const recordedVal = product.days[date];
                if (recordedVal !== undefined && recordedVal !== null) {
                    currentKnownQty = String(recordedVal);
                }
                if (reportDates.includes(date)) {
                    rowData.push(currentKnownQty);
                }
            });

            // Fill placeholders
            while (rowData.length < MAX_DAYS) {
                rowData.push("");
            }

            body.push([product.product_name, ...rowData]);
        });

        // 5. Generate Table
        autoTable(doc, {
            head: [header],
            body: body,
            startY: 25,
            margin: { top: 30, left: 10, right: 10 },
            styles: { fontSize: 7, halign: 'center' },
            theme: "grid",
            tableWidth: 'auto',
            headStyles: {
                fillColor: [31, 41, 55], // gray-800
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 45, halign: 'left', fontStyle: 'bold' },
            },
            didParseCell: (data) => {
                // Color "0" as red
                if (data.column.index > 0 && data.cell.raw === "0") {
                    data.cell.styles.textColor = [220, 38, 38];
                    data.cell.styles.fontStyle = "bold";
                }
                // Placeholder styling
                if (data.cell.raw === "" && data.section === 'body') {
                    data.cell.styles.fillColor = [249, 250, 251];
                }
            },
            didDrawPage: (data) => {
                // Persistent Page Header
                doc.setFontSize(14);
                doc.setTextColor(17, 24, 39);
                doc.text(`Stock Matrix Report: ${outletName}`, data.settings.margin.left, 12);

                doc.setFontSize(8);
                doc.setTextColor(107, 114, 128);
                doc.text(`Range: ${startDate} to ${endDate} | Generated: ${new Date().toLocaleString()}`, data.settings.margin.left, 18);
            }
        });

        doc.save(`${outletName.replace(/\s+/g, '_')}_Report.pdf`);
    };


    // -------------------------------------------------------------------------
    // LIST VIEW LOGIC
    // -------------------------------------------------------------------------
    const [filterStatus, setFilterStatus] = useState<'All' | 'Submitted' | 'Missing' | 'Quick Visit'>('All');

    // List View specific filter
    const [listDateFilter, setListDateFilter] = useState<string>(() => new Date().toISOString().split('T')[0]);

    const { data: reportsData, isLoading: isListLoading, error: listError } = useQuery<OutletReport[]>({
        queryKey: ['merchandiser-reports', listDateFilter, selectedMerchandiser, selectedOutlet],
        queryFn: () => apiService.getMerchandiserReports({
            date: listDateFilter || undefined, // Use local filter if set
            merchandiser_id: selectedMerchandiser || undefined,
            outlet_id: selectedOutlet || undefined,
        }),
        enabled: viewMode === 'list',
    });

    const reports = Array.isArray(reportsData) ? reportsData : [];

    // Debug logging for List View
    if (viewMode === 'list') {
        console.log('📋 List View State:', {
            reportsData,
            reportsCount: reports.length,
            isListLoading,
            listError: listError?.message,
            filters: { selectedDate, selectedMerchandiser, selectedOutlet }
        });
    }

    const filteredReports = reports.filter((r: OutletReport) => {
        const matchesSearch =
            (r.outlet_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.merchandiser_name || '').toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;
        if (filterStatus === 'All') return true;
        if (filterStatus === 'Quick Visit') return r.quick_visit;
        if (filterStatus === 'Submitted') return true;
        return true;
    });

    // -------------------------------------------------------------------------
    // RENDER
    // -------------------------------------------------------------------------
    return (
        <div className="min-h-screen bg-gray-50/50 p-8 print:bg-white print:p-0">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Field Reports</h1>
                        <p className="text-gray-500 font-medium text-sm">View outlet stock data and submissions</p>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                        <button
                            onClick={() => setViewMode('matrix')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'matrix'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <LayoutGrid size={16} />
                            Stock Matrix
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'list'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            <List size={16} />
                            List View
                        </button>
                    </div>
                </div>

                {/* MATRIX VIEW */}
                {viewMode === 'matrix' && (
                    <div className="space-y-6">
                        {/* Matrix Controls */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 no-print">
                            <div className="flex flex-wrap gap-4 items-end">
                                <div className="flex-1 min-w-[250px]">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Select Outlet (Required)
                                    </label>
                                    <select
                                        value={selectedOutlet}
                                        onChange={(e) => setSelectedOutlet(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Choose an outlet to view report...</option>
                                        {outlets.map((o) => (
                                            <option key={o.outlet_id} value={o.outlet_id}>
                                                {o.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Merchandiser (Optional)
                                    </label>
                                    <select
                                        value={selectedMerchandiser}
                                        onChange={(e) => setSelectedMerchandiser(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">All Merchandisers</option>
                                        {merchandisers.map((m) => (
                                            <option key={m.merchandiser_id} value={m.merchandiser_id}>
                                                {m.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="w-40">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                        Days Range
                                    </label>
                                    <select
                                        value={daysBack}
                                        onChange={(e) => setDaysBack(Number(e.target.value))}
                                        className="w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value={7}>7 Days</option>
                                        <option value={14}>14 Days</option>
                                        <option value={30}>30 Days</option>
                                    </select>
                                </div>

                                <button
                                    onClick={handleExportPdf}
                                    disabled={!selectedOutlet || !matrixData}
                                    className="px-6 py-2.5 bg-blue-600 shadow-lg shadow-blue-100 text-white font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                >
                                    <Download size={18} />
                                    Export PDF
                                </button>
                            </div>
                        </div>

                        {/* Matrix Table */}
                        {!selectedOutlet ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center no-print">
                                <LayoutGrid size={48} className="mx-auto text-gray-200 mb-4" />
                                <h3 className="text-xl font-black text-gray-900 mb-2">Select an Outlet</h3>
                                <p className="text-gray-500">Choose an outlet above to generate the 7-day stock matrix report.</p>
                            </div>
                        ) : isMatrixLoading ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-gray-500 font-medium">Generating Matrix...</p>
                            </div>
                        ) : matrixError ? (
                            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-12 text-center">
                                <p className="text-red-600 font-bold text-lg mb-2">Failed to load stock matrix</p>
                                <p className="text-gray-600 text-sm">{(matrixError as any)?.message || 'Unknown error'}</p>
                                <p className="text-xs text-gray-400 mt-2">Check browser console for details</p>
                            </div>
                        ) : !matrixData || matrixData.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                                <p className="text-gray-500 font-medium">No stock data found for this outlet in the selected date range.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none">
                                {/* Print Header */}
                                <div className="hidden print:block p-6 border-b border-gray-200">
                                    <h1 className="text-2xl font-black text-gray-900">Stock Report: {outlets.find(o => o.outlet_id === selectedOutlet)?.name}</h1>
                                    <p className="text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold">
                                            <tr>
                                                <th className="px-6 py-4 sticky left-0 z-20 bg-gray-50 min-w-[200px] w-[200px] shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Product</th>
                                                <th className="px-4 py-4 text-center sticky left-[200px] z-20 bg-gray-50 min-w-[80px] w-[80px] border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Trend</th>
                                                {dateHeaders.map(date => (
                                                    <th key={date} className="px-4 py-4 text-center min-w-[100px]">
                                                        {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {(() => {
                                                let lastCategory = '';
                                                let lastSubCategory = '';

                                                return matrixData.map((item, idx) => {
                                                    const categoryChanged = (item.category || '') !== lastCategory;
                                                    const subCategoryChanged = (item.subCategory || '') !== lastSubCategory || categoryChanged;

                                                    const rows = [];

                                                    if (categoryChanged) {
                                                        lastCategory = item.category || '';
                                                        rows.push(
                                                            <tr key={`cat-${item.category || 'none'}`} className="bg-blue-50/80">
                                                                <td colSpan={dateHeaders.length + 2} className="px-6 py-2 font-black text-[10px] text-blue-800 uppercase tracking-widest sticky left-0 z-10 bg-blue-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">
                                                                    {item.category || 'Unknown'}
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    if (subCategoryChanged) {
                                                        lastSubCategory = item.subCategory || '';
                                                        rows.push(
                                                            <tr key={`sub-${item.category || 'none'}-${item.subCategory || 'none'}`} className="bg-teal-50/50">
                                                                <td colSpan={dateHeaders.length + 2} className="px-10 py-1.5 font-bold text-[10px] text-teal-700 italic border-b border-teal-100/50 sticky left-0 z-10 bg-teal-50/50">
                                                                    {item.subCategory || 'Other'}
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    rows.push(
                                                        <tr key={idx} className="hover:bg-gray-50/50">
                                                            <td className="px-6 py-4 font-bold text-gray-900 sticky left-0 z-10 bg-white border-r border-gray-100 min-w-[200px] w-[200px] truncate shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                                                {item.product_name}
                                                            </td>
                                                            <td className="px-4 py-4 text-center sticky left-[200px] z-10 bg-white border-r border-gray-200 min-w-[80px] w-[80px] shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                                                <div className="flex justify-center">{getTrendIcon(item.trend)}</div>
                                                            </td>
                                                            {dateHeaders.map((date, dIdx) => {
                                                                const qty = item.days[date] || 0;
                                                                const prev = dIdx > 0 ? item.days[dateHeaders[dIdx - 1]] : undefined;
                                                                return (
                                                                    <td key={date} className={`px-4 py-4 text-center font-bold text-gray-900 min-w-[100px] ${getCellColor(qty, prev)}`}>
                                                                        {qty === 0 ? <span className="text-red-600 font-bold">0</span> : qty}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    );

                                                    return rows;
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* LIST VIEW */}
                {viewMode === 'list' && (
                    <div className="space-y-6">
                        {/* List Filters code */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 no-print">
                            <div className="flex flex-wrap gap-4">
                                <div className="flex-1 min-w-[300px] relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search outlets or merchandisers..."
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border border-transparent focus:bg-white focus:border-blue-500 transition-all font-bold text-sm text-gray-900 outline-none"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                {/* Date Filter for List View */}
                                <div className="relative">
                                    <input
                                        type="date"
                                        id="list-date-filter"
                                        value={listDateFilter}
                                        onChange={(e) => setListDateFilter(e.target.value)}
                                        onClick={(e) => e.currentTarget.showPicker()}
                                        className="px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer h-[46px] w-[160px] appearance-none"
                                        placeholder="Filter by date"
                                    />
                                    <style>{`
                                        input[type="date"]::-webkit-calendar-picker-indicator {
                                            cursor: pointer;
                                            opacity: 0.6;
                                            filter: invert(0.5);
                                        }
                                        input[type="date"]::-webkit-calendar-picker-indicator:hover {
                                            opacity: 1;
                                        }
                                    `}</style>
                                </div>

                                <select
                                    value={selectedMerchandiser}
                                    onChange={(e) => setSelectedMerchandiser(e.target.value)}
                                    className="px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 min-w-[200px]"
                                >
                                    <option value="">All Merchandisers</option>
                                    {merchandisers.map(m => <option key={m.merchandiser_id} value={m.merchandiser_id}>{m.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2 no-print">
                            {isListLoading ? <p>Loading...</p> : filteredReports.map(r => (
                                <div key={r.report_id} onClick={() => navigate(`/reports/${r.report_id}`)} className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md cursor-pointer flex justify-between items-center transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-lg ${r.quick_visit ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {r.quick_visit ? <Zap size={20} /> : <FileText size={20} />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{r.outlet_name}</h4>
                                            <p className="text-xs text-gray-500">{r.merchandiser_name} • {new Date(r.submitted_at).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-900" />
                                </div>
                            ))}
                            {filteredReports.length === 0 && <p className="text-center text-gray-500 py-8">No reports found.</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
