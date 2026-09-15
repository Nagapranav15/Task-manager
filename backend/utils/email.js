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

// Helper: Send secure invitation email to new user
const sendUserInviteEmail = async ({ userEmail, role, inviteUrl, adminName }) => {
    const subject = `You've been invited to join Task Manager`;
    const text = `Hello,\n\n${adminName || "An Admin"} has invited you to join Task Manager as a ${role.toUpperCase()}.\n\nClick the link below to accept your invitation and sign up using your Google account:\n${inviteUrl}\n\nNote: This invitation link is secure and valid for 48 hours.\n\nBest regards,\nTask Manager Team`;

    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; background-color: #f8fafc; color: #1e293b;">
            <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 32px 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; tracking-tight: -0.5px;">Task Manager Invitation</h1>
                    <p style="color: #e0e7ff; margin-top: 6px; font-size: 13px;">Official Organization Workspace</p>
                </div>
                
                <div style="padding: 32px 28px;">
                    <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
                        Hello,
                    </p>
                    <p style="font-size: 15px; line-height: 1.6; color: #334155;">
                        <strong>${adminName || "An Admin"}</strong> has invited you to join the organization workspace as a <span style="background: #e0e7ff; color: #4338ca; font-weight: 700; padding: 2px 8px; border-radius: 6px; font-size: 12px; text-transform: uppercase;">${role}</span>.
                    </p>
                    
                    <div style="background: #f1f5f9; border-radius: 12px; padding: 18px; margin: 24px 0; border-left: 4px solid #4f46e5;">
                        <p style="margin: 0; font-size: 13px; color: #64748b;">Invited Email:</p>
                        <p style="margin: 4px 0 0 0; font-weight: 700; font-size: 15px; color: #0f172a;">${userEmail}</p>
                    </div>

                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${inviteUrl}" target="_blank" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">
                            Accept Invitation & Sign Up
                        </a>
                    </div>

                    <p style="font-size: 12px; color: #64748b; line-height: 1.5; text-align: center; margin-bottom: 0;">
                        🔒 This secure invitation link will expire in <strong>48 hours</strong>.<br/>
                        If the button above does not work, copy and paste this URL into your browser:<br/>
                        <a href="${inviteUrl}" style="color: #4f46e5; word-break: break-all;">${inviteUrl}</a>
                    </p>
                </div>

                <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8;">
                    Task Manager &copy; ${new Date().getFullYear()} ThinkLab Digital Solutions. All rights reserved.
                </div>
            </div>
        </div>
    `;

    return sendEmail({ to: userEmail, subject, text, html });
};

module.exports = {
    sendTaskAssignmentEmail,
    sendTaskStatusUpdateEmail,
    sendUserInviteEmail
};
