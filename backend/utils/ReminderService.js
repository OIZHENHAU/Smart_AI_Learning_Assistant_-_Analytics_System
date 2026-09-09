import twilio from 'twilio';
import db from '../config/MySQL.js';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const ReminderService = {
    async scheduleReminder({ eventId, userId, remindAt, minutesBefore }) {
        await db.execute(
            `INSERT INTO event_reminders (event_id, user_id, remind_at, minutes_before) VALUES (?, ?, ?, ?)`,
            [eventId, userId, remindAt, minutesBefore]
        );
    },

    async cancelReminder({ eventId, userId }) {
        const [result] = await db.execute(
            `DELETE FROM event_reminders WHERE event_id = ? AND user_id = ? AND sent = FALSE`,
            [eventId, userId]
        );

        return result.affectedRows > 0;
    },

    //Run every minutes from the server.js, and sends anything that was now due
    async processDueReminders() {
        const [dueReminders] = await db.execute(
            `
            SELECT er.id, er.minutes_before, ce.title, u.phone_number
            FROM event_reminders er
            JOIN calendar_events ce ON ce.id = er.event_id
            JOIN users u ON u.id = er.user_id
            WHERE er.sent = FALSE AND er.remind_at <= NOW()
            `
        );

        for (const reminder of dueReminders) {
            if (!reminder.phone_number) {
                continue;
            }

            try {
                await client.messages.create({
                    body: `Reminder: "${reminder.title}" will be starts in ${reminder.minutes_before} minutes.`,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: reminder.phone_number
                });

                await db.execute(`UPDATE event_reminders SET sent = TRUE WHERE id = ?`, [reminder.id]);

            } catch (error) {
                console.error(`Fail to send the SMS reminder ${reminder.id} due to: ` + error);
            }
        }
    }

};

export default ReminderService;