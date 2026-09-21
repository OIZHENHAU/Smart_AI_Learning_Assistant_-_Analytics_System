import Classroom from '../models/Classroom.js';
import Announcement from '../models/Announcement.js';
import { extractImageFilenames, deleteUnusedImages } from '../utils/AnnouncementImages.js';

const MAX_STUDENTS_LIMIT = 500;

const canManageClass = (user, classroom) => user.role === 'admin' || classroom.owner_id === user.id;

const sendError = (res, status, error) => res.status(status).json({ success: false, error, statusCode: status });

//Loads the class and checks the caller owns it (or is admin). Returns { classroom } or { status, error }.
const getManagedClass = async (req) => {
    const classroom = await Classroom.getClassById(req.params.id, req.user.id);

    if (!classroom) return { status: 404, error: "Class not found." };
    if (!canManageClass(req.user, classroom)) return { status: 403, error: "You cannot manage this class." };

    return { classroom };
};

const parseMaxStudents = (value) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 && parsed <= MAX_STUDENTS_LIMIT ? parsed : null;
};

//Create a class: POST /api/classes
export const createClass = async (req, res, next) => {
    try {
        const className = (req.body.className || '').trim();
        const maxStudents = parseMaxStudents(req.body.maxStudents);

        if (!className || className.length > 150) {
            return res.status(400).json({
                success: false,
                error: "Class name is required and must be at most 150 characters.",
                statusCode: 400
            });
        }
        if (!maxStudents) {
            return res.status(400).json({
                success: false,
                error: `Number of students must be a whole number between 1 and ${MAX_STUDENTS_LIMIT}.`,
                statusCode: 400
            });
        }

        const created = await Classroom.createClassroom({ ownerId: req.user.id, className, maxStudents });

        res.status(201).json({
            success: true,
            message: "Class created successfully.",
            data: created,
            statusCode: 201
        });

    } catch (error) {
        console.error("Fail to create the class at the controller due to: " + error);
        next(error);
    }
};

//Get all classes based on search filters: GET /api/classes
export const getAllClasses = async (req, res, next) => {
    try {
        const { className, classCode, startDate, endDate } = req.query;
        const data = await Classroom.getAllClasses({
            userId: req.user.id,
            role: req.user.role,
            className, classCode, startDate, endDate
        });

        res.status(200).json({
            success: true,
            message: "Classes retrieved successfully.",
            data,
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get all the classes at the controller due to: " + error);
        next(error);
    }
};

//Get one class: GET /api/classes/:id
export const getClassById = async (req, res, next) => {
    try {
        const classroom = await Classroom.getClassById(req.params.id, req.user.id);

        if (!classroom) {
            return res.status(404).json({ success: false, error: "Class not found.", statusCode: 404 });
        }
        if (!canManageClass(req.user, classroom)) {
            return res.status(403).json({ success: false, error: "You cannot view this class.", statusCode: 403 });
        }

        res.status(200).json({
            success: true,
            message: "Class retrieved successfully.",
            data: classroom,
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get the class at the controller due to: " + error);
        next(error);
    }
};

//Look a class up by its code: GET /api/classes/code/:code
export const findClassByCode = async (req, res, next) => {
    try {
        const classCode = (req.params.code || '').trim().toLowerCase();
        const classroom = classCode ? await Classroom.getClassByCode(classCode, req.user.id) : null;

        if (!classroom) {
            return res.status(404).json({ success: false, error: "No such class exists.", statusCode: 404 });
        }

        res.status(200).json({
            success: true,
            message: "Class found.",
            data: classroom,
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to find the class by code at the controller due to: " + error);
        next(error);
    }
};

//Open a class workspace (owner, admin or approved member only): GET /api/classes/:id/workspace
export const getClassWorkspace = async (req, res, next) => {
    try {
        const classroom = await Classroom.getClassById(req.params.id, req.user.id);

        if (!classroom) {
            return res.status(404).json({ success: false, error: "Class not found.", statusCode: 404 });
        }

        const canManage = canManageClass(req.user, classroom);
        const isApprovedMember = classroom.my_status === 'approved';

        if (!canManage && !isApprovedMember) {
            const error = classroom.my_status === 'pending'
                ? "Your request to join this class is still waiting for approval."
                : classroom.my_status === 'deactivated'
                    ? "Your access to this class has been deactivated."
                    : "You do not have access to this class.";
            return res.status(403).json({ success: false, error, statusCode: 403 });
        }

        res.status(200).json({
            success: true,
            message: "Class workspace retrieved successfully.",
            data: { ...classroom, class_role: canManage ? 'owner' : 'member' },
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to open the class workspace at the controller due to: " + error);
        next(error);
    }
};

//Update class name / number of students: PUT /api/classes/:id
export const updateClass = async (req, res, next) => {
    try {
        const classroom = await Classroom.getClassById(req.params.id, req.user.id);

        if (!classroom) {
            return res.status(404).json({ success: false, error: "Class not found.", statusCode: 404 });
        }
        if (!canManageClass(req.user, classroom)) {
            return res.status(403).json({ success: false, error: "You cannot edit this class.", statusCode: 403 });
        }

        const className = (req.body.className || '').trim();
        const maxStudents = parseMaxStudents(req.body.maxStudents);

        if (!className || className.length > 150) {
            return res.status(400).json({
                success: false,
                error: "Class name is required and must be at most 150 characters.",
                statusCode: 400
            });
        }
        if (!maxStudents) {
            return res.status(400).json({
                success: false,
                error: `Number of students must be a whole number between 1 and ${MAX_STUDENTS_LIMIT}.`,
                statusCode: 400
            });
        }
        if (maxStudents < classroom.member_count) {
            return res.status(400).json({
                success: false,
                error: `${classroom.member_count} people have already joined, so the limit cannot be lower than that.`,
                statusCode: 400
            });
        }

        await Classroom.updateClass(classroom.id, { className, maxStudents });

        res.status(200).json({
            success: true,
            message: "Class updated successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to update the class at the controller due to: " + error);
        next(error);
    }
};

//Delete a class: DELETE /api/classes/:id
export const deleteClass = async (req, res, next) => {
    try {
        const classroom = await Classroom.getClassById(req.params.id, req.user.id);

        if (!classroom) {
            return res.status(404).json({ 
                success: false, 
                error: "Class not found.", 
                statusCode: 404 
            });
        }
        if (!canManageClass(req.user, classroom)) {
            return res.status(403).json({ 
                success: false, 
                error: "You cannot delete this class.", 
                statusCode: 403 
            });
        }

        //Read the announcements before the class delete cascades them away, then remove their images from disk.
        const announcements = await Announcement.getContentByClass(classroom.id);
        await Classroom.deleteClass(classroom.id);
        await deleteUnusedImages([...new Set(announcements.flatMap((a) => extractImageFilenames(a.content)))]);

        res.status(200).json({
            success: true,
            message: "Class deleted successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to delete the class at the controller due to: " + error);
        next(error);
    }
};

//Join a class: POST /api/classes/:id/join
export const joinClass = async (req, res, next) => {
    try {
        const outcome = await Classroom.joinClass(req.params.id, req.user.id, req.user.role);

        const responses = {
            joined: { status: 200, message: "You have joined the class." },
            requested: { status: 200, message: "Join request sent. Waiting for approval." },
            not_found: { status: 404, error: "Class not found." },
            already_joined: { status: 409, error: "You have already joined this class." },
            full: { status: 400, error: "This class is already full." }
        };
        const { status, message, error } = responses[outcome];

        res.status(status).json({ success: status === 200, message, error, statusCode: status });

    } catch (error) {
        console.error("Fail to join the class at the controller due to: " + error);
        next(error);
    }
};

//List who requested to join the class: GET /api/classes/:id/members
export const getClassMembers = async (req, res, next) => {
    try {
        const { classroom, status, error } = await getManagedClass(req);
        if (error) return sendError(res, status, error);

        const { username, email, role, startDate, endDate } = req.query;
        const data = await Classroom.getMembers(classroom.id, { username, email, role, startDate, endDate });

        res.status(200).json({
            success: true,
            message: "Class members retrieved successfully.",
            data,
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get the class members at the controller due to: " + error);
        next(error);
    }
};

//Approve a join request or re-activate a member: PUT /api/classes/:id/members/:userId/approve
export const approveClassMember = async (req, res, next) => {
    try {
        const { classroom, status, error } = await getManagedClass(req);
        if (error) return sendError(res, status, error);

        const outcome = await Classroom.approveMember(classroom.id, req.params.userId);

        const responses = {
            approved: { status: 200, message: "Member approved successfully." },
            not_found: { status: 404, error: "This user is not in the class." },
            already_approved: { status: 409, error: "This member is already active." },
            full: { status: 400, error: "This class is already full." }
        };
        const result = responses[outcome];

        res.status(result.status).json({
            success: result.status === 200,
            message: result.message,
            error: result.error,
            statusCode: result.status
        });

    } catch (error) {
        console.error("Fail to approve the class member at the controller due to: " + error);
        next(error);
    }
};

//Deactivate a member: PUT /api/classes/:id/members/:userId/deactivate
export const deactivateClassMember = async (req, res, next) => {
    try {
        const { classroom, status, error } = await getManagedClass(req);
        if (error) return sendError(res, status, error);

        const updated = await Classroom.deactivateMember(classroom.id, req.params.userId);
        if (!updated) return sendError(res, 404, "No active member found.");

        res.status(200).json({
            success: true,
            message: "Member deactivated successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to deactivate the class member at the controller due to: " + error);
        next(error);
    }
};

//Remove a member or reject a request: DELETE /api/classes/:id/members/:userId
export const removeClassMember = async (req, res, next) => {
    try {
        const { classroom, status, error } = await getManagedClass(req);
        if (error) return sendError(res, status, error);

        const removed = await Classroom.removeMember(classroom.id, req.params.userId);
        if (!removed) return sendError(res, 404, "This user is not in the class.");

        res.status(200).json({
            success: true,
            message: "Member removed successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to remove the class member at the controller due to: " + error);
        next(error);
    }
};
