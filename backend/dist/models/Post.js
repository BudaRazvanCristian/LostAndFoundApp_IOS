"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const PostSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"],
    },
    title: {
        type: String,
        required: [true, "Title is required"],
        trim: true,
        maxlength: 100,
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        maxlength: 1000,
    },
    category: {
        type: String,
        required: [true, "Category is required"],
    },
    location: {
        type: String,
        required: [true, "Location is required"],
    },
    latitude: {
        type: Number,
        default: null,
    },
    longitude: {
        type: Number,
        default: null,
    },
    status: {
        type: String,
        required: [true, "Status is required"],
        enum: ["Lost", "Found"],
    },
    date: {
        type: String,
        required: [true, "Date is required"],
    },
    ownerName: {
        type: String,
        required: [true, "Owner name is required"],
    },
    phoneNumber: {
        type: String,
        required: [true, "Phone number is required"],
    },
    imageUri: {
        type: String,
        default: "",
    },
    aiAnalysis: {
        type: {
            objectType: { type: String, required: false, default: null },
            brand: { type: String, required: false, default: null },
            primaryColor: { type: String, required: false, default: null },
            secondaryColors: { type: [String], default: [] },
            material: { type: String, required: false, default: null },
            distinguishingFeatures: { type: [String], default: [] },
            visibleText: { type: [String], default: [] },
            shortDescription: { type: String, required: false, default: null },
            suggestedTitle: { type: String, required: false, default: null },
            suggestedCategory: { type: String, required: false, default: null },
            confidence: { type: Number, required: false, default: 0 },
            provider: { type: String, required: false, default: null },
            model: { type: String, required: false, default: null },
            analyzedAt: { type: String, required: false, default: null },
        },
        default: null,
    },
}, {
    timestamps: true,
});
// Index for queries
PostSchema.index({ userId: 1 });
PostSchema.index({ status: 1 });
PostSchema.index({ createdAt: -1 });
exports.default = mongoose_1.default.model("Post", PostSchema);
//# sourceMappingURL=Post.js.map