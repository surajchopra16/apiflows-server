/** Imported modules */
import { parseEnv } from "./env.js";

import app from "./app.js";

/**
 * Handle the uncaught exception
 */

process.on("uncaughtException", (err) => {
    console.error(err, "Uncaught Exception! Shutting down...");
    process.exit(1);
});

/**
 * Handle the unhandled rejection
 */

process.on("unhandledRejection", (err: any) => {
    console.error(err, "Unhandled Rejection! Shutting down...");
    process.exit(1);
});

/**
 * Parse the environment variables
 */

parseEnv();

/**
 * Start the express server
 */

const host = process.env.HOST;
const port = +process.env.PORT;

app.listen(port, host, () => console.log(`Server is running on port ${port}`));
