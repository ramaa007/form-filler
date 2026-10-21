// src/app/api/audit/route.ts
import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/store/repository';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId') || 'org-mortgage-prime';
  const repo = getRepository();

  const events = repo.getAuditEvents(orgId);
  return NextResponse.json({ events });
}
