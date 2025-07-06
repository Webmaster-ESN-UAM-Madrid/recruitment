import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/controllers/userController';

export async function GET() {
    try {
        const users = await getUsers();
        return NextResponse.json(users);
    } catch (error) {
        console.error('Failed to fetch users', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}