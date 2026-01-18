/** Imported modules */
import { Router } from "express";

import { authMiddleware } from "../user/middlewares/auth.js";

import { getRequest, createRequest, updateRequest, deleteRequest } from "./request-controller.js";

/**
 * Router for request endpoints
 */

const requestRouter = Router();

requestRouter.get("/:requestId", authMiddleware, getRequest);
requestRouter.post("/", authMiddleware, createRequest);
requestRouter.patch("/:requestId", authMiddleware, updateRequest);
requestRouter.delete("/:requestId", authMiddleware, deleteRequest);

export { requestRouter };
