/** Imported modules */
import { object, record, string, url } from "zod";

import { bodySchema, httpMethodEnum } from "../request/request-model.js";

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

export { requestSchema };
