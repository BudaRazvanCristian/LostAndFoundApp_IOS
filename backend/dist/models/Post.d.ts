import mongoose, { Document } from "mongoose";
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
declare const _default: mongoose.Model<IPost, {}, {}, {}, mongoose.Document<unknown, {}, IPost> & IPost & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=Post.d.ts.map