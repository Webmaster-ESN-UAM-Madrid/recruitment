import { NextResponse } from 'next/server';
import { deleteUser } from '@/lib/controllers/userController';
import { checkAdminAccess } from "@/lib/utils/authUtils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !checkAdminAccess(session.user?.email)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const result = await deleteUser(id);
    if (!result.deleted) {
      return NextResponse.json({ message: result.message || 'Not Found' }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('Failed to delete user', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
