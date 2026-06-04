import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import authService from '../../services/AuthService';
import { Brain, User, Mail, Lock, Phone, ArrowRight } from "lucide-react";
import toast from 'react-hot-toast';


const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        setError('');
        setLoading(true);
        try {
            await authService.register(username, email, password);
            toast.success('Register is successful. Please log in to your account.');
            navigate('/login');

        } catch (error) {
            setError(error.message || "FAiled to register. Please try again.");
            toast.error(error.message || "Failed to register.");

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-50">
                    <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px, transparent_1px)] bg-size-[16px_16px] opacity-30"/>
        
                    <div className="relative w-full max-w-md px-6">
                        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/50 p-10">
                            {/* Header */}
                            <div className="text-center mb-10">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/25 mb-6">
                                    <Brain className="w-7 h-7 text-white" strokeWidth={2} />
                                </div>
                                <h1 className="text-2xl font-medium text-slate-900 tracking-tight mb-2">
                                    Create An Account
                                </h1>
                                <p className="text-slate-500 text-sm">
                                    Create an account to explore the amazing journey.
                                </p>
                            </div>
        
                            {/* Form */}
                            <div className="space-y-5">
                                {/* Username field */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                        Username
                                    </label>
                                    <div className="relative group">
                                        <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200
                                            ${focusedField === "username" ? 'text-purple-600' : "text-slate-400"}`}>
                                                <User className="h-5 w-5" strokeWidth={2}/>
                                        </div>
                                        <input type="text" value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            onFocus={() => setFocusedField("username")}
                                            onBlur={() => setFocusedField(null)}
                                            className="w-full h-12 pl-12 pr-4 border-2 border-slate-400 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 focus:outlier-none focus:border-purple-400"
                                            placeholder="yourusername"
                                        />

                                    </div>

                                </div>

                                {/* Email Field */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                        Email
                                    </label>
                                    <div className="relative group">
                                        <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200
                                            ${focusedField === "email" ? 'text-purple-600' : "text-slate-400"}`}>
                                            <Mail className="h-5 w-5" strokeWidth={2} />
                                        </div>
                                        <input type="email" value={email} 
                                            onChange={(e) => setEmail(e.target.value)}
                                            onFocus={() => setFocusedField('email') }
                                            onBlur={() => setFocusedField(null) }
                                            className="w-full h-12 pl-12 pr-4 border-2 border-slate-400 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 focus:outlier-none focus:border-purple-400"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>
        
                                {/* Password Field */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                        Password
                                    </label>
                                    <div className="relative group">
                                        <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200
                                            ${focusedField === 'password' ? 'text-purple-600' : "text-slate-400"}`}>
                                            <Lock className="h-5 w-5" strokeWidth={2}/>
                                        </div>
                                        <input type="password" value={password} 
                                            onChange={(e) => setPassword(e.target.value)}
                                            onFocus={() => setFocusedField('password') }
                                            onBlur={() => setFocusedField(null) }
                                            className="w-full h-12 pl-12 pr-4 border-2 border-slate-400 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 focus:outlier-none focus:border-purple-400"
                                            placeholder="********"
                                        />
                                    </div>
                                </div>
        
                                {/* Error Message */}
                                {error && (
                                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                                        <p className="text-xs text-red-600 font-medium text-center">{error}</p>
                                    </div>
                                )}
        
                                {/* Submit Button */}
                                <button onClick={handleSubmit} disabled={loading} className="w-full h-12 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors duration-200">
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                                            Creating Account...
                                        </>
                                    ) : (
                                        <>Creating Account <ArrowRight className="w-4 h-4" strokeWidth={2.5}/></>
                                    )}
                                </button>
                            </div>
        
                            {/* Footer */}
                            <div className="mt-8 pt-6 border-t border-slate-200/60">
                                <p className="text-center text-sm text-slate-600">
                                    Already have an account?{' '}
                                    <Link to='/login' className="font-semibold text-purple-600 hover:text-purple-700 transition-colors duration-200">
                                        Login
                                    </Link>
                                </p>
                            </div>
        
                            {/* Subtle footer text */}
                            <p className="text-center text-xs text-slate-400 mt-6">
                                By continuing, you agree to our Terms & Privacy Policy.
                            </p>
                        </div>
                    </div>
                </div>
    )
}

export default RegisterPage