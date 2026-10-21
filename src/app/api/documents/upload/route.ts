// src/app/api/documents/upload/route.ts
import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/store/repository';
import { UniversalPdfEngine } from '@/lib/pdf/engine';
import { DocumentRecord } from '@/types/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      organisation_id = 'org-mortgage-prime', 
      matter_id, 
      client_id, 
      file_name, 
      file_base64, 
      document_category = 'supporting_document' 
    } = body;

    if (!file_name || !file_base64) {
      return NextResponse.json({ error: 'File name and PDF base64 content are required.' }, { status: 400 });
    }

    const cleanBase64 = file_base64.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const uint8Array = new Uint8Array(buffer);

    // 1. Universal Security & Format Validation
    const validation = UniversalPdfEngine.validatePdf(uint8Array);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 422 });
    }

    // 2. Deep PDF Inspection (Page count, Encryption, Forms)
    const inspection = await UniversalPdfEngine.inspectPdf(uint8Array);

    if (inspection.isEncrypted) {
      return NextResponse.json({
        error: 'The uploaded PDF is password-protected or encrypted. Please provide an unencrypted copy for processing.'
      }, { status: 422 });
    }

    const repo = getRepository();
    const docId = `doc-${Date.now()}`;
    const storagePath = `${organisation_id}/${matter_id || 'general'}/${file_name}`;

    const docRecord: DocumentRecord = {
      id: docId,
      organisation_id,
      matter_id: matter_id || null,
      client_id: client_id || null,
      file_name,
      file_size_bytes: uint8Array.length,
      mime_type: 'application/pdf',
      storage_path: storagePath,
      document_category,
      page_count: inspection.pageCount,
      is_encrypted: false,
      extraction_status: 'uploaded',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    repo.saveDocument(docRecord);

    repo.recordAuditEvent({
      id: `audit-${Date.now()}`,
      organisation_id,
      action: 'document.uploaded',
      resource_type: 'document',
      resource_id: docId,
      details: { file_name, size: uint8Array.length, pages: inspection.pageCount },
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      document: docRecord,
      inspection
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
