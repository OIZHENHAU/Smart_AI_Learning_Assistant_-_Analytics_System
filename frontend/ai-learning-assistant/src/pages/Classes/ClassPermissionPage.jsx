import React from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import ClassSectionPage from './ClassSectionPage';

//Only the owner (or an admin) may open Permission. Students who type the URL are sent back to Announcement.
const ClassPermissionPage = () => {
    const { classData } = useOutletContext();

    if (classData.class_role !== 'owner') {
        return <Navigate to={`/classes/${classData.id}/announcement`} replace />;
    }

    return (
        <ClassSectionPage
            title='Permission'
            description='Control what members can do in this class.'
            icon={ShieldCheck}
        />
    );
};

export default ClassPermissionPage;
