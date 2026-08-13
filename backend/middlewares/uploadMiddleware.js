const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const uploadDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);  
    },
    filename: (req, file, cb) => {
        const extMap = {
            "image/jpeg": ".jpg",
            "image/jpg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/gif": ".gif"
        };
        const ext = extMap[file.mimetype.toLowerCase()] || path.extname(file.originalname).toLowerCase() || ".png";
        const randomName = `${Date.now()}-${crypto.randomBytes(16).toString("hex")}${ext}`;
        cb(null, randomName);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif"
    ];

    if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
        cb(null, true);
    } else {
        cb(new Error("Invalid image file type. Only JPEG, PNG, WEBP, and GIF are allowed."), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit for avatars
});

module.exports = { upload };