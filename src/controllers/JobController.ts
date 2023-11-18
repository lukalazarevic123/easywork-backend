import { Router, Request, Response } from "express";
import { AppRoute } from "../router/app-route";
import cors from "cors";
import { JobModel } from "../models/JobSchema";

export class JobController implements AppRoute {
  public route: string = "/job";
  router: Router = Router();

  constructor() {
    this.router.use(cors({ origin: "*" }));
    
    //endpoint
    this.router.get('/all/:beneficiary', cors(), (request, response) => {
        this.getAllJobsForBeneficiary(request, response);
    });

    this.router.post('/post', cors(), (req, res) => {
        this.postNewJob(req, res);
    })
  }

  public async postNewJob(req:Request, res:Response) {
    const {
        beneficiary,
        freelancer,
        deadline,
        price,
        category,
        title,
        description,
    } = req.body;

    if(!beneficiary || !freelancer || !deadline || !price || !category || !title || !description) {
        return res.status(400).json({msg: "Bad request"});
    }

    const newJob = new JobModel({
        beneficiary,
        freelancer,
        deadline,
        price,
        category,
        title,
        description,
        active: true
    })

    const flag = await newJob.save();
  }

  public async getAllJobsForBeneficiary(req: Request, res: Response) {
    const { beneficiary } = req.params;

    try{
        const jobs = await JobModel.find({
            beneficiary
        });

        if(jobs.length > 0) {
            return res.status(200).json(jobs)
        }

        return res.status(404).json({msg: "Jobs not found!"})
    }catch(e) {
        res.status(500).json({msg: e})
    }

    return;
  }
}
