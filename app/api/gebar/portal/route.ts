import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Use /api/billing/portal for hosted billing portal sessions.' },
    { status: 410 }
  );
}
