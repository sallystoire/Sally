import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import kingdomRouter from "./kingdom.js";
import raidRouter from "./raid.js";
import shopRouter from "./shop.js";
import codesRouter from "./codes.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/kingdoms", kingdomRouter);
router.use("/raids", raidRouter);
router.use("/shop", shopRouter);
router.use("/codes", codesRouter);

export default router;
