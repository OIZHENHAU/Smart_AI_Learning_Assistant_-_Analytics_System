import express from 'express';
import protect from '../middleware/Auth.js';
import {
    createEvent,
    getAllEvents,
    updateEvent,
    deleteEvent,
    getEventById,
    setReminder,
    cancelReminder
} from '../controller/CalendarEventController.js';


const router = express.Router();
router.use(protect);

router.get('/', getAllEvents);
router.post('/', createEvent);
router.get('/get/:id', getEventById);
router.put('/update/:id', updateEvent);
router.delete('/delete/:id', deleteEvent);
router.post('/:id/remind', setReminder);
router.delete('/:id/remind', cancelReminder);

export default router;
