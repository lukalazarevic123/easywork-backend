"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.UserSchema = void 0;
const mongoose_1 = require("mongoose");
exports.UserSchema = new mongoose_1.Schema({
    email: String,
    password: String,
    chainAddress: String,
    type: String
}, {
    collection: "users"
});
exports.UserModel = (0, mongoose_1.model)("users", exports.UserSchema);
