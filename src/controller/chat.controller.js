// backend/src/controller/chat.controller.js
import { StreamChat } from "stream-chat";

// ✅ Add debug to check if Stream is initialized
console.log("🔑 Stream Chat Initialized with:");
console.log("API Key:", process.env.STREAM_API_KEY ? "✅ Set" : "❌ Missing");
console.log("API Secret:", process.env.STREAM_API_SECRET ? "✅ Set" : "❌ Missing");

const serverClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET
);

export const getStreamToken = async (req, res) => {
  try {
    console.log("📝 Generating Stream token for user:", req.user._id);
    
    const token = serverClient.createToken(req.user._id.toString());
    
    console.log("✅ Stream token generated successfully");
    
    res.status(200).json({ 
      token,
      success: true,
      message: "Token generated successfully"
    });
  } catch (error) {
    console.error("❌ Error in getStreamToken:", error.message);
    res.status(500).json({ 
      message: "Failed to generate stream token",
      error: error.message 
    });
  }
};

// ============ FILE UPLOAD CONTROLLERS ============

// Upload single file (images, PDFs, documents)
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("📤 File uploaded:", req.file.originalname);

    const fileData = {
      url: req.file.path,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      publicId: req.file.filename,
    };

    res.status(200).json({
      success: true,
      file: fileData,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ message: "Failed to upload file" });
  }
};

// Upload multiple files (max 5)
export const uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    console.log(`📤 ${req.files.length} files uploaded`);

    const filesData = req.files.map((file) => ({
      url: file.path,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      publicId: file.filename,
    }));

    res.status(200).json({
      success: true,
      files: filesData,
      message: "Files uploaded successfully",
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ message: "Failed to upload files" });
  }
};