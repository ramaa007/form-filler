// src/app/api/documents/extract/route.ts
import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/store/repository';
import { GeminiDocumentExtractionProvider } from '@/lib/ai/gemini-provider';
import { ExtractedField } from '@/types/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { document_id, organisation_id = 'org-mortgage-prime', pdf_base64 } = body;

    if (!document_id) {
      return NextResponse.json({ error: 'document_id is required.' }, { status: 400 });
    }

    const repo = getRepository();
    const doc = repo.getDocument(organisation_id, document_id);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    // Set status to processing
    doc.extraction_status = 'processing';
    repo.saveDocument(doc);

    // Prepare buffer
    let pdfBuffer: Uint8Array;
    if (pdf_base64) {
      pdfBuffer = new Uint8Array(Buffer.from(pdf_base64.replace(/^data:application\/pdf;base64,/, ''), 'base64'));
    } else {
      // Create minimal synthetic buffer if physical file is not in mock store
      pdfBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]);
    }

    // Call Gemini AI Provider
    const provider = new GeminiDocumentExtractionProvider();
    const extractionResult = await provider.extractFromPdf(pdfBuffer, doc.file_name, {
      expectedCategory: doc.document_category
    });

    // Save extracted fields into repository with trace evidence
    const savedFields: ExtractedField[] = [];
    for (const item of extractionResult.extracted_fields) {
      const fieldId = `field-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const fieldRecord: ExtractedField = {
        id: fieldId,
        organisation_id,
        document_id: doc.id,
        field_key: item.field_key,
        field_label: item.field_label,
        extracted_value: item.extracted_value,
        normalized_value: item.normalized_value,
        source_page: item.source_page || 1,
        evidence_text: item.evidence_text || null,
        confidence_score: item.confidence_score,
        verification_status: 'unverified',
        conflict_details: item.conflict_details || null,
        created_at: new Date().toISOString()
      };
      repo.saveExtractedField(fieldRecord);
      savedFields.push(fieldRecord);
    }

    // Update document status
    doc.extraction_status = 'awaiting_review';
    repo.saveDocument(doc);

    repo.recordAuditEvent({
      id: `audit-${Date.now()}`,
      organisation_id,
      action: 'ai.extraction_completed',
      resource_type: 'document',
      resource_id: doc.id,
      details: {
        fields_extracted: savedFields.length,
        model: extractionResult.model_used,
        duration_ms: extractionResult.processing_duration_ms
      },
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      document: doc,
      extracted_fields: savedFields,
      summary: extractionResult.raw_analysis_summary,
      disclaimer: extractionResult.disclaimer
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
