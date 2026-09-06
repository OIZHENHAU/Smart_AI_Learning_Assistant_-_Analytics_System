import db from '../config/MySQL.js';

const CalendarEvent = {
    async createEvent({ userId, title, description, startTime, endTime, color }) {
        const [result] = await db.execute(
            `
            INSERT INTO calendar_events (user_id, title, description, start_time, end_time, color)
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [userId, title, description || null, startTime, endTime, color || '#7c3aed']
        );

        return result.insertId;
    },

    async getAllEvents(userId) {
        const [events] = await db.execute(
            `
            SELECT id, title, description, start_time, end_time, color, created_at
            FROM calendar_events
            WHERE user_id = ?
            ORDER BY start_time ASC
            `,
            [userId]
        );

        return events;
    },

    async getEventById({ eventId, userId }) {
        const [events] = await db.execute(
            `
            SELECT id, title, description, start_time, end_time, color, created_at
            FROM calendar_events
            WHERE id = ? AND user_id = ?
            `,
            [eventId, userId]
        );

        return events[0];
    },

    async updateEvent({ eventId, userId, title, description, startTime, endTime, color }) {
        const [result] = await db.execute(
            `
            UPDATE calendar_events
            SET title = ?, description = ?, start_time = ?, end_time = ?, color = ?
            WHERE id = ? AND user_id = ?
            `,
            [title, description || null, startTime, endTime, color || '#7c3aed', eventId, userId]
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
