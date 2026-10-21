// src/app/api/documents/scan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { UniversalPdfEngine } from '@/lib/pdf/engine';
import { DocumentMatcher, ScanDocumentInput } from '@/lib/document-matcher';
import { AnalyzedFormStructure, FormFieldValueState } from '@/types/form-filler';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const structureRaw = formData.get('formStructure') as string | null;
    const existingValuesRaw = formData.get('existingValues') as string | null;
    const loadSampleDocs = formData.get('loadSampleDocs') === 'true';

    if (!structureRaw) {
      return NextResponse.json({ error: 'Missing target form structure.' }, { status: 400 });
    }

    const formStructure: AnalyzedFormStructure = JSON.parse(structureRaw);
    const existingValues: Record<string, FormFieldValueState> = existingValuesRaw 
      ? JSON.parse(existingValuesRaw) 
      : {};

    const documentsToScan: ScanDocumentInput[] = [];

    if (loadSampleDocs) {
      // Load sample supporting docs
      const sample1 = await UniversalPdfEngine.createSampleSupportingDoc('driver_licence_sarah');
      const sample2 = await UniversalPdfEngine.createSampleSupportingDoc('payslip_sarah');
      const sample3 = await UniversalPdfEngine.createSampleSupportingDoc('bank_statement');

      documentsToScan.push(
        { fileName: sample1.fileName, buffer: sample1.buffer, assignedPersonRoleId: 'auto' },
        { fileName: sample2.fileName, buffer: sample2.buffer, assignedPersonRoleId: 'auto' },
        { fileName: sample3.fileName, buffer: sample3.buffer, assignedPersonRoleId: 'both' }
      );

      // If form has second person, also add second applicant sample docs
      if (formStructure.peopleRoles.length > 1) {
        const sample4 = await UniversalPdfEngine.createSampleSupportingDoc('driver_licence_david');
        const sample5 = await UniversalPdfEngine.createSampleSupportingDoc('payslip_david');
        documentsToScan.push(
          { fileName: sample4.fileName, buffer: sample4.buffer, assignedPersonRoleId: formStructure.peopleRoles[1].id },
          { fileName: sample5.fileName, buffer: sample5.buffer, assignedPersonRoleId: formStructure.peopleRoles[1].id }
        );
      }
    } else {
      // Process uploaded files
      const fileKeys = Array.from(formData.keys()).filter(k => k.startsWith('doc_'));
      for (const key of fileKeys) {
        const file = formData.get(key) as File;
        if (file && file.size > 0) {
          const arrayBuf = await file.arrayBuffer();
          const roleHint = formData.get(`${key}_role`) as string || 'auto';
          documentsToScan.push({
            fileName: file.name,
            buffer: new Uint8Array(arrayBuf),
            assignedPersonRoleId: roleHint
          });
        }
      }
    }

    if (documentsToScan.length === 0) {
      return NextResponse.json({ error: 'No documents provided for scanning.' }, { status: 400 });
    }

    const result = await DocumentMatcher.scanAndMatchDocuments(
      documentsToScan,
      formStructure,
      existingValues
    );

    return NextResponse.json({
      success: true,
      fieldValues: result.fieldValues,
      docSummaries: result.docSummaries
    });
  } catch (error: any) {
    console.error('Document scan API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to scan documents.' }, { status: 500 });
  }
}
