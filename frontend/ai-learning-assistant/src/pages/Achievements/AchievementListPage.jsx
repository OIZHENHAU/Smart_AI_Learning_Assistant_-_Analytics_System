import React, { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import Spinner from "../../components/common/Spinner";
import achievementService from "../../services/AchievementService";
import { useAuth } from "../../context/AuthContext";
import {
    Award, Flame, Lock, Medal, Shield, Info, Bot, Gift,
    Dumbbell, Sparkles, Star, CheckSquare, Calendar, TrendingUp, Trophy, BarChart4Icon
} from 'lucide-react';


const LEVEL_START_TITLE = 'Student Explorer';
const LEVEL_END_TITLE = 'Knowledge Master';

const RECENT_BADGES = [
    { name: 'Feeling 22', description: 'Everything will be alright', icon: Star, color: 'bg-red-100 text-red-500' },
    { name: 'Train Expert', description: 'Generate summary for more than 50 times', icon: Dumbbell, color: 'bg-rose-100 text-rose-500' },
    { name: 'Breakthrough', description: 'Solve correctly on 20 difficulty questions', icon: Sparkles, color: 'bg-slate-200 text-slate-600' },
    { name: 'AI Explorer', description: 'Using AI assistant frequently', icon: Bot, color: 'bg-slate-900 text-cyan-400' },
    { name: 'Python Expert', description: 'Complete python lesson', icon: Lock, color: 'bg-slate-100 text-slate-400', locked: true },
];

const DAILY_GOALS = [
    { label: 'Complete 2 quizzes', current: 2, target: 2, icon: CheckSquare },
    { label: 'Study for 30 minutes', current: 12, target: 30, icon: Calendar },
    { label: 'Chat with AI assistant 10 times', current: 5, target: 10, icon: Bot },
];

const REDEEM_ITEMS = [
    { title: 'AI Hints', progress: '5/10', description: 'Get hints from AI when answering quiz', cost: 500, icon: Bot, color: 'bg-slate-100 text-slate-700' },
    { title: 'Score Shield', progress: '3/10', description: 'Protect your points from losing.', cost: 250, icon: Shield, color: 'bg-purple-100 text-purple-700' },
    { title: 'Extra Attempt', progress: '5/10', description: 'Allow extra attempt of quiz. (max 2 question)', cost: 1000, icon: Info, color: 'bg-yellow-100 text-yellow-700' },
];

const AchievementListPage = () => {
    const { user } = useAuth();
    const [achievementStatistic, setAchievementStatistic] = useState(null);
    const [currentUserLevelAndXP, setCurrentUserLevelAndXP] = useState(null);
    const [allPlayersXP, setAllPlayersXP] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                //Get the achievement statistic of the user
                const response = await achievementService.getAchievementStatistics();
                const data = Array.isArray(response?.data) ? response.data[0] : response?.data;
                setAchievementStatistic(data || null);

                //get the current level and the remaining XP of the user for the next level
                const levelAndXPResponse = await achievementService.getCurrentLevelAndXP();
                setCurrentUserLevelAndXP(levelAndXPResponse?.data || null);

                // Get XP for all players
                const allPlayersResponse = await achievementService.getAllPlayers();
                setAllPlayersXP(Array.isArray(allPlayersResponse?.data) ? allPlayersResponse.data : []);

            } catch (error) {
                toast.error('Fail to load the achievement data.');
                console.error("Fail to load the achievement data at the achievement list page due to: " + error);

            } finally {
                setLoading(false);
            }
        };

        // Initial fetch
        fetchStatistics();
        // Set up polling - refetch every 3 seconds
        const pollInterval = setInterval(fetchStatistics, 3000);
        // Cleanup interval when component unmounts
        return () => clearInterval(pollInterval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spinner />
            </div>
        );
    }

    //Achievemnt Statistics Calculation
    const level = achievementStatistic?.current_level ?? 0;
    const totalPoints = achievementStatistic?.total_points ?? 0;
    const currentStreak = achievementStatistic?.current_steak ?? 0;
    const totalXp = achievementStatistic?.total_xp ?? 0;
    const currentRank = achievementStatistic?.current_rank ?? 0;

    //Level Progress Calculation
    const currentLevelXP = currentUserLevelAndXP?.level_length ?? 0;
    const currentUserLevelXp = currentUserLevelAndXP?.total_xp ?? 0;
    const xpToNextLevel = currentLevelXP - currentUserLevelXp;
    const levelProgressPercent = 100 - Math.min(100, Math.round((xpToNextLevel / currentLevelXP) * 100));

    // Get top 3 players with medal colors assigned
    const medalColors = ['text-yellow-500', 'text-slate-400', 'text-amber-600'];
    const sortedPlayers = [...allPlayersXP].sort((a, b) => b.total_xp - a.total_xp);
    const topLearners = sortedPlayers.slice(0, 3).map((learner, index) => ({
                        ...learner,
                        medal: medalColors[index]
    }));

    // Calculate user's position in the leaderboard
    const currentUserID = user?.id;
    const currentUsername = user?.username || user?.name || 'Learner';
    const currentUserPosition = sortedPlayers.findIndex(player => player.id === currentUserID) + 1;
    const isUserInTopThree = currentUserPosition <= 3;

    //The four stat cards: Level, Total Points, Current Streak, Rank
    const statCards = [
        { label: 'Level', value: level, icon: TrendingUp, bg: 'bg-slate-100', iconColor: 'text-slate-500' },
        { label: 'Total Points', value: totalPoints, bg: 'bg-purple-100', icon: Gift, iconColor: 'text-purple-500' },
        { label: 'Current Streak', value: currentStreak, bg: 'bg-red-100', icon: Flame, iconColor: 'text-red-500' },
        { label: 'Rank', value: currentRank, icon: Award, bg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
                    <Trophy className="w-7 h-7 text-purple-600" strokeWidth={2} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Achievements</h1>
                    <p className="text-sm text-slate-500">Learn, earn points, unlock rewards and level up.</p>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((stat, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-xl shadow-slate-200/50 p-6 hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-200 hover:translate-y-1">
                        <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                            <stat.icon className={`w-6 h-6 ${stat.iconColor}`} strokeWidth={2} />
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 leading-tight">{stat.label}</div>
                            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Level Progress */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-5">Level Progress</h2>
                        <div className="text-center mb-3">
                            <span className="text-2xl font-bold text-purple-600">Level {level}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm font-semibold text-slate-700 mb-2">
                            <span>{LEVEL_START_TITLE}</span>
                            <span>{LEVEL_END_TITLE}</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-linear-to-r from-purple-400 to-purple-600 rounded-full"
                                style={{ width: `${levelProgressPercent}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                            <span>{currentUserLevelXp}/{currentLevelXP} XP</span>
                            <span>{xpToNextLevel} XP to next level</span>
                        </div>
                    </div>

                    {/* Recent Badges */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-slate-900">Recent Badges</h2>
                            <button className="text-sm font-semibold text-purple-500 hover:text-purple-700">See All</button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            {RECENT_BADGES.map((badge, i) => (
                                <div key={i} className="flex flex-col items-center text-center">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${badge.color} ${badge.locked ? 'opacity-60' : ''}`}>
                                        <badge.icon className="w-7 h-7" strokeWidth={2} />
                                    </div>
                                    <div className="text-sm font-bold text-slate-900">{badge.name}</div>
                                    <div className="text-xs text-slate-500 mt-1 leading-snug">{badge.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Redeem Points */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-slate-900">Redeem Points</h2>
                            <button className="text-sm font-semibold text-purple-500 hover:text-purple-700">See All</button>
                        </div>
                        <div className="space-y-3">
                            {REDEEM_ITEMS.map((item, i) => (
                                <div key={i} className={`rounded-xl p-4 ${item.color}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <item.icon className="w-5 h-5" strokeWidth={2} />
                                        <span className="text-xs font-semibold opacity-70">{item.progress}</span>
                                    </div>
                                    <div className="text-sm font-bold mb-1">{item.title}</div>
                                    <div className="text-xs opacity-80 leading-snug mb-2">{item.description}</div>
                                    <div className="text-sm font-bold">{item.cost.toLocaleString()} pts</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right column */}
                <div className="space-y-6">
                    {/* Daily Goals */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-slate-900">Daily Goals</h2>
                            <span className="text-xs text-slate-400">Reset in 10:35:52</span>
                        </div>
                        <div className="space-y-4">
                            {DAILY_GOALS.map((goal, i) => {
                                const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
                                const done = goal.current >= goal.target;
                                return (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                                            <goal.icon className="w-4.5 h-4.5 text-purple-600" strokeWidth={2} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-slate-800 mb-1.5">{goal.label}</div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${done ? 'bg-green-500' : 'bg-purple-500'}`} style={{ width: `${percent}%` }} />
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-500 shrink-0 mt-1">{goal.current}/{goal.target}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-5">
                            <button className="h-10 rounded-xl bg-purple-100 text-purple-700 text-sm font-semibold hover:bg-purple-200 transition-colors">
                                View All Goals
                            </button>
                            <button
                                disabled
                                className="h-10 rounded-xl bg-slate-100 text-slate-500 text-sm font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
                            >
                                <Lock className="w-3.5 h-3.5" strokeWidth={2} /> Claim (3/8)
                            </button>
                        </div>
                    </div>

                    {/* All Player */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-slate-900">Top Learner</h2>
                            <button className="text-sm font-semibold text-purple-500 hover:text-purple-700">See All</button>
                        </div>
                        <div className="space-y-3">
                            {topLearners.map((learner, i) => {
                                const isCurrentUser = learner.id === currentUserID;
                                return (
                                    <div
                                        key={i}
                                        className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                                            isCurrentUser
                                                ? 'bg-purple-100 border-2 border-purple-400'
                                                : ''
                                        }`}
                                    >
                                        <Medal className={`w-5 h-5 shrink-0 ${learner.medal}`} strokeWidth={2} />
                                        <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-xs font-bold shrink-0">
                                            {learner.username.charAt(0)}
                                        </div>
                                        <span className="flex-1 text-sm font-semibold text-slate-800 truncate">{learner.username}</span>
                                        <span className="text-sm font-bold text-slate-900">{learner.total_xp} XP</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Divider - 3 dots */}
                        {!isUserInTopThree && (
                            <div className="flex justify-center items-center my-1">
                                <span className="text-2xl text-slate-400 font-bold">•••</span>
                            </div>
                        )}

                        {/* User's row - only show if not in top 3 */}
                        {!isUserInTopThree && (
                            <div className="flex items-center gap-3 bg-purple-100 rounded-xl px-3 py-2.5">
                                <span className="w-5 text-center text-sm font-bold text-purple-700 shrink-0">{currentUserPosition}</span>
                                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {currentUsername.charAt(0).toUpperCase()}
                                </div>
                                <span className="flex-1 text-sm font-bold text-slate-900 truncate">{currentUsername}</span>
                                <span className="text-sm font-bold text-slate-900">{totalXp} XP</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AchievementListPage;
