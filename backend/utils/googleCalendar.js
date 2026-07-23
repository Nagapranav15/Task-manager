const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/calendar.events"];

let calendar = null;

const getCalendarClient = () => {
    if (calendar) return calendar;

    // 1. Try OAuth2 Refresh Token (Solution B)
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (clientId && clientSecret && refreshToken) {
        try {
            const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
            oauth2Client.setCredentials({ refresh_token: refreshToken });
            calendar = google.calendar({ version: "v3", auth: oauth2Client });
            return calendar;
        } catch (err) {
            console.error("[Google Calendar] Failed to initialize OAuth2 client:", err);
        }
    }

    // 2. Fallback to Service Account JWT (Solution A)
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n") : null;

    if (clientEmail && privateKey) {
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
        }
    }

    console.warn("[Google Calendar] Missing credentials in environment. Calendar sync is disabled.");
    return null;
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

/**
 * Creates a Google Calendar Meeting Event with Google Meet conference data
 * @param {Object} meeting The Meeting document
 * @param {Array<string>} attendeeEmails Participant emails
 * @returns {Promise<{ googleEventId: string|null, meetLink: string }>}
 */
const createMeetingEvent = async (meeting, attendeeEmails = []) => {
    const calendarClient = getCalendarClient();
    if (!calendarClient) {
        const randStr = (len) => Array.from({length: len}, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join("");
        const mockLink = `https://meet.google.com/${randStr(3)}-${randStr(4)}-${randStr(3)}`;
        return { googleEventId: null, meetLink: mockLink };
    }

    const start = new Date(meeting.startTime);
    const end = new Date(meeting.endTime);

    const event = {
        summary: `Meeting: ${meeting.title}`,
        description: meeting.description || "Scheduled meeting via Task Tracker.",
        start: {
            dateTime: start.toISOString(),
            timeZone: "UTC"
        },
        end: {
            dateTime: end.toISOString(),
            timeZone: "UTC"
        },
        attendees: attendeeEmails.map(email => ({ email })),
        conferenceData: {
            createRequest: {
                requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                conferenceSolutionKey: {
                    type: "hangoutsMeet"
                }
            }
        },
        reminders: {
            useDefault: true
        }
    };

    try {
        const response = await calendarClient.events.insert({
            calendarId: "primary",
            resource: event,
            conferenceDataVersion: 1, // Enables Google Meet link creation
            sendUpdates: "all"
        });

        const googleEventId = response.data.id;
        const meetLink = response.data.hangoutLink || response.data.conferenceData?.entryPoints?.find(e => e.entryPointType === "video")?.uri || "";

        return { googleEventId, meetLink };
    } catch (err) {
        console.error("[Google Calendar] Error creating meeting event:", err.message);
        return { googleEventId: null, meetLink: "" };
    }
};

/**
 * Updates a Google Calendar Meeting Event
 * @param {string} eventId The Google Calendar Event ID
 * @param {Object} meeting The Meeting document
 * @param {Array<string>} attendeeEmails Participant emails
 * @returns {Promise<{ googleEventId: string|null, meetLink: string }>}
 */
const updateMeetingEvent = async (eventId, meeting, attendeeEmails = []) => {
    const calendarClient = getCalendarClient();
    if (!calendarClient || !eventId) {
        let currentLink = meeting.meetLink;
        if (!currentLink || !currentLink.startsWith("https://meet.google.com/")) {
            const randStr = (len) => Array.from({length: len}, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join("");
            currentLink = `https://meet.google.com/${randStr(3)}-${randStr(4)}-${randStr(3)}`;
        }
        return { googleEventId: eventId || null, meetLink: currentLink };
    }

    const start = new Date(meeting.startTime);
    const end = new Date(meeting.endTime);

    const event = {
        summary: `Meeting: ${meeting.title}`,
        description: meeting.description || "Scheduled meeting via Task Tracker.",
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

        const meetLink = response.data.hangoutLink || response.data.conferenceData?.entryPoints?.find(e => e.entryPointType === "video")?.uri || meeting.meetLink || "";
        return { googleEventId: response.data.id, meetLink };
    } catch (err) {
        console.error("[Google Calendar] Error updating meeting event:", err.message);
        return { googleEventId: eventId, meetLink: meeting.meetLink || "" };
    }
};

const createHolidayEvent = async (holiday) => {
    const calendarClient = getCalendarClient();
    if (!calendarClient) return null;

    const holidayDate = new Date(holiday.date);
    const dateStr = holidayDate.toISOString().split("T")[0];

    const event = {
        summary: `🏖️ Public Holiday: ${holiday.title}`,
        description: `${holiday.type} Public Holiday\n${holiday.description || ""}`,
        start: {
            date: dateStr,
        },
        end: {
            date: dateStr,
        },
        reminders: {
            useDefault: true
        }
    };

    try {
        const response = await calendarClient.events.insert({
            calendarId: "primary",
            resource: event,
        });
        return response.data.id;
    } catch (err) {
        console.error("[Google Calendar] Error creating holiday event:", err.message);
        return null;
    }
};

const updateHolidayEvent = async (eventId, holiday) => {
    const calendarClient = getCalendarClient();
    if (!calendarClient || !eventId) return null;

    const holidayDate = new Date(holiday.date);
    const dateStr = holidayDate.toISOString().split("T")[0];

    const event = {
        summary: `🏖️ Public Holiday: ${holiday.title}`,
        description: `${holiday.type} Public Holiday\n${holiday.description || ""}`,
        start: {
            date: dateStr,
        },
        end: {
            date: dateStr,
        },
    };

    try {
        const response = await calendarClient.events.update({
            calendarId: "primary",
            eventId: eventId,
            resource: event,
        });
        return response.data.id;
    } catch (err) {
        console.error("[Google Calendar] Error updating holiday event:", err.message);
        return null;
    }
};

module.exports = {
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    createMeetingEvent,
    updateMeetingEvent,
    createHolidayEvent,
    updateHolidayEvent,
};
