/** Imported modules */
import { RequestHandler } from "express";

import { ObjectId } from "mongodb";

import { collectionsCollection } from "../collection/collection-model.js";
import { createRequestSchema, requestsCollection, updateRequestSchema } from "./request-model.js";

import { HttpError } from "../../utils/httpError.js";
import { objectIdSchema } from "../../utils/schema.js";

/** Get the request */
const getRequest: RequestHandler = async (req, res) => {
    // Parse the request param for the request id
    const requestId = objectIdSchema.parse(req.params.requestId);

    // Find the request document
    const request = await requestsCollection.findOne({ _id: new ObjectId(requestId) });
    if (!request) throw new HttpError("Request not found", 404);

    // Remove the createdAt and updatedAt fields
    const { createdAt, updatedAt, ...sanitizedRequest } = request;

    res.status(200).json({
        status: "success",
        message: "Request fetched successfully",
        data: { request: sanitizedRequest }
    });
};

/** Create a new request */
const createRequest: RequestHandler = async (req, res) => {
    // Parse the request body
    const body = createRequestSchema.parse(req.body);

    // Insert the request document
    const doc = { ...body.request, createdAt: new Date(), updatedAt: new Date() };
    const insertOneResult = await requestsCollection.insertOne(doc);

    // Insert the request node into the collection
    const request = { _id: insertOneResult.insertedId.toString(), ...doc };
    const requestNode = {
        _id: insertOneResult.insertedId.toString(),
        name: request.name,
        type: "request" as const,
        method: request.method
    };

    let result;

    // Check if folder id is provided
    if (body.folderId)
        result = await collectionsCollection.updateOne(
            { "_id": new ObjectId(body.collectionId), "children._id": body.folderId },
            { $push: { "children.$.children": requestNode } }
        );
    else
        result = await collectionsCollection.updateOne(
            { _id: new ObjectId(body.collectionId) },
            { $push: { children: requestNode } }
        );

    if (result.matchedCount === 0) throw new HttpError("Collection or folder not found", 404);

    // Remove the createdAt and updatedAt fields
    const { createdAt, updatedAt, ...sanitizedRequest } = request;

    res.status(201).json({
        status: "success",
        message: "Request created successfully",
        data: { request: sanitizedRequest, requestNode }
    });
};

/** Update an existing request */
const updateRequest: RequestHandler = async (req, res) => {
    // Parse the request param for the request id
    const requestId = objectIdSchema.parse(req.params.requestId);

    // Parse the request body
    const body = updateRequestSchema.parse(req.body);

    // Check if the updates are provided
    if (Object.keys(body.updates).length === 0) throw new HttpError("No updates are provided", 400);

    // Prepare the updates
    const requestUpdates = { ...body.updates, updatedAt: new Date() };
    const requestNodeUpdates = {
        ...(body.updates.name && { name: body.updates.name }),
        ...(body.updates.method && { method: body.updates.method })
    };

    // Update the request document
    const updateResult = await requestsCollection.updateOne(
        { _id: new ObjectId(requestId) },
        { $set: requestUpdates }
    );
    if (updateResult.matchedCount === 0) throw new HttpError("Request not found", 404);

    // Update the request node in the collection
    if (Object.keys(requestNodeUpdates).length > 0) {
        let result;

        // Check if the folder id is provided
        if (body.folderId === null) {
            // Update the request node at the root level
            result = await collectionsCollection.updateOne(
                { "_id": new ObjectId(body.collectionId), "children._id": requestId },
                {
                    $set: Object.keys(requestNodeUpdates).reduce((acc, key) => {
                        acc[`children.$.${key}`] = (requestNodeUpdates as any)[key];
                        return acc;
                    }, {} as any)
                }
            );
        } else {
            // Update the request node at the folder level
            result = await collectionsCollection.updateOne(
                { _id: new ObjectId(body.collectionId) },
                {
                    $set: Object.keys(requestNodeUpdates).reduce((acc, key) => {
                        acc[`children.$[folder].children.$[request].${key}`] = (
                            requestNodeUpdates as any
                        )[key];
                        return acc;
                    }, {} as any)
                },
                { arrayFilters: [{ "folder._id": body.folderId }, { "request._id": requestId }] }
            );
        }

        if (result.matchedCount === 0)
            throw new HttpError("Collection or folder or request not found", 404);
    }

    res.status(200).json({
        status: "success",
        message: "Request updated successfully"
    });
};

/** Delete a request */
const deleteRequest: RequestHandler = async (req, res) => {
    // Parse the request param for the request id
    const requestId = objectIdSchema.parse(req.params.requestId);

    // Parse the request query for the collection id and folder id
    const collectionId = objectIdSchema.parse(req.query.collectionId);
    const folderId = req.query.folderId ? objectIdSchema.parse(req.query.folderId) : null;

    // Delete the request document
    const deleteResult = await requestsCollection.deleteOne({ _id: new ObjectId(requestId) });
    if (deleteResult.deletedCount === 0) throw new HttpError("Request not found", 404);

    // Delete the request node from the collection
    let result;

    if (folderId)
        result = await collectionsCollection.updateOne(
            { "_id": new ObjectId(collectionId), "children._id": folderId },
            { $pull: { "children.$.children": { _id: requestId, type: "request" } } }
        );
    else
        result = await collectionsCollection.updateOne(
            { _id: new ObjectId(collectionId) },
            { $pull: { children: { _id: requestId, type: "request" } } }
        );

    if (result.matchedCount === 0) throw new HttpError("Collection or folder not found", 404);

    res.status(200).json({
        status: "success",
        message: "Request deleted successfully"
    });
};

export { getRequest, createRequest, updateRequest, deleteRequest };
