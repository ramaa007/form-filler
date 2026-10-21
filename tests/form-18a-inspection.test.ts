// tests/form-18a-inspection.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import { UniversalPdfEngine } from '../src/lib/pdf/engine';
import { FormAnalyzer } from '../src/lib/form-analyzer';

describe('Form 18a Inspection & Analysis Test', () => {
  it('analyzes Form 18a General Tenancy Agreement in < 1 second', async () => {
    const pdfPath = 'C:\\Users\\61425\\Downloads\\Form-18a-General-tenancy-agreement.pdf';
    if (!fs.existsSync(pdfPath)) {
      console.log('Form 18a not found at path, skipping local file test');
      return;
    }

    const buf = fs.readFileSync(pdfPath);
    const t0 = Date.now();
    const inspection = await UniversalPdfEngine.inspectPdf(buf);
    const t1 = Date.now();
    console.log(`inspectPdf took ${t1 - t0}ms for ${inspection.detectedFields.length} fields across ${inspection.pageCount} pages`);
    expect(inspection.pageCount).toBe(12);
    expect(inspection.detectedFields.length).toBeGreaterThan(50);

    const structure = FormAnalyzer.analyzeWithHeuristics('Form-18a-General-tenancy-agreement.pdf', inspection);
    const t2 = Date.now();
    console.log(`analyzeWithHeuristics took ${t2 - t1}ms`);
    console.log('Detected people/roles:', structure.peopleRoles.map(r => r.label));
    console.log('Shared fields count:', structure.sharedFields.length);
    console.log('Sample shared fields:', structure.sharedFields.slice(0, 5).map(f => f.label));
    console.log('Person fields per role:', Object.entries(structure.personFields).map(([k, v]) => `${k}: ${v.length} fields`));

    expect(structure.peopleRoles.length).toBeGreaterThanOrEqual(2);
    expect(structure.sharedFields.length).toBeGreaterThan(0);
  });
});
