import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import FormConnection from "@/lib/models/formConnection";
import Form from "@/lib/models/form";
import Config from "@/lib/models/config";

export async function POST(request: Request) {
    await dbConnect();

    try {
        console.log("Validate endpoint received request.");
        const { key, code, formIdentifier, canCreateUsers } = await request.json();
        console.log("Received key:", key, "code:", code, "formIdentifier:", formIdentifier, "canCreateUsers:", canCreateUsers);

        const connection = await FormConnection.findOne({ key });
        console.log("Found connection:", connection);

        if (!connection || connection.expiresAt < new Date()) {
            console.log("Invalid or expired key.");
            return NextResponse.json({ message: "Invalid or expired key" }, { status: 404 });
        }

        if (connection.validationCode !== code) {
            console.log("Invalid code. Expected:", connection.validationCode, "Received:", code);
            return NextResponse.json({ message: "Invalid code" }, { status: 400 });
        }

        const globalConfig = await Config.findById("globalConfig");
        if (!globalConfig || !globalConfig.currentRecruitment) {
            console.log("Global config or current recruitment not found.");
            return NextResponse.json({ message: "Recruitment process not configured" }, { status: 500 });
        }
        const recruitmentProcessId = globalConfig.currentRecruitment;
        console.log("Recruitment Process ID:", recruitmentProcessId);

        let form;
        if (formIdentifier) {
            console.log("Attempting to find and update existing form with identifier:", formIdentifier);
            form = await Form.findOneAndUpdate(
                { formIdentifier },
                {
                    provider: connection.provider,
                    structure: connection.formData,
                    appsScriptId: connection.appsScriptId,
                    canCreateUsers: canCreateUsers,
                    recruitmentProcessId: recruitmentProcessId
                },
                { new: true, upsert: true } // Create if not found
            );
            console.log("Form updated/upserted:", form);
        } else {
            console.log("Creating new form.");
            form = await Form.create({
                provider: connection.provider,
                structure: connection.formData,
                appsScriptId: connection.appsScriptId,
                canCreateUsers: canCreateUsers,
                recruitmentProcessId: recruitmentProcessId,
                formIdentifier: formIdentifier || undefined // Store if provided, otherwise undefined
            });
            console.log("New form created:", form);
        }

        await FormConnection.deleteOne({ key });
        console.log("FormConnection deleted for key:", key);

        return NextResponse.json({ message: "Validation successful", formId: form._id });
    } catch (error) {
        console.error("Error validating form:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
