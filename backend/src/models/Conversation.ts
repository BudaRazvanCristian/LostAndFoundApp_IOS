import mongoose, { Schema, Document } from "mongoose";

export interface IConversation extends Document {
  postId: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  participantKey: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageSenderId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: [true, "Post ID is required"],
    },
    participants: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      required: [true, "Participants are required"],
      validate: {
        validator: (value: mongoose.Types.ObjectId[]) => value.length === 2,
        message: "A conversation must have exactly two participants",
      },
    },
    participantKey: {
      type: String,
      required: [true, "Participant key is required"],
      unique: true,
      index: true,
    },
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    lastMessageSenderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ participants: 1, lastMessageAt: -1 });
ConversationSchema.index({ postId: 1 });

export const Conversation = mongoose.model<IConversation>("Conversation", ConversationSchema);


