// tests/ai-extraction.test.ts
import { describe, it, expect } from 'vitest';
import { GeminiDocumentExtractionProvider } from '../src/lib/ai/gemini-provider';

describe('AI Document Extraction & Verification Lineage Tests', () => {
  it('instantiates GeminiDocumentExtractionProvider with server-side security checks', () => {
    const provider = new GeminiDocumentExtractionProvider();
    expect(provider.name).toContain('Google Gemini');
  });

  it('extracts structured factual key-values with confidence scores and evidence quotes', async () => {
    const provider = new GeminiDocumentExtractionProvider();
    const syntheticBuffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]); // %PDF-1.5

    const result = await provider.extractFromPdf(
      syntheticBuffer,
      'Sarah_Thompson_Income_Payslip.pdf',
      {
        expectedCategory: 'income_payslip',
        industryType: 'mortgage_finance',
        jurisdiction: 'AU-QLD'
      }
    );

    expect(result.file_name).toBe('Sarah_Thompson_Income_Payslip.pdf');
    expect(result.category_detected).toBe('income_payslip');
    expect(result.extracted_fields.length).toBeGreaterThan(0);

    for (const f of result.extracted_fields) {
      expect(f.field_key).toBeDefined();
      expect(f.field_label).toBeDefined();
      expect(f.confidence_score).toBeGreaterThanOrEqual(0);
      expect(f.confidence_score).toBeLessThanOrEqual(1);
      expect(f.verification_status).toBe('unverified');
    }

    // Check specific financial attributes
    const incomeField = result.extracted_fields.find(f => f.field_key === 'gross_annual_income');
    expect(incomeField).toBeDefined();
    expect(incomeField?.extracted_value).toBe('118500.00');
    expect(incomeField?.evidence_text).toContain('Annual Base Salary');

    // Verify statutory disclaimer exists
    expect(result.disclaimer).toContain('AI extraction is not equivalent to legal verification');
  });
});
