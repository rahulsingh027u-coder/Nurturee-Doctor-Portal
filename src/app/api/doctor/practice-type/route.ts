import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { userId, doctorId, practiceType } = await req.json();

    if (!userId || !practiceType) {
      return NextResponse.json(
        { error: 'userId and practiceType are required' },
        { status: 400 }
      );
    }

    const validTypes = ['doctor', 'clinic', 'hospital'];
    if (!validTypes.includes(practiceType)) {
      return NextResponse.json(
        { error: 'Invalid practice type. Must be: doctor, clinic, or hospital' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { practiceType },
    });

    if (doctorId) {
      await prisma.doctorProfile.update({
        where: { id: doctorId },
        data: { practiceType },
      });
    }

    return NextResponse.json({ success: true, practiceType });
  } catch (error: any) {
    console.error('Error saving practice type:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
