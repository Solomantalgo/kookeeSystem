import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

export const DashboardSelector: React.FC = () => {
    const { mode, setMode } = useDashboard();
    const navigate = useNavigate();

    const handleSelect = (newMode: 'sales' | 'merchandiser') => {
        setMode(newMode);
        if (newMode === 'sales') {
            navigate('/sales');
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <div className="flex bg-gray-100 p-1 rounded-lg sm:rounded-xl border border-gray-200">
            <button
                onClick={() => handleSelect('sales')}
                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'sales'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
            >
                <TrendingUp size={14} className="flex-shrink-0" />
                <span className="hidden sm:inline">Sales Ops</span>
            </button>
            <button
                onClick={() => handleSelect('merchandiser')}
                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'merchandiser'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
            >
                <Users size={14} className="flex-shrink-0" />
                <span className="hidden sm:inline">Merchandisers</span>
            </button>
        </div>
    );
};
