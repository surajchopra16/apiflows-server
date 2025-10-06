/** Imported modules */
import { MongoClient } from "mongodb";

/**
 * Database connection string (URL)
 */

const url = process.env.DB_CONNECTION_STRING.replace("<db_password>", process.env.DB_PASSWORD);

/**
 * MongoDB client
 */

const client = new MongoClient(url);

client.on("connectionReady", () => console.log("MongoDB connected"));
client.on("connectionClosed", () => console.log("MongoDB disconnected"));

/**
 * Database and collections
 */

const db = client.db("apiflow");

const collectionsCollection = db.collection("collections");
const requestsCollection = db.collection("requests");

export { collectionsCollection, requestsCollection };
