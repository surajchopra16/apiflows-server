/** Imported modules */
import { Router } from "express";

import { status, signup, login, logout } from "./user-controller.js";

/**
 * Router for user endpoints
 */

const userRouter = Router();

userRouter.get("/status", status);
userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.delete("/logout", logout);

export { userRouter };
