/** Imported modules */
import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.js";

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

collectionRouter.get("/", authMiddleware, getCollections);
collectionRouter.post("/", authMiddleware, createCollection);
collectionRouter.patch("/:collectionId", authMiddleware, renameCollection);
collectionRouter.delete("/:collectionId", authMiddleware, deleteCollection);

collectionRouter.post("/:collectionId/folders", authMiddleware, createFolder);
collectionRouter.patch("/:collectionId/folders/:folderId", authMiddleware, renameFolder);
collectionRouter.delete("/:collectionId/folders/:folderId", authMiddleware, deleteFolder);

export { collectionRouter };
