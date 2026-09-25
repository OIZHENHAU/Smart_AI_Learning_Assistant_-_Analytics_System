import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import problemSetService from '../../../services/ProblemSetService';
import { BASE_URL } from '../../../utils/apiPath';

//Autosaves the achievement, the same way QuestionEditor autosaves a question: no Save button, nothing here
//is required to be complete (that is only checked once, at publish), and it's persisted to the server as you
//go, so it survives switching to a question and back, or refreshing the page.
const AchievementPanel = ({ classId, setId, achievement, totalPoints, onSaved }) => {
    const [title, setTitle] = useState(achievement?.title || '');
    const [description, setDescription] = useState(achievement?.description || '');
    const [minPoints, setMinPoints] = useState(achievement?.min_points ?? '');
    const [expiryDate, setExpiryDate] = useState(achievement?.expiry_date ? achievement.expiry_date.slice(0, 10) : '');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(
        achievement?.badge_image ? `${BASE_URL}/uploads/problem-set-badges/${achievement.badge_image}` : null
    );
    const [saving, setSaving] = useState(false);
    //Stops the debounced autosave from firing after switching away to a question.
    const aliveRef = useRef(true);
    useEffect(() => () => { aliveRef.current = false; }, []);

    //Autosaves shortly after the lecturer stops typing (or right after picking an image).
    useEffect(() => {
        const timeout = setTimeout(() => { handleSave(); }, 700);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title, description, minPoints, expiryDate, imageFile]);

    const handleSave = async () => {
        setSaving(true);
        const formData = new FormData();
        if (imageFile) formData.append('badgeImage', imageFile);
        formData.append('title', title.trim());
        formData.append('description', description.trim());
        formData.append('minPoints', minPoints);
        formData.append('expiryDate', expiryDate);

        try {
            await problemSetService.saveAchievement(classId, setId, formData);
            if (aliveRef.current) onSaved();

        } catch (error) {
            if (aliveRef.current) toast.error(error.error || "Failed to save the achievement.");
            console.error(error);

        } finally {
            if (aliveRef.current) setSaving(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setImagePreviewUrl(URL.createObjectURL(file));
    };

    return (
        <div className='p-6'>
            <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center gap-3'>
                    <div className='w-11 h-11 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0'>
                        <Trophy className='w-6 h-6 text-purple-600' strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className='text-lg font-bold text-slate-900'>Add Achievement</h3>
                        <p className='text-sm text-slate-500'>Reward students who reach the target score on this problem set.</p>
                    </div>
                </div>
            </div>

            <div className='flex flex-col items-center mb-6'>
                <label className='w-28 h-28 rounded-full border-2 border-dashed border-purple-300 bg-purple-50 flex items-center justify-center cursor-pointer overflow-hidden hover:border-purple-400 transition-colors'>
                    {imagePreviewUrl
                        ? <img src={imagePreviewUrl} alt='Badge preview' className='w-full h-full object-cover' />
                        : <Upload className='w-8 h-8 text-purple-400' />}
                    <input type='file' accept='image/*' className='hidden' onChange={handleImageChange} />
                </label>
                <span className='text-xs text-slate-400 mt-2'>PNG or JPG, square, up to 2MB</span>
            </div>

            <div className='space-y-4 max-w-xl mx-auto'>
                <div>
                    <label className='text-sm font-medium text-slate-700 mb-1.5 block'>Badge Title</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={150}
                        className='w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                    />
                </div>
                <div>
                    <label className='text-sm font-medium text-slate-700 mb-1.5 block'>Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className='w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                    />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                    <div>
                        <label className='text-sm font-medium text-slate-700 mb-1.5 block'>Minimum Points to Unlock</label>
                        <input
                            type='number'
                            min='0'
                            value={minPoints}
                            onChange={(e) => setMinPoints(e.target.value)}
                            className='w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                        />
                    </div>
                    <div>
                        <label className='text-sm font-medium text-slate-700 mb-1.5 block'>Total Points for this Problem Set</label>
                        <input
                            value={totalPoints}
                            disabled
                            className='w-full h-10 px-3 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-500'
                        />
                        <p className='text-xs text-slate-400 mt-1.5'>Auto &mdash; the sum of every question's points.</p>
                    </div>
                </div>
                <div>
                    <label className='text-sm font-medium text-slate-700 mb-1.5 block'>Expiry Date</label>
                    <input
                        type='date'
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className='w-56 h-10 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400'
                    />
                </div>
                <p className='text-xs text-slate-400 text-center pt-1'>Saved automatically. Every field is checked when you publish.</p>
            </div>
        </div>
    );
};

export default AchievementPanel;
