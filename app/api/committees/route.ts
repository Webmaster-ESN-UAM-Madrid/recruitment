import { NextRequest, NextResponse } from "next/server";
import { getCommittees, createCommittee, updateCommittee, deleteCommittee } from "@/lib/controllers/committeeController";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAdminAccess, checkRecruiterAccess } from "@/lib/utils/authUtils";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !checkRecruiterAccess(session.user?.email)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    try {
        const committees = await getCommittees();
        return NextResponse.json(committees, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching committees", error }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !checkAdminAccess(session.user?.email)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    try {
        const body = await req.json();
        const newCommittee = await createCommittee(body);
        return NextResponse.json({ message: "Committee created successfully", committee: newCommittee }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "Error creating committee", error }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !checkAdminAccess(session.user?.email)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
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

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !checkAdminAccess(session.user?.email)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
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
