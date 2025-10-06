/** Imported modules */
import { RequestHandler } from "express";

import { executeUpstreamRequest } from "./cloud-agent.js";

import { requestSchema } from "./cloud-agent-model.js";

import { HttpError } from "../../utils/httpError.js";

/** Constants */
const DEFAULT_TIMEOUT = 15000;
const DEFAULT_FOLLOW_REDIRECT = true;
const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_VALIDATE_SSL = true;
const DEFAULT_MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

const MAX_CONCURRENT_REQUESTS = 50;
let concurrent_request = 0;

/** Send the upstream request */
const sendRequest: RequestHandler = async (req, res) => {
    // Check for the concurrent request limit
    if (concurrent_request >= MAX_CONCURRENT_REQUESTS)
        return res.status(429).json({ status: "error", message: "Too many concurrent requests" });
    concurrent_request++;

    // Parse the request body
    const body = requestSchema.parse(req.body);

    // Execute the upstream request
    const upstreamResponse = await executeUpstreamRequest({
        ...body,
        timeout: DEFAULT_TIMEOUT,
        followRedirect: DEFAULT_FOLLOW_REDIRECT,
        maxRedirects: DEFAULT_MAX_REDIRECTS,
        validateSSL: DEFAULT_VALIDATE_SSL,
        maxResponseBytes: DEFAULT_MAX_RESPONSE_BYTES
    });
    concurrent_request--;

    res.status(200).json({
        status: "success",
        message: "Request executed successfully",
        data: {
            response: {
                statusCode: upstreamResponse.statusCode,
                statusMessage: upstreamResponse.statusMessage,
                duration: upstreamResponse.duration,
                size: upstreamResponse.size,
                headers: upstreamResponse.headers,
                body: upstreamResponse.body,
                serializedCookieJar: upstreamResponse.serializedCookieJar
            }
        }
    });
};

export { sendRequest };
