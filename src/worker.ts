/** Imported modules */
import { parseEnv } from "./env.js";

import app from "./app.js";

import { httpServerHandler } from "cloudflare:node";

/**
 * Parse the environment variables
 */

parseEnv();

app.listen(3000);
export default httpServerHandler({ port: 3000 });
