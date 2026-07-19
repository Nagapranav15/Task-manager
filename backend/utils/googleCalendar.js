const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.events"];

let calendar = null;

const getCalendarClient = () => {
    if (calendar) return calendar;

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    // Replace literal '\n' sequences in key string with actual line breaks
    const privateKey = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n") : null;

    if (!clientEmail || !privateKey) {
        console.warn("[Google Calendar] Missing credentials in environment. Calendar sync is disabled.");
        return null;
    }

    try {
        const auth = new google.auth.JWT(
            clientEmail,
            null,
            privateKey,
            SCOPES
        );
        calendar = google.calendar({ version: "v3", auth });
        return calendar;
    } catch (err) {
        console.error("[Google Calendar] Failed to initialize JWT Auth client:", err);
        return null;
    }
};

/**
 * Creates a Google Calendar event for a task and invites assignees as guests
 * @param {Object} task The Task document
 * @param {Array<string>} attendeeEmails Email list of task assignees
 * @returns {Promise<string|null>} Google Calendar Event ID or null
 */
const createCalendarEvent = async (task, attendeeEmails = []) => {
    const calendarClient = getCalendarClient();
    if (!calendarClient) return null;

    // Use task createdAt as start time and dueDate as end time
    const start = new Date(task.createdAt || Date.now());
    const end = new Date(task.dueDate);

    // Make sure end is after start
    if (end <= start) {
        end.setTime(start.getTime() + 60 * 60 * 1000); // 1 hour default duration
    }

    const event = {
        summary: task.title,
        description: task.description || `Task priority: ${task.priority}\nStatus: ${task.status}`,
        start: {
            dateTime: start.toISOString(),
            timeZone: "UTC"
        },
        end: {
            dateTime: end.toISOString(),
            timeZone: "UTC"
        },
        attendees: attendeeEmails.map(email => ({ email })),
        reminders: {
            useDefault: true
        }
    };

    try {
        const response = await calendarClient.events.insert({
            calendarId: "primary",
            resource: event,
            sendUpdates: "all" // Automatically notifies attendees via email
        });
        return response.data.id;
    } catch (err) {
        console.error("[Google Calendar] Error creating event:", err.message);
        return null;
    }
};

/**
 * Updates a Google Calendar event for a task
 * @param {string} eventId The Google Calendar Event ID
 * @param {Object} task The Task document
 * @param {Array<string>} attendeeEmails Email list of task assignees
 * @returns {Promise<string|null>} Google Calendar Event ID or null
 */
const updateCalendarEvent = async (eventId, task, attendeeEmails = []) => {
    const calendarClient = getCalendarClient();
    if (!calendarClient || !eventId) return null;

    const start = new Date(task.createdAt || Date.now());
    const end = new Date(task.dueDate);

    if (end <= start) {
        end.setTime(start.getTime() + 60 * 60 * 1000);
    }

    const event = {
        summary: task.title,
        description: task.description || `Task priority: ${task.priority}\nStatus: ${task.status}`,
        start: {
            dateTime: start.toISOString(),
            timeZone: "UTC"
        },
        end: {
            dateTime: end.toISOString(),
            timeZone: "UTC"
        },
        attendees: attendeeEmails.map(email => ({ email })),
        reminders: {
            useDefault: true
        }
    };

    try {
        const response = await calendarClient.events.update({
            calendarId: "primary",
            eventId: eventId,
            resource: event,
            sendUpdates: "all"
        });
        return response.data.id;
    } catch (err) {
        console.error("[Google Calendar] Error updating event:", err.message);
        return null;
    }
};

/**
 * Deletes a Google Calendar event
 * @param {string} eventId The Google Calendar Event ID
 * @returns {Promise<boolean>} True if deleted successfully, false otherwise
 */
const deleteCalendarEvent = async (eventId) => {
    const calendarClient = getCalendarClient();
    if (!calendarClient || !eventId) return false;

    try {
        await calendarClient.events.delete({
            calendarId: "primary",
            eventId: eventId,
            sendUpdates: "all"
        });
        return true;
    } catch (err) {
        console.error("[Google Calendar] Error deleting event:", err.message);
        return false;
    }
};

module.exports = {
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent
};
