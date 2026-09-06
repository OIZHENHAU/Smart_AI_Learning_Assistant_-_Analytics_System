import express from 'express';
import protect from '../middleware/Auth.js';
import {
    createEvent,
    getAllEvents,
    updateEvent,
    deleteEvent
} from '../controller/CalendarEventController.js';

const router = express.Router();
router.use(protect);

router.get('/', getAllEvents);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
