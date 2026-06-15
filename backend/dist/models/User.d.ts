import mongoose, { Document } from "mongoose";
export interface IUser extends Document {
    email: string;
    password: string;
    displayName: string;
    phone?: string;
    profileImage?: string;
    expoPushToken?: string | null;
    createdAt: Date;
    updatedAt: Date;
    comparePassword: (password: string) => Promise<boolean>;
}
declare const _default: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser> & IUser & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;
//# sourceMappingURL=User.d.ts.map