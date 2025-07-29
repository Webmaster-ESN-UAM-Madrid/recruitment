import { updateCandidate } from '@/lib/controllers/candidateController';
import { getCurrentRecruitmentDetails } from '@/lib/controllers/adminController';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, context: any) {
    const { params } = context;
    const { id } = params;

    try {
        const body = await req.json();
        const { phase } = body;

        let recruitmentPhase = phase;
        if (!recruitmentPhase) {
            const recruitmentDetails = await getCurrentRecruitmentDetails();
            if (!recruitmentDetails.recruitmentPhase) {
                return new NextResponse(JSON.stringify({ message: 'Could not determine current recruitment phase' }), { status: 500 });
            }
            recruitmentPhase = recruitmentDetails.recruitmentPhase;
        }

        const updatedCandidate = await updateCandidate(id, { recruitmentPhase, emailSent: false });

        if (!updatedCandidate) {
            return new NextResponse(JSON.stringify({ message: 'Candidate not found' }), { status: 404 });
        }

        return new NextResponse(JSON.stringify(updatedCandidate), { status: 200 });
    } catch (error) {
        console.error(`Error updating candidate phase: ${error}`);
        return new NextResponse(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
    }
}
