/** Imported modules */
import { ObjectId } from "mongodb";
import { string } from "zod";

/** ObjectId schema */
const objectIdSchema = string().refine((value) => ObjectId.isValid(value), {
    message: "Invalid ObjectId"
});

export { objectIdSchema };
