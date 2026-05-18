import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chainsRouter from "./chains";
import partnershipsRouter from "./partnerships";
import ecosystemRouter from "./ecosystem";
import agentsRouter from "./agents";
import statsRouter from "./stats";
import nexusRouter from "./nexus";
import metricsRouter from "../metrics/metricsRouter";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chainsRouter);
router.use(partnershipsRouter);
router.use(ecosystemRouter);
router.use(agentsRouter);
router.use(statsRouter);
router.use(nexusRouter);
router.use(metricsRouter);

export default router;
