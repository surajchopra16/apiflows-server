/** Imported modules */
import { db } from "../../mongodb.js";
import { array, boolean, object, string, z } from "zod";

import { objectIdSchema } from "../../utils/schema.js";

/** HTTP method type */
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

/** Query param type */
type QueryParam = { enabled: boolean; key: string; value: string; description: string };

/** Header type */
type Header = { enabled: boolean; key: string; value: string; description: string; auto: boolean };

/** Body type */
type Body = { type: "none" | "raw:text" | "raw:json"; value: string };

/** Request type */
type Request = {
    name: string;
    url: string;
    method: HttpMethod;
    queryParams: QueryParam[];
    headers: Header[];
    body: Body;
    createdAt: Date;
    updatedAt: Date;
};

/** HTTP method enum */
const httpMethodEnum = z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);

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
    collectionId: objectIdSchema,
    folderId: objectIdSchema.nullable(),
    request: object({
        name: string(),
        url: string(),
        method: httpMethodEnum,
        queryParams: array(queryParamSchema),
        headers: array(headerSchema),
        body: bodySchema
    })
});

/** Update request schema */
const updateRequestSchema = object({
    collectionId: objectIdSchema,
    folderId: objectIdSchema.nullable(),
    updates: object({
        name: string().optional(),
        url: string().optional(),
        method: httpMethodEnum.optional(),
        queryParams: array(queryParamSchema).optional(),
        headers: array(headerSchema).optional(),
        body: bodySchema.optional()
    })
});

/**
 * ==================== Collection ====================>
 */

const requestsCollection = db.collection<Request>("requests");

export {
    HttpMethod,
    QueryParam,
    Header,
    Body,
    Request,
    httpMethodEnum,
    bodySchema,
    createRequestSchema,
    updateRequestSchema,
    requestsCollection
};
