import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  return NextResponse.json(session);
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Use the sign-in form' }, { status: 400 });
}