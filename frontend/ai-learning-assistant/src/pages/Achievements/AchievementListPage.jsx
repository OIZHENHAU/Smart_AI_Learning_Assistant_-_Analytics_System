import React, { useState, useEffect, useCallback } from "react";
import toast from 'react-hot-toast';
import Spinner from "../../components/common/Spinner";
import achievementService from "../../services/AchievementService";
import { useAuth } from "../../context/AuthContext";
import {
    Award, Flame, Lock, Medal, Shield, Info, Bot, Gift,
    Star, CheckSquare, Calendar, TrendingUp,
    Trophy, BarChart4Icon, BadgeCheckIcon, Upload, Snowflake
} from 'lucide-react';
import CountdownTimer from "../../components/common/CountdownTimer";


// Determine a suitable icon component for a daily goal based on its fields
const getGoalIcon = (goal) => {
    const key = (goal.main_focus || '').toString().toLowerCase();
    if (key.includes('study_time') || key.includes('minute') || key.includes('time')) return Calendar;
    if (key.includes('chat') || key.includes('ai') || key.includes('assistant')) return Bot;
    if (key.includes('quiz') || key.includes('quizzes')) return CheckSquare;
    if (key.includes('upload') || key.includes('done')) return Upload;
    if (key.includes('xp') || key.includes('experience')) return Award;
    return Star;
};


const LEVEL_START_TITLE = 'Student Explorer';
const LEVEL_END_TITLE = 'Knowledge Master';


const REDEEM_ITEMS = [
    { title: 'AI Hints', progress: '5/10', description: 'Get hints from AI when answering quiz', cost: 500, icon: Bot, color: 'bg-slate-100 text-slate-700', iconBg: 'bg-white text-slate-600' },
    { title: 'Score Shield', progress: '3/10', description: 'Protect your points from losing.', cost: 250, icon: Shield, color: 'bg-purple-100 text-purple-700', iconBg: 'bg-white text-purple-600' },
    { title: 'Extra Attempt', progress: '5/10', description: 'Allow extra attempt of quiz. (max 2 question)', cost: 1000, icon: Info, color: 'bg-yellow-100 text-yellow-800', iconBg: 'bg-yellow-500 text-white' },
];

const AchievementListPage = () => {
    const { user } = useAuth();
    const [achievementStatistic, setAchievementStatistic] = useState(null);
    const [currentUserLevelAndXP, setCurrentUserLevelAndXP] = useState(null);
    const [allPlayersXP, setAllPlayersXP] = useState([]);
    const [allDailyGoals, setAllDailyGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resetTimeInSeconds, setResetTimeInSeconds] = useState(null);
    const [allUnlockBadges, setAllUnlockBadges] = useState(null);

    const fetchStatistics = useCallback(async () => {
        try {
            //Get the achievement statistic of the user
            const statisticResponse = await achievementService.getAchievementStatistics();
            const data = Array.isArray(statisticResponse?.data) ? statisticResponse.data[0] : statisticResponse?.data;
            setAchievementStatistic(data || null);

            //get the current level and the remaining XP of the user for the next level
            const levelAndXPResponse = await achievementService.getCurrentLevelAndXP();
            setCurrentUserLevelAndXP(levelAndXPResponse?.data || null);

            // Get XP for all players
            const allPlayersResponse = await achievementService.getAllPlayers();
            setAllPlayersXP(Array.isArray(allPlayersResponse?.data) ? allPlayersResponse.data : []);

            //Get all the daily goals of the user and attach an icon component for each
            const allDailyGoalsResponse = await achievementService.getAllDailyGoals();
            const rawDailyGoals = Array.isArray(allDailyGoalsResponse?.data) ? allDailyGoalsResponse.data : [];
            const goalsWithIcons = rawDailyGoals.map(g => ({ ...g, icon: getGoalIcon(g) }));
            setAllDailyGoals(goalsWithIcons);

            //Get the meta data time for countdown
            const meta_time = allDailyGoalsResponse.meta || {};

            if (typeof meta_time.reset_in_seconds === "number") {
                setResetTimeInSeconds(meta_time.reset_in_seconds);

            } else if (meta_time.reset_at) {
                const nextTime = new Date(meta_time.reset_at);
                const remainingSeconds = Math.max(0, Math.floor((nextTime - new Date()) / 1000));
                setResetTimeInSeconds(remainingSeconds);

            } else {
                setResetTimeInSeconds(null);
            }

            //Get all unlock badges based on the user id
            const allBadgesResponse = await achievementService.getAllBadges();
            setAllUnlockBadges(allBadgesResponse);

        } catch (error) {
            toast.error('Fail to load the achievement data.');
            console.error("Fail to load the achievement data at the achievement list page due to: " + error);

        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Initial fetch
        fetchStatistics();
        // Set up polling and refetch every 3 seconds
        const pollInterval = setInterval(fetchStatistics, 3000);
        // Cleanup interval when component unmounts
        return () => clearInterval(pollInterval);

    }, [fetchStatistics]);

    const handleRedeem = (item) => {
        toast.error(`Redeeming "${item.title}" isn't available yet.`);
    };

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

    // All badges available/unlocked for the user
    const allBadges = Array.isArray(allUnlockBadges?.data) ? allUnlockBadges.data : [];

    // Calculate user's position in the leaderboard
    const currentUserID = user?.id;
    const currentUsername = user?.username || user?.name || 'Learner';
    const currentUserPosition = sortedPlayers.findIndex(player => player.id === currentUserID) + 1;
    const isUserInTopThree = currentUserPosition <= 3;

    //The four stat cards: Level, Total Points, Current Streak, and Rank
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
                            {allBadges.length === 0 && (
                                <p className="col-span-full text-sm text-slate-400 text-center py-4">No badges yet.</p>
                            )}
                            {allBadges.slice(0, 5).map((badge) => {
                                const isLocked = badge.target_value > 0 && (badge.current_value ?? 0) < badge.target_value;
                                return (
                                    <div key={badge.id} className="flex flex-col items-center text-center">
                                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-slate-100 overflow-hidden">
                                            {isLocked ? (
                                                <Lock className="w-6 h-6 text-slate-400" strokeWidth={2} />
                                            ) : badge.image_path ? (
                                                <img src={badge.image_path} alt={badge.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <Award className="w-7 h-7 text-slate-400" strokeWidth={2} />
                                            )}
                                        </div>
                                        <div className="text-sm font-bold text-slate-900">{badge.title}</div>
                                        <div className="text-xs text-slate-500 mt-1 leading-snug">{badge.badge_description}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Redeem Points */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-slate-900">Redeem Points</h2>
                            <button className="text-sm font-semibold text-purple-500 hover:text-purple-700">See All</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {REDEEM_ITEMS.map((item, i) => (
                                <div key={i} className={`rounded-2xl border border-black/5 p-5 flex flex-col items-center text-center transition-all duration-200 hover:translate-y-1 ${item.color}`}>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${item.iconBg}`}>
                                        <item.icon className="w-6 h-6" strokeWidth={2} />
                                    </div>
                                    <div className="text-base font-bold mb-1">{item.title}</div>
                                    <div className="text-xs font-semibold opacity-70 mb-3">({item.progress})</div>
                                    <div className="text-xs opacity-80 leading-snug mb-4">{item.description}</div>
                                    <div className="text-sm font-bold mb-4 mt-auto">{item.cost.toLocaleString()} pts</div>
                                    <button
                                        onClick={() => handleRedeem(item)}
                                        className="w-full h-9 rounded-lg bg-white/70 hover:bg-white text-sm font-semibold transition-colors mt-auto"
                                    >
                                        Redeem
                                    </button>
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
                            <span className="text-xs text-slate-400">
                                Reset in {' '}
                                {resetTimeInSeconds != null ? (
                                    <CountdownTimer resetInSeconds={resetTimeInSeconds} onZero={() => { fetchStatistics(); }} />
                                ) : (
                                    "_"
                                )}
                            </span>
                        </div>
                        <div className="space-y-4">
                            {allDailyGoals.map((goal, i) => {
                                const numComplete = goal.number_complete ?? 0;
                                const numAchieve = goal.num_achieve ?? 0;
                                const percent = numAchieve > 0 ? Math.min(100, Math.round((numComplete / numAchieve) * 100)) : 0;
                                const done = goal.completed;
                                const isComplete = numAchieve > 0 && numComplete >= numAchieve;
                                const Icon = goal.icon || Calendar;
                                return (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                                            <Icon className="w-4.5 h-4.5 text-purple-600" strokeWidth={2} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold text-slate-800 mb-1.5">{goal.goal_description}</div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${done ? 'bg-purple-500' : 'bg-purple-500'}`} style={{ width: `${percent}%` }} />
                                            </div>
                                        </div>
                                        <span className={`text-xs font-semibold shrink-0 mt-1 ${isComplete ? 'text-purple-600' : 'text-slate-500'}`}>
                                            {isComplete ? (
                                                <BadgeCheckIcon className="w-4 h-4 text-purple-600" strokeWidth={2} />
                                            ) : (
                                                `${numComplete}/${numAchieve}`
                                            )}
                                        </span>
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

                        {/* User's row & only show if not in top 3 */}
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
