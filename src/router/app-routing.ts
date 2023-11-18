import { Router } from "express";
import { AppRoute } from "./app-route";
import { DbController } from "../controllers/DbController";
import { AuthController } from "../controllers/AuthController";
import { JobController } from "../controllers/JobController";

export class AppRouting {
    constructor(private route:Router) {
        this.route = route;
        this.configure();
    }

    public configure() {
        this.addRoute(new DbController());
        this.addRoute(new AuthController());
        this.addRoute(new JobController());
    }

    private addRoute(appRoute:AppRoute) {
        this.route.use(appRoute.route, appRoute.router);
    }
}