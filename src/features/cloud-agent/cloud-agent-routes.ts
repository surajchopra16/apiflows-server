/** Imported modules */
import { Router } from "express";

import { sendRequest } from "./cloud-agent-controller.js";

/**
 * Router for cloud agent endpoints
 */

const cloudAgentRouter = Router();

cloudAgentRouter.post("/request", sendRequest);

export { cloudAgentRouter };
