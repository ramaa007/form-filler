// tests/pdf-engine.test.ts
import { describe, it, expect } from 'vitest';
import { UniversalPdfEngine } from '../src/lib/pdf/engine';

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

  it('generates a synthetic blank PDF form with real AcroForms and inspects fields', async () => {
    const blankBytes = await UniversalPdfEngine.createSyntheticBlankForm(
      'Queensland Conveyancing Particulars Form',
      'solicitor_conveyancing',
      'AU-QLD'
    );

    expect(blankBytes.length).toBeGreaterThan(1000);

    const inspection = await UniversalPdfEngine.inspectPdf(blankBytes);
    expect(inspection.isEncrypted).toBe(false);
    expect(inspection.pageCount).toBe(1);
    expect(inspection.pageDimensions.length).toBe(1);
    expect(inspection.pageDimensions[0].width).toBeCloseTo(595.28, 1);
    expect(inspection.pageDimensions[0].height).toBeCloseTo(841.89, 1);

    // Verify detected AcroForm fields
    const fieldNames = inspection.detectedFields.map(f => f.name);
    expect(fieldNames).toContain('client_full_name');
    expect(fieldNames).toContain('client_dob');
    expect(fieldNames).toContain('matter_property_address');
    expect(fieldNames).toContain('matter_amount');
    expect(fieldNames).toContain('compliance_id_verified');
  });

  it('fills AcroForms with formatting rules (AUD currency, AU date slash, uppercase)', async () => {
    const blankBytes = await UniversalPdfEngine.createSyntheticBlankForm(
      'Mortgage Application Schedule',
      'mortgage_finance',
      'AU-QLD'
    );

    const fieldValues = {
      client_full_name: 'sarah jane thompson',
      client_dob: '1988-06-14',
      matter_amount: '750000',
      client_income: '118500',
      compliance_id_verified: true
    };

    const formattingRules = {
      client_full_name: 'uppercase',
      client_dob: 'date_au_slash',
      matter_amount: 'currency_aud',
      client_income: 'currency_aud'
    };

    const filledBytes = await UniversalPdfEngine.fillAcroForm(
      blankBytes,
      fieldValues,
      formattingRules,
      false
    );

    expect(filledBytes.length).toBeGreaterThan(1000);

    // Inspect filled form values
    const inspection = await UniversalPdfEngine.inspectPdf(filledBytes);
    const nameField = inspection.detectedFields.find(f => f.name === 'client_full_name');
    expect(nameField?.value).toBe('SARAH JANE THOMPSON');

    const dobField = inspection.detectedFields.find(f => f.name === 'client_dob');
    expect(dobField?.value).toBe('14/06/1988');

    const amountField = inspection.detectedFields.find(f => f.name === 'matter_amount');
    expect(amountField?.value).toContain('$750,000.00');

    const checkField = inspection.detectedFields.find(f => f.name === 'compliance_id_verified');
    expect(checkField?.value).toBe(true);
  });

  it('overlays text on flat PDF coordinates without AcroForms', async () => {
    const blankBytes = await UniversalPdfEngine.createSyntheticBlankForm(
      'Flat Title Notice',
      'real_estate',
      'AU-QLD'
    );

    const placements = [
      {
        id: 'p-1',
        pageNumber: 1,
        fieldName: 'notice_text',
        binding: 'notice_text',
        x: 100,
        y: 200,
        width: 300,
        height: 20,
        fontSize: 12,
        alignment: 'left' as const,
        formatting: 'uppercase' as const
      }
    ];

    const values = {
      notice_text: 'verified residential tenancy agreement'
    };

    const overlaidBytes = await UniversalPdfEngine.overlayCoordinates(blankBytes, placements, values);
    expect(overlaidBytes.length).toBeGreaterThan(1000);
    const inspection = await UniversalPdfEngine.inspectPdf(overlaidBytes);
    expect(inspection.pageCount).toBe(1);
  });

  it('applies legal draft watermark across document pages', async () => {
    const blankBytes = await UniversalPdfEngine.createSyntheticBlankForm(
      'Draft Schedule',
      'universal',
      'AU-QLD'
    );

    const watermarkedBytes = await UniversalPdfEngine.applyDraftWatermark(blankBytes, 'DRAFT - NOT FOR EXECUTION');
    expect(watermarkedBytes.length).toBeGreaterThan(blankBytes.length);

    const validation = UniversalPdfEngine.validatePdf(watermarkedBytes);
    expect(validation.valid).toBe(true);
  });
});
