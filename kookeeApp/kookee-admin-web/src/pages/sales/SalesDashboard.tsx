import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Truck, Users } from 'lucide-react';

export const SalesDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Sales Comand Center</h1>
            <p className="text-gray-500">Manage your sales force, routes, and live tracking.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Live Tracking Card */}
                <div
                    onClick={() => navigate('/sales/live-tracking')}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow group"
                >
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                        <MapPin className="text-orange-600" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Live Tracking</h3>
                    <p className="text-sm text-gray-500">View real-time locations of all active sales agents on the map.</p>
                </div>

                {/* Route Management Card */}
                <div
                    onClick={() => navigate('/sales/routes')}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow group"
                >
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                        <Truck className="text-emerald-600" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Route Management</h3>
                    <p className="text-sm text-gray-500">Manage territories, routes, assignments, and customer sequences.</p>
                </div>

                {/* Agents Card */}
                <div
                    onClick={() => navigate('/sales/agents')}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow group"
                >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                        <Users className="text-blue-600" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Sales Agents</h3>
                    <p className="text-sm text-gray-500">Manage sales staff, activation status, and profiles.</p>
                </div>

            </div>
        </div>
    );
};
