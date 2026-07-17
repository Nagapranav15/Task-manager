const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads/chat-files directory exists
const uploadDir = path.join(__dirname, "../uploads/chat-files");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf"
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only PDFs and standard images are allowed."), false);
    }
};

const chatUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 25 * 1024 * 1024 } // 25 MB limit
});

module.exports = { chatUpload };
