// src/types/form-filler.ts
// Form-First Universal PDF Auto-Fill Data Models

export interface FormPersonRole {
  id: string; // e.g. "primary_applicant", "partner_applicant", "applicant_1", "person_a", "borrower_1"
  label: string; // e.g. "Primary Applicant", "Partner / Second Applicant", "Borrower 1"
  isOptional?: boolean;
}

export interface FormFieldDefinition {
  id: string; // e.g. "primary_applicant_full_name"
  label: string; // e.g. "Full Legal Name"
  personRoleId?: string; // null or 'shared' if common to all applicants
  targetAcroFieldName?: string; // Matching PDF AcroForm field name if interactive
  type: 'text' | 'date' | 'number' | 'currency' | 'phone' | 'email' | 'checkbox' | 'select' | 'signature';
  isRequired: boolean;
  isSkipped?: boolean; // User chose to skip or leave blank
  isSelected?: boolean; // User selection state for filling
  description?: string;
  options?: string[]; // for select/checkbox/radio
  pageNumber?: number;
  formatRule?: string; // e.g. 'uppercase', 'currency_aud', 'date_slash_au'
  coordinates?: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    pageNumber: number;
  };
}

export interface AnalyzedFormStructure {
  formName: string;
  formType: 'mortgage_finance' | 'solicitor_conveyancing' | 'rental_tenancy' | 'purchase_sale' | 'general';
  isInteractiveAcroForm: boolean;
  pageCount: number;
  peopleRoles: FormPersonRole[];
  sharedFields: FormFieldDefinition[];
  personFields: Record<string, FormFieldDefinition[]>; // personRoleId -> FormFieldDefinition[]
  signatureFields: Array<{
    id: string;
    label: string;
    personRoleId?: string;
    pageNumber?: number;
    note: string;
  }>;
}

export type FieldStatus = 
  | 'found'            // Ready for review
  | 'confirmed'        // Checked & approved by user
  | 'needs_review'     // Unclear or conflicting
  | 'missing'          // Not found in any document
  | 'manually_entered' // User typed or corrected
  | 'optional'         // Optional field not present
  | 'skipped';         // Explicitly skipped by user choice (left blank)

export interface FieldConflictOption {
  value: string;
  sourceDocName: string;
  sourcePage?: number;
  confidence?: number;
}

export interface FormFieldValueState {
  fieldId: string;
  personRoleId?: string;
  currentValue: any;
  status: FieldStatus;
  confidence?: number;
  sourceDocName?: string;
  sourcePage?: number;
  evidenceText?: string;
  conflicts?: FieldConflictOption[];
  userConfirmed?: boolean;
}

export interface UploadedSupportingDoc {
  id: string;
  file?: File;
  name: string;
  size: number;
  assignedPersonRoleId: string; // 'auto' | 'both' | personRoleId
  status: 'ready' | 'scanning' | 'processed' | 'error';
  error?: string;
  summary?: string;
  detectedPersons?: string[];
}

export interface FormValidationSummary {
  isValid: boolean;
  totalRequired: number;
  totalConfirmed: number;
  totalSkipped: number;
  personStats: Array<{
    roleId: string;
    roleLabel: string;
    totalRequired: number;
    confirmedRequired: number;
    skippedCount: number;
    isComplete: boolean;
    missingFields: FormFieldDefinition[];
    conflictingFields: FormFieldDefinition[];
  }>;
  sharedStats: {
    totalRequired: number;
    confirmedRequired: number;
    skippedCount: number;
    isComplete: boolean;
    missingFields: FormFieldDefinition[];
    conflictingFields: FormFieldDefinition[];
  };
  unresolvedCount: number;
}

