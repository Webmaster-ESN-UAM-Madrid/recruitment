import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkAdminAccess } from "@/lib/utils/authUtils";
import { addRecruiter, removeRecruiter } from "@/lib/controllers/adminController";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !checkAdminAccess(session.user?.email)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    const { email } = await request.json();
    const result = await addRecruiter(email);
    return NextResponse.json({ message: result.message }, { status: result.status });
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !checkAdminAccess(session.user?.email)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    const { email } = await request.json();
    const result = await removeRecruiter(email);
    return NextResponse.json({ message: result.message }, { status: result.status });
}