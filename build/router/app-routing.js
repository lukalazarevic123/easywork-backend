"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppRouting = void 0;
const DbController_1 = require("../controllers/DbController");
const AuthController_1 = require("../controllers/AuthController");
const JobController_1 = require("../controllers/JobController");
class AppRouting {
    constructor(route) {
        this.route = route;
        this.route = route;
        this.configure();
    }
    configure() {
        this.addRoute(new DbController_1.DbController());
        this.addRoute(new AuthController_1.AuthController());
        this.addRoute(new JobController_1.JobController());
    }
    addRoute(appRoute) {
        this.route.use(appRoute.route, appRoute.router);
    }
}
exports.AppRouting = AppRouting;
