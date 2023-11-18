"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobModel = exports.JobSchema = void 0;
const mongoose_1 = require("mongoose");
exports.JobSchema = new mongoose_1.Schema({
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
});
exports.JobModel = (0, mongoose_1.model)("jobs", exports.JobSchema);
