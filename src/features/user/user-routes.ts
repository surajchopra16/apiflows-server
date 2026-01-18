/** Imported modules */
import { Router } from "express";

import { signup, login, logout } from "./user-controller.js";

/**
 * Router for user endpoints
 */

const userRouter = Router();

userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.delete("/logout", logout);

export { userRouter };
