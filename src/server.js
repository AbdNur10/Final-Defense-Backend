// backend/src/server.js
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";

// Fix: Get the correct path to .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend root directory
dotenv.config({ path: path.join(__dirname, "../.env") });

import { connectDB } from "./lib/db.js";
import { initializeSocket } from "./socket.js";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import groupRoutes from "./routes/group.route.js";
import searchRoutes from "./routes/search.route.js";
import aiRoutes from "./routes/ai.route.js";

// Debug: Check if .env is loaded
console.log("📁 .env path:", path.join(__dirname, "../.env"));
console.log("🔑 Cloudinary Check:");
console.log("CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME || "❌ Missing");
console.log("API_KEY:", process.env.CLOUDINARY_API_KEY ? "✅ Set" : "❌ Missing");
console.log("API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "✅ Set" : "❌ Missing");

const app = express();
const PORT = process.env.PORT || 5001;

const server = http.createServer(app);
const io = initializeSocket(server);

// Ensure DB connection for every request in serverless environment
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database middleware connection error:", err);
    next(err);
  }
});

// ✅ CORS Configuration - Allow Vercel origins and client URLs
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  process.env.CLIENT_URL,
  "https://finalprojectfrontend-flax.vercel.app",
  "https://kyauchatbox.vercel.app",
  "https://kyauchatbox-c19cm9e85-tanvir-hanifs-projects.vercel.app",
  /https:\/\/.*\.vercel\.app/,
  /http:\/\/192\.168\.\d+\.\d+:\d+/,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.some((pattern) =>
        typeof pattern === "string" ? pattern === origin : pattern.test(origin)
      );
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.log("❌ CORS blocked origin:", origin);
        callback(null, true);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/ai", aiRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    cloudinary: {
      configured: !!process.env.CLOUDINARY_API_KEY,
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("❌ Error:", message);
  res.status(statusCode).json({ success: false, message });
});

if (!process.env.VERCEL) {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    connectDB();
  });
}

export default app;