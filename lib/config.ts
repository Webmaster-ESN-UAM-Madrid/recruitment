import dotenv from "dotenv";

dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || "3000"),
    mongoURI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/esn_recruitment",
    google: {
        clientID: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
    },
    sessionSecret: process.env.SESSION_SECRET || "default_key",
    baseURL: process.env.NEXT_PUBLIC_BASE_URL || "https://recruitment.esn.tablerus.es"
};
