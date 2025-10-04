/** Imported modules */
import express, { Request, Response, NextFunction } from "express";

import cors from "cors";
import helmet from "helmet";

import { collectionRouter } from "./features/collection/collection-routes.js";
import { requestRouter } from "./features/request/request-routes.js";

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
 * Middleware to parse JSON bodies
 */

app.use(express.json());

/**
 * App routes
 */

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

app.use((_err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ status: "error", message: "Something went wrong" });
});

export default app;
