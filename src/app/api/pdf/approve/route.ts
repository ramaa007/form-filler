// src/app/api/pdf/approve/route.ts
import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/store/repository';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      document_id, 
      organisation_id = 'org-mortgage-prime', 
      action, // 'approve' | 'reject'
      notes, 
      approver_name = 'Alex Sterling' 
    } = body;

    if (!document_id || !action) {
      return NextResponse.json({ error: 'document_id and action are required.' }, { status: 400 });
    }

    const repo = getRepository();
    const generatedDocs = repo.getGeneratedDocuments(organisation_id);
    const target = generatedDocs.find(g => g.id === document_id);

    if (!target) {
      return NextResponse.json({ error: 'Generated document not found.' }, { status: 404 });
    }

    target.approval_status = action === 'approve' ? 'approved' : 'rejected';
    target.approved_by = approver_name;
    target.approved_at = new Date().toISOString();
    target.approval_notes = notes || null;

    repo.saveGeneratedDocument(target);

    repo.recordAuditEvent({
      id: `audit-${Date.now()}`,
      organisation_id,
      action: action === 'approve' ? 'document.approved' : 'document.rejected',
      resource_type: 'generated_document',
      resource_id: target.id,
      details: {
        approval_status: target.approval_status,
        approver: approver_name,
        notes
      },
      created_at: new Date().toISOString()
    });

    return NextResponse.json({ success: true, document: target });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
