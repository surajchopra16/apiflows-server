/** Imported modules */
import { object, string, z } from "zod";

/**
 * Environment variables schema
 */

const envSchema = object({
    /** Environment */
    NODE_ENV: string(),
    HOST: string(),
    PORT: string(),

    /** CORS */
    CORS_ORIGIN: string(),

    /** MongoDB */
    DB_CONNECTION_STRING: string(),
    DB_PASSWORD: string(),

    /** JWT */
    JWT_SECRET: string(),
    JWT_EXPIRES_IN: string(),

    /** Gemini */
    GOOGLE_API_KEY: string()
});

/**
 * Extending NodeJS.ProcessEnv with env schema
 */

declare global {
    namespace NodeJS {
        interface ProcessEnv extends z.infer<typeof envSchema> {}
    }
}

/**
 * Parsing environment variables
 */

const parseEnv = () => {
    const result = envSchema.safeParse(process.env);
    if (!result.success) throw new Error("Environment variables are not valid");
};

export { parseEnv };
