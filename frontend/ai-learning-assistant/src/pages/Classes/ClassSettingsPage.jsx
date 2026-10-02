import React, { useState, useEffect } from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';
import { Settings, BarChart3, RefreshCw, Pencil, Trash2, Trophy, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import classService from '../../services/ClassService';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import LevelEditModal from '../../components/classes/Settings/LevelEditModal';
import { useAuth } from '../../context/AuthContext';
import { BASE_URL } from '../../utils/apiPath';

const inputClass = 'w-full h-11 px-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 disabled:bg-slate-50 disabled:text-slate-500';

//A level as the server sends it, turned into the shape this page edits. key keeps React rows stable for new rows.
let nextKey = 0;
const toRow = (level) => ({
    key: `level-${level.id ?? `new-${nextKey++}`}`,
    id: level.id ?? null,
    xpRequired: level.xpRequired,
    achievement: level.achievement ? {
        title: level.achievement.title,
        description: level.achievement.description,
        badgePreview: level.achievement.badgeImage ? `${BASE_URL}/uploads/class-level-badges/${level.achievement.badgeImage}` : null,
        badgeFile: null,
        keepBadge: !!level.achievement.badgeImage
    } : null
});

//Class settings: name, number of students, class code, and the class's levels (each with an optional achievement).
//Edits stay on this page until Update -> Confirm saves everything together. Only the owner (or an admin) can change it.
const ClassSettingsPage = () => {
    const { classData, setClassData } = useOutletContext();
    const { user } = useAuth();
    const canEdit = classData.class_role === 'owner' || user?.role === 'admin';

    const [className, setClassName] = useState(classData.class_name);
    const [maxStudents, setMaxStudents] = useState(String(classData.max_students));
    const [classCode, setClassCode] = useState(classData.class_code);
    const [levels, setLevels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingIndex, setEditingIndex] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        classService.getClassLevels(classData.id)
            .then((result) => setLevels((result.data || []).map(toRow)))
            .catch((error) => {
                toast.error(error.error || "Failed to load the levels.");
                console.error(error);
            })
            .finally(() => setLoading(false));
    }, [classData.id]);

    //Warn before leaving with unsaved changes.
    useEffect(() => {
        if (!dirty) return;
        const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);

    //Students don't have a Settings page (the sidebar hides it); one who types the URL goes back to the class.
    if (user?.role === 'student') {
        return <Navigate to={`/classes/${classData.id}/announcement`} replace />;
    }

    const change = (setter) => (value) => { setter(value); setDirty(true); };

    //The server picks a code no other class has; it's saved only when Update is confirmed.
    const handleNewCode = async () => {
        setGenerating(true);
        try {
            const result = await classService.generateClassCode(classData.id);
            change(setClassCode)(result.data.classCode);

        } catch (error) {
            toast.error(error.error || "Failed to generate a new class code.");
            console.error(error);

        } finally {
            setGenerating(false);
        }
    };

    //A new row starts at 0; the creator sets its experience point with Edit.
    const handleAddRow = () => {
        setLevels((prev) => [...prev, toRow({ id: null, xpRequired: 0, achievement: null })]);
        setDirty(true);
    };

    const handleDeleteRow = (index) => {
        setLevels((prev) => prev.filter((_, i) => i !== index));
        setDirty(true);
    };

    const handleSaveLevel = (updated) => {
        setLevels((prev) => prev.map((row, i) => (i === editingIndex ? updated : row)));
        setEditingIndex(null);
        setDirty(true);
    };

    //Update only checks the form, then asks for confirmation.
    const handleOpenUpdate = () => {
        if (!className.trim() || !maxStudents) {
            toast.error("Please enter the class name and number of students.");
            return;
        }
        //Same rule as the popup, for rows added but never edited (still 0).
        const badIndex = levels.findIndex((row, i) => i > 0 && row.xpRequired <= levels[i - 1].xpRequired);
        if (badIndex !== -1) {
            toast.error(`Level ${badIndex + 1}'s experience point must be greater than Level ${badIndex}'s (${levels[badIndex - 1].xpRequired}). Click Edit to change it.`);
            return;
        }
        setConfirmOpen(true);
    };

    const handleConfirmUpdate = async () => {
        const formData = new FormData();
        formData.append('className', className.trim());
        formData.append('maxStudents', maxStudents);
        formData.append('classCode', classCode);
        formData.append('levels', JSON.stringify(levels.map((row) => ({
            id: row.id,
            xpRequired: row.xpRequired,
            achievement: row.achievement ? {
                title: row.achievement.title.trim(),
                description: row.achievement.description.trim(),
                keepBadge: row.achievement.keepBadge && !row.achievement.badgeFile
            } : null
        }))));
        levels.forEach((row, index) => {
            if (row.achievement?.badgeFile) formData.append(`badge_${index}`, row.achievement.badgeFile);
        });

        setSaving(true);
        try {
            const result = await classService.saveClassSettings(classData.id, formData);
            setLevels(result.data.levels.map(toRow));
            setClassData((prev) => ({ ...prev, class_name: result.data.className, max_students: result.data.maxStudents, class_code: result.data.classCode }));
            setDirty(false);
            setConfirmOpen(false);
            toast.success("Settings saved successfully.");

        } catch (error) {
            toast.error(error.error || "Failed to save the settings.");
            console.error(error);

        } finally {
            setSaving(false);
        }
    };

    const codeChanged = classCode !== classData.class_code;

    return (
        <div>
            <div className='flex flex-wrap items-center justify-between gap-4 mb-8'>
                <div className='flex items-center gap-4'>
                    <div className='w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0'>
                        <Settings className='w-7 h-7 text-purple-600' />
                    </div>
                    <div>
                        <h2 className='text-2xl font-bold text-slate-900'>Settings</h2>
                        <p className='text-sm text-slate-500'>Edit or update class information</p>
                    </div>
                </div>
                {canEdit && (
                    <div className='flex items-center gap-3'>
                        {dirty && <span className='text-xs text-amber-600'>Unsaved changes</span>}
                        <button
                            onClick={handleOpenUpdate}
                            disabled={saving || !dirty}
                            className='px-6 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors'
                        >
                            Update
                        </button>
                    </div>
                )}
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-10'>
                <div>
                    <label htmlFor='settings-class-name' className='text-sm font-medium text-slate-700 mb-1.5 block'>Class Name:</label>
                    <input id='settings-class-name' value={className} onChange={(e) => change(setClassName)(e.target.value)} disabled={!canEdit} maxLength={150} className={inputClass} />
                </div>
                <div>
                    <label htmlFor='settings-max-students' className='text-sm font-medium text-slate-700 mb-1.5 block'>Number of Students:</label>
                    <input id='settings-max-students' type='number' min={1} max={500} value={maxStudents} onChange={(e) => change(setMaxStudents)(e.target.value)} disabled={!canEdit} className={inputClass} />
                </div>
                <div>
                    <label htmlFor='settings-class-code' className='text-sm font-medium text-slate-700 mb-1.5 block'>Class Code:</label>
                    <div className='relative'>
                        <input id='settings-class-code' value={classCode} readOnly className={`${inputClass} pr-12 bg-slate-50`} />
                        {canEdit && (
                            <button
                                type='button'
                                onClick={handleNewCode}
                                disabled={generating}
                                title='Generate a new class code'
                                aria-label='Generate a new class code'
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-purple-600 hover:text-purple-700 disabled:opacity-50'
                            >
                                <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className='flex flex-wrap items-center justify-between gap-4 mb-6'>
                <div className='flex items-center gap-4'>
                    <div className='w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0'>
                        <BarChart3 className='w-7 h-7 text-purple-600' />
                    </div>
                    <div>
                        <h2 className='text-2xl font-bold text-slate-900'>Leaderboard</h2>
                        <p className='text-sm text-slate-500'>Edit the level for each student at the leaderboard.</p>
                    </div>
                </div>
                {canEdit && (
                    <button onClick={handleAddRow} className='px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold'>
                        Add Level Row
                    </button>
                )}
            </div>

            {loading ? (
                <div className='flex justify-center py-12'><Spinner /></div>
            ) : levels.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-16 text-center bg-white border border-slate-200 rounded-2xl'>
                    <div className='w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4'>
                        <BarChart3 className='w-8 h-8 text-purple-400' />
                    </div>
                    <h3 className='text-lg font-medium text-slate-700 mb-1'>No levels yet</h3>
                    <p className='text-slate-400 text-sm'>
                        {canEdit ? 'Click "Add Level Row" to create the first level.' : 'The class owner has not set up any levels.'}
                    </p>
                </div>
            ) : (
                <div className='bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-x-auto'>
                    <table className='w-full text-left'>
                        <thead>
                            <tr className='text-sm font-bold text-slate-900 border-b border-slate-200'>
                                <th className='pb-3 pr-4'>S/N</th>
                                <th className='pb-3 pr-4'>Level</th>
                                <th className='pb-3 pr-4'>Experience Point</th>
                                <th className='pb-3 pr-4'>Achievement</th>
                                <th className='pb-3 text-right'>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {levels.map((row, index) => (
                                <tr key={row.key} className='border-b border-slate-100 last:border-0'>
                                    <td className='py-4 pr-4 text-sm text-slate-600'>{index + 1}</td>
                                    <td className='py-4 pr-4 text-sm text-slate-600'>{index + 1}</td>
                                    <td className='py-4 pr-4 text-sm text-slate-600'>{row.xpRequired}</td>
                                    <td className='py-4 pr-4'>
                                        {row.achievement ? (
                                            row.achievement.badgePreview ? (
                                                <img src={row.achievement.badgePreview} alt={row.achievement.title} title={row.achievement.title} className='w-9 h-9 rounded-full object-cover border border-slate-200' />
                                            ) : (
                                                <span title={row.achievement.title} className='w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center'>
                                                    <Trophy className='w-4 h-4 text-purple-500' />
                                                </span>
                                            )
                                        ) : (
                                            <span className='text-sm text-slate-400'>-</span>
                                        )}
                                    </td>
                                    <td className='py-4'>
                                        {canEdit && (
                                            <div className='flex items-center justify-end gap-2'>
                                                <button
                                                    onClick={() => setEditingIndex(index)}
                                                    className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold hover:bg-slate-100'
                                                >
                                                    <Pencil className='w-3.5 h-3.5' /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRow(index)}
                                                    className='w-8 h-8 flex items-center justify-center rounded-lg bg-red-500 hover:bg-red-600 text-white'
                                                    aria-label={`Delete level ${index + 1}`}
                                                >
                                                    <Trash2 className='w-3.5 h-3.5' />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {editingIndex != null && (
                <LevelEditModal
                    levelNumber={editingIndex + 1}
                    previousPoint={editingIndex > 0 ? levels[editingIndex - 1].xpRequired : 0}
                    nextPoint={editingIndex < levels.length - 1 ? levels[editingIndex + 1].xpRequired : null}
                    value={levels[editingIndex]}
                    onSave={handleSaveLevel}
                    onClose={() => setEditingIndex(null)}
                />
            )}

            <Modal isOpen={confirmOpen} onClose={() => !saving && setConfirmOpen(false)} title='Update Settings'>
                <p className='text-sm text-slate-600 mb-4'>
                    Save the class name, number of students{codeChanged ? ', the new class code' : ''} and {levels.length} level{levels.length === 1 ? '' : 's'}?
                </p>
                {codeChanged && (
                    <div className='flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 mb-4'>
                        <AlertTriangle className='w-4 h-4 shrink-0 mt-0.5' />
                        The old class code ({classData.class_code}) will stop working. Students already in the class are not affected.
                    </div>
                )}
                <div className='flex gap-3'>
                    <button
                        onClick={() => setConfirmOpen(false)}
                        disabled={saving}
                        className='flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50'
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmUpdate}
                        disabled={saving}
                        className='flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white py-2 rounded-lg text-sm font-medium transition-colors'
                    >
                        {saving ? 'Saving...' : 'Confirm'}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default ClassSettingsPage;
