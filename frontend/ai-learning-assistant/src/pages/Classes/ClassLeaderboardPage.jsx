import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Trophy, Medal } from 'lucide-react';
import toast from 'react-hot-toast';
import classService from '../../services/ClassService';
import Spinner from '../../components/common/Spinner';
import { useAuth } from '../../context/AuthContext';
import { formatPoints } from '../../utils/formatPoints';

const MEDAL_COLORS = { 1: 'text-yellow-500', 2: 'text-slate-400', 3: 'text-amber-700' };

//The class leaderboard: approved students ranked by their class points (sum of their graded problem set scores).
const ClassLeaderboardPage = () => {
    const { classData } = useOutletContext();
    const { user } = useAuth();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        classService.getClassLeaderboard(classData.id)
            .then((result) => setRows(Array.isArray(result?.data) ? result.data : []))
            .catch((error) => {
                toast.error(error.error || "Failed to load the leaderboard.");
                console.error(error);
            })
            .finally(() => setLoading(false));
    }, [classData.id]);

    const me = rows.find((row) => row.user_id === user?.id);

    return (
        <div>
            <div className='flex flex-wrap items-center justify-between gap-4 mb-8'>
                <div className='flex items-center gap-4'>
                    <div className='w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0'>
                        <Trophy className='w-7 h-7 text-purple-600' />
                    </div>
                    <div>
                        <h2 className='text-2xl font-bold text-slate-900'>Leaderboard</h2>
                        <p className='text-sm text-slate-500'>Students ranked by the points from their graded problem sets.</p>
                    </div>
                </div>
                {me && (
                    <div className='px-5 py-3 rounded-2xl bg-purple-50 border border-purple-100 text-right'>
                        <p className='text-xs text-purple-400'>Your rank</p>
                        <p className='text-lg font-bold text-purple-700'>#{me.rank} &bull; {formatPoints(me.total_points)} pts</p>
                    </div>
                )}
            </div>

            {loading ? (
                <div className='flex justify-center items-center py-20'><Spinner /></div>
            ) : rows.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-24 text-center'>
                    <div className='w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4'>
                        <Trophy className='w-8 h-8 text-purple-400' />
                    </div>
                    <h3 className='text-lg font-medium text-slate-700 mb-1'>No students yet</h3>
                    <p className='text-slate-400 text-sm'>Students appear here once they join the class.</p>
                </div>
            ) : (
                <div className='bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-x-auto'>
                    <table className='w-full text-left'>
                        <thead>
                            <tr className='text-sm font-bold text-slate-900 border-b border-slate-200'>
                                <th className='pb-3 pr-4'>Rank</th>
                                <th className='pb-3 pr-4'>Name</th>
                                <th className='pb-3 pr-4'>Graded Problem Sets</th>
                                <th className='pb-3 text-right'>Total Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={row.user_id}
                                    className={`border-b border-slate-100 last:border-0 ${row.user_id === user?.id ? 'bg-purple-50' : ''}`}
                                >
                                    <td className='py-4 pr-4'>
                                        <span className='inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700'>
                                            {MEDAL_COLORS[row.rank] && <Medal className={`w-4 h-4 ${MEDAL_COLORS[row.rank]}`} />}
                                            #{row.rank}
                                        </span>
                                    </td>
                                    <td className='py-4 pr-4 text-sm text-slate-600'>
                                        {row.username}
                                        {row.user_id === user?.id && <span className='ml-2 text-xs font-semibold text-purple-600'>(You)</span>}
                                    </td>
                                    <td className='py-4 pr-4 text-sm text-slate-600'>{row.graded_count}</td>
                                    <td className='py-4 text-sm font-semibold text-slate-900 text-right'>{formatPoints(row.total_points)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ClassLeaderboardPage;
