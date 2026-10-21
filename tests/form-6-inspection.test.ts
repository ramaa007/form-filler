// tests/form-6-inspection.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import { UniversalPdfEngine } from '../src/lib/pdf/engine';
import { FormAnalyzer } from '../src/lib/form-analyzer';

describe('Form 6 Inspection & Categorization Test', () => {
  it('correctly categorizes Form 6 roles and separates required vs optional fields', async () => {
    const pdfPath = 'C:\\Users\\61425\\Downloads\\23_1467ft_po_f6_v1_0524fields.pdf';
    if (!fs.existsSync(pdfPath)) {
      console.log('Form 6 not found, skipping');
      return;
    }

    const buf = fs.readFileSync(pdfPath);
    const inspection = await UniversalPdfEngine.inspectPdf(buf);
    fs.writeFileSync('C:\\Users\\61425\\Downloads\\Form Filler\\scratch_fields.json', JSON.stringify(inspection.detectedFields.map(f => f.name), null, 2));
    expect(inspection.detectedFields.length).toBe(167);

    const structure = FormAnalyzer.analyzeWithHeuristics('23_1467ft_po_f6_v1_0524fields.pdf', inspection);
    
    console.log('Form Name:', structure.formName);
    console.log('Roles:', structure.peopleRoles.map(r => `${r.label} (id: ${r.id}, optional: ${r.isOptional})`));
    console.log('Shared fields count:', structure.sharedFields.length);
    for (const [rId, fields] of Object.entries(structure.personFields)) {
      const req = fields.filter(f => f.isRequired).length;
      console.log(`Role ${rId}: ${fields.length} fields (${req} required)`);
    }

    // Role expectations:
    // Should have Client 1, Client 2 (Optional), and Agent / Licensee
    const roleIds = structure.peopleRoles.map(r => r.id);
    expect(roleIds).toContain('client_1');
    expect(roleIds).toContain('client_2');

    // Required count should NOT be 167!
    const allFields = [
      ...structure.sharedFields,
      ...Object.values(structure.personFields).flat()
    ];
    const totalRequired = allFields.filter(f => f.isRequired).length;
    console.log(`Total fields: ${allFields.length}, Total Required: ${totalRequired}`);
    expect(totalRequired).toBeLessThan(35); // Realistic required count!
  });
});
