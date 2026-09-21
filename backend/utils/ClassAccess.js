import sanitizeHTML from 'sanitize-html';
import Classroom from '../models/Classroom.js';

export const STAFF_ROLES = ['lecturer', 'parents', 'admin'];
export const sendError = (res, status, error) => res.status(status).json({ success: false, error, statusCode: status });

//Owner, admin or approved member can read. Lecturer, parents and admin can also manage.
export const getClassAccess = async (classId, user) => {
    const classroom = await Classroom.getClassById(classId, user.id);

    if (!classroom) {
        return { status: 404, error: "Class was not found." };
    }

    const hasAccess = user.role === 'admin' || classroom.owner_id === user.id || classroom.my_status === 'approved';
    if (!hasAccess) {
        return { status: 403, error: "You do not have access to this class." };
    }

    return { classroom, canManage: STAFF_ROLES.includes(user.role) };
};

//Runs before multer, so a student (or anyone without access) can't leave a file on disk.
export const requireClassManager = async (req, res, next) => {
    try {
        const access = await getClassAccess(req.params.id, req.user);
        if (access.error) return sendError(res, access.status, access.error);
        if (!access.canManage) return sendError(res, 403, "Only lecturer, parents or admin can do this.");

        next();

    } catch (error) {
        next(error);
    }
};

//Comments use the same cleaning rules as announcements, minus <img> because comments can't have images.
export const COMMENT_CLEAN_OPTIONS = {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'a', 'span', 'h1', 'h2', 'h3', 'blockquote'],
    allowedAttributes: { a: ['href', 'target', 'rel'], span: ['style'] },
    allowedStyles: { span: { 'font-family': [/^[\w\s,'"-]+$/] } },
    allowedSchemes: ['http', 'https'],
    transformTags: { a: sanitizeHTML.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }) }
};
