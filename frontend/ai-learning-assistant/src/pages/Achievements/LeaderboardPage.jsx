import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';
import achievementService from '../../services/AchievementService';
import { Trophy, Award } from 'lucide-react';

const MAX_VISIBLE_BADGES = 4;

const LeaderboardPage = () => {
    const navigate = useNavigate();
    const [leaderboardByLevel, setLeaderboardByLevel] = useState([]);
    const [leaderboardByAchievements, setLeaderboardByAchievements] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboardData = useCallback(async () => {
        try {
            const [levelData, achievementsData] = await Promise.all([
                achievementService.getLeaderboardByLevel(),
                achievementService.getLeaderboardByAchievements()
            ]);

            setLeaderboardByLevel(Array.isArray(levelData?.data) ? levelData.data : []);
            setLeaderboardByAchievements(Array.isArray(achievementsData?.data) ? achievementsData.data : []);

        } catch (error) {
            toast.error('Fail to load the leaderboard data.');
            console.error("Fail to load the leaderboard data at the leaderboard page due to: " + error);

        } finally {
            setLoading(false);
        }

    }, []);

    useEffect(() => {
        fetchLeaderboardData();
        const pollingInterval = setInterval(fetchLeaderboardData, 1000); // Poll every 1 seconds
        return () => clearInterval(pollingInterval);

    }, [fetchLeaderboardData]);


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="max-w-8xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
                        <Trophy className="w-7 h-7 text-purple-600" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Leaderboard</h1>
                        <p className="text-sm text-slate-500">See how you rank against other learners.</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/achievements')}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl transition-all"
                >
                    Back
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* By Level */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
                    <h2 className="text-xl font-bold text-slate-900 text-center mb-5">By Level</h2>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-sm font-semibold text-slate-500 border-b border-slate-200">
                                <th className="pb-3 pr-4">Rank</th>
                                <th className="pb-3 pr-4">Name</th>
                                <th className="pb-3 pr-4">Level</th>
                                <th className="pb-3">Experience</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboardByLevel.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-6 text-sm text-slate-400 text-center">No players yet.</td>
                                </tr>
                            )}
                            {leaderboardByLevel.map((player, index) => (
                                <tr key={player.username} className="border-b border-slate-100 last:border-0">
                                    <td className="py-4 pr-4 text-sm font-semibold text-slate-900">{index + 1}</td>
                                    <td className="py-4 pr-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-xs font-bold shrink-0">
                                                {player.username.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-medium text-slate-800">{player.username}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 pr-4 text-sm text-slate-600">{player.current_level}</td>
                                    <td className="py-4 text-sm text-slate-600">{player.total_xp}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* By Achievements */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
                    <h2 className="text-xl font-bold text-slate-900 text-center mb-5">By Achievements</h2>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-sm font-semibold text-slate-500 border-b border-slate-200">
                                <th className="pb-3 pr-4">Rank</th>
                                <th className="pb-3 pr-4">Name</th>
                                <th className="pb-3">Achievement</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboardByAchievements.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="py-6 text-sm text-slate-400 text-center">No players yet.</td>
                                </tr>
                            )}
                            {leaderboardByAchievements.map((player, index) => {
                                const visibleBadges = player.badges.slice(0, MAX_VISIBLE_BADGES);
                                const remaining = player.badges.length - visibleBadges.length;

                                return (
                                    <tr key={player.userId} className="border-b border-slate-100 last:border-0">
                                        <td className="py-4 pr-4 text-sm font-semibold text-slate-900">{index + 1}</td>
                                        <td className="py-4 pr-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-xs font-bold shrink-0">
                                                    {player.username.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-slate-800">{player.username}</span>
                                            </div>
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center -space-x-2">
                                                {visibleBadges.map((badge) => (
                                                    <div
                                                        key={badge.id}
                                                        title={badge.title}
                                                        className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden flex items-center justify-center shrink-0"
                                                    >
                                                        {badge.image_path ? (
                                                            <img src={badge.image_path} alt={badge.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Award className="w-4 h-4 text-slate-400" strokeWidth={2} />
                                                        )}
                                                    </div>
                                                ))}
                                                {remaining > 0 && (
                                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                                                        +{remaining}
                                                    </div>
                                                )}
                                                {player.badges.length === 0 && (
                                                    <span className="text-xs text-slate-400">No badges yet.</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    )
}

export default LeaderboardPage;