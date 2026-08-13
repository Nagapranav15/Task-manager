require("dotenv").config({ path: "../.env" });
const nodemailer = require("nodemailer");

console.log("Testing SMTP configuration...");
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASS:", process.env.SMTP_PASS ? "********" : "NOT SET");
console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_PORT:", process.env.SMTP_PORT);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

transporter.sendMail({
    from: `"Test Support" <${process.env.SMTP_USER}>`,
    to: "pranav@thinklabdigitalsolutions.com",
    subject: "SMTP Integration Test",
    text: "This is a test email from the Task Tracker SMTP integration. If you are reading this, it works!"
}).then(info => {
    console.log("SUCCESS! Test email sent:", info.messageId);
    process.exit(0);
}).catch(err => {
    console.error("FAILED to send test email:", err);
    process.exit(1);
});
