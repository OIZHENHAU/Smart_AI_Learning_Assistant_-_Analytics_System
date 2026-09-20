import React, { useState, useEffect } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import classService from '../../services/ClassService';
import Spinner from '../../components/common/Spinner';

const LOADING_MS = 3000;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ClassLayout = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
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
            <div className='mb-6'>
                <h1 className='text-2xl font-bold text-slate-900'>{classData.class_name}</h1>
                <p className='text-sm text-slate-500'>
                    Class Code: {classData.class_code} · Lecturer: {classData.owner_name}
                </p>
            </div>

            {/* Pages under this layout read the class through useOutletContext() */}
            <Outlet context={{ classData, setClassData }} />
        </div>
    );
};

export default ClassLayout;
