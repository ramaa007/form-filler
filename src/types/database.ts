// src/types/database.ts
// Multi-Tenant Universal AI Document Platform Database Types

export type IndustryType = 'mortgage_finance' | 'solicitor_conveyancing' | 'real_estate' | 'universal';

export type UserRole = 
  | 'platform_admin'
  | 'org_owner'
  | 'org_admin'
  | 'staff'
  | 'compliance_officer'
  | 'client_portal';

export type ClientType = 'individual' | 'joint' | 'business' | 'trust';

export type MatterType = 
  | 'mortgage_application'
  | 'conveyancing_purchase'
  | 'conveyancing_sale'
  | 'tenancy_application'
  | 'lease_agreement'
  | 'property_sale'
  | 'commercial_finance'
  | 'general_compliance';

export type MatterStatus = 
  | 'draft'
  | 'open'
  | 'pending_documents'
  | 'under_review'
  | 'approved'
  | 'settled'
  | 'archived'
  | 'cancelled';

export type DocumentCategory = 
  | 'identity_document'
  | 'income_payslip'
  | 'bank_statement'
  | 'contract_of_sale'
  | 'tenancy_agreement'
  | 'blank_form_template'
  | 'supporting_document'
  | 'other';

export type ExtractionStatus = 
  | 'uploaded'
  | 'processing'
  | 'extracted'
  | 'awaiting_review'
  | 'verified'
  | 'failed'
  | 'archived';

export type VerificationStatus = 'unverified' | 'verified' | 'conflict' | 'rejected';

export type TemplateType = 'acroform' | 'flat_coordinates' | 'hybrid';
export type TemplateStatus = 'draft' | 'published' | 'retired';
export type TargetFieldType = 'acroform' | 'coordinate_overlay';

export type ComplianceAssessmentStatus = 
  | 'not_assessed'
  | 'incomplete'
  | 'awaiting_review'
  | 'needs_correction'
  | 'exception_requiring_review'
  | 'verified_complete'
  | 'not_applicable';

export type RuleSeverity = 'mandatory' | 'warning' | 'advisory';

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  industry_type: IndustryType;
  jurisdiction: string; // e.g., 'AU-QLD', 'AU-NSW', 'AU-VIC'
  branding: {
    product_name: string;
    primary_color: string;
    logo_url?: string | null;
  };
  retention_policy_days: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganisationMembership {
  id: string;
  organisation_id: string;
  user_id: string;
  role: UserRole;
  permissions: string[];
  status: 'active' | 'invited' | 'suspended';
  created_at: string;
  updated_at: string;
  profile?: Profile;
  organisation?: Organisation;
}

export interface Address {
  street: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
}

export interface ClientIdentification {
  id_type: 'passport' | 'drivers_licence' | 'medicare' | 'national_id' | 'other';
  id_number: string;
  issuer?: string;
  expiry_date?: string;
  is_verified?: boolean;
}

export interface ClientEmployment {
  employer: string;
  occupation: string;
  employment_type: 'full_time' | 'part_time' | 'casual' | 'self_employed' | 'retired' | 'other';
  gross_annual_income?: number;
  commenced_date?: string;
}

export interface Client {
  id: string;
  organisation_id: string;
  client_type: ClientType;
  primary_name: string;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  residential_address?: Address | null;
  postal_address?: Address | null;
  identification_details?: ClientIdentification | null;
  employment_details?: ClientEmployment | null;
  business_details?: {
    company_name?: string;
    abn?: string;
    acn?: string;
    registered_address?: Address;
  } | null;
  universal_profile: Record<string, any>;
  portal_access_enabled: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Matter {
  id: string;
  organisation_id: string;
  client_id: string;
  matter_type: MatterType;
  title: string;
  reference_number: string;
  jurisdiction: string;
  status: MatterStatus;
  matter_data: Record<string, any>;
  assigned_staff_id?: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface DocumentRecord {
  id: string;
  organisation_id: string;
  matter_id?: string | null;
  client_id?: string | null;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  storage_path: string;
  document_category: DocumentCategory;
  page_count: number;
  is_encrypted: boolean;
  extraction_status: ExtractionStatus;
  error_message?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExtractedField {
  id: string;
  organisation_id: string;
  document_id: string;
  field_key: string;
  field_label: string;
  extracted_value: string | null;
  normalized_value?: any;
  source_page?: number | null;
  evidence_text?: string | null;
  confidence_score?: number | null;
  verification_status: VerificationStatus;
  conflict_details?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  created_at: string;
}

export interface PdfTemplate {
  id: string;
  organisation_id: string;
  name: string;
  industry_type: IndustryType;
  jurisdiction: string;
  description?: string | null;
  storage_path: string;
  template_type: TemplateType;
  version: number;
  status: TemplateStatus;
  page_count: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  mappings?: PdfTemplateFieldMapping[];
}

export interface PdfTemplateFieldMapping {
  id: string;
  template_id: string;
  field_name: string;
  target_type: TargetFieldType;
  source_binding: string;
  static_fallback_value?: string | null;
  is_required: boolean;
  formatting_rule?: 'uppercase' | 'date_au_slash' | 'currency_aud' | 'phone_au' | 'lowercase' | null;
  page_number: number;
  coordinate_x?: number | null;
  coordinate_y?: number | null;
  width?: number | null;
  height?: number | null;
  font_size?: number | null;
  alignment?: 'left' | 'center' | 'right' | null;
  created_at: string;
}

export interface GeneratedDocument {
  id: string;
  organisation_id: string;
  matter_id: string;
  template_id: string;
  template_version: number;
  storage_path: string;
  file_name: string;
  generation_type: 'draft' | 'final';
  approval_status: 'draft' | 'awaiting_approval' | 'approved' | 'rejected';
  approved_by?: string | null;
  approved_at?: string | null;
  approval_notes?: string | null;
  generated_by?: string | null;
  created_at: string;
}

export interface ComplianceRule {
  id: string;
  organisation_id?: string | null; // null for platform system baseline
  rule_code: string;
  name: string;
  industry_type: IndustryType;
  jurisdiction: string;
  effective_date: string;
  expiry_date?: string | null;
  version: number;
  status: 'draft' | 'published' | 'retired';
  description: string;
  source_reference?: string | null;
  condition_criteria: {
    required_document_categories?: DocumentCategory[];
    required_verified_fields?: string[];
    max_document_age_days?: number; // e.g. payslips within 90 days
    condition_expression?: string;
  };
  severity: RuleSeverity;
  created_at: string;
}

export interface ComplianceAssessment {
  id: string;
  organisation_id: string;
  matter_id: string;
  rule_id: string;
  rule_version: number;
  assessment_status: ComplianceAssessmentStatus;
  notes?: string | null;
  evidence_references: Array<{
    document_id?: string;
    field_id?: string;
    snippet?: string;
  }>;
  exception_reason?: string | null;
  assessed_by?: string | null;
  assessed_at: string;
  rule?: ComplianceRule;
}

export interface AuditEvent {
  id: string;
  organisation_id: string;
  actor_id?: string | null;
  actor_email?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details: Record<string, any>;
  ip_address?: string | null;
  created_at: string;
}
