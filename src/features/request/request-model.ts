/** Imported modules */
import { array, boolean, object, string, z } from "zod";

/** Method enum */
const methodEnum = z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);

/** Query param schema */
const queryParamSchema = object({
    enabled: boolean(),
    key: string(),
    value: string(),
    description: string()
});

/** Header schema */
const headerSchema = object({
    enabled: boolean(),
    key: string(),
    value: string(),
    description: string(),
    auto: boolean()
});

/** Body schema */
const bodySchema = object({
    type: z.enum(["none", "raw:text", "raw:json"]),
    value: string()
});

/**
 * ==================== Schemas ====================>
 */

/** Create request schema */
const createRequestSchema = object({
    name: string(),
    url: string(),
    method: methodEnum,
    queryParams: array(queryParamSchema),
    headers: array(headerSchema),
    body: bodySchema
});

export { createRequestSchema };
