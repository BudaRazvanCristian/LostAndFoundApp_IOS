import mongoose, { Schema, Document } from "mongoose";

import type { ItemAiAnalysis } from "../types/itemAnalysis";

export type ItemStatus = "Lost" | "Found";

export interface IPost extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  location: string;
  latitude?: number;
  longitude?: number;
  status: ItemStatus;
  date: string;
  ownerName: string;
  phoneNumber: string;
  imageUri: string;
  aiAnalysis?: ItemAiAnalysis | null;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    userId: {
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

// Index for queries
PostSchema.index({ userId: 1 });
PostSchema.index({ status: 1 });
PostSchema.index({ createdAt: -1 });

export default mongoose.model<IPost>("Post", PostSchema);
