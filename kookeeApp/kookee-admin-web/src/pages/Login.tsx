import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, AlertCircle, Server } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Call Real Backend
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                // Save Real Token
                localStorage.setItem('admin_token', data.token);
                // Save user info just in case
                localStorage.setItem('admin_user', JSON.stringify(data.user));

                toast.success(`Welcome back, ${data.user.full_name || 'Admin'}!`);
                navigate('/dashboard');
            } else {
                toast.error(data.error || 'Invalid credentials');
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Login error:', err);
            toast.error('Connection failed. Backend may be offline.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-[30%] -left-[10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[100px]"></div>
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-purple-600/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10 flex flex-col md:flex-row">

                <div className="w-full p-8 md:p-10">
                    <div className="mb-8">
                        <h1 className="text-3xl font-black tracking-tighter text-blue-600 mb-1">KOOKEE <span className="text-gray-900">ADMIN</span></h1>
                        <p className="text-gray-500 font-medium text-sm">Sign in to access the command center</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-900 uppercase ml-1">Username / Email</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                    placeholder="admin"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-900 uppercase ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                            <label className="flex items-center gap-2 cursor-pointer text-gray-500 font-medium">
                                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                Remember me
                            </label>
                            <a href="#" className="font-bold text-blue-600 hover:text-blue-700">Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                        >
                            {isLoading ? (
                                <span className="animate-pulse">Authenticating...</span>
                            ) : (
                                <>
                                    <span>Access Dashboard</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 bg-gray-50 py-2 px-4 rounded-full mx-auto w-fit">
                            <AlertCircle size={14} className="text-blue-600" />
                            <span>Use <b>admin</b> / <b>admin123</b></span>
                        </div>

                        {/* Connection Status Indicator */}
                        <div className="mt-4 flex items-center justify-center gap-1 text-[10px] text-gray-400">
                            <Server size={10} />
                            <span>Connecting to: http://localhost:3000</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-6 text-center w-full z-10 opacity-30">
                <p className="text-white text-xs font-mono">Kookee Ops Platform v1.2.0 • Secured</p>
            </div>
        </div>
    );
};
