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
exports.JobController = void 0;
const express_1 = require("express");
const cors_1 = __importDefault(require("cors"));
const JobSchema_1 = require("../models/JobSchema");
class JobController {
    constructor() {
        this.route = "/job";
        this.router = (0, express_1.Router)();
        this.router.use((0, cors_1.default)({ origin: "*" }));
        //endpoint
        this.router.get('/all/:beneficiary', (0, cors_1.default)(), (request, response) => {
            this.getAllJobsForBeneficiary(request, response);
        });
        this.router.post('/post', (0, cors_1.default)(), (req, res) => {
            this.postNewJob(req, res);
        });
    }
    postNewJob(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { beneficiary, freelancer, deadline, price, category, title, description, } = req.body;
            if (!beneficiary || !freelancer || !deadline || !price || !category || !title || !description) {
                return res.status(400).json({ msg: "Bad request" });
            }
            const newJob = new JobSchema_1.JobModel({
                beneficiary,
                freelancer,
                deadline,
                price,
                category,
                title,
                description,
                active: true
            });
            const flag = yield newJob.save();
        });
    }
    getAllJobsForBeneficiary(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { beneficiary } = req.params;
            try {
                const jobs = yield JobSchema_1.JobModel.find({
                    beneficiary
                });
                if (jobs.length > 0) {
                    return res.status(200).json(jobs);
                }
                return res.status(404).json({ msg: "Jobs not found!" });
            }
            catch (e) {
                res.status(500).json({ msg: e });
            }
            return;
        });
    }
}
exports.JobController = JobController;
