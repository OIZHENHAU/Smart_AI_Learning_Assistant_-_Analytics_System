import ProblemSetUserAchievement from '../models/ProblemSetUserAchievement.js';
import { getClassAccess, sendError } from '../utils/ClassAccess.js';

//The logged-in student's achievements in this class: GET /api/classes/:id/my-achievements?unseen=true
export const getMyAchievements = async (req, res, next) => {
    try {
        const access = await getClassAccess(req.params.id, req.user);
        if (access.error) return sendError(res, access.status, access.error);

        const data = await ProblemSetUserAchievement.listForStudent(access.classroom.id, req.user.id, {
            unseenOnly: req.query.unseen === 'true'
        });

        res.status(200).json({ success: true, message: "Achievements retrieved successfully.", data, statusCode: 200 });

    } catch (error) {
        console.error("Fail to get the achievements at the controller due to: " + error);
        next(error);
    }
};

//The student closed the "new achievement" popup: PUT /api/classes/:id/my-achievements/:setId/seen
//Only ever touches the caller's own row, so no further check is needed.
export const markAchievementSeen = async (req, res, next) => {
    try {
        const access = await getClassAccess(req.params.id, req.user);
        if (access.error) return sendError(res, access.status, access.error);

        await ProblemSetUserAchievement.markSeen(Number(req.params.setId), req.user.id);

        res.status(200).json({ success: true, message: "Achievement marked as seen.", statusCode: 200 });

    } catch (error) {
        console.error("Fail to mark the achievement as seen at the controller due to: " + error);
        next(error);
    }
};
