/** Imported modules */
import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.js";

import { sendRequest } from "./cloud-agent-controller.js";

/**
 * Router for cloud agent endpoints
 */

const cloudAgentRouter = Router();

cloudAgentRouter.post("/request", authMiddleware, sendRequest);

export { cloudAgentRouter };
