import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import Spinner from "../../components/common/Spinner";
import moment from "moment";
import achievementService from "../../services/AchievementService";
import { Award } from 'lucide-react';


const AchievementListPage = () => {
    const navigate = useNavigate();
    const [achievementStatistic, setAchievementStatistics] = useState([]);
    const [allBadges, setAchievementBadges] = useState([]);
    const [allUnlockFeatures, setAllUnlockFeatures] = useState([]);
    const [allUserXP, setAllUserXP] = useState([]);
    const [allDailyGoals, setAllDailyGoals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllAchievementData = async () => {
            try {
                const [achievementStatisticData, allBadgesData, allUnlockFeaturesData, 
                    allUserXPData, allDailyGoalsData] = await Promise.all([
                        achievementService.getAchievementStatistics(),
                        achievementService.getAllBadges(),
                        achievementService.getAllDailyGoals(),
                        achievementService.getAllUnlockFeatures(),
                        achievementService.getAllPlayers()
                    ]);

                    setAchievementStatistics(achievementStatisticData);
                    setAchievementBadges(allBadgesData);
                    setAllUnlockFeatures(allUnlockFeaturesData);
                    setAllUserXP(allUserXPData);
                    setAllDailyGoals(allDailyGoalsData);

            } catch (error) {
                console.error("Fail to load the achievement data at the achievement list page due to: " + error);

            } finally {
                setLoading(false);
            }
        };
        fetchAllAchievementData();

    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Spinner />
            </div>
        );
    }


    return (<div>AchievementListPage</div>)
}

export default AchievementListPage