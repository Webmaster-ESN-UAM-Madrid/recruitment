import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import FormConnection from "@/lib/models/formConnection";

export async function POST(request: Request) {
    await dbConnect();

    try {
        console.log("Register endpoint received request.");
        const { key, formData, code, appsScriptId, canCreateUsers, formIdentifier } = await request.json();
        console.log("Received payload:", { key, formData: "[omitted for brevity]", code, appsScriptId, canCreateUsers, formIdentifier });

        const connection = await FormConnection.findOne({ key });
        console.log("Found connection:", connection);

        if (!connection || connection.expiresAt < new Date()) {
            console.log("Invalid or expired key.");
            return NextResponse.json({ message: "Invalid or expired key" }, { status: 404 });
        }

        connection.formData = JSON.stringify(formData);
        connection.validationCode = code;
        connection.appsScriptId = appsScriptId;
        connection.canCreateUsers = canCreateUsers;
        connection.formIdentifier = formIdentifier;
        await connection.save();
        console.log("FormConnection saved:", connection);

        return NextResponse.json({ message: "Registration successful" });
    } catch (error) {
        console.error("Error registering form:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
