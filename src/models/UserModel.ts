import { ObjectId, Schema, Types, model } from "mongoose";

export interface IUser {
    email: string;
    password: string;
    chainAddress: string;
    type: string;
}

export const UserSchema = new Schema<IUser>({
    email: String,
    password: String,
    chainAddress: String,
    type: String
}, {
    collection: "users"
})

export const UserModel = model<IUser>("users", UserSchema);