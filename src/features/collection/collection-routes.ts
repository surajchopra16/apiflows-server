/** Imported modules */
import { Router } from "express";

import {
    getCollections,
    createCollection,
    renameCollection,
    deleteCollection,
    createFolder,
    renameFolder,
    deleteFolder
} from "./collection-controller.js";

/**
 * Router for collection endpoints
 */

const collectionRouter = Router();

collectionRouter.get("/", getCollections);
collectionRouter.post("/", createCollection);
collectionRouter.patch("/:collectionId", renameCollection);
collectionRouter.delete("/:collectionId", deleteCollection);

collectionRouter.post("/:collectionId/folders", createFolder);
collectionRouter.patch("/:collectionId/folders/:folderId", renameFolder);
collectionRouter.delete("/:collectionId/folders/:folderId", deleteFolder);

export { collectionRouter };
