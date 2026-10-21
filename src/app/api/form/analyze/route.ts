// src/app/api/form/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { UniversalPdfEngine } from '@/lib/pdf/engine';
import { FormAnalyzer } from '@/lib/form-analyzer';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('formFile') as File | null;
    const sampleType = formData.get('sampleType') as string | null;

    let buffer: Uint8Array;
    let fileName: string;

    if (sampleType) {
      const sample = await UniversalPdfEngine.createSampleForm(
        sampleType as 'single_rental' | 'joint_mortgage' | 'flat_conveyancing'
      );
      buffer = sample.buffer;
      fileName = sample.fileName;
    } else if (file) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = new Uint8Array(arrayBuffer);
      fileName = file.name;
    } else {
      return NextResponse.json({ error: 'No form PDF file or sampleType provided.' }, { status: 400 });
    }

    // Validate PDF format
    const validation = UniversalPdfEngine.validatePdf(buffer);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || 'Invalid PDF file.' }, { status: 400 });
    }

    // Analyze form structure
    const structure = await FormAnalyzer.analyzeBlankForm(buffer, fileName);
    const base64Pdf = Buffer.from(buffer).toString('base64');

    return NextResponse.json({
      success: true,
      fileName,
      structure,
      fileBase64: base64Pdf
    });
  } catch (error: any) {
    console.error('Form analysis API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to analyze blank PDF form.' }, { status: 500 });
  }
}
