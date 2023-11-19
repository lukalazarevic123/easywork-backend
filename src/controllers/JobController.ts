import { Router, Request, Response } from "express";
import { AppRoute } from "../router/app-route";
import cors from "cors";
import { JobModel } from "../models/JobSchema";
import { Relayer } from "@openzeppelin/defender-relay-client";
import {
  AbiCoder,
  ethers,
  formatEther,
  parseEther,
  solidityPacked,
  toBigInt,
} from "ethers";
import { EASyWork } from "../abis/EASyWork";
import { SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";

export class JobController implements AppRoute {
  public route: string = "/job";
  router: Router = Router();

  constructor() {
    this.router.use(cors({ origin: "*" }));

    //endpoint
    this.router.get("/all/:beneficiary", cors(), (request, response) => {
      this.getAllJobsForBeneficiary(request, response);
    });

    this.router.get("/employee/:freelancer", cors(), (req, res) => {
      this.getAllJobsForFreelancer(req, res);
    });

    this.router.post("/post", cors(), (req, res) => {
      this.postNewJob(req, res);
    });

    this.router.get("/all-jobs", cors(), (req, res) => {
      this.getAllJobs(req, res);
    });

    this.router.get("/id/:id", cors(), (req, res) => {
      this.getJobById(req, res);
    });

    this.router.post("/apply/:id", cors(), (req, res) => {
      this.applyToJob(req, res);
    });

    this.router.get("/freelancer/:id", cors(), (req, res) => {
      this.getFreelancer(req, res);
    });
  }
  private async estimateGas(functionName: string, data: any, value: number) {
    const provider = new ethers.AlchemyProvider(
      "sepolia",
      process.env.ALCHEMY_API_KEY
    );
    console.log(data);
    const blockGas = await provider.getBlock("latest");

    const estimatedGas = await provider.estimateGas({
      from: process.env.RELAY_ADDRESS,
      to: process.env.CONTRACT_ADDRESS,
      data: new ethers.Interface(EASyWork).encodeFunctionData(functionName, [
        ...data,
      ]),
      value,
    });

    const numberValue = ethers.toNumber(estimatedGas) * 3;

    return {
      gasLimit: numberValue ?? "",
      maxFeePerGas: blockGas?.baseFeePerGas,
    };
  }

  public async postNewJob(req: Request, res: Response) {
    const { beneficiary, deadline, price, category, title, description } =
      req.body;

    if (
      !beneficiary ||
      !deadline ||
      !price ||
      !category ||
      !title ||
      !description
    ) {
      return res.status(400).json({ msg: "Bad request" });
    }

    const firstArray = ["string", "string", "uint256", "uint256", "string"];
    const secondArray = [
      title,
      category,
      deadline,
      parseEther(price.toString()),
      description,
    ];

    const encodedData = AbiCoder.defaultAbiCoder().encode(
      firstArray,
      secondArray
    );

    const attestationRequestData = {
      recipient: process.env.RELAY_ADDRESS,
      expirationTime: 0, // assuming deadline is the correct field
      revocable: false, // set to true or false as needed
      refUID:
        "0x0000000000000000000000000000000000000000000000000000000000000000", // replace with the actual refUID
      data: encodedData, // replace with the actual custom data
      value: 0, // assuming price is the correct field
    };

    const attestationRequest = {
      schema: process.env.CREATE_SCHEMA,
      data: attestationRequestData,
    };

    const relayer = new Relayer({
      apiKey: process.env.API_KEY ?? "",
      apiSecret: process.env.API_SECRET ?? "",
    });

    try {
      const estimatedGasCreateGig = await this.estimateGas(
        "createGig",
        [attestationRequest],
        0
      );

      // console.log("GAS", estimatedGasCreateGig);

      // Assuming easyWorkInstance is the instance of your EASYWork contract

      const txCreateGig = await relayer.sendTransaction({
        to: process.env.CONTRACT_ADDRESS, // Replace with the actual address of your deployed EASYWork contract
        data: new ethers.Interface(EASyWork).encodeFunctionData("createGig", [
          attestationRequest,
        ]),
        maxFeePerGas: estimatedGasCreateGig.maxFeePerGas.toString(),
        maxPriorityFeePerGas: estimatedGasCreateGig.maxFeePerGas.toString(),
        gasLimit: estimatedGasCreateGig.gasLimit.toString(),
      });

      // Handle success response
      return res.status(200).json({ txCreateGig });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  public async getAllJobsForBeneficiary(req: Request, res: Response) {
    const { beneficiary } = req.params;

    try {
      const jobs = await JobModel.find({
        beneficiary,
      });

      if (jobs.length > 0) {
        return res.status(200).json(jobs);
      }

      return res.status(404).json({ msg: "Jobs not found!" });
    } catch (e) {
      res.status(500).json({ msg: e });
    }

    return;
  }

  public async getAllJobsForFreelancer(req: Request, res: Response) {
    const { freelancer } = req.params;

    try {
      const jobs = await JobModel.find({
        freelancer,
      });

      if (jobs.length > 0) {
        return res.status(200).json(jobs);
      }

      return res.status(404).json({ msg: "Jobs not found!" });
    } catch (e) {
      res.status(500).json({ msg: e });
    }

    return;
  }

  private async getAllJobs(req: Request, res: Response) {
    const endpoint = "https://sepolia.easscan.org/graphql";

    const query = `
  query {
    attestations(where: { schemaId: { equals: "${process.env.CREATE_SCHEMA}" } }) {
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

    const jobs = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    const jobsData = await jobs.json();

    const firstArray = ["string", "string", "uint256", "uint256", "string"];
    const gigs = jobsData.data.attestations;

    let decodedJobs = [];
    for (let i = 0; i < gigs.length; i++) {
      const dec = AbiCoder.defaultAbiCoder().decode(firstArray, gigs[i].data);
      decodedJobs.push({
        id: gigs[i].id,
        beneficiary: gigs[i].attester,
        title: dec[0],
        category: dec[1],
        deadline: dec[2].toString(),
        price: formatEther(dec[3]),
        description: dec[4],
      });
    }

    return res.status(200).json(decodedJobs);
  }

  private async getJobById(req: Request, res: Response) {
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

    const job = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    const jobJson = await job.json();

    const firstArray = ["string", "string", "uint256", "uint256", "string"];
    const dec = AbiCoder.defaultAbiCoder().decode(
      firstArray,
      jobJson.data.attestation.data
    );

    return res.status(200).json({
      id: jobJson.data.attestation.id,
      beneficiary: jobJson.data.attestation.attester,
      title: dec[0],
      category: dec[1],
      deadline: dec[2].toString(),
      price: formatEther(dec[3]),
      description: dec[4],
    });
  }

  private async applyToJob(req: Request, res: Response) {
    const { freelancer } = req.body;

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

    const job = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    const jobJson = await job.json();

    const firstArray = ["string", "string", "uint256", "uint256", "string"];
    const dec = AbiCoder.defaultAbiCoder().decode(
      firstArray,
      jobJson.data.attestation.data
    );

    const params = ["address", "string"];

    const encodedData = AbiCoder.defaultAbiCoder().encode(params, [
      freelancer,
      `Freelancer ${freelancer} assigned to gig ${req.params.id}`,
    ]);

    const attestationRequestData = {
      recipient: process.env.RELAY_ADDRESS,
      expirationTime: 0, // assuming deadline is the correct field
      revocable: false, // set to true or false as needed
      refUID: jobJson.data.attestation.id, // replace with the actual refUID
      data: encodedData, // replace with the actual custom data
      value: 0, // assuming price is the correct field
    };

    const attestationRequest = {
      schema: process.env.APPLY_SCHEMA,
      data: attestationRequestData,
    };
    console.log(attestationRequest);
    const relayer = new Relayer({
      apiKey: process.env.API_KEY ?? "",
      apiSecret: process.env.API_SECRET ?? "",
    });

    try {
      const estimatedGasCreateGig = await this.estimateGas(
        "assignGig",
        [attestationRequest.data.refUID, attestationRequest],
        dec[3].toString()
      );
      console.log("DEC[3]", dec[3].toString());
      // console.log("GAS", estimatedGasCreateGig);

      // Assuming easyWorkInstance is the instance of your EASYWork contract

      const txCreateGig = await relayer.sendTransaction({
        to: process.env.CONTRACT_ADDRESS, // Replace with the actual address of your deployed EASYWork contract
        data: new ethers.Interface(EASyWork).encodeFunctionData("assignGig", [
          attestationRequest.data.refUID,
          attestationRequest,
        ]),
        maxFeePerGas: estimatedGasCreateGig.maxFeePerGas.toString(),
        maxPriorityFeePerGas: estimatedGasCreateGig.maxFeePerGas.toString(),
        gasLimit: estimatedGasCreateGig.gasLimit.toString(),
        value: dec[3].toString(),
      });

      // Handle success response
      return res.status(200).json({ txCreateGig });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  private async getFreelancer(req: Request, res: Response) {
    const { id } = req.params;

    const endpoint = "https://sepolia.easscan.org/graphql";

    const query = `
  query {
    attestations(where: { schemaId: { equals: "${process.env.APPLY_SCHEMA}" } }) {
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

    const jobs = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    const jobsData = await jobs.json();

    const firstArray = ["address", "string"];
    const gigs = jobsData.data.attestations;

    console.log(gigs);
    for (let i = 0; i < gigs.length; i++) {
      if (gigs[i].refUID === id) {
        const dec = AbiCoder.defaultAbiCoder().decode(firstArray, gigs[i].data);
        return res.status(200).json({
          id: gigs[i].id,
          description: dec[1],
        });
      }
    }

    return res.status(404).json({msg: "Not found"});
  }
}
