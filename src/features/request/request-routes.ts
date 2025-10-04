/** Imported modules */
import { Router } from "express";

import { getRequest, createRequest, updateRequest, deleteRequest } from "./request-controller.js";

/**
 * Router for request endpoints
 */

const requestRouter = Router();

requestRouter.get("/:id", getRequest);
requestRouter.post("/", createRequest);
requestRouter.patch("/:id", updateRequest);
requestRouter.delete("/:id", deleteRequest);

export { requestRouter };
