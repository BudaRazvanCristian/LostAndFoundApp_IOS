"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = __importDefault(require("./config/database"));
const auth_1 = __importDefault(require("./routes/auth"));
const posts_1 = __importDefault(require("./routes/posts"));
const chats_1 = __importDefault(require("./routes/chats"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use(express_1.default.json({ limit: "15mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "15mb" }));
// CORS Configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};
app.use((0, cors_1.default)(corsOptions));
// Routes
app.use("/api/auth", auth_1.default);
app.use("/api/posts", posts_1.default);
app.use("/api/chats", chats_1.default);
// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "Server is running" });
});
// Error handling middleware
app.use((err, req, res, _next) => {
    console.error("Error:", err);
    res.status(err.status || 500).json({
        error: err.message || "Internal server error",
    });
});
// Start server
const startServer = async () => {
    await (0, database_1.default)();
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📍 API: http://localhost:${PORT}/api`);
        console.log(`💚 Health: http://localhost:${PORT}/health`);
    });
};
startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map