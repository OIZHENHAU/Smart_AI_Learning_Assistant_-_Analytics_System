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
    joinClass
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

//Creating and managing classes is for lecturer, parents and admin only.
router.post('/', staffOnly, createClass);
router.get('/:id', staffOnly, getClassById);
router.put('/:id', staffOnly, updateClass);
router.delete('/:id', staffOnly, deleteClass);

export default router;
