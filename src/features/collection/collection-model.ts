/** Imported modules */
import { db } from "../../mongodb.js";
import { object, string } from "zod";

import { HttpMethod } from "../request/request-model.js";

/** Request node type */
type RequestNode = { _id: string; name: string; type: "request"; method: HttpMethod };

/** Folder node type */
type FolderNode = { _id: string; name: string; type: "folder"; children: RequestNode[] };

/** Collection node type */
type CollectionNode = {
    userId: string;
    name: string;
    type: "collection";
    children: (FolderNode | RequestNode)[];
};

/**
 * ==================== Schemas ====================>
 */

/** Create collection schema */
const createCollectionSchema = object({ name: string() });

/** Rename collection schema */
const renameCollectionSchema = object({ newName: string() });

/** Create folder schema */
const createFolderSchema = object({ name: string() });

/** Rename folder schema */
const renameFolderSchema = object({ newName: string() });

/**
 * ==================== Collection ====================>
 */

const collectionsCollection = db.collection<CollectionNode>("collections");

export {
    RequestNode,
    FolderNode,
    CollectionNode,
    createCollectionSchema,
    renameCollectionSchema,
    createFolderSchema,
    renameFolderSchema,
    collectionsCollection
};
