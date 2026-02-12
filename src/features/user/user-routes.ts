/** Imported modules */
import { Router } from "express";

import { authMiddleware } from "./middlewares/auth.js";

import { status, guest, signup, login, logout } from "./user-controller.js";

/**
 * Router for user endpoints
 */

const userRouter = Router();

userRouter.get("/status", status);
userRouter.post("/guest", guest);
userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.delete("/logout", logout);

export { userRouter };
