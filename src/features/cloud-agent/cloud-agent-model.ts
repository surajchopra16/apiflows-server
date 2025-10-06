/** Imported modules */
import { z, object, record, string, url } from "zod";

/** Method enum */
const methodEnum = z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);

/** Body schema */
const bodySchema = object({
    type: z.enum(["none", "raw:text", "raw:json"]),
    value: string()
});

/**
 * ==================== Schemas ====================>
 */

/** Request schema */
const requestSchema = object({
    url: url(),
    method: methodEnum,
    queryParams: record(string(), string()),
    headers: record(string(), string()),
    body: bodySchema,
    serializedCookieJar: string().optional()
});

export { requestSchema };
