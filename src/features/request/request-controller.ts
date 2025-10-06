/** Imported modules */
import { RequestHandler } from "express";

import { requestsCollection } from "../../mongodb.js";
import { ObjectId } from "mongodb";
import { string } from "zod";

import { createRequestSchema } from "./request-model.js";

/** Get the request */
const getRequest: RequestHandler = async (req, res) => {
    // Parse the request param for the request ID
    const requestId = string().parse(req.params.requestId);

    // Find the request document
    const request = await requestsCollection.findOne({ _id: new ObjectId(requestId) });

    res.status(200).json({
        status: "success",
        message: "Request fetched successfully",
        data: { request }
    });
};

/** Create a new request */
const createRequest: RequestHandler = async (req, res) => {
    // Parse the request body
    const body = createRequestSchema.parse(req.body);

    // Insert the request document
    const data = { ...body, createdAt: new Date(), updatedAt: new Date() };
    const request = await requestsCollection.insertOne(data);

    res.status(201).json({
        status: "success",
        message: "Request created successfully",
        data: { request: { _id: request.insertedId, ...data } }
    });
};

/** Update an existing request */
const updateRequest: RequestHandler = (_req, _res) => {};

/** Delete a request */
const deleteRequest: RequestHandler = (_req, _res) => {};

export { getRequest, createRequest, updateRequest, deleteRequest };
