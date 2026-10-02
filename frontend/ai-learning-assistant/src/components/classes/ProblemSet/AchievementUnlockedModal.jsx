import React from 'react';
import { Trophy, Sparkles, AwardIcon } from 'lucide-react';
import { BASE_URL } from '../../../utils/apiPath';
import { formatPoints } from '../../../utils/formatPoints';

const AchievementUnlockedModal = ({ achievement, remaining, onClose }) => (
    <div className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4' role='dialog' aria-modal='true' aria-labelledby='achievement-title'>
        <div className='bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center'>
            <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold mb-5'>
                <AwardIcon className='w-3.5 h-3.5' /> New Achievement Unlocked
            </div>

            <div className='w-32 h-32 mx-auto rounded-full bg-purple-50 border-4 border-purple-200 overflow-hidden flex items-center justify-center mb-5'>
                {achievement.badge_image ? (
                    <img
                        src={`${BASE_URL}/uploads/problem-set-badges/${achievement.badge_image}`}
                        alt={achievement.title}
                        className='w-full h-full object-cover'
                    />
                ) : (
                    <Trophy className='w-12 h-12 text-purple-500' />
                )}
            </div>

            <h2 id='achievement-title' className='text-xl font-bold text-slate-900'>{achievement.title}</h2>
            <p className='text-xs text-slate-400 mt-1'>from {achievement.assessment}</p>
            <p className='text-sm text-slate-600 mt-3'>{achievement.description}</p>

            <div className='mt-5 grid grid-cols-2 gap-3 text-left'>
                <div className='rounded-xl bg-slate-50 px-4 py-3'>
                    <p className='text-xs text-slate-400'>Requirement</p>
                    <p className='text-sm font-semibold text-slate-800'>{achievement.min_points} - {achievement.total_points} points</p>
                </div>
                <div className='rounded-xl bg-purple-50 px-4 py-3'>
                    <p className='text-xs text-purple-400'>You score</p>
                    <p className='text-sm font-semibold text-purple-700'>{formatPoints(achievement.score)} / {achievement.total_points}</p>
                </div>
            </div>

            <button
                onClick={onClose}
                autoFocus
                className='mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors'
            >
                {remaining > 0 ? `Continue (${remaining} more)` : 'Continue'}
            </button>
        </div>
    </div>
);

export default AchievementUnlockedModal;
