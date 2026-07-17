const nodemailer = require("nodemailer");

// Setup transporter configuration (optional SMTP)
const getTransporter = () => {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: parseInt(process.env.SMTP_PORT || "465"),
            secure: process.env.SMTP_SECURE !== "false", // Use SSL/TLS
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }
    return null;
};

// Send an email or log it
const sendEmail = async ({ to, subject, html, text }) => {
    const transporter = getTransporter();
    
    if (transporter) {
        try {
            const info = await transporter.sendMail({
                from: `"Task Manager Support" <${process.env.SMTP_USER}>`,
                to,
                subject,
                text,
                html
            });
            console.log(`[Email Sent] Message sent: ${info.messageId} to ${to}`);
            return true;
        } catch (error) {
            console.error("[Email Error] Failed to send via SMTP:", error.message);
        }
    }

    // Fallback: Console Simulation
    console.log(`
======================================================
[SMTP NOT CONFIGED - MOCK EMAIL LOG]
To: ${to}
Subject: ${subject}
Message text: ${text}
======================================================
`);
    return true;
};

// Helper: Notify assigned user about a new task
const sendTaskAssignmentEmail = async (userEmail, userName, taskTitle, priority, dueDate) => {
    const subject = `New Task Assigned: ${taskTitle}`;
    const text = `Hello ${userName},\n\nYou have been assigned a new task: "${taskTitle}" (Priority: ${priority}) due on ${new Date(dueDate).toDateString()}.\n\nLog in to your dashboard to view the details.\n\nBest,\nTask Manager Admin`;
    
    const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 500px; border: 1px solid #e2e8f0; rounded: 12px;">
            <h2 style="color: #6366f1; margin-top: 0;">New Task Assigned</h2>
            <p>Hello <strong>${userName}</strong>,</p>
            <p>You have been assigned a new task in the workspace:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Task Title</td>
                    <td style="padding: 8px 0; font-weight: bold;">${taskTitle}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Priority</td>
                    <td style="padding: 8px 0; font-weight: bold; color: ${priority === "High" ? "#ef4444" : priority === "Medium" ? "#f59e0b" : "#10b981"}">${priority}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Due Date</td>
                    <td style="padding: 8px 0; font-weight: bold;">${new Date(dueDate).toDateString()}</td>
                </tr>
            </table>
            <p style="font-size: 13px; color: #64748b; margin-top: 20px;">Log in to your workspace dashboard to start working on it.</p>
        </div>
    `;

    return sendEmail({ to: userEmail, subject, text, html });
};

// Helper: Notify about status changes
const sendTaskStatusUpdateEmail = async (userEmail, userName, taskTitle, status) => {
    const subject = `Task Status Update: ${taskTitle}`;
    const text = `Hello ${userName},\n\nThe status of your task "${taskTitle}" has been updated to: ${status}.\n\nLog in to your dashboard to review.\n\nBest,\nTask Manager Team`;

    const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 500px; border: 1px solid #e2e8f0; rounded: 12px;">
            <h2 style="color: #06b6d4; margin-top: 0;">Task Status Updated</h2>
            <p>Hello <strong>${userName}</strong>,</p>
            <p>The status of your task has been updated:</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #06b6d4;">
                <p style="margin: 0; font-size: 14px;"><strong>Task:</strong> ${taskTitle}</p>
                <p style="margin: 5px 0 0 0; font-size: 14px;"><strong>New Status:</strong> <span style="font-weight: bold; color: #0891b2;">${status}</span></p>
            </div>
            <p style="font-size: 13px; color: #64748b; margin-top: 20px;">Log in to your workspace dashboard to review the changes.</p>
        </div>
    `;

    return sendEmail({ to: userEmail, subject, text, html });
};

module.exports = {
    sendTaskAssignmentEmail,
    sendTaskStatusUpdateEmail
};
