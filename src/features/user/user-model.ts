/** Imported modules */
import { db } from "../../mongodb.js";
import { email, object, string } from "zod";

/** User type */
type User = { email: string; password: string; createdAt: Date };

/**
 * ==================== Schemas ====================>
 */

/** Signup schema */
const signupSchema = object({
    email: email("Invalid email address"),
    password: string().min(8, "Password must be at least 8 characters long")
});

/** Login schema */
const loginSchema = object({
    email: email("Invalid email address"),
    password: string().min(1, "Password is required")
});

/**
 * ==================== User collection ====================>
 */

const usersCollection = db.collection<User>("users");
usersCollection.createIndex({ email: 1 }, { unique: true }).then();

export { User, signupSchema, loginSchema, usersCollection };
