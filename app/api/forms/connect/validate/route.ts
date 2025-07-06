import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import FormConnection from "@/lib/models/formConnection";
import Form from "@/lib/models/form";
import Config from "@/lib/models/config";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAdminAccess } from "@/lib/utils/authUtils";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !checkAdminAccess(session.user?.email)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    await dbConnect();

    try {
        const { key, code, formIdentifier, canCreateUsers } = await request.json();

        const connection = await FormConnection.findOne({ key });

        if (!connection || connection.expiresAt < new Date()) {
            return NextResponse.json({ message: "Invalid or expired key" }, { status: 404 });
        }

        if (connection.validationCode !== code) {
            return NextResponse.json({ message: "Invalid code" }, { status: 400 });
        }

        const globalConfig = await Config.findById("globalConfig");
        if (!globalConfig || !globalConfig.currentRecruitment) {
            return NextResponse.json({ message: "Recruitment process not configured" }, { status: 500 });
        }
        const recruitmentProcessId = globalConfig.currentRecruitment;

        let form;
        if (formIdentifier) {
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
        } else {
            form = await Form.create({
                provider: connection.provider,
                structure: connection.formData,
                appsScriptId: connection.appsScriptId,
                canCreateUsers: canCreateUsers,
                recruitmentProcessId: recruitmentProcessId,
                formIdentifier: formIdentifier || undefined // Store if provided, otherwise undefined
            });
        }

        await FormConnection.deleteOne({ key });

        return NextResponse.json({ message: "Validation successful", formId: form._id });
    } catch (error) {
        console.error("Error validating form:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
