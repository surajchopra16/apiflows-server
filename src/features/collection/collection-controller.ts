/** Imported modules */
import { RequestHandler } from "express";

import { ObjectId } from "mongodb";

import { requestsCollection } from "../request/request-model.js";
import {
    createFolderSchema,
    collectionsCollection,
    createCollectionSchema,
    renameCollectionSchema,
    renameFolderSchema,
    FolderNode
} from "./collection-model.js";

import { HttpError } from "../../utils/httpError.js";
import { objectIdSchema } from "../../utils/schema.js";

/**
 * ==================== Collection ====================>
 */

/** Get the collections */
const getCollections: RequestHandler = async (req, res) => {
    // Get userId from the authenticated user
    const userId = req.user!.userId;

    // Find all the collections
    const collections = await collectionsCollection.find({ userId }).toArray();

    res.status(200).json({
        status: "success",
        message: "Collections fetched successfully",
        data: { collections }
    });
};

/** Create a new collection */
const createCollection: RequestHandler = async (req, res) => {
    // Get userId from the authenticated user
    const userId = req.user!.userId;

    // Parse the request body
    const body = createCollectionSchema.parse(req.body);

    // Insert the collection document
    const doc = { userId, name: body.name, type: "collection" as const, children: [] };
    const insertOneResult = await collectionsCollection.insertOne(doc);

    res.status(201).json({
        status: "success",
        message: "Collection created successfully",
        data: { collection: { _id: insertOneResult.insertedId, ...doc } }
    });
};

/** Rename an existing collection */
const renameCollection: RequestHandler = async (req, res) => {
    // Get userId from the authenticated user
    const userId = req.user!.userId;

    // Parse the request params for the collection id
    const collectionId = objectIdSchema.parse(req.params.collectionId);

    // Parse the request body
    const body = renameCollectionSchema.parse(req.body);

    // Update the collection
    const result = await collectionsCollection.updateOne(
        { _id: new ObjectId(collectionId), userId },
        { $set: { name: body.newName } }
    );
    if (result.matchedCount === 0) throw new HttpError("Collection not found", 404);

    res.status(200).json({
        status: "success",
        message: "Collection updated successfully"
    });
};

/** Delete a collection */
const deleteCollection: RequestHandler = async (req, res) => {
    // Get userId from the authenticated user
    const userId = req.user!.userId;

    // Parse the request params for the collection id
    const collectionId = objectIdSchema.parse(req.params.collectionId);

    // Delete the collection
    const collection = await collectionsCollection.findOneAndDelete({
        _id: new ObjectId(collectionId),
        userId
    });
    if (!collection) throw new HttpError("Collection not found", 404);

    // Delete all the requests in the collection
    const requestIds: ObjectId[] = [];

    collection.children.forEach((child) => {
        if (child.type === "folder")
            child.children.forEach((request) => requestIds.push(new ObjectId(request._id)));
        else requestIds.push(new ObjectId(child._id));
    });

    if (requestIds.length > 0)
        await requestsCollection.deleteMany({ _id: { $in: requestIds }, userId });

    res.status(200).json({
        status: "success",
        message: "Collection deleted successfully",
        data: { requestIds: requestIds.map((objectId) => objectId.toHexString()) }
    });
};

/**
 * ==================== Folder ====================>
 */

/** Create a new folder */
const createFolder: RequestHandler = async (req, res) => {
    // Get userId from the authenticated user
    const userId = req.user!.userId;

    // Parse the request params for the collection id
    const collectionId = objectIdSchema.parse(req.params.collectionId);

    // Parse the request body
    const body = createFolderSchema.parse(req.body);

    // Insert the new folder in the collection
    const folder = {
        _id: new ObjectId().toHexString(),
        name: body.name,
        type: "folder" as const,
        children: []
    };

    const result = await collectionsCollection.updateOne(
        { _id: new ObjectId(collectionId), userId },
        { $push: { children: folder } }
    );
    if (result.matchedCount === 0) throw new HttpError("Collection not found", 404);

    res.status(200).json({
        status: "success",
        message: "Folder created successfully",
        data: { folder }
    });
};

/** Rename a folder */
const renameFolder: RequestHandler = async (req, res) => {
    // Get userId from the authenticated user
    const userId = req.user!.userId;

    // Parse the request params for the collection id and folder id
    const collectionId = objectIdSchema.parse(req.params.collectionId);
    const folderId = objectIdSchema.parse(req.params.folderId);

    // Parse the request body
    const body = renameFolderSchema.parse(req.body);

    // Update the folder name
    const result = await collectionsCollection.updateOne(
        { "_id": new ObjectId(collectionId), userId, "children._id": folderId },
        { $set: { "children.$.name": body.newName } }
    );
    if (result.matchedCount === 0) throw new HttpError("Collection or Folder not found", 404);

    res.status(200).json({
        status: "success",
        message: "Folder updated successfully"
    });
};

/** Delete a folder */
const deleteFolder: RequestHandler = async (req, res) => {
    // Get userId from the authenticated user
    const userId = req.user!.userId;

    // Parse the request params for the collection id and folder id
    const collectionId = objectIdSchema.parse(req.params.collectionId);
    const folderId = objectIdSchema.parse(req.params.folderId);

    // Find the collection
    const collection = await collectionsCollection.findOne({
        _id: new ObjectId(collectionId),
        userId
    });
    if (!collection) throw new HttpError("Collection not found", 404);

    // Find the folder
    const folder = collection.children.find(
        (child) => child.type === "folder" && child._id === folderId
    ) as FolderNode | undefined;
    if (!folder) throw new HttpError("Folder not found", 404);

    // Delete all the requests in the folder
    const requestIds = folder.children.map((request) => new ObjectId(request._id));
    if (requestIds.length > 0)
        await requestsCollection.deleteMany({ _id: { $in: requestIds }, userId });

    // Delete the folder
    await collectionsCollection.updateOne(
        { _id: new ObjectId(collectionId), userId },
        { $pull: { children: { _id: folderId, type: "folder" } } }
    );

    res.status(200).json({
        status: "success",
        message: "Folder deleted successfully",
        data: { requestIds: requestIds.map((objectId) => objectId.toHexString()) }
    });
};

export {
    getCollections,
    createCollection,
    renameCollection,
    deleteCollection,
    createFolder,
    renameFolder,
    deleteFolder
};
