"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const express_1 = require("express");
const cors_1 = __importDefault(require("cors"));
const UserModel_1 = require("../models/UserModel");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ethers_1 = require("ethers");
class AuthController {
    constructor() {
        this.route = "/auth";
        this.router = (0, express_1.Router)();
        this.router.use((0, cors_1.default)({ origin: "*" }));
        this.router.post("/login", (0, cors_1.default)(), (req, res) => {
            this.login(req, res);
        });
        this.router.post("/register", (0, cors_1.default)(), (req, res) => {
            this.register(req, res);
        });
        this.router.post("/register-web3", (0, cors_1.default)(), (req, res) => {
            // res.setHeader("Access-Control-Allow-Origin", "*")
            this.registerWeb3(req, res);
        });
        this.router.post("/login-web3", (0, cors_1.default)(), (req, res) => {
            this.loginWeb3(req, res);
        });
        this.router.get("/clients", (0, cors_1.default)(), (req, res) => {
            this.getAllClients(req, res);
        });
    }
    // classic web2 login without chain address
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password } = req.body;
            const user = yield UserModel_1.UserModel.findOne({
                email,
            });
            if (user) {
                if (!bcrypt_1.default.compareSync(password, user.password)) {
                    return res.status(400).json({ msg: "Wrong credentials!" });
                }
                const userToken = {
                    type: user.type,
                    userId: user._id.toString(),
                    userEmail: user.email,
                    userAddres: user.chainAddress
                };
                // @ts-ignore
                const token = jsonwebtoken_1.default.sign(userToken, process.env.TOKEN_SECRET);
                return res.status(200).json({ token });
            }
            return res.status(404).json({ msg: "Not found" });
        });
    }
    // classis web2 registration without chain address
    register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password, type } = req.body;
            if (!email || !password || !type) {
                res.status(400).json({ msg: "Fields can't be empty!" });
                return;
            }
            const chainAddress = ethers_1.Wallet.createRandom().address;
            const user = new UserModel_1.UserModel({
                email,
                password: bcrypt_1.default.hashSync(password, 10),
                type,
                chainAddress,
            });
            const flag = yield user.save();
            if (!flag)
                return res.status(500).json({ msg: "Bad request" });
            const userToken = {
                type,
                userId: user._id.toString(),
                userEmail: user.email,
                userAddress: chainAddress
            };
            // @ts-ignore
            const token = jsonwebtoken_1.default.sign(userToken, process.env.TOKEN_SECRET);
            return res.status(200).json({ token });
        });
    }
    registerWeb3(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { password, type, chainAddress } = req.body;
            if (!password || !type || !chainAddress) {
                res.status(400).json({ msg: "Fields can't be empty!" });
                return;
            }
            const user = new UserModel_1.UserModel({
                email: "NA",
                password: bcrypt_1.default.hashSync(password, 10),
                type,
                chainAddress,
            });
            const flag = yield user.save();
            if (!flag)
                return res.status(500).json({ msg: "Bad request" });
            const userToken = {
                type,
                userId: user._id.toString(),
                userEmail: user.email,
                userAddress: chainAddress
            };
            // @ts-ignore
            const token = jsonwebtoken_1.default.sign(userToken, process.env.TOKEN_SECRET);
            return res.status(200).json({ token });
        });
    }
    // accepts chainAddress and password
    loginWeb3(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { chainAddress, password } = req.body;
            const user = yield UserModel_1.UserModel.findOne({
                chainAddress,
            });
            if (user) {
                if (!bcrypt_1.default.compareSync(password, user.password)) {
                    return res.status(400).json({ msg: "Wrong credentials!" });
                }
                const userToken = {
                    type: user.type,
                    userId: user._id.toString(),
                    userEmail: user.email,
                    userAddres: user.chainAddress
                };
                // @ts-ignore
                const token = jsonwebtoken_1.default.sign(userToken, process.env.TOKEN_SECRET);
                return res.status(200).json({ token });
            }
            return res.status(404).json({ msg: "Not found" });
        });
    }
    getAllClients(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const clients = yield UserModel_1.UserModel.find({
                    type: "CLIENT"
                }, {
                    password: 0,
                    email: 0,
                    type: 0
                });
                return res.status(200).json(clients);
            }
            catch (e) {
                return res.status(500).json({ msg: "Something went wrong" });
            }
        });
    }
}
exports.AuthController = AuthController;
