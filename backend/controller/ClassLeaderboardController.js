import ClassPoints from '../models/ClassPoints.js';
import { getClassAccess, sendError } from '../utils/ClassAccess.js';

//The class leaderboard (approved students, ranked by class points): GET /api/classes/:id/leaderboard
export const getClassLeaderboard = async (req, res, next) => {
    try {
        const access = await getClassAccess(req.params.id, req.user);
        if (access.error) return sendError(res, access.status, access.error);

        const data = await ClassPoints.getLeaderboard(access.classroom.id);

        res.status(200).json({ success: true, message: "Leaderboard retrieved successfully.", data, statusCode: 200 });

    } catch (error) {
        console.error("Fail to get the class leaderboard at the controller due to: " + error);
        next(error);
    }
};
