import React, { createContext, useContext, useState, ReactNode } from 'react';
import { format } from 'date-fns';

type DashboardMode = 'sales' | 'merchandiser';

interface DashboardContextType {
    mode: DashboardMode;
    setMode: (mode: DashboardMode) => void;
    selectedDate: string;
    setSelectedDate: (date: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<DashboardMode>('sales');
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    return (
        <DashboardContext.Provider value={{ mode, setMode, selectedDate, setSelectedDate }}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};
