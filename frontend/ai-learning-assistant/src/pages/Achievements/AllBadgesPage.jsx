import React, {useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import Spinner from "../../components/common/Spinner";
import achievementService from "../../services/AchievementService";
import { Award, Lock, Trophy } from 'lucide-react';

const AllBadgesPage = () => {
    const navigate = useNavigate();
    const [allUnlockBadges, setAllUnlockBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchAllBadges = async () => {
            try {
                const response = await achievementService.getAllBadges();
                setAllUnlockBadges(Array.isArray(response?.data) ? response.data : []);

            } catch (error) {
                toast.error('Fail to load all the badges.');
                console.error("Fail to load all the badges at the badges list page due to: " + error);

            } finally {
                setLoading(false);
            }
        };
        fetchAllBadges();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
                        <Trophy className="w-7 h-7 text-purple-600" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Achievements</h1>
                        <p className="text-sm text-slate-500">Learn, earn points, unlock rewards and level up.</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/achievements')}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl transition-all"
                >
                    Back
                </button>
            </div>

            {/* Badges Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-sm font-bold text-slate-900 border-b border-slate-200">
                            <th className="pb-3 pr-4">Badges</th>
                            <th className="pb-3 pr-4">Title</th>
                            <th className="pb-3 pr-4">Description</th>
                            <th className="pb-3 pr-4">Requirement</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allUnlockBadges.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-6 text-sm text-slate-400 text-center">No badges yet.</td>
                            </tr>
                        )}

                        {allUnlockBadges.map((badge) => {
                            const target = badge.target_value || 0;
                            const current = badge.current_value ?? 0;
                            const percent = (target > 0) ? Math.min(100, Math.round((current/target) * 100)) : 0;
                            const isLocked = (target > 0) && (current < target);

                            return (
                                <tr key={badge.id} className="border-b border-slate-100 last:border-0">
                                    <td className="py-4 pr-4">
                                        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-100 overflow-hidden">
                                            {isLocked ? (
                                                <Lock className="w-5 h-5 text-slate-400" strokeWidth={2}/>
                                            ) : badge.image_path ? (
                                                <img src={badge.image_path} alt={badge.title} className="w-full h-full object-cover"/>
                                            ) : (
                                                <Award className="w-6 h-6 text-slate-400" strokeWidth={2}/>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 pr-4 text-sm font-semibold text-slate-900">{badge.title}</td>
                                    <td className="py-4 pr-4 text-sm text-slate-600">{badge.badge_description}</td>
                                    <td className="py-4">
                                        <div className="flex items-center justify-between gap-4 mb-1.5">
                                            <span className="text-sm text-slate-600">• {badge.badge_description}</span>
                                            <span className="text-xs font-semibold text-slate-500 shrink-0">{current}/{target}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-purple-500 rounded-full" style={{width: `${percent}%`}}/>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AllBadgesPage;