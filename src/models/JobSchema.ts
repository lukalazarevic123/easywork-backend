import { ObjectId, Schema, Types, model } from "mongoose";

export interface IJob {
    beneficiary: string;
    freelancer: string;
    deadline: number;
    price: number;
    category: string;
    title: string;
    description: string;
    active: boolean;
}

export const JobSchema = new Schema<IJob>({
    beneficiary: String,
    freelancer: String,
    deadline: String,
    price: Number,
    category: String,
    title: String,
    description: String,
    active: Boolean
}, {
    collection: "jobs"
})

export const JobModel = model<IJob>("jobs", JobSchema);