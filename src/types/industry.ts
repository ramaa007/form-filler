// src/types/industry.ts
import { IndustryType, MatterType, DocumentCategory } from './database';

export interface IndustryConfig {
  id: IndustryType;
  name: string;
  description: string;
  iconName: string;
  supportedMatterTypes: Array<{
    type: MatterType;
    label: string;
    description: string;
    recommendedDocumentCategories: DocumentCategory[];
    customFieldDefinitions: Array<{
      key: string;
      label: string;
      type: 'text' | 'number' | 'date' | 'currency' | 'select' | 'boolean';
      options?: string[];
      required: boolean;
      placeholder?: string;
    }>;
  }>;
  universalFieldRecommendations: Array<{
    key: string;
    label: string;
    category: 'identity' | 'financial' | 'property' | 'legal';
    description: string;
  }>;
}

export interface JurisdictionConfig {
  code: string;
  name: string;
  state: string;
  country: string;
  legalNotice: string;
  authoritativeSources: string[];
}

export const SUPPORTED_JURISDICTIONS: JurisdictionConfig[] = [
  {
    code: 'AU-QLD',
    name: 'Queensland (QLD), Australia',
    state: 'Queensland',
    country: 'Australia',
    legalNotice: 'Governed by Queensland legislation including Property Law Act 1974 (QLD), Land Title Act 1994 (QLD), and Residential Tenancies and Rooming Accommodation Act 2008 (QLD).',
    authoritativeSources: ['Queensland Legislation Repository (legislation.qld.gov.au)', 'Queensland Law Society', 'RTA QLD']
  },
  {
    code: 'AU-NSW',
    name: 'New South Wales (NSW), Australia',
    state: 'New South Wales',
    country: 'Australia',
    legalNotice: 'Governed by NSW legislation including Conveyancing Act 1919 (NSW), Real Property Act 1900 (NSW), and Residential Tenancies Act 2010 (NSW).',
    authoritativeSources: ['NSW Legislation (legislation.nsw.gov.au)', 'NSW Land Registry Services']
  },
  {
    code: 'AU-VIC',
    name: 'Victoria (VIC), Australia',
    state: 'Victoria',
    country: 'Australia',
    legalNotice: 'Governed by Victorian legislation including Sale of Land Act 1962 (VIC) and Residential Tenancies Act 1997 (VIC).',
    authoritativeSources: ['Victorian Legislation (legislation.vic.gov.au)', 'Consumer Affairs Victoria']
  }
];

export const INDUSTRY_MODULES: Record<IndustryType, IndustryConfig> = {
  mortgage_finance: {
    id: 'mortgage_finance',
    name: 'Mortgage & Finance',
    description: 'Broker onboarding, borrower assessment, serviceability, loan application forms, and lender document packaging.',
    iconName: 'Landmark',
    supportedMatterTypes: [
      {
        type: 'mortgage_application',
        label: 'Residential Mortgage Application',
        description: 'First home buyer, refinance, or property investor residential loan application.',
        recommendedDocumentCategories: ['identity_document', 'income_payslip', 'bank_statement', 'contract_of_sale'],
        customFieldDefinitions: [
          { key: 'lender_name', label: 'Proposed Lender', type: 'text', required: true, placeholder: 'e.g. Commonwealth Bank, Macquarie, ANZ' },
          { key: 'loan_amount', label: 'Requested Loan Amount ($AUD)', type: 'currency', required: true, placeholder: 'e.g. 750000' },
          { key: 'loan_purpose', label: 'Loan Purpose', type: 'select', options: ['Owner Occupied', 'Investment', 'Refinance', 'Equity Release'], required: true },
          { key: 'property_value', label: 'Estimated Property Value ($AUD)', type: 'currency', required: true, placeholder: 'e.g. 950000' },
          { key: 'loan_term_years', label: 'Loan Term (Years)', type: 'number', required: true, placeholder: '30' },
          { key: 'interest_rate_type', label: 'Rate Type', type: 'select', options: ['Variable', 'Fixed 1 Year', 'Fixed 2 Years', 'Fixed 3 Years', 'Split'], required: true }
        ]
      },
      {
        type: 'commercial_finance',
        label: 'Commercial & Asset Finance',
        description: 'Business equipment loans, commercial property, and working capital credit.',
        recommendedDocumentCategories: ['identity_document', 'bank_statement', 'supporting_document'],
        customFieldDefinitions: [
          { key: 'business_abn', label: 'Operating ABN', type: 'text', required: true },
          { key: 'facility_type', label: 'Facility Type', type: 'select', options: ['Term Loan', 'Overdraft', 'Equipment Finance', 'Chattel Mortgage'], required: true },
          { key: 'loan_amount', label: 'Facility Amount ($AUD)', type: 'currency', required: true }
        ]
      }
    ],
    universalFieldRecommendations: [
      { key: 'borrower_full_name', label: 'Primary Borrower Full Name', category: 'identity', description: 'Legal name as stated on passport or licence.' },
      { key: 'borrower_dob', label: 'Date of Birth', category: 'identity', description: 'Borrower date of birth.' },
      { key: 'borrower_residential_address', label: 'Current Residential Address', category: 'identity', description: 'Full physical residential address.' },
      { key: 'employer_name', label: 'Current Employer', category: 'financial', description: 'Trading or legal entity name of current employer.' },
      { key: 'gross_annual_income', label: 'Gross Base Annual Income', category: 'financial', description: 'Verified gross annual earnings before tax.' },
      { key: 'monthly_living_expenses', label: 'Declared Monthly Living Expenses', category: 'financial', description: 'HEM benchmark or declared ongoing living expenses.' }
    ]
  },

  solicitor_conveyancing: {
    id: 'solicitor_conveyancing',
    name: 'Solicitors & Conveyancing',
    description: 'Property settlements, contract review, VOI (Verification of Identity), authority forms, and trust recordkeeping.',
    iconName: 'Scale',
    supportedMatterTypes: [
      {
        type: 'conveyancing_purchase',
        label: 'Property Purchase Conveyancing',
        description: 'Acting for the purchaser in residential or commercial real estate acquisition.',
        recommendedDocumentCategories: ['contract_of_sale', 'identity_document', 'supporting_document'],
        customFieldDefinitions: [
          { key: 'property_address', label: 'Subject Property Address', type: 'text', required: true, placeholder: 'e.g. 42 Ocean Parade, Surfers Paradise QLD 4217' },
          { key: 'lot_plan', label: 'Lot & Plan Description', type: 'text', required: true, placeholder: 'e.g. Lot 12 on RP 123456, Title Ref 50123456' },
          { key: 'purchase_price', label: 'Purchase Price ($AUD)', type: 'currency', required: true, placeholder: '850000' },
          { key: 'deposit_amount', label: 'Deposit Paid ($AUD)', type: 'currency', required: true, placeholder: '85000' },
          { key: 'contract_date', label: 'Contract Date', type: 'date', required: true },
          { key: 'finance_date', label: 'Finance Due Date', type: 'date', required: false },
          { key: 'building_pest_date', label: 'Building & Pest Due Date', type: 'date', required: false },
          { key: 'settlement_date', label: 'Settlement Date', type: 'date', required: true },
          { key: 'vendor_solicitor', label: 'Vendor Solicitor Firm', type: 'text', required: false }
        ]
      },
      {
        type: 'conveyancing_sale',
        label: 'Property Sale Conveyancing',
        description: 'Acting for the vendor in preparing contract documentation and completing settlement.',
        recommendedDocumentCategories: ['contract_of_sale', 'identity_document', 'supporting_document'],
        customFieldDefinitions: [
          { key: 'property_address', label: 'Subject Property Address', type: 'text', required: true },
          { key: 'sale_price', label: 'Sale Price ($AUD)', type: 'currency', required: true },
          { key: 'settlement_date', label: 'Settlement Date', type: 'date', required: true },
          { key: 'mortgagee_release', label: 'Discharging Bank/Mortgagee', type: 'text', required: false }
        ]
      }
    ],
    universalFieldRecommendations: [
      { key: 'client_legal_name', label: 'Client Legal Full Name', category: 'identity', description: 'Exact full name matching title or identification.' },
      { key: 'property_address', label: 'Property Street Address', category: 'property', description: 'Physical address of the transacting parcel.' },
      { key: 'title_reference', label: 'Title Reference / Volume & Folio', category: 'property', description: 'State Land Titles registry unique identifier.' },
      { key: 'settlement_date', label: 'Scheduled Settlement Date', category: 'legal', description: 'Agreed settlement completion date.' },
      { key: 'contract_price', label: 'Contract Consideration Price', category: 'financial', description: 'Total purchase/sale amount in AUD.' }
    ]
  },

  real_estate: {
    id: 'real_estate',
    name: 'Real Estate & Property Management',
    description: 'Agency agreements, residential sales listings, leasing applications, tenancy agreements, and compliance notices.',
    iconName: 'Building2',
    supportedMatterTypes: [
      {
        type: 'tenancy_application',
        label: 'Residential Tenancy Application',
        description: 'Prospective tenant application, references, identity verification, and affordability checks.',
        recommendedDocumentCategories: ['identity_document', 'income_payslip', 'supporting_document'],
        customFieldDefinitions: [
          { key: 'property_address', label: 'Rental Property Address', type: 'text', required: true },
          { key: 'proposed_rent_weekly', label: 'Proposed Weekly Rent ($AUD)', type: 'currency', required: true },
          { key: 'tenancy_term_months', label: 'Lease Term (Months)', type: 'number', required: true, placeholder: '12' },
          { key: 'commencement_date', label: 'Commencement Date', type: 'date', required: true },
          { key: 'bond_amount', label: 'Bond Amount ($AUD)', type: 'currency', required: true }
        ]
      },
      {
        type: 'property_sale',
        label: 'Property Agency & Listing File',
        description: 'Managing sales appointment (e.g. QLD Form 6), buyer offers, and exchange records.',
        recommendedDocumentCategories: ['contract_of_sale', 'supporting_document'],
        customFieldDefinitions: [
          { key: 'property_address', label: 'Property Address', type: 'text', required: true },
          { key: 'vendor_names', label: 'Registered Owners / Vendors', type: 'text', required: true },
          { key: 'listing_price_guide', label: 'Listing Price Guide ($AUD)', type: 'text', required: true },
          { key: 'commission_rate', label: 'Agreed Commission (%)', type: 'text', required: false }
        ]
      }
    ],
    universalFieldRecommendations: [
      { key: 'applicant_full_name', label: 'Applicant / Buyer Full Name', category: 'identity', description: 'Full legal name.' },
      { key: 'property_address', label: 'Property Street Address', category: 'property', description: 'Target property address.' },
      { key: 'weekly_rental_amount', label: 'Weekly Rental Amount', category: 'financial', description: 'Weekly rent payable in AUD.' },
      { key: 'bond_lodgement_amount', label: 'Rental Bond Amount', category: 'financial', description: '4-week bond lodgement amount.' }
    ]
  },

  universal: {
    id: 'universal',
    name: 'Universal Document & Compliance Engine',
    description: 'Configurable cross-industry document parsing, custom template building, and arbitrary regulatory workflows.',
    iconName: 'FileCheck',
    supportedMatterTypes: [
      {
        type: 'general_compliance',
        label: 'General Document & Compliance File',
        description: 'Universal intake for any document extraction, verification, and PDF population.',
        recommendedDocumentCategories: ['identity_document', 'income_payslip', 'bank_statement', 'contract_of_sale', 'supporting_document'],
        customFieldDefinitions: [
          { key: 'file_subject', label: 'Subject / Transaction Title', type: 'text', required: true },
          { key: 'department', label: 'Business Unit / Department', type: 'text', required: false }
        ]
      }
    ],
    universalFieldRecommendations: [
      { key: 'full_legal_name', label: 'Full Legal Name', category: 'identity', description: 'Primary entity or person legal name.' },
      { key: 'reference_number', label: 'Reference Number', category: 'legal', description: 'Unique case or document identifier.' }
    ]
  }
};
