"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error("MONGODB_URI not defined in .env");
        }
        await mongoose_1.default.connect(mongoURI);
        console.log("✅ MongoDB connected successfully");
        return mongoose_1.default.connection;
    }
    catch (error) {
        console.error("❌ MongoDB connection failed:", error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
exports.default = exports.connectDB;
//# sourceMappingURL=database.js.map