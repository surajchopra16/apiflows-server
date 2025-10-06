/** Imported modules */
import { Router } from "express";

import { getRequest, createRequest, updateRequest, deleteRequest } from "./request-controller.js";

/**
 * Router for request endpoints
 */

const requestRouter = Router();

requestRouter.get("/:requestId", getRequest);
requestRouter.post("/", createRequest);
requestRouter.patch("/:requestId", updateRequest);
requestRouter.delete("/:requestId", deleteRequest);

export { requestRouter };
