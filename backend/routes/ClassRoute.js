import express from 'express';
import protect, { requireRole } from '../middleware/Auth.js';
import {
    createClass,
    getAllClasses,
    getClassById,
    findClassByCode,
    getClassWorkspace,
    updateClass,
    deleteClass,
    joinClass,
    getClassMembers,
    approveClassMember,
    deactivateClassMember,
    removeClassMember
} from '../controller/ClassController.js';
import uploadAnnouncementImage from '../config/announcementImageUpload.js';
import {
    getAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    uploadAnnouncementImage as saveAnnouncementImage,
    requireAnnouncementManager
} from '../controller/AnnouncementController.js';

import uploadClassDocument from '../config/classDocumentUpload.js';
import { requireClassManager } from '../utils/ClassAccess.js';
import {
    getClassDocuments,
    createClassDocument,
    getClassDocument,
    deleteClassDocument,
    getComments,
    createComment,
    updateComment,
    deleteComment
} from '../controller/ClassDocumentController.js';

const router = express.Router();

const staffOnly = requireRole('lecturer', 'parents', 'admin');
const everyone = requireRole('student', 'lecturer', 'parents', 'admin');

router.use(protect);

//Students may list their own classes, look a class up by code and request to join it.
router.get('/', everyone, getAllClasses);
router.get('/code/:code', everyone, findClassByCode);
router.get('/:id/workspace', everyone, getClassWorkspace);
router.post('/:id/join', everyone, joinClass);

//Anyone in the class can read the announcements, only lecturer, parents and admin can publish, edit and delete.
router.get('/:id/announcements', everyone, getAnnouncements);
router.post('/:id/announcements', staffOnly, createAnnouncement);
router.post('/:id/announcements/images', staffOnly, requireAnnouncementManager, uploadAnnouncementImage.single('image'), saveAnnouncementImage);
router.put('/:id/announcements/:announcementId', staffOnly, updateAnnouncement);
router.delete('/:id/announcements/:announcementId', staffOnly, deleteAnnouncement);

//Anyone in the class can read the documents and comment, only lecturer, parents and admin can upload and delete documents.
router.get('/:id/documents', everyone, getClassDocuments);
router.post('/:id/documents', staffOnly, requireClassManager, uploadClassDocument.single('file'), createClassDocument);
router.get('/:id/documents/:documentId', everyone, getClassDocument);
router.delete('/:id/documents/:documentId', staffOnly, deleteClassDocument);

router.get('/:id/documents/:documentId/comments', everyone, getComments);
router.post('/:id/documents/:documentId/comments', everyone, createComment);
router.put('/:id/documents/:documentId/comments/:commentId', everyone, updateComment);
router.delete('/:id/documents/:documentId/comments/:commentId', everyone, deleteComment);

//Creating and managing classes is for lecturer, parents and admin only.
router.post('/', staffOnly, createClass);
router.get('/:id', staffOnly, getClassById);
router.put('/:id', staffOnly, updateClass);
router.delete('/:id', staffOnly, deleteClass);

//Permission page: the class owner (or an admin) manages who joined, the same way User Management does for accounts.
router.get('/:id/members', staffOnly, getClassMembers);
router.put('/:id/members/:userId/approve', staffOnly, approveClassMember);
router.put('/:id/members/:userId/deactivate', staffOnly, deactivateClassMember);
router.delete('/:id/members/:userId', staffOnly, removeClassMember);

export default router;
