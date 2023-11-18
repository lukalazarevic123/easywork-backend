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
const defender_relay_client_1 = require("@openzeppelin/defender-relay-client");
const ethers_1 = require("ethers");
const EASyWork_1 = require("../abis/EASyWork");
class JobController {
    constructor() {
        this.route = "/job";
        this.router = (0, express_1.Router)();
        this.router.use((0, cors_1.default)({ origin: "*" }));
        //endpoint
        this.router.get("/all/:beneficiary", (0, cors_1.default)(), (request, response) => {
            this.getAllJobsForBeneficiary(request, response);
        });
        this.router.get("/employee/:freelancer", (0, cors_1.default)(), (req, res) => {
            this.getAllJobsForFreelancer(req, res);
        });
        this.router.post("/post", (0, cors_1.default)(), (req, res) => {
            this.postNewJob(req, res);
        });
        this.router.get("/all-jobs", (0, cors_1.default)(), (req, res) => {
            this.getAllJobs(req, res);
        });
        this.router.get("/id/:id", (0, cors_1.default)(), (req, res) => {
            this.getJobById(req, res);
        });
    }
    estimateGas(functionName, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = new ethers_1.ethers.AlchemyProvider("sepolia", process.env.ALCHEMY_API_KEY);
            console.log(data);
            const blockGas = yield provider.getBlock("latest");
            const estimatedGas = yield provider.estimateGas({
                from: process.env.RELAY_ADDRESS,
                to: process.env.CONTRACT_ADDRESS,
                data: new ethers_1.ethers.Interface(EASyWork_1.EASyWork).encodeFunctionData(functionName, [
                    ...data,
                ]),
            });
            const numberValue = ethers_1.ethers.toNumber(estimatedGas) * 3;
            return {
                gasLimit: numberValue !== null && numberValue !== void 0 ? numberValue : "",
                maxFeePerGas: blockGas === null || blockGas === void 0 ? void 0 : blockGas.baseFeePerGas,
            };
        });
    }
    postNewJob(req, res) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const { beneficiary, deadline, price, category, title, description } = req.body;
            if (!beneficiary ||
                !deadline ||
                !price ||
                !category ||
                !title ||
                !description) {
                return res.status(400).json({ msg: "Bad request" });
            }
            // const schemaEncoder = new SchemaEncoder("string field1, string field2, uint256 field3, uint256 field4, string field5");
            // const encodedData = schemaEncoder.encodeData([
            //   { name: "field1", value: title, type: "string" },
            //   { name: "field2", value: category, type: "string" },
            //   { name: "field3", value: deadline, type: "uint256" },
            //   { name: "field4", value: parseEther(price.toString()), type: "uint256" },
            //   { name: "field5", value: description, type: "string" },
            // ]);
            const firstArray = ["string", "string", "uint256", "uint256", "string"];
            const secondArray = [
                title,
                category,
                deadline,
                (0, ethers_1.parseEther)(price.toString()),
                description,
            ];
            const encodedData = ethers_1.AbiCoder.defaultAbiCoder().encode(firstArray, secondArray);
            const attestationRequestData = {
                recipient: beneficiary,
                expirationTime: 0,
                revocable: false,
                refUID: "0x0000000000000000000000000000000000000000000000000000000000000000",
                data: encodedData,
                value: 0, // assuming price is the correct field
            };
            const attestationRequest = {
                schema: process.env.CREATE_SCHEMA,
                data: attestationRequestData,
            };
            console.log(attestationRequest);
            // Assuming you have already created an instance of the Relayer
            const relayer = new defender_relay_client_1.Relayer({
                apiKey: (_a = process.env.API_KEY) !== null && _a !== void 0 ? _a : "",
                apiSecret: (_b = process.env.API_SECRET) !== null && _b !== void 0 ? _b : "",
            });
            try {
                const estimatedGasCreateGig = yield this.estimateGas("createGig", [
                    attestationRequest,
                ]);
                // console.log("GAS", estimatedGasCreateGig);
                // Assuming easyWorkInstance is the instance of your EASYWork contract
                const txCreateGig = yield relayer.sendTransaction({
                    to: process.env.CONTRACT_ADDRESS,
                    data: new ethers_1.ethers.Interface(EASyWork_1.EASyWork).encodeFunctionData("createGig", [
                        attestationRequest,
                    ]),
                    maxFeePerGas: estimatedGasCreateGig.maxFeePerGas.toString(),
                    maxPriorityFeePerGas: estimatedGasCreateGig.maxFeePerGas.toString(),
                    gasLimit: estimatedGasCreateGig.gasLimit.toString(),
                });
                // Handle success response
                return res.status(200).json({ txCreateGig });
            }
            catch (error) {
                console.error(error);
                return res.status(500).json({ error: "Internal server error" });
            }
        });
    }
    getAllJobsForBeneficiary(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { beneficiary } = req.params;
            try {
                const jobs = yield JobSchema_1.JobModel.find({
                    beneficiary,
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
    getAllJobsForFreelancer(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { freelancer } = req.params;
            try {
                const jobs = yield JobSchema_1.JobModel.find({
                    freelancer,
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
    getAllJobs(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const endpoint = "https://sepolia.easscan.org/graphql";
            const query = `
  query {
    attestations(where: { schemaId: { equals: "0xf602cc558d4aa60987b4b51d3416f55cc59cb66f6571682681116775c04b4251" } }) {
      id 
      attester
      recipient
      refUID
      revocable
      revocationTime
      expirationTime
      data
      schema {
        id
      }
    }
  }
`;
            const jobs = yield fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query }),
            });
            const jobsData = yield jobs.json();
            const firstArray = ["string", "string", "uint256", "uint256", "string"];
            const gigs = jobsData.data.attestations;
            let decodedJobs = [];
            for (let i = 0; i < gigs.length; i++) {
                const dec = ethers_1.AbiCoder.defaultAbiCoder().decode(firstArray, gigs[i].data);
                decodedJobs.push({
                    id: gigs[i].id,
                    beneficiary: gigs[i].attester,
                    title: dec[0],
                    category: dec[1],
                    deadline: dec[2].toString(),
                    price: (0, ethers_1.formatEther)(dec[3]),
                    description: dec[4],
                });
            }
            return res.status(200).json(gigs);
        });
    }
    getJobById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `query Attestation {
      attestation(
        where: { id: "${req.params.id}" }
      ) {
        id
        attester
        recipient
        refUID
        revocable
        revocationTime
        expirationTime
        data
      }
    }`;
            const endpoint = "https://sepolia.easscan.org/graphql";
            const job = yield fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query }),
            });
            const jobJson = yield job.json();
            const firstArray = ["string", "string", "uint256", "uint256", "string"];
            const dec = ethers_1.AbiCoder.defaultAbiCoder().decode(firstArray, jobJson.data.attestation.data);
            return res.status(200).json({
                id: jobJson.data.attestation.id,
                beneficiary: jobJson.data.attestation.attester,
                title: dec[0],
                category: dec[1],
                deadline: dec[2].toString(),
                price: (0, ethers_1.formatEther)(dec[3]),
                description: dec[4],
            });
        });
    }
}
exports.JobController = JobController;
