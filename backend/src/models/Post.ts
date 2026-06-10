import mongoose, { Schema, Document } from "mongoose";

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
