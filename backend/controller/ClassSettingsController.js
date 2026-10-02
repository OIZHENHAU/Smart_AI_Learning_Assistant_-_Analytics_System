import Classroom from '../models/Classroom.js';
import ClassLevel from '../models/ClassLevel.js';
import { removeLevelBadgeFile, removeLevelBadgeFiles } from '../config/classLevelBadgeUpload.js';
import { getClassAccess, sendError } from '../utils/ClassAccess.js';

const MAX_STUDENTS_LIMIT = 500;
const MAX_LEVELS = 50;
const CLASS_CODE = /^[a-z0-9]{8}$/;

const isOwnerOrAdmin = (user, classroom) => user.role === 'admin' || classroom.owner_id === user.id;

//The class's levels and their achievements: GET /api/classes/:id/levels (anyone in the class)
export const getClassLevels = async (req, res, next) => {
    try {
        const access = await getClassAccess(req.params.id, req.user);
        if (access.error) return sendError(res, access.status, access.error);

        const data = await ClassLevel.getLevels(access.classroom.id);
        res.status(200).json({ success: true, message: "Levels retrieved successfully.", data, statusCode: 200 });

    } catch (error) {
        console.error("Fail to get the class levels at the controller due to: " + error);
        next(error);
    }
};

//A new, unused class code for the Settings page: POST /api/classes/:id/class-code
//It isn't saved here; it's saved with everything else when the owner confirms Update.
export const generateClassCode = async (req, res, next) => {
    try {
        const classroom = await Classroom.getClassById(req.params.id, req.user.id);
        if (!classroom) return sendError(res, 404, "Class not found.");
        if (!isOwnerOrAdmin(req.user, classroom)) return sendError(res, 403, "Only the class owner can change the class code.");

        const classCode = await Classroom.generateUniqueCode();
        res.status(200).json({ success: true, message: "New class code generated.", data: { classCode }, statusCode: 200 });

    } catch (error) {
        console.error("Fail to generate the class code at the controller due to: " + error);
        next(error);
    }
};

//Save the whole Settings page in one go: PUT /api/classes/:id/settings
//multipart: className, maxStudents, classCode, levels = JSON [{ id?, xpRequired, achievement?: { title, description, keepBadge } }]
//and a badge image per level in field "badge_<index>". Only the class owner (or an admin) may save.
export const saveClassSettings = async (req, res, next) => {
    const uploaded = req.files || [];
    const discardUploads = () => Promise.all(uploaded.map((f) => removeLevelBadgeFile(f.filename)));
    const fail = async (status, error) => {
        await discardUploads();
        return sendError(res, status, error);
    };

    try {
        const classroom = await Classroom.getClassById(req.params.id, req.user.id);
        if (!classroom) return fail(404, "Class not found.");
        if (!isOwnerOrAdmin(req.user, classroom)) return fail(403, "Only the class owner can change the settings.");

        const className = (req.body.className || '').trim();
        const maxStudents = Number(req.body.maxStudents);
        const classCode = (req.body.classCode || '').trim().toLowerCase();

        if (!className || className.length > 150) return fail(400, "Class name is required and must be at most 150 characters.");
        if (!Number.isInteger(maxStudents) || maxStudents < 1 || maxStudents > MAX_STUDENTS_LIMIT) {
            return fail(400, `Number of students must be a whole number between 1 and ${MAX_STUDENTS_LIMIT}.`);
        }
        if (maxStudents < classroom.member_count) {
            return fail(400, `${classroom.member_count} people have already joined, so the limit cannot be lower than that.`);
        }
        if (!CLASS_CODE.test(classCode)) return fail(400, "The class code must be 8 lowercase letters or digits.");

        let raw;
        try { raw = JSON.parse(req.body.levels || '[]'); } catch { return fail(400, "The levels could not be read."); }
        if (!Array.isArray(raw)) return fail(400, "The levels could not be read.");
        if (raw.length > MAX_LEVELS) return fail(400, `A class can have at most ${MAX_LEVELS} levels.`);

        //Same rules as the popup: whole numbers, Level 1 at 0 or more, and each level above the one before.
        //An achievement needs a title, a description and a badge image.
        const levels = [];
        const current = await ClassLevel.getLevels(classroom.id);
        for (const [index, level] of raw.entries()) {
            const xpRequired = Number(level.xpRequired);
            const label = `Level ${index + 1}`;
            if (!Number.isInteger(xpRequired) || xpRequired < 0) return fail(400, `${label} needs a whole number of experience points.`);
            if (index > 0 && xpRequired <= levels[index - 1].xpRequired) {
                return fail(400, `${label}'s experience point must be greater than the previous level point (${levels[index - 1].xpRequired}).`);
            }

            let achievement = null;
            if (level.achievement) {
                const title = String(level.achievement.title || '').trim();
                const description = String(level.achievement.description || '').trim();
                if (!title || !description) return fail(400, `${label}'s achievement needs a title and a description.`);
                if (title.length > 150) return fail(400, `${label}'s achievement title must be at most 150 characters.`);

                const newBadge = uploaded.find((f) => f.fieldname === `badge_${index}`);
                const oldBadge = current.find((l) => l.id === Number(level.id))?.achievement?.badgeImage ?? null;
                const badgeImage = newBadge ? newBadge.filename : (level.achievement.keepBadge ? oldBadge : null);
                if (!badgeImage) return fail(400, `${label}'s achievement needs a badge image.`);

                achievement = { title, description, badgeImage };
            }

            levels.push({ id: level.id ? Number(level.id) : null, xpRequired, achievement });
        }

        //A badge uploaded for a level that has no achievement (or a stray field) isn't used.
        const used = new Set(levels.map((l) => l.achievement?.badgeImage).filter(Boolean));
        await Promise.all(uploaded.filter((f) => !used.has(f.filename)).map((f) => removeLevelBadgeFile(f.filename)));

        let unusedBadges;
        try {
            unusedBadges = await ClassLevel.saveSettings(classroom.id, { className, maxStudents, classCode }, levels);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') return fail(409, "That class code is already used by another class. Generate a new one.");
            throw error;
        }
        await removeLevelBadgeFiles(unusedBadges);

        res.status(200).json({
            success: true,
            message: "Settings saved successfully.",
            data: { className, maxStudents, classCode, levels: await ClassLevel.getLevels(classroom.id) },
            statusCode: 200
        });

    } catch (error) {
        await discardUploads();
        console.error("Fail to save the class settings at the controller due to: " + error);
        next(error);
    }
};
