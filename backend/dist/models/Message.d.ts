import mongoose, { Document } from "mongoose";
export interface IMessage extends Document {
    conversationId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    text: string;
    readBy: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IMessage, {}, {}, {}, mongoose.Document<unknown, {}, IMessage> & IMessage & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Message.d.ts.map