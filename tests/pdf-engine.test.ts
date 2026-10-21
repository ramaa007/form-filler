// tests/pdf-engine.test.ts
// Universal PDF Automation Engine Unit & Integration Tests

import { describe, it, expect } from 'vitest';
import { UniversalPdfEngine } from '../src/lib/pdf/engine';
import { AnalyzedFormStructure, FormFieldValueState } from '../src/types/form-filler';

describe('UniversalPdfEngine Unit & Integration Tests', () => {
  it('validates genuine PDF headers and rejects non-PDF payloads', () => {
    // Non-PDF fake file
    const invalidBuffer = new TextEncoder().encode('<html><body>Fake PDF payload</body></html>');
    const result = UniversalPdfEngine.validatePdf(invalidBuffer);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Security validation failed');

    // Valid header buffer
    const validHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]); // %PDF-1.7
    const validResult = UniversalPdfEngine.validatePdf(validHeader);
    expect(validResult.valid).toBe(true);
  });

  it('generates sample forms and inspects detected AcroForms and dimensions', async () => {
    const sample = await UniversalPdfEngine.createSampleForm('joint_mortgage');
    expect(sample.buffer.length).toBeGreaterThan(1000);

    const inspection = await UniversalPdfEngine.inspectPdf(sample.buffer);
    expect(inspection.isEncrypted).toBe(false);
    expect(inspection.pageCount).toBe(1);
    expect(inspection.pageDimensions.length).toBe(1);
    expect(inspection.pageDimensions[0].width).toBeCloseTo(595.28, 1);
    expect(inspection.pageDimensions[0].height).toBeCloseTo(841.89, 1);

    // Verify detected AcroForm fields
    const fieldNames = inspection.detectedFields.map(f => f.name);
    expect(fieldNames).toContain('borrower_1_full_name');
    expect(fieldNames).toContain('borrower_2_full_name');
    expect(fieldNames).toContain('shared_property_address');
    expect(fieldNames).toContain('shared_loan_amount');
  });

  it('formats field values according to locale and type rules', () => {
    expect(UniversalPdfEngine.formatValue('sarah thompson', 'uppercase')).toBe('SARAH THOMPSON');
    expect(UniversalPdfEngine.formatValue('750000', 'currency_aud')).toBe('$750,000.00');
    expect(UniversalPdfEngine.formatValue('1988-06-14', 'date_slash_au')).toBe('14/06/1988');
    expect(UniversalPdfEngine.formatValue('0423987654', 'phone_au')).toBe('0423 987 654');
  });

  it('fills interactive AcroForm fields in PDF document', async () => {
    const sample = await UniversalPdfEngine.createSampleForm('joint_mortgage');
    const dummyStructure: AnalyzedFormStructure = {
      formName: 'Joint Home Loan Application',
      formType: 'mortgage_finance',
      isInteractiveAcroForm: true,
      pageCount: 1,
      peopleRoles: [
        { id: 'borrower_1', label: 'Borrower 1' },
        { id: 'borrower_2', label: 'Borrower 2' }
      ],
      sharedFields: [
        { id: 'shared_property_address', label: 'Property Address', targetAcroFieldName: 'shared_property_address', type: 'text', isRequired: true }
      ],
      personFields: {
        borrower_1: [
          { id: 'borrower_1_full_name', label: 'Full Name', targetAcroFieldName: 'borrower_1_full_name', type: 'text', isRequired: true, formatRule: 'uppercase' }
        ],
        borrower_2: [
          { id: 'borrower_2_full_name', label: 'Full Name', targetAcroFieldName: 'borrower_2_full_name', type: 'text', isRequired: true, formatRule: 'uppercase' }
        ]
      },
      signatureFields: []
    };

    const values: Record<string, FormFieldValueState> = {
      borrower_1_full_name: { fieldId: 'borrower_1_full_name', currentValue: 'Sarah Jane Thompson', status: 'confirmed' },
      borrower_2_full_name: { fieldId: 'borrower_2_full_name', currentValue: 'David Robert Miller', status: 'confirmed' },
      shared_property_address: { fieldId: 'shared_property_address', currentValue: '74 Coastal Highway', status: 'confirmed' }
    };

    const filledPdf = await UniversalPdfEngine.fillCompletedForm(sample.buffer, dummyStructure, values);
    expect(filledPdf.length).toBeGreaterThan(sample.buffer.length);

    const inspection = await UniversalPdfEngine.inspectPdf(filledPdf);
    const p1 = inspection.detectedFields.find(f => f.name === 'borrower_1_full_name');
    expect(p1?.value).toBe('SARAH JANE THOMPSON');
    const p2 = inspection.detectedFields.find(f => f.name === 'borrower_2_full_name');
    expect(p2?.value).toBe('DAVID ROBERT MILLER');
  });

  it('creates supporting document packs for testing', async () => {
    const docSarah = await UniversalPdfEngine.createSampleSupportingDoc('driver_licence_sarah');
    expect(docSarah.fileName).toBe('Sarah_Thompson_Drivers_Licence.pdf');
    expect(docSarah.buffer.length).toBeGreaterThan(500);

    const docBank = await UniversalPdfEngine.createSampleSupportingDoc('bank_statement');
    expect(docBank.fileName).toBe('Bank_Statement_Deposit_Schedule.pdf');
    expect(docBank.buffer.length).toBeGreaterThan(500);
  });
});
