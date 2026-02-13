/** Imported modules */
import { Router } from "express";

import { authMiddleware } from "../user/middlewares/auth.js";

import { auditRequest, sendRequest } from "./cloud-agent-controller.js";

/**
 * Router for cloud agent endpoints
 */

const cloudAgentRouter = Router();

cloudAgentRouter.post("/request", authMiddleware, sendRequest);
cloudAgentRouter.post("/request/audit", authMiddleware, auditRequest);

export { cloudAgentRouter };
