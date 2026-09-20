import sanitizeHtml from 'sanitize-html';
import Announcement from '../models/Announcement.js';
import Classroom from '../models/Classroom.js';
import { extractImageFilenames, deleteUnusedImages } from '../utils/AnnouncementImages.js';

const STAFF_ROLES = ['lecturer', 'parents', 'admin'];
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

//Only these tags/styles survive, everything else (scripts, event handlers, ...) is removed before saving.
const CLEAN_OPTIONS = {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'a', 'img', 'span', 'h1', 'h2', 'h3', 'blockquote'],
    allowedAttributes: { a: ['href', 'target', 'rel'], img: ['src', 'alt'], span: ['style'] },
    allowedStyles: { span: { 'font-family': [/^[\w\s,'"-]+$/] } },
    allowedSchemes: ['http', 'https'],
    transformTags: { a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }) }
};

//Same text without any tags, so searching "span" doesn't match the HTML.
const toPlainText = (html) =>
    sanitizeHtml(html.replace(/<\/(p|li|h[1-3]|blockquote)>/gi, ' '), { allowedTags: [], allowedAttributes: {} }).trim();

//Anyone with access to the class (owner, admin or approved member) can read.
//Lecturer, parents and admin can also create, edit and delete. Students can not.
const getClassAccess = async (classId, user) => {
    const classroom = await Classroom.getClassById(classId, user.id);

    if (!classroom) return { status: 404, error: "Class not found." };

    const hasAccess = user.role === 'admin' || classroom.owner_id === user.id || classroom.my_status === 'approved';
    if (!hasAccess) return { status: 403, error: "You do not have access to this class." };

    return { classroom, canManage: STAFF_ROLES.includes(user.role) };
};

const sendError = (res, status, error) => res.status(status).json({ success: false, error, statusCode: status });

//Validates and cleans the title/content from the request, returns { title, content, contentText } or { error }.
const readAnnouncementBody = (body) => {
    const title = (body.title || '').trim();
    const content = sanitizeHtml(body.content || '', CLEAN_OPTIONS);
    const contentText = toPlainText(content);

    if (!title || title.length > 255) return { error: "Title is required and must be at most 255 characters." };
    if (!contentText && !content.includes('<img')) return { error: "Please write the announcement information." };

    return { title, content, contentText };
};

//Runs before multer, so a student (or anyone without access) can't leave a file on disk.
export const requireAnnouncementManager = async (req, res, next) => {
    try {
        const access = await getClassAccess(req.params.id, req.user);
        if (access.error) return sendError(res, access.status, access.error);
        if (!access.canManage) return sendError(res, 403, "Only lecturer, parents or admin can do this.");

        next();

    } catch (error) {
        next(error);
    }
};

//Get announcements: GET /api/classes/:id/announcements?search=&startDate=&endDate=&page=&pageSize=
export const getAnnouncements = async (req, res, next) => {
    try {
        const access = await getClassAccess(req.params.id, req.user);
        if (access.error) return sendError(res, access.status, access.error);

        const { search, startDate, endDate } = req.query;
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);

        const { rows, total } = await Announcement.getAnnouncement({
            classId: access.classroom.id, search, startDate, endDate, page, pageSize
        });

        res.status(200).json({
            success: true,
            message: "Announcements retrieved successfully.",
            data: rows,
            pagination: { page, pageSize, total, totalPages: Math.max(Math.ceil(total / pageSize), 1) },
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get the announcements at the controller due to: " + error);
        next(error);
    }
};

//Publish an announcement: POST /api/classes/:id/announcements
export const createAnnouncement = async (req, res, next) => {
    try {
        const access = await getClassAccess(req.params.id, req.user);
        if (access.error) return sendError(res, access.status, access.error);
        if (!access.canManage) return sendError(res, 403, "Only lecturer, parents or admin can publish announcements.");

        const body = readAnnouncementBody(req.body);
        if (body.error) return sendError(res, 400, body.error);

        const id = await Announcement.createAnnouncement({
            classId: access.classroom.id, authorId: req.user.id, ...body
        });

        res.status(201).json({ success: true, message: "Announcement published successfully.", data: { id }, statusCode: 201 });

    } catch (error) {
        console.error("Fail to create the announcement at the controller due to: " + error);
        next(error);
    }
};

//Edit an announcement: PUT /api/classes/:id/announcements/:announcementId
export const updateAnnouncement = async (req, res, next) => {
    try {
        const access = await getClassAccess(req.params.id, req.user);
        if (access.error) return sendError(res, access.status, access.error);
        if (!access.canManage) return sendError(res, 403, "Only lecturer, parents or admin can edit announcements.");

        const announcement = await Announcement.getAnnouncementById(req.params.announcementId);
        if (!announcement || announcement.class_id !== access.classroom.id) {
            return sendError(res, 404, "Announcement not found.");
        }

        const body = readAnnouncementBody(req.body);
        if (body.error) return sendError(res, 400, body.error);

        await Announcement.updateAnnouncement(announcement.id, body);

        //Images that were in the old text but not in the new one are no longer needed.
        const stillUsed = extractImageFilenames(body.content);
        const removed = extractImageFilenames(announcement.content).filter((filename) => !stillUsed.includes(filename));
        await deleteUnusedImages(removed, announcement.id);

        res.status(200).json({ success: true, message: "Announcement updated successfully.", statusCode: 200 });

    } catch (error) {
        console.error("Fail to update the announcement at the controller due to: " + error);
        next(error);
    }
};

//Delete an announcement and its images: DELETE /api/classes/:id/announcements/:announcementId
export const deleteAnnouncement = async (req, res, next) => {
    try {
        const access = await getClassAccess(req.params.id, req.user);
        if (access.error) return sendError(res, access.status, access.error);
        if (!access.canManage) return sendError(res, 403, "Only lecturer, parents or admin can delete announcements.");

        const announcement = await Announcement.getAnnouncementById(req.params.announcementId);
        if (!announcement || announcement.class_id !== access.classroom.id) {
            return sendError(res, 404, "Announcement not found.");
        }

        await Announcement.deleteAnnouncement(announcement.id);
        await deleteUnusedImages(extractImageFilenames(announcement.content));

        res.status(200).json({ success: true, message: "Announcement deleted successfully.", statusCode: 200 });

    } catch (error) {
        console.error("Fail to delete the announcement at the controller due to: " + error);
        next(error);
    }
};

//Upload an image for the editor: POST /api/classes/:id/announcements/images  (form field "image")
//Access is already checked by requireAnnouncementManager.
export const uploadAnnouncementImage = async (req, res, next) => {
    try {
        if (!req.file) return sendError(res, 400, "Please choose an image.");

        const url = `http://localhost:${process.env.PORT || 5528}/uploads/announcements/${req.file.filename}`;

        res.status(201).json({ success: true, data: { url }, statusCode: 201 });

    } catch (error) {
        console.error("Fail to upload the announcement image at the controller due to: " + error);
        next(error);
    }
};
