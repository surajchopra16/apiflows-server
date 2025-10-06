/** Imported modules */
import express, { Request, Response, NextFunction } from "express";

import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { prettifyError, ZodError } from "zod";

import { cloudAgentRouter } from "./features/cloud-agent/cloud-agent-routes.js";
import { collectionRouter } from "./features/collection/collection-routes.js";
import { requestRouter } from "./features/request/request-routes.js";

import { HttpError } from "./utils/httpError.js";

/**
 * Create an express instance
 */

const app = express();

/**
 * CORS middleware
 */

app.use(
    cors({
        origin: process.env.NODE_ENV === "production" ? process.env.CORS_ORIGIN : true,
        methods: ["GET", "POST", "PATCH", "DELETE", "HEAD", "OPTIONS"],
        credentials: true
    })
);

/**
 * Helmet middleware
 */

app.use(helmet({ hidePoweredBy: true }));

/**
 * Morgan middleware
 */

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

/**
 * Middleware to parse JSON bodies
 */

app.use(express.json());

/**
 * App routes
 */

app.use("/api/v1/cloud-agent", cloudAgentRouter);
app.use("/api/v1/collections", collectionRouter);
app.use("/api/v1/requests", requestRouter);

/**
 * Handle invalid routes
 */

app.use((_req: Request, res: Response) => {
    res.status(404).json({ status: "success", message: "Route not found" });
});

/**
 * Global error handler
 */

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Handle the operational errors
    if (err instanceof HttpError && err.isOperational)
        return res.status(err.statusCode).json({ status: err.status, message: err.message });

    // Handle the Zod errors
    if (err instanceof ZodError)
        return res.status(400).json({ status: "fail", message: prettifyError(err) });

    // Handle the non-operational errors
    console.error("Non-operational error:", err);
    res.status(500).json({ status: "error", message: "Something went wrong!" });
});

export default app;
