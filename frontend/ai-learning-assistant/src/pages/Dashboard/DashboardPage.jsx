import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Spinner from '../../components/common/Spinner';
import mainDashboardService from '../../services/DashboardService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FileText, BookOpen, Upload, Languages, Trophy, Star, Calendar, Bell, TrendingUp, Clock, Award } from 'lucide-react';
import moment from 'moment';

const features = [
    {
        title: 'AI Content Generator',
        description: 'Upload PDFs to generate summaries, flashcards, and quizzes',
        icon: Upload,
        bg: 'bg-blue-500',
    },
    {
        title: 'Multilingual Translation',
        description: 'Translate learning content into multiple languages',
        icon: Languages,
        bg: 'bg-green-500',
    },
    {
        title: 'Unlock Achievements',
        description: 'Use points to unlock different learning features, badges and so on.',
        icon: Award,
        bg: 'bg-purple-600',
    },
    {
        title: 'Quiz Calendar',
        description: 'Schedule and track your quiz sessions',
        icon: Calendar,
        bg: 'bg-slate-400',
    },
    {
        title: 'WhatsApp Reminders',
        description: 'Get automated quiz reminders via WhatsApp',
        icon: Bell,
        bg: 'bg-pink-500',
    },
    {
        title: 'Performance Analytics',
        description: 'Track scores and study patterns with AI insights',
        icon: TrendingUp,
        bg: 'bg-violet-500',
    },
];

const DashboardPage = () => {
    const { user } = useAuth();
    const [mainDashboardData, setMainDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMainDashboardData = async () => {
            try {
                const data = await mainDashboardService.getMainDashboard();
                setMainDashboardData(data);
            } catch (error) {
                toast.error('Fail to fetch the main dashboard data at the page.');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchMainDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spinner />
            </div>
        );
    }

    const data = mainDashboardData?.data || {};
    const recentDocuments = mainDashboardData?.recent_document || [];
    const recentQuizzes = mainDashboardData?.recent_quizzes || [];

    const stats = [
        {
            label: 'Uploaded Document',
            value: data.total_document ?? 0,
            icon: BookOpen,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-500',
        },
        {
            label: 'Quiz Taken',
            value: data.total_quiz ?? 0,
            icon: FileText,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-500',
        },
        {
            label: 'Total points',
            value: data.total_points ?? 0,
            icon: Star,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-500',
        },
        {
            label: 'place in the leaderboard',
            value: data.leaderboard_rank ? `${data.leaderboard_rank}th` : 'N/A',
            icon: Trophy,
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-500',
            smallValue: true,
        },
    ];

    const activities = [
        ...recentDocuments.map(doc => ({
            id: `doc-${doc.id}`,
            description: `Accessed Document: ${doc.title}`,
            timestamp: doc.last_accessed,
            link: `/documents/${doc.id}`,
        })),
        ...recentQuizzes.map(quiz => ({
            id: `quiz-${quiz.id}`,
            description: `Attempted Quiz: ${quiz.title}`,
            timestamp: quiz.last_attempt,
            link: `/quizzes/${quiz.id}/results`,
        })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const username = user?.username || user?.name || 'Learner';
    const initial = username.charAt(0).toUpperCase();

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Welcome Header */}
            <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-2xl font-bold border-4 border-white shadow-md">
                        {initial}
                    </div>
                    <div className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-slate-700 text-white text-xs font-bold flex items-center justify-center border-2 border-white">
                        {data.level ?? 1}
                    </div>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Welcome back, {username}!</h1>
                    <p className="text-sm text-slate-500">{data.xp_to_next_level ?? 0} XP to the next level</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="h-27 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-xl shadow-slate-200/50 p-6 hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-200 hover:translate-y-1">
                        <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}>
                            <stat.icon className={`w-6 h-6 ${stat.iconColor}`} strokeWidth={2} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                            <div className="text-xs text-slate-500 leading-tight">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Features */}
            <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Features</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {features.map((feature, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                            <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                                <feature.icon className="w-6 h-6 text-white" strokeWidth={2} />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mb-1">{feature.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <Clock className="w-5 h-5 text-slate-500" strokeWidth={2} />
                    <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
                </div>

                {activities.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {activities.slice(0, 5).map((activity) => (
                            <div key={activity.id} className="flex items-center justify-between py-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{activity.description}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {moment(activity.timestamp).format('Today, HH:mm:ss')}
                                        </p>
                                    </div>
                                </div>
                                <Link to={activity.link} className="text-sm font-semibold text-purple-500 hover:text-purple-700 shrink-0 ml-4">
                                    View
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-sm text-slate-500">No recent activity yet.</p>
                        <p className="text-xs text-slate-400 mt-1">Start learning to see your progress here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
