import { NextResponse } from 'next/server';
import { deleteUser } from '@/lib/controllers/userController';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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
