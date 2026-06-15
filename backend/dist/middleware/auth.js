"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            res.status(401).json({ error: "No token provided" });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "secret");
        req.userId = decoded.userId;
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error("Token verification error:", error);
        res.status(401).json({ error: "Invalid or expired token" });
    }
};
exports.verifyToken = verifyToken;
const generateToken = (userId) => {
    const secret = process.env.JWT_SECRET || "secret";
    const options = { expiresIn: "7d" };
    return jsonwebtoken_1.default.sign({ userId }, secret, options);
};
exports.generateToken = generateToken;
exports.default = exports.verifyToken;
//# sourceMappingURL=auth.js.map