import mongoose, { Document } from "mongoose";
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
export declare const Conversation: mongoose.Model<IConversation, {}, {}, {}, mongoose.Document<unknown, {}, IConversation> & IConversation & {
    _id: mongoose.Types.ObjectId;
}, any>;
//# sourceMappingURL=Conversation.d.ts.map