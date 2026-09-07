import db from '../config/MySQL.js';

const CalendarEvent = {
    async createEvent({ userId, title, description, startTime, endTime, color, documentId, quizId }) {
        const [result] = await db.execute(
            `
            INSERT INTO calendar_events (user_id, title, description, start_time, end_time, color, document_id, quiz_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [userId, title, description || null, startTime, endTime, color || '#7c3aed', documentId || null, quizId || null]
        );

        return result.insertId;
    },

    async getAllEvents(userId) {
        const [events] = await db.execute(
            `
            SELECT ce.id, ce.title, ce.description, ce.start_time, ce.end_time, ce.color, ce.created_at,
                    ce.document_id, ce.quiz_id, d.title AS document_title, q.title AS quiz_title,
                    EXISTS (
                        SELECT 1 FROM event_reminders er
                        WHERE er.event_id = ce.id AND er.sent = FALSE
                    ) AS has_reminder
            FROM calendar_events ce
            LEFT JOIN documents d ON ce.document_id = d.id
            LEFT JOIN quizzes q ON ce.quiz_id = q.id
            WHERE ce.user_id = ?
            ORDER BY ce.start_time ASC
            `,
            [userId]
        );

        return events;
    },

    async getEventById({ eventId, userId }) {
        const [events] = await db.execute(
            `
            SELECT ce.id, ce.title, ce.description, ce.start_time, ce.end_time, ce.color, ce.created_at,
                    ce.document_id, ce.quiz_id, d.title AS document_title, q.title AS quiz_title,
                    EXISTS (
                        SELECT 1 FROM event_reminders er
                        WHERE er.event_id = ce.id AND er.sent = FALSE
                    ) AS has_reminder
            FROM calendar_events ce
            LEFT JOIN documents d ON ce.document_id = d.id
            LEFT JOIN quizzes q ON ce.quiz_id = q.id
            WHERE ce.id = ? AND ce.user_id = ?
            `,
            [eventId, userId]
        );

        return events[0];
    },

    async updateEvent({ eventId, userId, title, description, startTime, endTime, color, documentId, quizId }) {
        const [result] = await db.execute(
            `
            UPDATE calendar_events
            SET title = ?, description = ?, start_time = ?, end_time = ?, color = ?, document_id = ?, quiz_id = ?
            WHERE id = ? AND user_id = ?
            `,
            [title, description || null, startTime, endTime, color || '#7c3aed', documentId || null, quizId || null, eventId, userId]
        );

        return result.affectedRows > 0;
    },

    async deleteEvent({ eventId, userId }) {
        const [result] = await db.execute(
            `DELETE FROM calendar_events WHERE id = ? AND user_id = ?`,
            [eventId, userId]
        );

        return result.affectedRows > 0;
    }
};

export default CalendarEvent;
