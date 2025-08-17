// This file needs manual conversion to singleton pattern
// Original file: src\app\api\admin\tasks\create-github-branch\route.ts
// Please use getMainDbPool() instead of prisma

import { NextResponse } from 'next/server';
import { getMainDbPool } from '@/lib/db-pool';

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    error: 'Endpoint needs manual conversion to singleton pattern'
  }, { status: 501 });
}

export async function POST() {
  return NextResponse.json({
    error: 'Endpoint needs manual conversion to singleton pattern'
  }, { status: 501 });
}

export async function PUT() {
  return NextResponse.json({
    error: 'Endpoint needs manual conversion to singleton pattern'
  }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({
    error: 'Endpoint needs manual conversion to singleton pattern'
  }, { status: 501 });
}
