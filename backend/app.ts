import express from "express";
import cors from "cors";
import postsRoutes from "./src/routes/posts.routes.js";
import commentsRoutes from "./src/routes/comments.routes.js";
import usersRoutes from "./src/routes/users.routes.js";
import uploadRoutes from "./src/routes/upload.routes.js";
import webhooksRoutes from "./src/routes/webhooks.routes.js";
import likesRoutes from "./src/routes/likes.routes.js";
import followsRoutes from "./src/routes/follows.routes.js";
import searchRoutes from "./src/routes/search.routes.js";
import savedRoutes from "./src/routes/saved.routes.js";
import notificationsRoutes from "./src/routes/notifications.routes.js";
import feedbackRoutes from "./src/routes/feedback.routes.js";
import projectsRoutes from "./src/routes/projects.routes.js";
import projectCommentsRoutes from "./src/routes/projectComments.routes.js";
import messagesRoutes from "./src/routes/messages.routes.js";

import helmet from "helmet";

import rateLimit from "express-rate-limit";

const app = express();

// 1. CORS - MUST BE FIRST for preflight requests
app.use(cors({
  origin: [
    "https://localhost:5174",
    "https://seedlab0.vercel.app"
  ],
  // credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// 2. Webhooks need raw body for signature verification - MUST be before express.json()
app.use("/webhooks", express.raw({ type: "application/json" }), webhooksRoutes);

// 3. Regular JSON parser
app.use(express.json({ limit: "50mb" }));

// 4. Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// 5. Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000, // Increased for development
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use(limiter);

// Routes
app.use("/posts", postsRoutes);
app.use("/comments", commentsRoutes);
app.use("/users", usersRoutes);
app.use("/upload", uploadRoutes);
app.use("/likes", likesRoutes);
app.use("/follows", followsRoutes);
app.use("/search", searchRoutes);
app.use("/saved", savedRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/feedback", feedbackRoutes);
app.use("/projects", projectsRoutes);
app.use("/messages", messagesRoutes);
app.use("/", projectCommentsRoutes);

console.log("App initialized - v2");
export default app;
