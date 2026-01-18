/** Imported modules */
import { RequestHandler } from "express";

import jwt from "jsonwebtoken";

import { HttpError } from "../utils/httpError.js";

/**
 * Extend the Express Request type to include user information
 */

declare global {
    namespace Express {
        interface Request {
            user?: { userId: string; email: string };
        }
    }
}

/**
 * Authentication middleware to verify JWT tokens from cookies
 */

const authMiddleware: RequestHandler = async (req, _res, next) => {
    try {
        // Get the access token from cookies
        const accessToken = req.cookies["access-token"];

        // Check if the access token is present
        if (!accessToken) throw new HttpError("Authentication required. Please log in.", 401);

        // Decode the access token
        const decodedAccessToken = jwt.verify(accessToken, process.env.JWT_SECRET) as {
            userId: string;
            email: string;
        };

        // Attach user information to the request object
        req.user = { userId: decodedAccessToken.userId, email: decodedAccessToken.email };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError)
            throw new HttpError("Invalid or expired token. Please log in again.", 401);

        throw error;
    }
};

export { authMiddleware };
