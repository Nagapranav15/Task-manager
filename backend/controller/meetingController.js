const Meeting = require("../model/Meeting");
const User = require("../model/User");
const Message = require("../model/Message");
const ActivityLog = require("../model/ActivityLog");
const { createMeetingEvent, updateMeetingEvent, deleteCalendarEvent } = require("../utils/googleCalendar");

// @desc    Schedule a new meeting
// @route   POST /api/meetings
// @access  Private (All Roles)
// @desc    Schedule a new meeting
// @route   POST /api/meetings
// @access  Private (All Roles)
const createMeeting = async (req, res) => {
    try {
        const { title, description, startTime, endTime, participants, externalParticipants } = req.body;

        if (!title || !startTime || !endTime) {
            return res.status(400).json({ message: "Title, start time, and end time are required." });
        }

        const participantIds = Array.isArray(participants) ? participants : [];
        const extEmails = Array.isArray(externalParticipants)
            ? externalParticipants.map(e => e.trim().toLowerCase()).filter(e => e.includes("@"))
            : typeof externalParticipants === "string"
            ? externalParticipants.split(",").map(e => e.trim().toLowerCase()).filter(e => e.includes("@"))
            : [];

        const meeting = await Meeting.create({
            title,
            description,
            startTime,
            endTime,
            organizer: req.user._id,
            participants: participantIds,
            externalParticipants: extEmails
        });

        const populatedMeeting = await Meeting.findById(meeting._id)
            .populate("organizer", "name email profileImageUrl")
            .populate("participants", "name email profileImageUrl");

        // Combine internal and external attendee emails for Google Calendar & Meet
        const attendeeEmails = [
            ...populatedMeeting.participants.map(p => p.email).filter(Boolean),
            ...extEmails
        ];

        if (populatedMeeting.organizer?.email && !attendeeEmails.includes(populatedMeeting.organizer.email)) {
            attendeeEmails.push(populatedMeeting.organizer.email);
        }

        const { googleEventId, meetLink } = await createMeetingEvent(populatedMeeting, attendeeEmails);
        let finalMeetLink = meetLink;
        if (!finalMeetLink) {
            const randStr = (len) => Array.from({length: len}, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join("");
            finalMeetLink = `https://meet.google.com/${randStr(3)}-${randStr(4)}-${randStr(3)}`;
        }

        meeting.googleEventId = googleEventId || null;
        meeting.meetLink = finalMeetLink;
        await meeting.save();
        populatedMeeting.googleEventId = googleEventId || null;
        populatedMeeting.meetLink = finalMeetLink;

        // Format times for display in chat & email
        const formattedStart = new Date(startTime).toLocaleString("en-GB", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
        });

        // Send Chat Notifications to all internal participants
        const io = req.app.get("io");
        const meetText = finalMeetLink ? `\n\n📹 **Google Meet Link**: ${finalMeetLink}` : "";
        const chatText = `📅 **New Meeting Scheduled!**\n\n**Title**: ${title}\n**Time**: ${formattedStart}${meetText}\n\n*Organized by ${req.user.name}*`;

        for (const p of populatedMeeting.participants) {
            if (p._id.toString() !== req.user._id.toString()) {
                const newMsg = await Message.create({
                    sender: req.user._id,
                    receiver: p._id,
                    group: "",
                    text: chatText
                });

                const populatedMsg = await Message.findById(newMsg._id).populate("sender", "name email profileImageUrl");

                if (io) {
                    io.to(p._id.toString()).emit("chat_message", populatedMsg);
                    io.to(req.user._id.toString()).emit("chat_message", populatedMsg);
                    io.to(p._id.toString()).emit("notification", {
                        type: "meeting_scheduled",
                        title: "Meeting Scheduled",
                        message: `Meeting "${title}" scheduled for ${formattedStart}.`,
                        meeting: populatedMeeting
                    });
                }
            }
        }

        // Log Activity
        await ActivityLog.create({
            user: req.user._id,
            action: "Meeting Scheduled",
            details: `Scheduled meeting "${title}"`
        });

        res.status(201).json({ message: "Meeting scheduled successfully", meeting: populatedMeeting });
    } catch (error) {
        console.error("Create Meeting Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Get user's meetings
// @route   GET /api/meetings
// @access  Private (All Roles)
const getMeetings = async (req, res) => {
    try {
        let filter = {};

        if (req.user.role === "admin") {
            filter = {}; // Admin views all meetings
        } else {
            filter = {
                $or: [
                    { organizer: req.user._id },
                    { participants: req.user._id }
                ]
            };
        }

        const meetings = await Meeting.find(filter)
            .populate("organizer", "name email profileImageUrl role")
            .populate("participants", "name email profileImageUrl role")
            .sort({ startTime: 1 })
            .lean();

        res.status(200).json(meetings);
    } catch (error) {
        console.error("Get Meetings Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Update meeting details
// @route   PUT /api/meetings/:id
// @access  Private
const updateMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) {
            return res.status(404).json({ message: "Meeting not found" });
        }

        // Only organizer or admin/manager can update
        if (
            req.user.role !== "admin" &&
            req.user.role !== "manager" &&
            meeting.organizer.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ message: "Access denied" });
        }

        meeting.title = req.body.title || meeting.title;
        meeting.description = req.body.description !== undefined ? req.body.description : meeting.description;
        meeting.startTime = req.body.startTime || meeting.startTime;
        meeting.endTime = req.body.endTime || meeting.endTime;
        if (Array.isArray(req.body.participants)) {
            meeting.participants = req.body.participants;
        }
        if (req.body.externalParticipants !== undefined) {
            meeting.externalParticipants = Array.isArray(req.body.externalParticipants)
                ? req.body.externalParticipants.map(e => e.trim().toLowerCase()).filter(e => e.includes("@"))
                : typeof req.body.externalParticipants === "string"
                ? req.body.externalParticipants.split(",").map(e => e.trim().toLowerCase()).filter(e => e.includes("@"))
                : [];
        }

        await meeting.save();

        const populatedMeeting = await Meeting.findById(meeting._id)
            .populate("organizer", "name email profileImageUrl")
            .populate("participants", "name email profileImageUrl");

        // Sync update with Google Calendar
        const attendeeEmails = [
            ...populatedMeeting.participants.map(p => p.email).filter(Boolean),
            ...(meeting.externalParticipants || [])
        ];
        if (populatedMeeting.organizer?.email && !attendeeEmails.includes(populatedMeeting.organizer.email)) {
            attendeeEmails.push(populatedMeeting.organizer.email);
        }

        if (populatedMeeting.googleEventId) {
            const { meetLink } = await updateMeetingEvent(populatedMeeting.googleEventId, populatedMeeting, attendeeEmails);
            let finalMeetLink = meetLink || meeting.meetLink;
            if (!finalMeetLink) {
                const randStr = (len) => Array.from({length: len}, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join("");
                finalMeetLink = `https://meet.google.com/${randStr(3)}-${randStr(4)}-${randStr(3)}`;
            }
            if (finalMeetLink !== meeting.meetLink) {
                meeting.meetLink = finalMeetLink;
                await meeting.save();
                populatedMeeting.meetLink = finalMeetLink;
            }
        } else {
            if (!meeting.meetLink || !meeting.meetLink.startsWith("https://meet.google.com/")) {
                const randStr = (len) => Array.from({length: len}, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join("");
                meeting.meetLink = `https://meet.google.com/${randStr(3)}-${randStr(4)}-${randStr(3)}`;
                await meeting.save();
                populatedMeeting.meetLink = meeting.meetLink;
            }
        }

        res.status(200).json({ message: "Meeting updated successfully", meeting: populatedMeeting });
    } catch (error) {
        console.error("Update Meeting Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Delete/cancel meeting
// @route   DELETE /api/meetings/:id
// @access  Private
const deleteMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) {
            return res.status(404).json({ message: "Meeting not found" });
        }

        // Only organizer or admin/manager can delete
        if (
            req.user.role !== "admin" &&
            req.user.role !== "manager" &&
            meeting.organizer.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Delete from Google Calendar
        if (meeting.googleEventId) {
            await deleteCalendarEvent(meeting.googleEventId);
        }

        await meeting.deleteOne();

        res.status(200).json({ message: "Meeting cancelled successfully" });
    } catch (error) {
        console.error("Delete Meeting Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

module.exports = {
    createMeeting,
    getMeetings,
    updateMeeting,
    deleteMeeting
};
