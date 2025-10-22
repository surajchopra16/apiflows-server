/** Imported modules */
import { parse } from "content-type";
import dns from "dns/promises";
import got from "got";
import iconv from "iconv-lite";
import ipaddr from "ipaddr.js";
import { CookieJar } from "tough-cookie";
import { URL } from "url";

import { HttpError } from "../../utils/httpError.js";

/** Upstream request type */
type UpstreamRequest = {
    url: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
    queryParams: Record<string, string>;
    headers: Record<string, string>;
    body: { type: "none" | "raw:text" | "raw:json"; value: string };
    serializedCookieJar?: string;
    timeout: number;
    followRedirect: boolean;
    maxRedirects: number;
    validateSSL: boolean;
    maxResponseBytes: number;
};

/** Upstream response type */
type UpstreamResponse = {
    statusCode: number;
    statusMessage: string;
    headers: Record<string, string>;
    body: { encoding: string; type: string; value: string };
    serializedCookieJar: string;
    timings: {
        wait: number;
        dns: number;
        tcp: number;
        tls: number;
        request: number;
        firstByte: number;
        download: number;
        total: number;
    };
    size: number;
};

/** Hop by hop headers that should be removed */
const HOP_BY_HOP_HEADERS = new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade"
]);

/** Blocked CIDR ranges for SSRF protection */
const BLOCKED_CIDRS = [
    "0.0.0.0/8",
    "10.0.0.0/8",
    "100.64.0.0/10",
    "127.0.0.0/8",
    "169.254.0.0/16",
    "172.16.0.0/12",
    "192.0.0.0/24",
    "192.0.2.0/24",
    "192.88.99.0/24",
    "192.168.0.0/16",
    "198.18.0.0/15",
    "198.51.100.0/24",
    "203.0.113.0/24",
    "224.0.0.0/4",
    "240.0.0.0/4",
    "::1/128",
    "fc00::/7",
    "fe80::/10"
];

/**
 * ==================== Helpers ====================>
 */

/**
 * Validate a URL to prevent SSRF attacks
 * @param targetURL The target URL to validate
 */

const validateSSRF = async (targetURL: string) => {
    const url = new URL(targetURL);

    // Check for the valid protocol
    if (!["http:", "https:"].includes(url.protocol))
        throw new HttpError(`SSRF_BLOCKED: Invalid protocol ${url.protocol}`, 403);

    // Check if the hostname is an IP address
    if (ipaddr.isValid(url.hostname)) {
        if (isBlockedAddress(url.hostname))
            throw new HttpError(`SSRF_BLOCKED: Blocked IP address ${url.hostname}`, 403);
        return;
    }

    // Resolve the hostname to IP addresses and validate the IP addresses
    try {
        const lookupAddresses = await dns.lookup(url.hostname, { all: true });
        for (const { address } of lookupAddresses)
            if (isBlockedAddress(address))
                throw new HttpError(`SSRF_BLOCKED: Blocked IP address ${address}`, 403);
    } catch (err) {
        throw err instanceof HttpError
            ? err
            : new HttpError(`SSRF_BLOCKED: Unable to resolve hostname ${url.hostname}`, 403);
    }
};

/**
 * Check if an IP address is in a blocked range
 * @param address The IP address to check
 */

const isBlockedAddress = (address: string): boolean => {
    try {
        const parsedAddress = ipaddr.parse(address);

        for (const cidr of BLOCKED_CIDRS) {
            const [rangeAddr, prefix] = ipaddr.parseCIDR(cidr);

            // Skip if different IP versions (IPv4 vs IPv6)
            if (rangeAddr.kind() !== parsedAddress.kind()) continue;

            // Type-safe match using the kind check
            const isMatch =
                rangeAddr.kind() === "ipv4"
                    ? (parsedAddress as ipaddr.IPv4).match(rangeAddr as ipaddr.IPv4, prefix)
                    : (parsedAddress as ipaddr.IPv6).match(rangeAddr as ipaddr.IPv6, prefix);

            if (isMatch) return true;
        }

        return false;
    } catch {
        return true;
    }
};

/**
 * Sanitize headers by removing hop-by-hop and sensitive headers
 * @param headers The original headers
 */

function sanitizeHeaders(headers: Record<string, string>) {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
        const k = key.toLowerCase();
        if (HOP_BY_HOP_HEADERS.has(k) || k === "host") continue;
        out[k] = value;
    }
    return out;
}

/**
 * Process the response body based on content-type and content
 * @param buffer The response body buffer
 * @param contentTypeHeader The content-type header
 */

const processBody = (buffer: Buffer, contentTypeHeader: string): UpstreamResponse["body"] => {
    // Parse the content-type header
    const { type, parameters } = contentTypeHeader
        ? parse(contentTypeHeader)
        : { type: "", parameters: {} };

    const mediaType = type.toLowerCase();

    let charset = (parameters.charset || "utf-8").toLowerCase();
    if (!iconv.encodingExists(charset)) charset = "utf-8";

    // Decode the buffer to text
    const text = iconv.decode(buffer, charset).trim();

    // JSON
    if (
        mediaType === "application/json" ||
        mediaType.endsWith("+json") ||
        (!contentTypeHeader && (text.startsWith("{") || text.startsWith("[")))
    ) {
        try {
            const json = JSON.stringify(JSON.parse(text), null, 4);
            return { encoding: "utf8", type: "json", value: json };
        } catch {
            return { encoding: "utf8", type: "text", value: text };
        }
    }

    // XML
    if (
        mediaType === "application/xml" ||
        mediaType === "text/xml" ||
        mediaType.endsWith("+xml") ||
        (!contentTypeHeader &&
            text.startsWith("<") &&
            !text.toLowerCase().includes("<!doctype html>"))
    ) {
        return { encoding: "utf8", type: "xml", value: text };
    }

    // HTML
    if (
        mediaType === "text/html" ||
        (!contentTypeHeader &&
            (text.toLowerCase().includes("<!doctype html>") ||
                text.toLowerCase().includes("<html")))
    ) {
        return { encoding: "utf8", type: "html", value: text };
    }

    // Text (including JavaScript)
    if (
        mediaType.startsWith("text/") ||
        mediaType === "application/javascript" ||
        mediaType === "application/x-javascript" ||
        mediaType === "application/ecmascript"
    ) {
        return { encoding: "utf8", type: "text", value: text };
    }

    // Binary
    if (
        mediaType.startsWith("image/") ||
        mediaType.startsWith("video/") ||
        mediaType.startsWith("audio/") ||
        buffer.includes(0)
    ) {
        return { encoding: "base64", type: "binary", value: buffer.toString("base64") };
    }

    // RAW (Fallback)
    return { encoding: "base64", type: "raw", value: buffer.toString("base64") };
};

/**
 * Extract the timings information from the got stream
 * @param stream The got stream
 */

const extractTimings = (stream: any): UpstreamResponse["timings"] => {
    return {
        wait: stream.timings?.phases.wait ?? 0,
        dns: stream.timings?.phases.dns ?? 0,
        tcp: stream.timings?.phases.tcp ?? 0,
        tls: stream.timings?.phases.tls ?? 0,
        request: stream.timings?.phases.request ?? 0,
        firstByte: stream.timings?.phases.firstByte ?? 0,
        download: stream.timings?.phases.download ?? 0,
        total: stream.timings?.phases.total ?? 0
    };
};

/**
 * ==================== Functions ====================>
 */

/**
 * Execute an upstream HTTP request
 * @param request The upstream request
 * @returns The upstream response
 */

const executeUpstreamRequest = async (request: UpstreamRequest): Promise<UpstreamResponse> => {
    // Check for the SSRF attack
    await validateSSRF(request.url);

    // Handle the headers
    const headers = sanitizeHeaders(request.headers);

    // Handle the body
    let body: string | undefined = undefined;

    if (request.body.type === "raw:text") {
        body = request.body.value;
        headers["content-type"] = "text/plain;charset=utf-8";
        headers["content-length"] = Buffer.byteLength(body).toString();
    } else if (request.body.type === "raw:json") {
        body = request.body.value;
        headers["content-type"] = "application/json";
        headers["content-length"] = Buffer.byteLength(body).toString();
    } else if (request.body.type === "none" && ["POST", "PUT", "PATCH"].includes(request.method)) {
        body = "";
        headers["content-type"] = "text/plain;charset=utf-8";
        headers["content-length"] = "0";
    }

    // Handle the cookie jar
    let cookieJar: CookieJar;

    if (request.serializedCookieJar) {
        try {
            cookieJar = CookieJar.deserializeSync(request.serializedCookieJar);
        } catch {
            cookieJar = new CookieJar();
        }
    } else cookieJar = new CookieJar();

    return await new Promise((resolve) => {
        // Send the HTTP request
        const stream = got({
            url: request.url,
            method: request.method,
            searchParams: request.queryParams,
            headers: headers,
            body: body,
            cookieJar: cookieJar,
            timeout: { request: request.timeout },
            followRedirect: request.followRedirect,
            maxRedirects: request.maxRedirects,
            https: { rejectUnauthorized: request.validateSSL },
            ...(request.method === "GET" && request.body.type !== "none" && { allowGetBody: true }), // Allow body in GET request
            throwHttpErrors: false, // We want to handle HTTP errors ourselves
            retry: { limit: 0 }, // Disable retries
            responseType: "buffer", // We want a buffer to handle different content types
            resolveBodyOnly: false, // We want a full response
            decompress: true, // Handle the content-encoding (gzip, deflate, br)
            isStream: true
        });

        // Handle the stream
        let size = 0;
        let chunks: Buffer[] = [];

        let statusCode = 0;
        let statusMessage = "";
        let upstreamHeaders: Record<string, any> = {};

        // Stream for the first time to byte (TTFB)
        stream.on("response", (res) => {
            statusCode = res.statusCode || 500;
            statusMessage = res.statusMessage || "Something went wrong!";
            upstreamHeaders = res.headers;

            // Handle the set-cookie headers
            const setCookie = res.headers["set-cookie"];
            if (setCookie) {
                const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
                for (const cookie of cookies) {
                    cookieJar.setCookieSync(cookie, request.url);
                }
            }
        });

        // Stream for the response body
        stream.on("data", (chunk) => {
            size += chunk.length;

            if (size > request.maxResponseBytes)
                stream.destroy(new HttpError("MAX_RESPONSE_BYTES: Response is too large", 413));
            else chunks.push(chunk);
        });

        // Stream for the end of the response
        stream.on("end", () => {
            const buffer = Buffer.concat(chunks);
            const contentType = upstreamHeaders["content-type"] || "";
            const body = processBody(buffer, contentType);

            resolve({
                statusCode,
                statusMessage,
                headers: upstreamHeaders,
                body,
                serializedCookieJar: JSON.stringify(cookieJar.serializeSync()),
                timings: extractTimings(stream),
                size
            });
        });

        // Stream for the error only (no HTTP errors)
        stream.on("error", (err: any) => {
            statusCode = 500;
            statusMessage = err?.code || "Internal Server Error";
            upstreamHeaders = err.response?.headers || {};

            resolve({
                statusCode,
                statusMessage,
                headers: upstreamHeaders,
                body: { encoding: "utf8", type: "text", value: err.message },
                serializedCookieJar: JSON.stringify(cookieJar.serializeSync()),
                timings: extractTimings(stream),
                size
            });
        });
    });
};

export { executeUpstreamRequest };
