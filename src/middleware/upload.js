// backend/src/middleware/upload.js
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ============ PROFILE PICTURE STORAGE ============
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "profile-pictures",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

// ============ CHAT FILE STORAGE ============
const chatStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "chat-files",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "pdf", "doc", "docx", "txt", "mp4", "mp3", "zip", "rar"],
    resource_type: "auto",
  },
});

// ============ FILE FILTERS ============
// Profile picture filter (images only)
const profileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(file.mimetype);
  
  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed for profile pictures"));
  }
};

// Chat file filter (images, documents, etc.)
const chatFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif|pdf|doc|docx|txt|mp4|mp3|zip|rar/;
  const extname = allowedTypes.test(file.mimetype);
  
  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error("File type not supported. Please upload images, PDFs, or documents."));
  }
};

// ============ EXPORT UPLOAD MIDDLEWARES ============

// For profile pictures (single file)
export const upload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: profileFilter,
});

// For chat files (single file - images, PDFs, docs)
export const uploadChatFile = multer({
  storage: chatStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: chatFileFilter,
});

// For multiple chat files (max 5 files)
export const uploadMultipleChatFiles = multer({
  storage: chatStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: chatFileFilter,
}).array("files", 5);

// For profile pictures (kept for backward compatibility)
export const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: profileFilter,
});