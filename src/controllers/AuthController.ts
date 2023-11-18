import { Request, Response, Router } from "express";
import { AppRoute } from "../router/app-route";
import cors from "cors";
import { UserModel } from "../models/UserModel";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Wallet } from "ethers";

export class AuthController implements AppRoute {
  public route: string = "/auth";
  router: Router = Router();

  constructor() {
    this.router.use(cors({ origin: "*" }));

    this.router.post("/login", cors(), (req, res) => {
      this.login(req, res);
    });

    this.router.post("/register", cors(), (req, res) => {
      this.register(req, res);
    });

    this.router.post("/register-web3", cors(), (req, res) => {
      this.registerWeb3(req, res);
    });

    this.router.post("/login-web3", cors(), (req, res) => {
      this.loginWeb3(req, res);
    })
  }

  // classic web2 login without chain address
  private async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const user = await UserModel.findOne({
      email,
    });

    if (user) {
      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(400).json({ msg: "Wrong credentials!" });
      }

      const userToken = {
        type: user.type,
        userId: user._id.toString(),
        userEmail: user.email,
        userAddres: user.chainAddress
      };

      // @ts-ignore
      const token = jwt.sign(userToken, process.env.TOKEN_SECRET);

      return res.status(200).json({ token });
    }

    return res.status(404).json({ msg: "Not found" });
  }

  // classis web2 registration without chain address
  private async register(req: Request, res: Response) {
    const { email, password, type } = req.body;

    if (!email || !password || !type) {
      res.status(400).json({ msg: "Fields can't be empty!" });
      return;
    }

    const chainAddress = Wallet.createRandom().address;
    
    const user = new UserModel({
      email,
      password: bcrypt.hashSync(password, 10),
      type,
      chainAddress,
    });

    const flag = await user.save();

    if (!flag) return res.status(500).json({ msg: "Bad request" });

    const userToken = {
      type,
      userId: user._id.toString(),
      userEmail: user.email,
      userAddress: chainAddress
    };

    // @ts-ignore
    const token = jwt.sign(userToken, process.env.TOKEN_SECRET);

    return res.status(200).json({ token });
  }

  private async registerWeb3(req: Request, res: Response) {
    const { password, type, chainAddress } = req.body;

    if (!password || !type || !chainAddress) {
      res.status(400).json({ msg: "Fields can't be empty!" });
      return;
    }
    
    const user = new UserModel({
      email: "NA",
      password: bcrypt.hashSync(password, 10),
      type,
      chainAddress,
    });

    const flag = await user.save();

    if (!flag) return res.status(500).json({ msg: "Bad request" });

    const userToken = {
      type,
      userId: user._id.toString(),
      userEmail: user.email,
      userAddress: chainAddress
    };

    // @ts-ignore
    const token = jwt.sign(userToken, process.env.TOKEN_SECRET);

    return res.status(200).json({ token });
  }

  // accepts chainAddress and password
  private async loginWeb3(req: Request, res: Response) {
    const { chainAddress, password } = req.body;

    const user = await UserModel.findOne({
      chainAddress,
    });

    if (user) {
      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(400).json({ msg: "Wrong credentials!" });
      }

      const userToken = {
        type: user.type,
        userId: user._id.toString(),
        userEmail: user.email,
        userAddres: user.chainAddress
      };

      // @ts-ignore
      const token = jwt.sign(userToken, process.env.TOKEN_SECRET);

      return res.status(200).json({ token });
    }

    return res.status(404).json({ msg: "Not found" });
  }
}