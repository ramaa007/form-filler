// src/lib/store/repository.ts
// Multi-tenant data repository with strict organisation data isolation

import { 
  Organisation, 
  OrganisationMembership, 
  Client, 
  Matter, 
  DocumentRecord, 
  ExtractedField, 
  PdfTemplate, 
  PdfTemplateFieldMapping, 
  GeneratedDocument, 
  ComplianceRule, 
  ComplianceAssessment, 
  AuditEvent 
} from '@/types/database';
import { SAMPLE_COMPLIANCE_RULES } from '@/lib/compliance/sample-rules';

// In-memory tenant store for resilient execution & test suites
class PlatformDataRepository {
  private organisations: Map<string, Organisation> = new Map();
  private memberships: Map<string, OrganisationMembership> = new Map();
  private clients: Map<string, Client> = new Map();
  private matters: Map<string, Matter> = new Map();
  private documents: Map<string, DocumentRecord> = new Map();
  private extractedFields: Map<string, ExtractedField> = new Map();
  private templates: Map<string, PdfTemplate> = new Map();
  private templateMappings: Map<string, PdfTemplateFieldMapping> = new Map();
  private generatedDocs: Map<string, GeneratedDocument> = new Map();
  private complianceRules: Map<string, ComplianceRule> = new Map();
  private complianceAssessments: Map<string, ComplianceAssessment> = new Map();
  private auditEvents: AuditEvent[] = [];

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    // 1. Seed Sample Organisations
    const org1: Organisation = {
      id: 'org-mortgage-prime',
      name: 'Apex Mortgage & Finance Group',
      slug: 'apex-mortgage',
      industry_type: 'mortgage_finance',
      jurisdiction: 'AU-QLD',
      branding: {
        product_name: 'Apex Universal Loan & Document Platform',
        primary_color: '#2563eb'
      },
      retention_policy_days: 365,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const org2: Organisation = {
      id: 'org-coastal-conveyancing',
      name: 'Coastal Legal & Conveyancing Solicitors',
      slug: 'coastal-conveyancing',
      industry_type: 'solicitor_conveyancing',
      jurisdiction: 'AU-QLD',
      branding: {
        product_name: 'Coastal Legal Portal',
        primary_color: '#0d9488'
      },
      retention_policy_days: 2555, // 7-year Australian statutory legal retention
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const org3: Organisation = {
      id: 'org-pacific-realty',
      name: 'Pacific Estate Agents & Property Management',
      slug: 'pacific-realty',
      industry_type: 'real_estate',
      jurisdiction: 'AU-QLD',
      branding: {
        product_name: 'Pacific Property Suite',
        primary_color: '#d97706'
      },
      retention_policy_days: 1825, // 5 years
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.organisations.set(org1.id, org1);
    this.organisations.set(org2.id, org2);
    this.organisations.set(org3.id, org3);

    // 2. Seed Default User Memberships
    const defaultUserId = 'user-broker-demo';
    this.memberships.set('mem-1', {
      id: 'mem-1',
      organisation_id: org1.id,
      user_id: defaultUserId,
      role: 'org_owner',
      permissions: ['all'],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    this.memberships.set('mem-2', {
      id: 'mem-2',
      organisation_id: org2.id,
      user_id: 'user-lawyer-demo',
      role: 'org_admin',
      permissions: ['legal_intake', 'document_generation'],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // 3. Seed Compliance Rules
    for (const rule of SAMPLE_COMPLIANCE_RULES) {
      this.complianceRules.set(rule.id, rule);
    }

    // 4. Seed Starter Client in Org 1
    const client1: Client = {
      id: 'client-sarah-thompson',
      organisation_id: org1.id,
      client_type: 'individual',
      primary_name: 'Sarah Jane Thompson',
      email: 'sarah.thompson@example.com.au',
      phone: '0412 345 678',
      date_of_birth: '1988-06-14',
      residential_address: {
        street: '18 Kurrajong Street',
        suburb: 'Brisbane',
        state: 'QLD',
        postcode: '4000',
        country: 'Australia'
      },
      postal_address: {
        street: '18 Kurrajong Street',
        suburb: 'Brisbane',
        state: 'QLD',
        postcode: '4000',
        country: 'Australia'
      },
      identification_details: {
        id_type: 'drivers_licence',
        id_number: 'QLD-94820149',
        issuer: 'Dept of Transport and Main Roads QLD',
        expiry_date: '2029-06-14',
        is_verified: true
      },
      employment_details: {
        employer: 'Queensland Health Services Pty Ltd',
        occupation: 'Clinical Nurse Consultant',
        employment_type: 'full_time',
        gross_annual_income: 118500,
        commenced_date: '2019-03-01'
      },
      business_details: null,
      universal_profile: {
        borrower_full_name: 'Sarah Jane Thompson',
        borrower_dob: '1988-06-14',
        gross_annual_income: '118500.00',
        employer_name: 'Queensland Health Services Pty Ltd',
        monthly_living_expenses: '3200.00'
      },
      portal_access_enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.clients.set(client1.id, client1);

    // 5. Seed Starter Matter in Org 1
    const matter1: Matter = {
      id: 'matter-home-loan-01',
      organisation_id: org1.id,
      client_id: client1.id,
      matter_type: 'mortgage_application',
      title: 'Thompson First Home Mortgage Application - Surfers Paradise',
      reference_number: 'APX-2026-0042',
      jurisdiction: 'AU-QLD',
      status: 'under_review',
      matter_data: {
        lender_name: 'Commonwealth Bank of Australia',
        loan_amount: '716000.00',
        loan_purpose: 'Owner Occupied',
        property_value: '895000.00',
        loan_term_years: 30,
        interest_rate_type: 'Variable',
        property_address: '42 Ocean Parade, Surfers Paradise QLD 4217',
        settlement_date: '2026-11-28'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.matters.set(matter1.id, matter1);

    // 6. Seed Sample Documents for Matter 1
    const doc1: DocumentRecord = {
      id: 'doc-payslip-01',
      organisation_id: org1.id,
      matter_id: matter1.id,
      client_id: client1.id,
      file_name: 'Sarah_Thompson_Payslip_Sep2026.pdf',
      file_size_bytes: 245000,
      mime_type: 'application/pdf',
      storage_path: `org-mortgage-prime/matter-home-loan-01/Sarah_Thompson_Payslip_Sep2026.pdf`,
      document_category: 'income_payslip',
      page_count: 1,
      is_encrypted: false,
      extraction_status: 'verified',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.documents.set(doc1.id, doc1);

    // Seed Extracted Fields for Document 1
    const field1: ExtractedField = {
      id: 'field-income-1',
      organisation_id: org1.id,
      document_id: doc1.id,
      field_key: 'gross_annual_income',
      field_label: 'Gross Annual Base Salary',
      extracted_value: '118500.00',
      source_page: 1,
      evidence_text: 'Annual Base Salary: $118,500.00 per annum',
      confidence_score: 0.98,
      verification_status: 'verified',
      verified_by: 'broker-sarah',
      verified_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    const field2: ExtractedField = {
      id: 'field-emp-1',
      organisation_id: org1.id,
      document_id: doc1.id,
      field_key: 'employer_name',
      field_label: 'Employer Legal Name',
      extracted_value: 'Queensland Health Services Pty Ltd',
      source_page: 1,
      evidence_text: 'Employer: Queensland Health Services Pty Ltd | ABN 45 123 456 789',
      confidence_score: 0.96,
      verification_status: 'verified',
      verified_by: 'broker-sarah',
      verified_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    this.extractedFields.set(field1.id, field1);
    this.extractedFields.set(field2.id, field2);

    // 7. Seed Starter PDF Template in Org 1
    const tpl1: PdfTemplate = {
      id: 'tpl-loan-intake-01',
      organisation_id: org1.id,
      name: 'Mortgage & Finance Standard Loan Schedule (AU-QLD)',
      industry_type: 'mortgage_finance',
      jurisdiction: 'AU-QLD',
      description: 'Standard 2026 Residential Loan Application Schedule with AcroForm and coordinate mapping.',
      storage_path: 'templates/mortgage_schedule_v1.pdf',
      template_type: 'acroform',
      version: 1,
      status: 'published',
      page_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.templates.set(tpl1.id, tpl1);

    // Seed Template Mappings
    const map1: PdfTemplateFieldMapping = {
      id: 'map-1',
      template_id: tpl1.id,
      field_name: 'client_full_name',
      target_type: 'acroform',
      source_binding: 'client.primary_name',
      is_required: true,
      formatting_rule: 'uppercase',
      page_number: 1,
      created_at: new Date().toISOString()
    };
    const map2: PdfTemplateFieldMapping = {
      id: 'map-2',
      template_id: tpl1.id,
      field_name: 'client_dob',
      target_type: 'acroform',
      source_binding: 'client.date_of_birth',
      is_required: true,
      formatting_rule: 'date_au_slash',
      page_number: 1,
      created_at: new Date().toISOString()
    };
    const map3: PdfTemplateFieldMapping = {
      id: 'map-3',
      template_id: tpl1.id,
      field_name: 'matter_property_address',
      target_type: 'acroform',
      source_binding: 'matter.property_address',
      is_required: true,
      page_number: 1,
      created_at: new Date().toISOString()
    };
    const map4: PdfTemplateFieldMapping = {
      id: 'map-4',
      template_id: tpl1.id,
      field_name: 'matter_amount',
      target_type: 'acroform',
      source_binding: 'matter.loan_amount',
      is_required: true,
      formatting_rule: 'currency_aud',
      page_number: 1,
      created_at: new Date().toISOString()
    };
    const map5: PdfTemplateFieldMapping = {
      id: 'map-5',
      template_id: tpl1.id,
      field_name: 'client_income',
      target_type: 'acroform',
      source_binding: 'client.employment.gross_annual_income',
      is_required: true,
      formatting_rule: 'currency_aud',
      page_number: 1,
      created_at: new Date().toISOString()
    };
    this.templateMappings.set(map1.id, map1);
    this.templateMappings.set(map2.id, map2);
    this.templateMappings.set(map3.id, map3);
    this.templateMappings.set(map4.id, map4);
    this.templateMappings.set(map5.id, map5);
  }

  // --- TENANT DATA ISOLATION & QUERY METHODS ---

  getOrganisations(): Organisation[] {
    return Array.from(this.organisations.values());
  }

  getOrganisation(id: string): Organisation | undefined {
    return this.organisations.get(id);
  }

  createOrganisation(org: Organisation): Organisation {
    this.organisations.set(org.id, org);
    return org;
  }

  getClients(orgId: string): Client[] {
    return Array.from(this.clients.values()).filter(c => c.organisation_id === orgId);
  }

  getClient(orgId: string, clientId: string): Client | undefined {
    const c = this.clients.get(clientId);
    return c && c.organisation_id === orgId ? c : undefined;
  }

  saveClient(client: Client): Client {
    this.clients.set(client.id, client);
    return client;
  }

  getMatters(orgId: string): Matter[] {
    return Array.from(this.matters.values()).filter(m => m.organisation_id === orgId);
  }

  getMatter(orgId: string, matterId: string): Matter | undefined {
    const m = this.matters.get(matterId);
    return m && m.organisation_id === orgId ? m : undefined;
  }

  saveMatter(matter: Matter): Matter {
    this.matters.set(matter.id, matter);
    return matter;
  }

  getDocuments(orgId: string, matterId?: string): DocumentRecord[] {
    return Array.from(this.documents.values()).filter(d => {
      if (d.organisation_id !== orgId) return false;
      if (matterId && d.matter_id !== matterId) return false;
      return true;
    });
  }

  getDocument(orgId: string, documentId: string): DocumentRecord | undefined {
    const d = this.documents.get(documentId);
    return d && d.organisation_id === orgId ? d : undefined;
  }

  saveDocument(doc: DocumentRecord): DocumentRecord {
    this.documents.set(doc.id, doc);
    return doc;
  }

  deleteDocument(orgId: string, documentId: string): boolean {
    const doc = this.getDocument(orgId, documentId);
    if (!doc) return false;
    this.documents.delete(documentId);
    // Delete associated extracted fields
    for (const [id, f] of this.extractedFields.entries()) {
      if (f.document_id === documentId) {
        this.extractedFields.delete(id);
      }
    }
    return true;
  }

  getExtractedFields(orgId: string, documentId?: string): ExtractedField[] {
    return Array.from(this.extractedFields.values()).filter(f => {
      if (f.organisation_id !== orgId) return false;
      if (documentId && f.document_id !== documentId) return false;
      return true;
    });
  }

  saveExtractedField(field: ExtractedField): ExtractedField {
    this.extractedFields.set(field.id, field);
    return field;
  }

  getTemplates(orgId: string): PdfTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.organisation_id === orgId);
  }

  getTemplate(orgId: string, templateId: string): PdfTemplate | undefined {
    const t = this.templates.get(templateId);
    if (!t || t.organisation_id !== orgId) return undefined;
    const mappings = Array.from(this.templateMappings.values()).filter(m => m.template_id === templateId);
    return { ...t, mappings };
  }

  saveTemplate(template: PdfTemplate): PdfTemplate {
    this.templates.set(template.id, template);
    return template;
  }

  saveTemplateMapping(mapping: PdfTemplateFieldMapping): PdfTemplateFieldMapping {
    this.templateMappings.set(mapping.id, mapping);
    return mapping;
  }

  getGeneratedDocuments(orgId: string, matterId?: string): GeneratedDocument[] {
    return Array.from(this.generatedDocs.values()).filter(g => {
      if (g.organisation_id !== orgId) return false;
      if (matterId && g.matter_id !== matterId) return false;
      return true;
    });
  }

  saveGeneratedDocument(doc: GeneratedDocument): GeneratedDocument {
    this.generatedDocs.set(doc.id, doc);
    return doc;
  }

  getComplianceRules(orgId?: string, industryType?: string, jurisdiction?: string): ComplianceRule[] {
    return Array.from(this.complianceRules.values()).filter(r => {
      if (r.organisation_id && r.organisation_id !== orgId) return false;
      if (industryType && r.industry_type !== industryType && r.industry_type !== 'universal') return false;
      if (jurisdiction && r.jurisdiction !== jurisdiction) return false;
      return true;
    });
  }

  getComplianceRule(ruleId: string): ComplianceRule | undefined {
    return this.complianceRules.get(ruleId);
  }

  saveComplianceRule(rule: ComplianceRule): ComplianceRule {
    this.complianceRules.set(rule.id, rule);
    return rule;
  }

  getComplianceAssessments(orgId: string, matterId?: string): ComplianceAssessment[] {
    return Array.from(this.complianceAssessments.values()).filter(a => {
      if (a.organisation_id !== orgId) return false;
      if (matterId && a.matter_id !== matterId) return false;
      return true;
    });
  }

  saveComplianceAssessment(assessment: ComplianceAssessment): ComplianceAssessment {
    this.complianceAssessments.set(assessment.id, assessment);
    return assessment;
  }

  recordAuditEvent(event: AuditEvent): void {
    this.auditEvents.unshift(event);
  }

  getAuditEvents(orgId: string, limit: number = 50): AuditEvent[] {
    return this.auditEvents
      .filter(e => e.organisation_id === orgId)
      .slice(0, limit);
  }
}

// Global repository singleton attached to globalThis to preserve state across Next.js dev reloads
declare global {
  // eslint-disable-next-line no-var
  var __platformRepo: PlatformDataRepository | undefined;
}

const globalRepo = globalThis.__platformRepo || new PlatformDataRepository();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__platformRepo = globalRepo;
}

export function getRepository(): PlatformDataRepository {
  return globalRepo;
}
