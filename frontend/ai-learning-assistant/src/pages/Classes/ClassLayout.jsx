import React, { useState, useEffect } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import classService from '../../services/ClassService';
import Spinner from '../../components/common/Spinner';
import { useCurrentClass } from '../../context/ClassContext';
import { useAuth } from '../../context/AuthContext';
import problemSetService from '../../services/ProblemSetService';
import AchievementUnlockedModal from '../../components/classes/ProblemSet/AchievementUnlockedModal';

const LOADING_MS = 3000;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ClassLayout = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { setCurrentClass } = useCurrentClass();
    const { user } = useAuth();
    const [newAchievements, setNewAchievements] = useState([]); // earned but not shown yet, shown one at a time
    //The loaded class is stored with its id, so opening a different class automatically shows the loading page again.
    const [loaded, setLoaded] = useState(null);
    const classData = loaded?.classId === classId ? loaded.data : null;

    const setClassData = (update) => {
        setLoaded((prev) => ({ ...prev, data: typeof update === 'function' ? update(prev.data) : update }));
    };

    useEffect(() => {
        let cancelled = false;

        const openClass = async () => {
            try {
                //Wait for the access check AND the 3 seconds, so the loading page never just flashes.
                const [result] = await Promise.all([classService.getClassWorkspace(classId), wait(LOADING_MS)]);
                if (!cancelled) setLoaded({ classId, data: result.data });

            } catch (error) {
                if (cancelled) return;
                toast.error(error.error || "Unable to open this class.");
                navigate('/classes', { replace: true });
            }
        };

        openClass();
        return () => { cancelled = true; };
    }, [classId, navigate]);

    //Show the class name and lecturer at the top of the sidebar while this class is open.
    useEffect(() => {
        setCurrentClass(classData);
        return () => setCurrentClass(null);
    }, [classData, setCurrentClass]);

    //Once the class is open, a student sees any problem set achievement they earned since last time.
    const openedClassId = classData?.id;
    useEffect(() => {
        if (!openedClassId || user?.role !== 'student') return;
        problemSetService.getMyAchievements(openedClassId, true)
            .then((result) => setNewAchievements(Array.isArray(result?.data) ? result.data : []))
            .catch((error) => console.error(error)); //a missing popup shouldn't interrupt the class
    }, [openedClassId, user?.role]);

    //Closing one marks it as seen (so it never shows again) and moves on to the next.
    const handleCloseAchievement = () => {
        const [current, ...rest] = newAchievements;
        setNewAchievements(rest);
        problemSetService.markAchievementSeen(openedClassId, current.problem_set_id).catch((error) => console.error(error));
    };

    if (!classData) {
        return (
            <div className='fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center'>
                <Spinner />
                <p className='text-sm text-slate-500'>Opening your class...</p>
            </div>
        );
    }

    return (
        <div className='max-w-7xl mx-auto'>
            {/* Pages under this layout read the class through useOutletContext() */}
            <Outlet context={{ classData, setClassData }} />

            {newAchievements.length > 0 && (
                <AchievementUnlockedModal
                    achievement={newAchievements[0]}
                    remaining={newAchievements.length - 1}
                    onClose={handleCloseAchievement}
                />
            )}
        </div>
    );
};

export default ClassLayout;
