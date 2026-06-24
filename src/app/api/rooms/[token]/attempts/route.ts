import { NextRequest, NextResponse } from 'next/server';
import { jsonError, submitAttempt } from '@/lib/server/api';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const submitted = await submitAttempt(token, await request.json());
    return NextResponse.json(submitted, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to submit attempt';
    return jsonError(message, message === 'Room not found' ? 404 : 400);
  }
}
