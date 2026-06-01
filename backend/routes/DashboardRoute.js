import express from 'express';
import {
    getMainDashboard
} from '../controller/DashboardController.js';
import protect from '../middleware/Auth.js';

const router = express.Router();

router.use(protect);

router.get('/main-dashboard', getMainDashboard);

export default router;