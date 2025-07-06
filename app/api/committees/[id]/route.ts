import { NextRequest, NextResponse } from "next/server";
import { updateCommittee, deleteCommittee } from "@/lib/controllers/committeeController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAdminAccess } from "@/lib/utils/authUtils";

export async function PUT(req: NextRequest, context: any) {
    const session = await getServerSession(authOptions);
    if (!session || !checkAdminAccess(session.user?.email)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    try {
        const { id } = context.params;
        if (!id) {
            return NextResponse.json({ message: "Committee ID is required" }, { status: 400 });
        }
        const body = await req.json();
        const updatedCommittee = await updateCommittee(id, body);
        if (!updatedCommittee) {
            return NextResponse.json({ message: "Committee not found" }, { status: 404 });
        }
        return NextResponse.json({ message: "Committee updated successfully", committee: updatedCommittee }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error updating committee", error }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, context: any) {
    const session = await getServerSession(authOptions);
    if (!session || !checkAdminAccess(session.user?.email)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    try {
        const { id } = context.params;
        if (!id) {
            return NextResponse.json({ message: "Committee ID is required" }, { status: 400 });
        }
        const deleted = await deleteCommittee(id);
        if (!deleted) {
            return NextResponse.json({ message: "Committee not found" }, { status: 404 });
        }
        return NextResponse.json({ message: "Committee deleted successfully" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error deleting committee", error }, { status: 500 });
    }
}
