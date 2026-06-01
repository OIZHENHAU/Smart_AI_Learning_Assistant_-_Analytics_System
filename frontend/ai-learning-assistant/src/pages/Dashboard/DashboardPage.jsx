import React, { useState, useEffect } from 'react';
import Spinner from '../../components/common/Spinner';
import mainDashboardService from '../../services/DashboardService';
import toast from 'react-hot-toast';
import { FileText, BookOpen, Brain, Upload, Languages, Trophy, StarIcon, Calendar, BellIcon, ChartLineIcon, TrendingUp } from 'lucide-react'

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

    return (<div>DashboardPage</div>)
}

export default DashboardPage