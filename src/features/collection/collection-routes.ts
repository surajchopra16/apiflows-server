/** Imported modules */
import { Router } from "express";

import {
    getCollection,
    createCollection,
    updateCollection,
    deleteCollection
} from "./collection-controller.js";

/**
 * Router for collection endpoints
 */

const collectionRouter = Router();

collectionRouter.get("/:id", getCollection);
collectionRouter.post("/", createCollection);
collectionRouter.patch("/:id", updateCollection);
collectionRouter.delete("/:id", deleteCollection);

export { collectionRouter };
