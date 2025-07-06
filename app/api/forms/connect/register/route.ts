import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import FormConnection from "@/lib/models/formConnection";

export async function POST(request: Request) {
    await dbConnect();

    try {
        const { key, formData, code, appsScriptId, canCreateUsers, formIdentifier } = await request.json();

        const connection = await FormConnection.findOne({ key });

        if (!connection || connection.expiresAt < new Date()) {
            return NextResponse.json({ message: "Invalid or expired key" }, { status: 404 });
        }

        connection.formData = JSON.stringify(formData);
        connection.validationCode = code;
        connection.appsScriptId = appsScriptId;
        connection.canCreateUsers = canCreateUsers;
        connection.formIdentifier = formIdentifier;
        await connection.save();

        return NextResponse.json({ message: "Registration successful" });
    } catch (error) {
        console.error("Error registering form:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
