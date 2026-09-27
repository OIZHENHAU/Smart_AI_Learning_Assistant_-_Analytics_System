import React from 'react';
import { Trophy, Upload } from 'lucide-react';
import IssueList from './IssueList';

const inputClass = 'w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400';

//Always shows its header and switch; the form only appears while the switch is on.
const AchievementPanel = ({ enabled, onToggle, value, totalPoints, onChange, issues = [] }) => {
    const { title, description, minPoints, expiryDate, imagePreviewUrl } = value;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        onChange({ imageFile: file, imagePreviewUrl: URL.createObjectURL(file) });
    };

    return (
        <div className={`bg-white border rounded-2xl p-6 transition-colors ${
            issues.length ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'}`}>
            <div className='flex items-start justify-between gap-4'>
                <div className='flex items-center gap-3'>
                    <div className='w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0'>
                        <Trophy className='w-6 h-6 text-purple-600' strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className='text-lg font-bold text-slate-900'>Add Achievement</h3>
                        <p className='text-sm text-slate-500'>Reward students who reach the target score on this problem set.</p>
                    </div>
                </div>
                <button
                    type='button'
                    role='switch'
                    aria-checked={enabled}
                    aria-label='Toggle achievement'
                    onClick={onToggle}
                    className={`w-14 h-8 rounded-full relative shrink-0 transition-colors ${enabled ? 'bg-slate-900' : 'bg-slate-300'}`}
                >
                    <span className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>

            {enabled && (
                <>
                    <IssueList issues={issues} className='mt-5' />

                    <div className='flex flex-col items-center my-6'>
                        <label className='w-36 h-36 rounded-full border-2 border-dashed border-purple-300 bg-purple-50 flex items-center justify-center cursor-pointer overflow-hidden hover:border-purple-400 transition-colors'>
                            {imagePreviewUrl
                                ? <img src={imagePreviewUrl} alt='Badge preview' className='w-full h-full object-cover' />
                                : <Upload className='w-9 h-9 text-purple-500' />}
                            <input type='file' accept='image/png,image/jpeg' className='hidden' onChange={handleImageChange} />
                        </label>
                        <span className='text-xs text-slate-400 mt-3'>PNG or JPG, square, up to 2MB</span>
                    </div>

                    <div className='space-y-5 max-w-2xl mx-auto'>
                        <div>
                            <label className='text-sm font-medium text-slate-700 mb-1.5 block'>Badge Title</label>
                            <input value={title} onChange={(e) => onChange({ title: e.target.value })} maxLength={150} className={inputClass} />
                        </div>
                        <div>
                            <label className='text-sm font-medium text-slate-700 mb-1.5 block'>Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => onChange({ description: e.target.value })}
                                rows={4}
                                className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                            />
                        </div>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                            <div>
                                <label className='text-sm font-medium text-slate-700 mb-1.5 block'>Minimum Points to Unlock</label>
                                <input type='number' min='0' value={minPoints} onChange={(e) => onChange({ minPoints: e.target.value })} className={inputClass} />
                            </div>
                            <div>
                                <label className='text-sm font-medium text-slate-700 mb-1.5 block'>Total Points for this Problem Set</label>
                                <input value={totalPoints} disabled className='w-full h-10 px-3 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-500' />
                                <p className='text-xs text-slate-400 mt-1.5'>Auto &mdash; the sum of every question's points.</p>
                            </div>
                        </div>
                        <div>
                            <label className='text-sm font-medium text-slate-700 mb-1.5 block'>Expiry Date</label>
                            <input type='date' value={expiryDate} onChange={(e) => onChange({ expiryDate: e.target.value })} className={`${inputClass} sm:w-72`} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AchievementPanel;
