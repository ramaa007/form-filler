// tests/compliance-engine.test.ts
import { describe, it, expect } from 'vitest';
import { ComplianceEngine } from '../src/lib/compliance/engine';
import { SAMPLE_COMPLIANCE_RULES } from '../src/lib/compliance/sample-rules';
import { Client, Matter, DocumentRecord, ExtractedField } from '../src/types/database';

describe('ComplianceEngine Unit & Integration Tests', () => {
  const client: Client = {
    id: 'client-sarah',
    organisation_id: 'org-1',
    client_type: 'individual',
    primary_name: 'Sarah Jane Thompson',
    universal_profile: {
      borrower_full_name: 'Sarah Jane Thompson',
      borrower_dob: '1988-06-14',
      gross_annual_income: '118500',
      employer_name: 'Queensland Health Services Pty Ltd',
      monthly_living_expenses: '3200'
    },
    portal_access_enabled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const matter: Matter = {
    id: 'matter-01',
    organisation_id: 'org-1',
    client_id: 'client-sarah',
    matter_type: 'mortgage_application',
    title: 'Sarah Thompson Loan File',
    reference_number: 'APX-2026-0042',
    jurisdiction: 'AU-QLD',
    status: 'under_review',
    matter_data: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  it('marks assessment incomplete when required document is absent', () => {
    const rules = SAMPLE_COMPLIANCE_RULES.filter(r => r.rule_code === 'MF-NCCP-VOI');
    const documents: DocumentRecord[] = []; // No documents provided
    const fields: ExtractedField[] = [];

    const report = ComplianceEngine.evaluateMatter({
      matter,
      client,
      rules,
      documents,
      extractedFields: fields
    });

    expect(report.overallStatus).toBe('requires_action');
    expect(report.evaluations[0].status).toBe('incomplete');
    expect(report.evaluations[0].missingItems.some(i => i.includes('Missing mandatory document category'))).toBe(true);
  });

  it('evaluates rule as verified_complete when verified documents and fields are present', () => {
    const rules = SAMPLE_COMPLIANCE_RULES.filter(r => r.rule_code === 'MF-NCCP-VOI');
    const documents: DocumentRecord[] = [
      {
        id: 'doc-id-01',
        organisation_id: 'org-1',
        matter_id: matter.id,
        file_name: 'Drivers_Licence_QLD.pdf',
        file_size_bytes: 124000,
        mime_type: 'application/pdf',
        storage_path: 'path/id.pdf',
        document_category: 'identity_document',
        page_count: 1,
        is_encrypted: false,
        extraction_status: 'verified',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const fields: ExtractedField[] = [
      {
        id: 'f-1',
        organisation_id: 'org-1',
        document_id: 'doc-id-01',
        field_key: 'id_document_number',
        field_label: 'Licence Number',
        extracted_value: 'QLD-94820149',
        verification_status: 'verified',
        created_at: new Date().toISOString()
      }
    ];

    const report = ComplianceEngine.evaluateMatter({
      matter,
      client,
      rules,
      documents,
      extractedFields: fields
    });

    expect(report.overallStatus).toBe('compliant');
    expect(report.evaluations[0].status).toBe('verified_complete');
    expect(report.evaluations[0].evidenceReferences.length).toBeGreaterThan(0);
  });
});
