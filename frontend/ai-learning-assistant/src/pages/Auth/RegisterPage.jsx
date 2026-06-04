import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/AuthService';
import { Brain, User, Mail, Lock, ArrowRight } from "lucide-react";
import toast from 'react-hot-toast';

const AuthInput = ({ label, icon: Icon, type = "text", value, onChange, placeholder, focusKey, focusedField, onFocus, onBlur }) => (
    <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">{label}</label>
        <div className="relative">
            <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${focusedField === focusKey ? 'text-purple-500' : 'text-slate-400'}`}>
                <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <input
                type={type}
                value={value}
                onChange={onChange}
                onFocus={() => onFocus(focusKey)}
                onBlur={() => onBlur(null)}
                placeholder={placeholder}
                className="w-full h-12 pl-12 pr-4 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 focus:outline-none focus:border-purple-400 focus:bg-white"
            />
        </div>
    </div>
);

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username.trim()) { setError("Username is required."); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
        if (password !== confirmPassword) { setError("Passwords do not match."); return; }

        setLoading(true);
        try {
            await authService.register(username, email, password);
            toast.success('Account created! Please log in.');
            navigate('/login');
        } catch (error) {
            const msg = error.message || "Failed to register. Please try again.";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Left Panel */}
            <div className="hidden md:flex md:w-5/12 bg-purple-600 flex-col justify-between p-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-white font-bold text-lg">LearnAI</span>
                </div>

                <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-white leading-tight">
                        Start learning smarter today
                    </h2>
                    <p className="text-purple-200 text-sm leading-relaxed">
                        Join thousands of students already using LearnAI to ace their exams and master new topics.
                    </p>
                </div>

                <p className="text-purple-300 text-xs">© 2026 LearnAI · FYP Project 1</p>
            </div>

            {/* Right Panel */}
            <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
                <div className="w-full max-w-md space-y-8">
                    {/* Icon */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center">
                            <Brain className="w-8 h-8 text-purple-600" strokeWidth={2} />
                        </div>
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-slate-900">Create An Account</h1>
                            <p className="text-slate-500 text-sm mt-1">Create an account to explore the amazing journey.</p>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="space-y-4">
                        <AuthInput label="Username" icon={User} value={username}
                            onChange={(e) => setUsername(e.target.value)} placeholder="yourusername"
                            focusKey="username" focusedField={focusedField} onFocus={setFocusedField} onBlur={setFocusedField}
                        />
                        <AuthInput label="Email" icon={Mail} type="email" value={email}
                            onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                            focusKey="email" focusedField={focusedField} onFocus={setFocusedField} onBlur={setFocusedField}
                        />
                        <AuthInput label="Password" icon={Lock} type="password" value={password}
                            onChange={(e) => setPassword(e.target.value)} placeholder="********"
                            focusKey="password" focusedField={focusedField} onFocus={setFocusedField} onBlur={setFocusedField}
                        />
                        <AuthInput label="Confirm Password" icon={Lock} type="password" value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)} placeholder="********"
                            focusKey="confirmPassword" focusedField={focusedField} onFocus={setFocusedField} onBlur={setFocusedField}
                        />

                        {error && (
                            <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                                <p className="text-xs text-red-600 font-medium text-center">{error}</p>
                            </div>
                        )}

                        <button onClick={handleSubmit} disabled={loading}
                            className="w-full h-12 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors duration-200 mt-2">
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating Account...</>
                            ) : (
                                <>Creating Account <ArrowRight className="w-4 h-4" strokeWidth={2.5} /></>
                            )}
                        </button>
                    </div>

                    <div className="border-t border-slate-200 pt-6 space-y-3 text-center">
                        <p className="text-sm text-slate-600">
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold text-purple-600 hover:text-purple-700 transition-colors">Login</Link>
                        </p>
                        <p className="text-xs text-slate-400">By continuing, you agree to our Terms & Privacy Policy.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
