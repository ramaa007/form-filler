// src/lib/compliance/sample-rules.ts
// Configurable baseline sample compliance rules for Mortgage, Conveyancing, and Real Estate
// Clearly labelled: Sample rules for development framework; require review by an authorised professional before production.

import { ComplianceRule } from '@/types/database';

export const SAMPLE_COMPLIANCE_RULES: ComplianceRule[] = [
  // --- MORTGAGE & FINANCE (AU-QLD / Commonwealth) ---
  {
    id: 'rule-mf-01',
    rule_code: 'MF-NCCP-VOI',
    name: 'Borrower Verification of Identity (VOI) Standard',
    industry_type: 'mortgage_finance',
    jurisdiction: 'AU-QLD',
    effective_date: '2026-01-01',
    version: 1,
    status: 'published',
    description: 'Requires primary borrower identity document (Passport or Drivers Licence) cited, verified, and not expired.',
    source_reference: 'National Consumer Credit Protection Act 2009 (Cth) s130 & ARNECC VOI Standard',
    severity: 'mandatory',
    condition_criteria: {
      required_document_categories: ['identity_document'],
      required_verified_fields: ['borrower_full_name', 'borrower_dob', 'id_document_number'],
      max_document_age_days: 365
    },
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'rule-mf-02',
    rule_code: 'MF-INCOME-CURRENCY',
    name: 'Income & Serviceability Currency Verification (90-Day Rule)',
    industry_type: 'mortgage_finance',
    jurisdiction: 'AU-QLD',
    effective_date: '2026-01-01',
    version: 1,
    status: 'published',
    description: 'Borrower payslips or financial evidence must be issued within 90 days of application submission.',
    source_reference: 'ASIC Regulatory Guide 209: Credit licensing: Responsible lending conduct',
    severity: 'mandatory',
    condition_criteria: {
      required_document_categories: ['income_payslip', 'bank_statement'],
      required_verified_fields: ['gross_annual_income', 'employer_name'],
      max_document_age_days: 90
    },
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'rule-mf-03',
    rule_code: 'MF-HEM-LIVING-EXPENSES',
    name: 'Living Expenses Benchmark Verification',
    industry_type: 'mortgage_finance',
    jurisdiction: 'AU-QLD',
    effective_date: '2026-01-01',
    version: 1,
    status: 'published',
    description: 'Requires declared borrower monthly living expenses to be documented and compared against household benchmark.',
    source_reference: 'NCCP Act 2009 Responsible Lending Inquiries',
    severity: 'warning',
    condition_criteria: {
      required_verified_fields: ['monthly_living_expenses']
    },
    created_at: '2026-01-01T00:00:00Z'
  },

  // --- SOLICITORS & CONVEYANCING (AU-QLD) ---
  {
    id: 'rule-cv-01',
    rule_code: 'CV-QLD-CONTRACT-VALIDATION',
    name: 'REIQ / QLS Contract of Sale Execution Check',
    industry_type: 'solicitor_conveyancing',
    jurisdiction: 'AU-QLD',
    effective_date: '2026-01-01',
    version: 1,
    status: 'published',
    description: 'Verify executed Contract of Sale contains lot/plan particulars, agreed purchase price, deposit terms, and settlement date.',
    source_reference: 'Property Law Act 1974 (QLD) s59 & Land Title Act 1994 (QLD)',
    severity: 'mandatory',
    condition_criteria: {
      required_document_categories: ['contract_of_sale'],
      required_verified_fields: ['property_address', 'purchase_price', 'settlement_date', 'lot_plan']
    },
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'rule-cv-02',
    rule_code: 'CV-CLIENT-AUTHORITY',
    name: 'Client Legal Engagement & Authority Form',
    industry_type: 'solicitor_conveyancing',
    jurisdiction: 'AU-QLD',
    effective_date: '2026-01-01',
    version: 1,
    status: 'published',
    description: 'Requires signed client retainer and authority to act in conveyance prior to taking steps towards settlement.',
    source_reference: 'Legal Profession Act 2007 (QLD) / Australian Solicitors Conduct Rules',
    severity: 'mandatory',
    condition_criteria: {
      required_document_categories: ['supporting_document'],
      required_verified_fields: ['client_legal_name']
    },
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'rule-cv-03',
    rule_code: 'CV-CONFLICT-CHECK-RECORD',
    name: 'Conflict of Interest Screening Record',
    industry_type: 'solicitor_conveyancing',
    jurisdiction: 'AU-QLD',
    effective_date: '2026-01-01',
    version: 1,
    status: 'published',
    description: 'Record that an authorised legal practitioner has completed a conflict-of-interest review between buyer and seller parties.',
    source_reference: 'Australian Solicitors Conduct Rules (Rule 10 & 11: Conflicts of interest)',
    severity: 'mandatory',
    condition_criteria: {
      condition_expression: 'conflict_check_completed == true'
    },
    created_at: '2026-01-01T00:00:00Z'
  },

  // --- REAL ESTATE & PROPERTY MANAGEMENT (AU-QLD) ---
  {
    id: 'rule-re-01',
    rule_code: 'RE-QLD-PO-ACT-APPOINTMENT',
    name: 'Form 6 Property Occupations Appointment Verification',
    industry_type: 'real_estate',
    jurisdiction: 'AU-QLD',
    effective_date: '2026-01-01',
    version: 1,
    status: 'published',
    description: 'Validates that an agent appointment is properly formed under Form 6 before marketing or leasing property.',
    source_reference: 'Property Occupations Act 2014 (QLD) Part 4',
    severity: 'mandatory',
    condition_criteria: {
      required_document_categories: ['supporting_document', 'contract_of_sale'],
      required_verified_fields: ['property_address']
    },
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'rule-re-02',
    rule_code: 'RE-QLD-TENANCY-BOND-LODGEMENT',
    name: 'Residential Tenancy Bond Lodgement Form (RTA QLD Form 2)',
    industry_type: 'real_estate',
    jurisdiction: 'AU-QLD',
    effective_date: '2026-01-01',
    version: 1,
    status: 'published',
    description: 'Validates tenant particulars, rental property address, and maximum 4-week bond calculation for RTA lodgement.',
    source_reference: 'Residential Tenancies and Rooming Accommodation Act 2008 (QLD) s116',
    severity: 'mandatory',
    condition_criteria: {
      required_document_categories: ['identity_document', 'income_payslip'],
      required_verified_fields: ['applicant_full_name', 'property_address', 'weekly_rental_amount', 'bond_lodgement_amount']
    },
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'rule-re-03',
    rule_code: 'RE-SMOKE-ALARM-DISCLOSURE',
    name: 'Smoke Alarm Safety Compliance Disclosure',
    industry_type: 'real_estate',
    jurisdiction: 'AU-QLD',
    effective_date: '2026-01-01',
    version: 1,
    status: 'published',
    description: 'Requires record that interconnected photoelectric smoke alarm compliance certificate is verified prior to tenancy commencement.',
    source_reference: 'Fire and Emergency Services Act 1990 (QLD) & Building Fire Safety Regulation 2008',
    severity: 'mandatory',
    condition_criteria: {
      required_document_categories: ['supporting_document']
    },
    created_at: '2026-01-01T00:00:00Z'
  }
];
