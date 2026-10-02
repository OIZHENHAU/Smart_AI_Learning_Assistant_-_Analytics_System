import React, { useState } from 'react';
import { BarChart3, Trophy, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

const inputClass = 'w-full h-11 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400';

//Edits one level row. previousPoint = the level above's experience point (0 for Level 1);
//nextPoint = the level below's (null for the last one), so levels always keep going up.
const LevelEditModal = ({ levelNumber, previousPoint, nextPoint, value, onSave, onClose }) => {
    const [xp, setXp] = useState(String(value.xpRequired));
    const [achievement, setAchievement] = useState(value.achievement ? { ...value.achievement } : null);

    const updateAchievement = (patch) => setAchievement((prev) => ({ ...prev, ...patch }));

    const handleBadge = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            toast.error("The badge image must be 2MB or smaller.");
            return;
        }
        updateAchievement({ badgeFile: file, badgePreview: URL.createObjectURL(file) });
    };

    const handleSave = () => {
        const xpRequired = Number(xp);
        if (xp === '' || !Number.isInteger(xpRequired) || xpRequired < 0) {
            toast.error("Please enter a whole number of experience points.");
            return;
        }
        if (levelNumber > 1 && xpRequired <= previousPoint) {
            toast.error(`The experience point must be greater than the previous level point (${previousPoint}).`);
            return;
        }
        if (nextPoint != null && xpRequired >= nextPoint) {
            toast.error(`The experience point must be less than Level ${levelNumber + 1}'s (${nextPoint}).`);
            return;
        }
        if (achievement && (!achievement.title?.trim() || !achievement.description?.trim())) {
            toast.error("The achievement section is empty. Please fill in the title and description, or remove the achievement.");
            return;
        }
        if (achievement && !achievement.badgePreview) {
            toast.error("Please upload a badge image for the achievement.");
            return;
        }
        onSave({ ...value, xpRequired, achievement });
    };

    return (
        <div className='fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4' role='dialog' aria-modal='true' aria-labelledby='level-edit-title'>
            <div className='bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8'>
                <div className='flex items-start justify-between gap-4 mb-6'>
                    <div className='flex items-center gap-4'>
                        <div className='w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0'>
                            <BarChart3 className='w-7 h-7 text-purple-600' />
                        </div>
                        <div>
                            <h3 id='level-edit-title' className='text-2xl font-bold text-slate-900'>Level {levelNumber}</h3>
                            <p className='text-sm text-slate-400'>Set the experience point students need to reach this level.</p>
                        </div>
                    </div>
                    <button onClick={onClose} aria-label='Close' className='text-slate-400 hover:text-slate-600'>
                        <X className='w-5 h-5' />
                    </button>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                    <div>
                        <label className='text-sm font-medium text-slate-700 mb-1.5 block'>Previous Level Point:</label>
                        <input value={levelNumber > 1 ? previousPoint : 0} disabled className={`${inputClass} bg-slate-50 text-slate-500`} />
                    </div>
                    <div>
                        <label htmlFor='level-xp' className='text-sm font-medium text-slate-700 mb-1.5 block'>Experience Point:</label>
                        <input id='level-xp' type='number' min='0' step='1' value={xp} onChange={(e) => setXp(e.target.value)} className={inputClass} autoFocus />
                    </div>
                </div>

                {achievement ? (
                    <div className='mt-6 border border-slate-200 rounded-2xl p-6'>
                        <div className='flex items-start justify-between gap-4 mb-5'>
                            <div className='flex items-center gap-3'>
                                <div className='w-11 h-11 rounded-2xl bg-purple-100 flex items-center justify-center'>
                                    <Trophy className='w-6 h-6 text-purple-600' />
                                </div>
                                <div>
                                    <h4 className='text-base font-bold text-slate-900'>Add Achievement</h4>
                                    <p className='text-sm text-slate-500'>Reward students who reach this level.</p>
                                </div>
                            </div>
                            <button onClick={() => setAchievement(null)} className='text-xs font-semibold text-red-500 hover:text-red-600'>
                                Remove
                            </button>
                        </div>

                        <div className='flex flex-col items-center mb-5'>
                            <label className='w-28 h-28 rounded-full border-2 border-dashed border-purple-300 bg-purple-50 flex items-center justify-center cursor-pointer overflow-hidden hover:border-purple-400'>
                                {achievement.badgePreview
                                    ? <img src={achievement.badgePreview} alt='Badge preview' className='w-full h-full object-cover' />
                                    : <Upload className='w-8 h-8 text-purple-400' />}
                                <input type='file' accept='image/png,image/jpeg' className='hidden' onChange={handleBadge} aria-label='Upload badge image' />
                            </label>
                            <span className='text-xs text-slate-400 mt-2'>PNG or JPG, square, up to 2MB</span>
                        </div>

                        <div className='space-y-4'>
                            <div>
                                <label htmlFor='level-badge-title' className='text-sm font-medium text-slate-700 mb-1.5 block'>Badge Title</label>
                                <input id='level-badge-title' value={achievement.title || ''} onChange={(e) => updateAchievement({ title: e.target.value })} maxLength={150} className={inputClass} />
                            </div>
                            <div>
                                <label htmlFor='level-badge-description' className='text-sm font-medium text-slate-700 mb-1.5 block'>Description</label>
                                <textarea
                                    id='level-badge-description'
                                    value={achievement.description || ''}
                                    onChange={(e) => updateAchievement({ description: e.target.value })}
                                    rows={3}
                                    className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setAchievement({ title: '', description: '', badgePreview: null, badgeFile: null, keepBadge: false })}
                        className='mt-6 w-full py-3.5 rounded-xl border border-slate-200 text-base font-semibold text-purple-600 hover:bg-purple-50 transition-colors'
                    >
                        + Add Achievement
                    </button>
                )}

                <div className='flex justify-end gap-3 mt-8'>
                    <button onClick={onClose} className='px-5 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50'>
                        Cancel
                    </button>
                    <button onClick={handleSave} className='px-6 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold'>
                        Save Level
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LevelEditModal;
