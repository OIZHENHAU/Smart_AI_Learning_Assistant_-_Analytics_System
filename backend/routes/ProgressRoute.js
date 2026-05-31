import express from 'express';
import {
    getDashboard,
    startSession,
    endSession
} from '../controller/ProgressController.js';
import protect from '../middleware/Auth.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboard)
router.get('/sesssion/start', startSession)
router.get('/session/:sessionId/end', endSession)

export default router;