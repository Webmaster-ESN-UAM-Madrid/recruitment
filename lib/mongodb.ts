import { MongoClient } from "mongodb";
import mongoose from "mongoose";
import { config } from "./config";
import Config from "./models/config"; // Import the Config model

declare global {
    var _mongoClientPromise: Promise<MongoClient>;
    var _mongooseConnection: typeof mongoose;
}

const uri = config.mongoURI;

async function connectToDatabase() {
    if (global._mongooseConnection) {
        return global._mongooseConnection;
    }

    if (!global._mongoClientPromise) {
        const client = new MongoClient(uri, {});
        global._mongoClientPromise = client.connect();
    }

    try {
        await global._mongoClientPromise;
        console.log("MongoDB client connected.");

        // Use the connected client for Mongoose
        const mongooseInstance = await mongoose.connect(uri, { bufferCommands: true });
        global._mongooseConnection = mongooseInstance;

        // Check for and create globalConfig if it doesn't exist
        const globalConfig = await Config.findById("globalConfig");
        if (!globalConfig) {
            await Config.create({
                _id: "globalConfig",
                currentRecruitment: "placeholder",
                recruitmentPhase: "placeholder1",
                recruiters: []
            });
        }

        return mongooseInstance;
    } catch (error) {
        console.error("MongoDB connection error:", error);
        throw new Error("Failed to connect to MongoDB");
    }
}

mongoose.connection.on("disconnected", () => {
    console.log("Mongoose disconnected from DB.");
});

export default connectToDatabase;
