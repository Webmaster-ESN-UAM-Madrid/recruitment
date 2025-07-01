import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const committeesFilePath = path.resolve(process.cwd(), 'lib', 'committees.json');

export async function GET() {
  try {
    const committeesData = fs.readFileSync(committeesFilePath, 'utf-8');
    const committees = JSON.parse(committeesData);
    return NextResponse.json(committees);
  } catch (error) {
    console.error('Failed to read committees:', error);
    return NextResponse.json({ error: 'Failed to fetch committees' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, color } = await req.json();
    const committeesData = fs.readFileSync(committeesFilePath, 'utf-8');
    const committees = JSON.parse(committeesData);

    const newCommittee = { id: Date.now().toString(), name, color }; // Simple ID generation
    committees.push(newCommittee);

    fs.writeFileSync(committeesFilePath, JSON.stringify(committees, null, 2), 'utf-8');
    return NextResponse.json(newCommittee, { status: 201 });
  } catch (error) {
    console.error('Failed to create committee:', error);
    return NextResponse.json({ error: 'Failed to create committee' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, name, color } = await req.json();
    const committeesData = fs.readFileSync(committeesFilePath, 'utf-8');
    const committees = JSON.parse(committeesData);

    const index = committees.findIndex((c: any) => c.id === id);
    if (index > -1) {
      committees[index] = { id, name, color };
      fs.writeFileSync(committeesFilePath, JSON.stringify(committees, null, 2), 'utf-8');
      return NextResponse.json(committees[index]);
    } else {
      return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Failed to update committee:', error);
    return NextResponse.json({ error: 'Failed to update committee' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const committeesData = fs.readFileSync(committeesFilePath, 'utf-8');
    const committees = JSON.parse(committeesData);

    const filteredCommittees = committees.filter((c: any) => c.id !== id);

    if (filteredCommittees.length < committees.length) {
      fs.writeFileSync(committeesFilePath, JSON.stringify(filteredCommittees, null, 2), 'utf-8');
      return NextResponse.json({ message: 'Committee deleted' });
    } else {
      return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Failed to delete committee:', error);
    return NextResponse.json({ error: 'Failed to delete committee' }, { status: 500 });
  }
}