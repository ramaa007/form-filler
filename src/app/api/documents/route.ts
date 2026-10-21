// src/app/api/documents/route.ts
import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/store/repository';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId') || 'org-mortgage-prime';
  const matterId = searchParams.get('matterId') || undefined;
  const repo = getRepository();

  const documents = repo.getDocuments(orgId, matterId);
  const extractedFields = repo.getExtractedFields(orgId);

  return NextResponse.json({
    documents,
    extractedFields
  });
}
