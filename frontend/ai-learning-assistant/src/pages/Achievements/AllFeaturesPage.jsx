import React, {useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';
import achievementService from '../../services/AchievementService';
import { Trophy, Star, Bot, Shield, AlertTriangleIcon, Snowflake, NotepadText, NotebookPenIcon } from 'lucide-react';

const getUnlockFeaturesIcon = (uf) => {
    const key = (uf.specific_type || "").toString().toLowerCase();
    if (key.includes('hint')) return Bot;
    if (key.includes('block')) return Shield;
    if (key.includes('extra attempt')) return AlertTriangleIcon;
    if (key.includes('stop')) return Snowflake;
    if (key.includes('flashcards')) return NotepadText;
    if (key.includes('fill-in-blanks')) return NotebookPenIcon;
    return Star;
}

const AllFeaturesPage = () => {
    const navigate = useNavigate();
    const [allUnlockFeatures, setAllUnlockFeatures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmFeature, setConfirmFeature] = useState(null);
    const [redeemingFeature, setRedeemingFeature] = useState(false);

    useEffect(() => {
        const fetchAllFeatures = async () => {
            try {
                const response = await achievementService.getAllUnlockFeatures();
                const rawFeatures = Array.isArray(response?.data) ? response.data : [];
                setAllUnlockFeatures(rawFeatures.map((f) => ({ ...f, icon: getUnlockFeaturesIcon(f) })));

            } catch (error) {
                toast.error("Fail to load all the unlock features.");
                console.error("fail to load all the unlock features at the all unlock feature page due to: " + error);

            } finally {
                setLoading(false);
            }
        };
        fetchAllFeatures();

    }, []);

    const handleRedeemUnlockFeature = (item) => {
        setConfirmFeature(item);
    };

    const confirmRedeemUnlockFeature = async () => {
        if (!confirmFeature) {
            return;
        }
        setRedeemingFeature(true);

        try {
            await achievementService.redeemUnlockFeature(confirmFeature.id);
            toast.success(`"${confirmFeature.feature_name}" redeem successfully.`);

        } catch (error) {
            const message = error?.response?.data?.message || `Failed to redeem "${confirmFeature.feature_name}".`;
            toast.error(message);

        } finally {
            setRedeemingFeature(false);
            setConfirmFeature(null);
        }
    };

    if (loading) {
        return (
            <div className='flex items-center justify-center min-h-[60vh]'>
                <Spinner />
            </div>
        );
    }

    return (
        <>
        <div className='max-w-6xl mx-auto space-y-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                    <div className='w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0'>
                        <Trophy className='w-7 h-7 text-purple-600' strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className='text-2xl font-bold text-slate-900'>Achievements</h1>
                        <p className='text-sm text-slate-500'>Learn, earn points, unlock rewards and level up.</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/achievements')}
                    className='px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl transition-all'
                >
                    Back
                </button>
            </div>

            {/* Feature Grid */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                {allUnlockFeatures.length === 0 && (
                    <p className='col-span-full text-sm text-slate-400 text-center py-4'>No features yet.</p>
                )}
                {allUnlockFeatures.map((item) => {
                    const Icon = item.icon || Star;
                    return (
                        <div key={item.id} className='group relative bg-white/80 backdrop-blur-xl border-2 border-slate-200 hover:border-purple-400 rounded-2xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10 flex flex-col justify-between'>
                            <div className="space-y-4">
                                {/* Cost Badge */}
                                <div className='inline-flex items-center gap-1.5 py-1 rounded-lg text-xs font-semibold'>
                                    <div className='flex items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1'>
                                        <span className='text-purple-700'>{item.point_needed.toLocaleString()} points</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className='flex items-center gap-2.5 text-base font-semibold text-slate-900 mb-1 line-clamp-2'>
                                        <div className='flex items-center justify-center w-9 h-9 rounded-full bg-purple-100 shrink-0'>
                                            <Icon className='w-4 h-4 text-purple-600' strokeWidth={3} />
                                        </div>
                                        <div>
                                            {item.feature_name}
                                            <p className='text-xs font-medium text-slate-500 tracking-wide'>{item.num_unlock}/{item.limit_number} available</p>
                                        </div>
                                    </h3>
                                </div>

                                {/* Description */}
                                <div className='pt-2 border-t border-slate-100'>
                                    <div className='h-16 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center'>
                                        <span className='text-xs font-medium text-slate-600 leading-snug line-clamp-2'>{item.feature_description}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className='mt-2 pt-4 border-t border-slate-100'>
                                <button
                                    onClick={() => handleRedeemUnlockFeature(item)}
                                    className='group/btn relative w-full h-11 bg-linear-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25 active:scale-95 overflow-hidden'
                                >
                                    <span className='relative z-10 flex items-center justify-center gap-2'>Redeem</span>
                                    <div className='absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700' />
                                </button>
                            </div>
                        </div>
                    )
                })}

            </div>
        </div>

        {confirmFeature && (
            <div className='fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50'>
                <div className='bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl'>
                    <h3 className='text-lg font-bold text-slate-900 mb-2'>Confirm Redemption</h3>
                    <p className='text-sm text-slate-600 mb-5'>
                        Redeem <span className='font-semibold'>{confirmFeature.feature_name}</span> for{' '}
                        <span className='font-semibold text-purple-600'>
                            {confirmFeature.point_needed.toLocaleString()} points
                        </span>?
                    </p>
                    <div className='flex gap-3'>
                        <button
                            onClick={() => setConfirmFeature(null)}
                            disabled={redeemingFeature}
                            className='flex-1 h-10 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 disabled:opacity-50'
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmRedeemUnlockFeature}
                            disabled={redeemingFeature}
                            className='flex-1 h-10 rounded-xl bg-linear-to-r from-purple-500 to-purple-600 text-white font-semibold text-sm hover:from-purple-600 hover:to-purple-700 disabled:opacity-50'
                        >
                            {redeemingFeature ? 'Redeeming...' : 'Confirm'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    )
}

export default AllFeaturesPage;
