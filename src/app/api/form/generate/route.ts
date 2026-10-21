// src/app/api/form/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { UniversalPdfEngine } from '@/lib/pdf/engine';
import { AnalyzedFormStructure, FormFieldValueState } from '@/types/form-filler';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const originalPdfBase64 = formData.get('originalPdfBase64') as string | null;
    const originalPdfFile = formData.get('originalPdfFile') as File | null;
    const structureRaw = formData.get('formStructure') as string | null;
    const fieldValuesRaw = formData.get('fieldValues') as string | null;

    if (!structureRaw || !fieldValuesRaw) {
      return NextResponse.json({ error: 'Missing form structure or field values.' }, { status: 400 });
    }

    let originalBuffer: Uint8Array;
    if (originalPdfBase64) {
      originalBuffer = new Uint8Array(Buffer.from(originalPdfBase64, 'base64'));
    } else if (originalPdfFile) {
      originalBuffer = new Uint8Array(await originalPdfFile.arrayBuffer());
    } else {
      return NextResponse.json({ error: 'Original PDF file or base64 data required.' }, { status: 400 });
    }

    const formStructure: AnalyzedFormStructure = JSON.parse(structureRaw);
    const fieldValues: Record<string, FormFieldValueState> = JSON.parse(fieldValuesRaw);

    const completedPdfBytes = await UniversalPdfEngine.fillCompletedForm(
      originalBuffer,
      formStructure,
      fieldValues
    );

    // Validate that output is valid PDF
    const validation = UniversalPdfEngine.validatePdf(completedPdfBytes);
    if (!validation.valid) {
      return NextResponse.json({ error: 'Generated PDF failed integrity check.' }, { status: 500 });
    }

    const safeName = (formStructure.formName || 'Completed_Application').replace(/[^a-zA-Z0-9_-]/g, '_');

    return new Response(Buffer.from(completedPdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${safeName}_Completed.pdf"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate completed PDF.' }, { status: 500 });
  }
}
