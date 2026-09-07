import CalendarEvent from '../models/CalendarEvent.js';
import ReminderService from '../utils/ReminderService.js';

//Create a new calendar event POST /api/calendar-events
export const createEvent = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { title, description, startTime, endTime, color, documentId, quizId } = req.body;

        if (!title || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                error: "Please provide a title, start time and end time.",
                statusCode: 400
            });
        }

        const eventId = await CalendarEvent.createEvent({ userId, title, description, startTime, endTime, color, documentId, quizId });

        res.status(201).json({
            success: true,
            data: { id: eventId },
            message: "Event created successfully.",
            statusCode: 201
        });

    } catch (error) {
        console.error("Fail to create the calendar event due to: " + error);
        next(error);
    }
};

//Get all calendar events for the user GET /api/calendar-events
export const getAllEvents = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const events = await CalendarEvent.getAllEvents(userId);

        res.status(200).json({
            success: true,
            count: events.length,
            data: events,
            message: "Calendar events retrieved successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get all the calendar events due to: " + error);
        next(error);
    }
};

//Get a single calendar event by ID GET /api/calendar-events/:id
export const getEventById = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id: eventId } = req.params;

        const particularEvent = await CalendarEvent.getEventById({ eventId, userId });

        if (!particularEvent) {
            return res.status(404).json({
                success: false,
                error: "Event not found.",
                statusCode: 404
            });
        }
        
        res.status(200).json({
            success: true,
            data: particularEvent,
            message: "Calendar event retrieved successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to get the calendar event by ID due to: " + error);
        next(error);
    }
};

//Update a calendar event PUT /api/calendar-events/update/:id
export const updateEvent = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id: eventId } = req.params;
        const { title, description, startTime, endTime, color, documentId, quizId } = req.body;

        if (!title || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                error: "Please provide a title, start time and end time.",
                statusCode: 400
            });
        }

        const updated = await CalendarEvent.updateEvent({ eventId, userId, title, description, startTime, endTime, color, documentId, quizId });

        if (!updated) {
            return res.status(404).json({
                success: false,
                error: "Event not found.",
                statusCode: 404
            });
        }

        res.status(200).json({
            success: true,
            message: "Event updated successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to update the calendar event due to: " + error);
        next(error);
    }
};

//Delete a calendar event DELETE /api/calendar-events/delete/:id
export const deleteEvent = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id: eventId } = req.params;

        const deleted = await CalendarEvent.deleteEvent({ eventId, userId });

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: "Event not found.",
                statusCode: 404
            });
        }

        res.status(200).json({
            success: true,
            message: "Event deleted successfully.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to delete the calendar event due to: " + error);
        next(error);
    }
};

export const setReminder = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id: eventId } = req.params;

        if (!req.user.phone_number) {
            return res.status(400).json({
                success: false,
                error: "Please provide a phone number to your profile first.",
                statusCode: 400
            });
        }

        const event = await CalendarEvent.getEventById({ eventId, userId });

        if (!event) {
            return res.status(404).json({
                success: false,
                error: "Such event was not found.",
                statusCode: 404
            });
        }

        const remindAt = new Date(new Date(event.start_time).getTime() - 30 * 60 * 1000);

        if (remindAt <= new Date()) {
            return res.status(400).json({
                success: false,
                error: "This event starts in less than 30 minutes or has already started."
            })
        }

        await ReminderService.scheduleReminder({ eventId, userId, remindAt });

        res.status(200).json({
            success: true,
            message: "SMS reminder was scheduled.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to schedule the SMS reminder due to: " + error);
        next(error);
    }
}

export const cancelReminder = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id: eventId } = req.params;

        const event = await CalendarEvent.getEventById({ eventId, userId });

        if (!event) {
            return res.status(404).json({
                success: false,
                error: "Such event was not found.",
                statusCode: 404
            });
        }

        await ReminderService.cancelReminder({ eventId, userId });

        res.status(200).json({
            success: true,
            message: "SMS reminder was cancelled.",
            statusCode: 200
        });

    } catch (error) {
        console.error("Fail to cancel the SMS reminder due to: " + error);
        next(error);
    }
}
