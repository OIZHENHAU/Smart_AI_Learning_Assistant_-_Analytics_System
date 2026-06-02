import React, { useState, useEffect } from 'react';
import Spinner from '../../components/common/Spinner';
import mainDashboardService from '../../services/DashboardService';
import toast from 'react-hot-toast';
import { GlassesIcon, FileText, BookOpen, Brain, Upload, Languages, Trophy, StarIcon, Calendar, BellIcon, ChartLineIcon, TrendingUp, Clock } from 'lucide-react'

const DashboardPage = () => {
    const [mainDashboardData, setMainDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMainDashboardData = async () => {
            try {
                const data = await mainDashboardService.getMainDashboard();
                console.log("The data for get main dashboard data", data);

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
        return <Spinner />;
    }

    if (!mainDashboardData) {
        return (
            <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center'>
                <div className='text-center'>
                    <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4'>
                        <TrendingUp className='w-8 h-8 text-slate-400'/>
                    </div>
                    <p className='text-slate-600 text-sm'>No main dashboard data available.</p>
                </div>
            </div>
        );
    }

    const stats = [
        {
            label: 'Total Documents',
            value: mainDashboardData.data.total_document,
            icon: BookOpen,
            gradient: 'from-blue-400 to-blue-500',
            shadowColor: 'shadow-blue-600/25'
        },
        {
            label: 'Total Quizzes',
            value: mainDashboardData.data.total_quiz,
            icon: FileText,
            gradient: 'from-green-300 to-green-400',
            shadowColor: 'shadow-green-400/25'
        },
        {
            label: 'Earn Points',
            value: "88",
            icon: StarIcon,
            gradient: 'from-purple-400 to-purple-500',
            shadowColor: 'shadow-purple-500/25'
        },
        {
            label: 'place in the leaderboard.',
            value: "8th",
            icon: Trophy,
            gradient: 'from-orange-400 to-orange-500',
            shadowColor: 'shadow-orange-500/25'
        }
    ]

    return (
        <div className='min-h-screen'>
            <div className='absolute inset-0 bg-[radial-gradient(#e5e7eb_1px, transparent_1px)] bg-sze-[16px_16px] opacity-30 pointer-events-none'/>

            <div className='relative max-w-7xl mx-auto'>
                {/* Header */}
                <div className='mb-6 bg-purple-200'>
                    <h1 className='text-2xl font-medium text-slate-900 tracking-tight mb-2'>
                        Welcome back, zhenhau! 
                    </h1>
                    <p className='text-slate-500 text-sm'>
                        Continue to explore your learning journey!
                    </p>
                </div>

                {/* Stats Grid */}
                <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-5'>
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className='group-relative bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-200/50 p-6 hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-200 hover:translate-y-1'
                        >
                            <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${stat.gradient} shadow-lg ${stat.shadowColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                    <stat.icon className='w-5 h-5 text-white' strokeWidth={2} />
                            </div>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>
                                    {stat.label}
                                </span>
                                <div className='text-3xl font-semibold text-slate-900 tracking-tight'>
                                    {stat.value}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Activity Section */}
                <div className='bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-200/50 p-1'>
                    <div className='flex items-center gap-3 mb-6'>
                        <div className='w-10 h-10 rounded-xl bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center'>
                            <Clock className='w-5 h-5 text-slate-600' strokeWidth={2}/>
                        </div>
                        <h3 className="text-xl font-medium text-slate-900 tracking-tight">
                            Recent Activity
                        </h3>
                    </div>

                    {(mainDashboardData.recent_document && mainDashboardData.recent_document.length > 0)
                        && (mainDashboardData.recent_quizzes && mainDashboardData.recent_quizzes.length > 0)
                    ?
                    (<div className='space-y-3'>
                        {[
                            ...(mainDashboardData.recent_document || []).map(document => ({
                                id: document.id,
                                description: document.title,
                                timestamp: document.last_accessed,
                                link: `/documents/${document.id}`,
                                type: 'document'
                            })),
                            ...BellIcon(mainDashboardData.recent_quizzes || []).map(quiz => ({
                                id: quiz.id,
                                description: quiz.title,
                                timestamp: quiz.last_attempt,
                                link: `/quizzes/${quiz.id}`,
                                type: 'quiz'
                            }))
                        ].sort((x, y) => new Date(y.timestamp) - new Date(x.timestamp))
                            .map((activity, index) => (
                                <div
                                    key={activity.id || index}
                                    className='group flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-200/60 hover:bg-white hover:border-slate-300/60 hover:shadow-md transition-all duration-200'
                                >
                                    <div className='flex-1 min-w-0'>
                                        <div className='flex items-center gap-2 mb-1'>
                                            <div className={`w-2 h-2 rounded-full bg-linear-to-br from-purple-400 to-purple-500`}/>
                                            <p className='text-sm font-medium text-slate-900 truncate'>
                                                {activity.type === "document" ? 'Document Accessed' : 'Quiz Attempted'}
                                                <span className='text-slate-900'>{activity.description}</span>
                                            </p>
                                        </div>
                                        <p className='text-xs text-slate-500 pl-4'>
                                            {new Date(activity.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    {activity.link && (<a href={activity.link} className='ml-4 px-4 text-xs font-semibold text-purple-500'>View</a>)}
                                </div>
                            ))
                        }
                    </div>)
                    :
                    (<div className='text-center py-12'>
                        <div className='inline-flex items-center justify-center w-16 h-16 rounded-xl bg-slate-400 mb-4'>
                            <GlassesIcon className='w-8 h-8 text-slate-400'/>
                        </div>
                        <p className='text-sm text-slate-600'>No recent activity yet.</p>
                        <p className='text-xs text-slate-500 mt-1'>Start learning to see your progress here.</p>

                    </div>)
                    }
                </div>
            </div>
        </div>
    )
}

export default DashboardPage
