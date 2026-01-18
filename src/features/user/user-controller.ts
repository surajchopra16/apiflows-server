/** Imported modules */
import { RequestHandler } from "express";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { loginSchema, signupSchema, usersCollection } from "./user-model.js";

import { HttpError } from "../../utils/httpError.js";

/**
 * ==================== User controller ====================>
 */

/** Sign up a new user */
const signup: RequestHandler = async (req, res) => {
    // Parse the request body
    const body = signupSchema.parse(req.body);

    // Check if the user already exists
    const existingUser = await usersCollection.findOne({ email: body.email });
    if (existingUser) throw new HttpError("User already exists", 409);

    // Hash the password
    const hashedPassword = await bcrypt.hash(body.password, 12);

    // Create the user document
    const doc = {
        email: body.email,
        password: hashedPassword,
        createdAt: new Date()
    };

    // Insert the user into the database
    const insertOneResult = await usersCollection.insertOne(doc);

    // Generate the access token
    const accessToken = jwt.sign(
        { userId: insertOneResult.insertedId.toString(), email: body.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    // Set the access token cookie
    res.cookie("access-token", accessToken, {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        httpOnly: true,
        path: "/",
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(201).json({
        status: "success",
        message: "User account created successfully",
        data: {
            user: { _id: insertOneResult.insertedId, email: body.email, createdAt: doc.createdAt }
        }
    });
};

/** Log in an existing user */
const login: RequestHandler = async (req, res) => {
    // Parse the request body
    const body = loginSchema.parse(req.body);

    // Find the user document
    const user = await usersCollection.findOne({ email: body.email });
    if (!user) throw new HttpError("Invalid email or password", 401);

    // Check the password
    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (!isPasswordValid) throw new HttpError("Invalid email or password", 401);

    // Generate the access token
    const accessToken = jwt.sign(
        { userId: user._id.toString(), email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN } as jwt.SignOptions
    );

    // Set token access token cookie
    res.cookie("access-token", accessToken, {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        httpOnly: true,
        path: "/",
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(200).json({
        status: "success",
        message: "User logged in successfully",
        data: {
            user: { _id: user._id, email: user.email, createdAt: user.createdAt }
        }
    });
};

/** Log out a user */
const logout: RequestHandler = async (_req, res) => {
    // Clear the access token cookie
    res.clearCookie("access-token", {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        httpOnly: true,
        path: "/"
    });

    res.status(200).json({
        status: "success",
        message: "User logged out successfully"
    });
};

export { signup, login, logout };
