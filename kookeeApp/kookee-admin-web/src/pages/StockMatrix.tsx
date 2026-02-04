import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StockMatrixData {
    product_name: string;
    category?: string;
    subCategory?: string;
    days: {
        [date: string]: number;
    };
    trend: 'increasing' | 'decreasing' | 'stable';
}

export const StockMatrix = () => {
    const navigate = useNavigate();
    const [selectedOutlet, setSelectedOutlet] = useState<string>('');
    const [daysBack, setDaysBack] = useState(7);

    // Calculate date range
    // Calculate date range
    // Allow future dates by setting endDate to 30 days ahead
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch outlets for dropdown
    const { data: outlets = [] } = useQuery({
        queryKey: ['outlets'],
        queryFn: () => apiService.getOutlets(),
    });

    // Fetch stock matrix data
    const { data: matrixData, isLoading, error } = useQuery<StockMatrixData[]>({
        queryKey: ['stock-matrix', selectedOutlet, startDate, endDate],
        queryFn: () => apiService.getStockMatrix(selectedOutlet, startDate, endDate),
        enabled: !!selectedOutlet, // Only fetch if outlet is selected
    });

    // Generate date headers dynamically based on ACTUAL data present
    const uniqueDates = new Set<string>();
    if (matrixData) {
        matrixData.forEach(item => {
            Object.keys(item.days).forEach(date => uniqueDates.add(date));
        });
    }
    const dateHeaders = Array.from(uniqueDates).sort();

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'increasing':
                return <TrendingUp size={16} className="text-green-600" />;
            case 'decreasing':
                return <TrendingDown size={16} className="text-red-600" />;
            default:
                return <Minus size={16} className="text-gray-400" />;
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

        // Sort dates chronologically
        const sortedDates = [...dateHeaders].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        // Take the last 13 days (most recent) for the report
        const reportDates = sortedDates.slice(-MAX_DAYS);
        const emptyColumnsNeeded = MAX_DAYS - reportDates.length;

        // Headers: Format as MM/DD/YY
        const formattedDates = reportDates.map(d => {
            const dateObj = new Date(d);
            return `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear().toString().slice(2)}`;
        });
        const placeholderHeaders = Array(emptyColumnsNeeded).fill("NO UPDATE");
        const header = ["Item", ...formattedDates, ...placeholderHeaders];

        const doc = new jsPDF({ orientation: "landscape" });
        const body: any[] = [];

        // Build Rows with Carry-over logic
        matrixData.forEach(product => {
            const rowData: string[] = [];
            let currentKnownQty = "0";

            // Process ALL sorted dates in the matrix to ensure accurate carry-over
            sortedDates.forEach(date => {
                const recordedVal = product.days[date];
                if (recordedVal !== undefined && recordedVal !== null) {
                    currentKnownQty = String(recordedVal);
                }

                // If this date is within our 13-day report window, add it to the row
                if (reportDates.includes(date)) {
                    rowData.push(currentKnownQty);
                }
            });

            // Fill remaining columns if data < 13 days
            while (rowData.length < MAX_DAYS) {
                rowData.push("");
            }

            body.push([product.product_name, ...rowData]);
        });

        autoTable(doc, {
            head: [header],
            body: body,
            startY: 25,
            styles: { fontSize: 7, halign: 'center' },
            theme: "grid",
            tableWidth: 'auto',
            headStyles: {
                fillColor: [37, 99, 235], // Blue-600
                textColor: [255, 255, 255],
                fontSize: 8,
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 45, halign: 'left', fontStyle: 'bold' },
            },
            didParseCell: (data) => {
                // Style out of stock (0) as red and bold
                if (data.column.index > 0 && data.cell.raw === "0") {
                    data.cell.styles.textColor = [220, 38, 38]; // Red-600
                    data.cell.styles.fontStyle = "bold";
                }
                // Light gray for empty placeholder cells
                if (data.cell.raw === "" && data.section === 'body') {
                    data.cell.styles.fillColor = [249, 250, 251];
                }
            },
            didDrawPage: (data) => {
                // Add header info
                doc.setFontSize(16);
                doc.setTextColor(17, 24, 39); // Gray-900
                doc.text(`Stock Matrix Report: ${outletName}`, data.settings.margin.left, 15);

                doc.setFontSize(9);
                doc.setTextColor(107, 114, 128); // Gray-500
                doc.text(`Generated on: ${new Date().toLocaleDateString()} | Strategy: 13-Day Chronological Carry-over`, data.settings.margin.left, 21);
            }
        });

        doc.save(`${outletName.replace(/\s+/g, '_')}_Stock_Matrix_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Stock Matrix</h1>
                        <p className="text-gray-500 font-medium text-sm">7-day stock comparison and trend tracking</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                Select Outlet
                            </label>
                            <select
                                value={selectedOutlet}
                                onChange={(e) => setSelectedOutlet(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                            >
                                <option value="">Choose an outlet...</option>
                                {outlets.map((o) => (
                                    <option key={o.outlet_id} value={o.outlet_id}>
                                        {o.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="w-48">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                Days Back
                            </label>
                            <select
                                value={daysBack}
                                onChange={(e) => setDaysBack(Number(e.target.value))}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value={7}>7 Days</option>
                                <option value={14}>14 Days</option>
                                <option value={30}>30 Days</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleExportPdf}
                                disabled={!selectedOutlet || isLoading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download size={18} />
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>

                {/* Matrix Table */}
                {!selectedOutlet ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <p className="text-gray-500 text-lg">Please select an outlet to view stock matrix</p>
                    </div>
                ) : isLoading ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : error ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <p className="text-red-500 font-bold">Error loading stock matrix</p>
                        <p className="text-gray-500 text-sm mt-2">Please try again</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 sticky left-0 z-20 bg-gray-50 text-left text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[200px] w-[200px] shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                            Product Name
                                        </th>
                                        <th className="px-4 py-4 text-center sticky left-[200px] z-20 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[80px] w-[80px] border-r border-gray-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                            Trend
                                        </th>
                                        {dateHeaders.map((date) => (
                                            <th key={date} className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[100px]">
                                                {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(() => {
                                        let lastCat = '';
                                        let lastSub = '';

                                        return (matrixData || []).map((product, idx) => {
                                            const catChanged = (product.category || '') !== lastCat;
                                            const subChanged = (product.subCategory || '') !== lastSub || catChanged;

                                            const rows = [];

                                            if (catChanged) {
                                                lastCat = product.category || '';
                                                rows.push(
                                                    <tr key={`cat-${product.category || 'none'}`} className="bg-blue-50/80">
                                                        <td colSpan={dateHeaders.length + 2} className="px-6 py-2 font-black text-[10px] text-blue-800 uppercase tracking-widest sticky left-0 z-10 bg-blue-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">
                                                            {product.category || 'Unknown'}
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            if (subChanged) {
                                                lastSub = product.subCategory || '';
                                                rows.push(
                                                    <tr key={`sub-${product.category || 'none'}-${product.subCategory || 'none'}`} className="bg-teal-50/50">
                                                        <td colSpan={dateHeaders.length + 2} className="px-10 py-1.5 font-bold text-[10px] text-teal-700 italic border-b border-teal-100/50 sticky left-0 z-10 bg-teal-50/50">
                                                            {product.subCategory || 'Other'}
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            rows.push(
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="sticky left-0 z-10 bg-white px-6 py-4 font-semibold text-gray-900 border-r border-gray-100 min-w-[200px] w-[200px] truncate shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                                        {product.product_name}
                                                    </td>
                                                    <td className="px-4 py-4 text-center sticky left-[200px] z-10 bg-white border-r border-gray-200 min-w-[80px] w-[80px] shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                                        {getTrendIcon(product.trend)}
                                                    </td>
                                                    {dateHeaders.map((date, dayIdx) => {
                                                        const quantity = product.days[date] || 0;
                                                        const prevQuantity = dayIdx > 0 ? product.days[dateHeaders[dayIdx - 1]] : undefined;
                                                        return (
                                                            <td
                                                                key={date}
                                                                className={`px-4 py-4 text-center min-w-[100px] ${getCellColor(quantity, prevQuantity)}`}
                                                            >
                                                                {quantity === 0 ? (
                                                                    <span className="text-red-600 font-bold">0</span>
                                                                ) : (
                                                                    quantity
                                                                )}
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

                {/* Legend */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Legend</h3>
                    <div className="flex gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-50 border border-green-200 rounded"></div>
                            <span className="text-gray-700">Increased from previous day</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-red-50 border border-red-200 rounded"></div>
                            <span className="text-gray-700">Decreased from previous day</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-50 border border-gray-200 rounded"></div>
                            <span className="text-gray-700">No change or first day</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-red-600 font-bold">0</span>
                            <span className="text-gray-700">Out of stock</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
