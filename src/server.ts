import express, { Request, Response, NextFunction } from 'express';
import * as http from "http";
import { json, urlencoded } from "body-parser";
import { AppRouting } from './router/app-routing';
import mongoose from 'mongoose';
const path = require("path");
require('dotenv').config();

export class Server {
    public app: express.Express;
    private router: express.Router;

    constructor() {
        this.app = express();
        this.router = express.Router();
        this.configure();
    }

    private configure() {
        this.configureMiddleware();
        this.configureRoutes();
        this.configureDb();
    }

    private configureMiddleware() {
        this.app.use(json({ limit: "50mb" }));
        this.app.use(urlencoded({ limit: "50mb", extended: true }));
    }

    private configureRoutes() {
        const basePath = "/";
        this.app.use(basePath, this.router);
        if (process.env.NODE_ENV == "production") {
            this.app.use(express.static(path.join(__dirname, '/../client/build')));
        }
        new AppRouting(this.router);
    }

    private configureDb() {
        const db_url:string = process.env.DB_URL ?? "bruh";
        mongoose.connect(db_url);
        
        const flag = mongoose.connection;

        flag.once('open', () => {
            console.log("Database connection established succesfully!");
        })
    }

    public run() {
        const port = process.env.PORT || 4000;
        const server = http.createServer(this.app);
        
        server.listen(port, () => {
            console.log(`Express server running on port ${port}.`);
        });
    }
}