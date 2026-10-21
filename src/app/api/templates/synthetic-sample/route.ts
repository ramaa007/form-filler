// src/app/api/templates/synthetic-sample/route.ts
import { NextResponse } from 'next/server';
import { UniversalPdfEngine } from '@/lib/pdf/engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Universal Mortgage & Conveyancing Schedule';
    const industry = searchParams.get('industry') || 'mortgage_finance';
    const jurisdiction = searchParams.get('jurisdiction') || 'AU-QLD';

    const pdfBytes = await UniversalPdfEngine.createSyntheticBlankForm(title, industry, jurisdiction);
    const inspection = await UniversalPdfEngine.inspectPdf(pdfBytes);
    const base64 = Buffer.from(pdfBytes).toString('base64');

    return NextResponse.json({
      success: true,
      file_name: `${title.replace(/[^a-zA-Z0-9]+/g, '_')}.pdf`,
      file_size_bytes: pdfBytes.length,
      base64,
      inspection
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
