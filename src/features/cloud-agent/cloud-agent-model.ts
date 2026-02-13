/** Imported modules */
import { number, object, record, string, url } from "zod";

import { bodySchema, httpMethodEnum } from "../request/request-model.js";

/** Constants */
const AUDIT_REQUEST_SYSTEM_PROMPT = `
    You are an expert REST API Auditor and Architect. Your job is to analyze HTTP request/response metadata and grade the API endpoint based on strict industry standards (Richardson Maturity Model), performance metrics, and security best practices.

    **INPUT DATA:**
    You will receive a JSON object containing:
    - Request
      - URL (e.g. "https://api.example.com/v1/users")
      - Method (GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD)
      - Query Parameters (e.g. {"search": "john", "limit": "10"})
      - Headers (e.g. {"Content-Type": "application/json
      - Body (e.g. {"encoding": "utf-8", "type": "application/json", "value": "{\"name\": \"John\"}"})
      - Serialized Cookie Jar (if any)
    - Response
      - Status Code (e.g. 200, 404, 500)
      - Status Message (e.g. "OK", "Not Found", "Internal Server Error")
      - Headers (e.g. {"Content-Type": "application/json", "Cache-Control": "no-cache"})
      - Body (e.g. {"encoding": "utf-8", "type": "application/json", "value": "{\"id\": \"123\", \"name\": \"John\"}"})
      - Timings (e.g. {"wait": 50, "dns": 20, "tcp": 30, "tls": 10, "request": 100, "firstByte": 150, "download": 200, "total": 360})
      - Size (in bytes)
    
    **SCORING RUBRIC (Total: 100 Points):**

    1. **STRUCTURE (Max 40 Points):**
       - **URI Design:** Penalize if URL contains verbs (e.g., \`/getUsers\` instead of \`/users\`). URIs should be noun-based resource paths.
       - **HTTP Semantics:** Penalize if GET is used for state change or POST for simple retrieval.
       - **Status Codes:** Penalize generic codes where specific ones exist (e.g., returning \`200 OK\` for a creation instead of \`201 Created\`, or \`200\` containing an error message instead of \`4xx/5xx\`).
       - **Formatting:** Penalize mixed casing in JSON keys (e.g., mixing \`camelCase\` and \`snake_case\`).
       - **Content Negotiation:** Check if \`Accept\` and \`Content-Type\` headers match.

    2. **PERFORMANCE (Max 30 Points):**
       - **Latency Evaluation:**
         - < 200ms: Full points.
         - 200ms - 500ms: Minor penalty.
         - > 500ms: Significant penalty.
       - **Compression:** Penalize if response body is large (>1KB) but \`Content-Encoding\` (gzip/brotli) header is missing.
       - **Caching:** For GET requests, penalize if \`Cache-Control\` or \`ETag\` headers are missing.
       - **Payload:** Penalize if the response contains excessive nesting or unnecessary data wrappers (like \`{"d": {"results": [...]}}\`) unless standard for the API type (like GraphQL or OData).

    3. **BEST PRACTICES (Max 30 Points):**
       - **Security Headers:** Penalize if \`X-Powered-By\` or \`Server\` headers leak version information. Reward \`Strict-Transport-Security\`.
       - **Error Handling:** If status is 4xx/5xx, check if the body provides a structured error message (e.g., \`code\`, \`message\`).
       - **Versioning:** Check if versioning is present (in URL or Headers).
       - **Auth:** Check for proper \`Authorization\` header usage if the endpoint appears protected.

    **OUTPUT FORMAT:**
    You must return ONLY a raw JSON object. Do not include markdown formatting (like \`\`\`json).

    The JSON structure must be:
    {
      "totalScore": <integer_0_to_100>,
      "breakdown": {
        "structure": <integer_0_to_40>,
        "performance": <integer_0_to_30>,
        "bestPractices": <integer_0_to_30>
      },
      "suggestions": [
        {
          "category": "<Structure|Performance|Best Practices>",
          "issue": "<Brief description of the issue>",
          "fix": "<Actionable instruction on how to fix it>"
        }
      ]
    }
`;

/**
 * ==================== Schemas ====================>
 */

/** Request schema */
const requestSchema = object({
    url: url(),
    method: httpMethodEnum,
    queryParams: record(string(), string()),
    headers: record(string(), string()),
    body: bodySchema,
    serializedCookieJar: string().optional()
});

/** Audit request schema */
const auditRequestSchema = object({
    request: requestSchema,
    response: object({
        statusCode: number(),
        statusMessage: string(),
        headers: record(string(), string()),
        body: object({ encoding: string(), type: string(), value: string() }),
        timings: object({
            wait: number(),
            dns: number(),
            tcp: number(),
            tls: number(),
            request: number(),
            firstByte: number(),
            download: number(),
            total: number()
        }),
        size: number()
    })
});

/** Audit response schema */
const auditResponseSchema = object({
    totalScore: number()
        .min(0)
        .max(100)
        .describe("Overall score for the API endpoint, from 0 to 100 based on the defined rubric"),
    breakdown: object({
        structure: number()
            .min(0)
            .max(40)
            .describe("Score for the REST API structure category, from 0 to 40"),
        performance: number()
            .min(0)
            .max(30)
            .describe("Score for the REST API performance category, from 0 to 30"),
        bestPractices: number()
            .min(0)
            .max(30)
            .describe("Score for the REST API best practices category, from 0 to 30")
    }).describe("Detailed breakdown of scores for each category based on the defined rubric"),
    suggestions: object({
        category: string().describe(
            "Category of the issue identified in the API endpoint, one of 'Structure', 'Performance', or 'Best Practices'"
        ),
        issue: string().describe(
            "Brief description of the specific issue identified in the API endpoint that led to a score deduction"
        ),
        fix: string().describe(
            "Actionable instruction on how to fix the identified issue in the API endpoint to improve its score"
        )
    })
        .array()
        .describe(
            "List of specific issues identified in the API endpoint along with their categories and actionable fixes to improve the overall score"
        )
});

export { AUDIT_REQUEST_SYSTEM_PROMPT, requestSchema, auditRequestSchema, auditResponseSchema };
