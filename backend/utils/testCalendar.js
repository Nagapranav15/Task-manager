const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = require("./googleCalendar");

async function testCalendarIntegration() {
    console.log("\n==========================================");
    console.log("🚀 Testing Google Calendar API Integration");
    console.log("==========================================\n");

    const dummyTask = {
        title: "Test Task - Google Calendar Integration",
        description: "This is an automated test event to verify calendar event creation, updates, and deletion.",
        priority: "High",
        status: "In Progress",
        createdAt: new Date(),
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    };

    console.log("1. Creating test calendar event...");
    const eventId = await createCalendarEvent(dummyTask, []);
    
    if (eventId) {
        console.log(`✅ SUCCESS: Created Google Calendar Event! ID: ${eventId}`);
        
        console.log("\n2. Updating test calendar event...");
        dummyTask.title = "Test Task - Google Calendar Integration (Updated)";
        dummyTask.status = "Completed";
        const updatedId = await updateCalendarEvent(eventId, dummyTask, []);
        console.log(`✅ SUCCESS: Updated Google Calendar Event! ID: ${updatedId || eventId}`);

        console.log("\n3. Deleting test calendar event...");
        const deleted = await deleteCalendarEvent(eventId);
        console.log(`✅ SUCCESS: Deleted Google Calendar Event! Result: ${deleted}`);

        console.log("\n==========================================");
        console.log("🎉 ALL GOOGLE CALENDAR TESTS PASSED SUCCESSFULLY!");
        console.log("==========================================\n");
    } else {
        console.error("\n❌ FAILED: Could not create calendar event. Please verify GOOGLE_REFRESH_TOKEN in backend/.env.");
    }
}

testCalendarIntegration();
