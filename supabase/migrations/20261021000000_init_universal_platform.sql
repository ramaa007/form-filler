-- Migration: 20261021000000_init_universal_platform.sql
-- Universal AI Document Platform: Complete Multi-Tenant Database Schema with Row Level Security (RLS)

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Organizations Table
CREATE TABLE IF NOT EXISTS public.organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    industry_type TEXT NOT NULL CHECK (industry_type IN ('mortgage_finance', 'solicitor_conveyancing', 'real_estate', 'universal')),
    jurisdiction TEXT NOT NULL DEFAULT 'AU-QLD',
    branding JSONB NOT NULL DEFAULT '{"product_name": "Universal AI Document Platform", "primary_color": "#2563eb", "logo_url": null}'::jsonb,
    retention_policy_days INTEGER NOT NULL DEFAULT 365,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. User Profiles Table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Organization Memberships Table
CREATE TABLE IF NOT EXISTS public.organisation_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('platform_admin', 'org_owner', 'org_admin', 'staff', 'compliance_officer', 'client_portal')),
    permissions TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(organisation_id, user_id)
);

-- 5. Clients Table (Universal identity profiles)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    client_type TEXT NOT NULL CHECK (client_type IN ('individual', 'joint', 'business', 'trust')),
    primary_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    date_of_birth DATE,
    residential_address JSONB,
    postal_address JSONB,
    identification_details JSONB,
    employment_details JSONB,
    business_details JSONB,
    universal_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    portal_access_enabled BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Matters / Transactions Table
CREATE TABLE IF NOT EXISTS public.matters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    matter_type TEXT NOT NULL CHECK (matter_type IN (
        'mortgage_application',
        'conveyancing_purchase',
        'conveyancing_sale',
        'tenancy_application',
        'lease_agreement',
        'property_sale',
        'commercial_finance',
        'general_compliance'
    )),
    title TEXT NOT NULL,
    reference_number TEXT NOT NULL,
    jurisdiction TEXT NOT NULL DEFAULT 'AU-QLD',
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'pending_documents', 'under_review', 'approved', 'settled', 'archived', 'cancelled')),
    matter_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    assigned_staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Documents Table (PDF uploads, blank templates, supporting docs)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    matter_id UUID REFERENCES public.matters(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'application/pdf',
    storage_path TEXT NOT NULL,
    document_category TEXT NOT NULL CHECK (document_category IN (
        'identity_document',
        'income_payslip',
        'bank_statement',
        'contract_of_sale',
        'tenancy_agreement',
        'blank_form_template',
        'supporting_document',
        'other'
    )),
    page_count INTEGER NOT NULL DEFAULT 1,
    is_encrypted BOOLEAN NOT NULL DEFAULT false,
    extraction_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (extraction_status IN (
        'uploaded',
        'processing',
        'extracted',
        'awaiting_review',
        'verified',
        'failed',
        'archived'
    )),
    error_message TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Extracted Fields Table (Traceable AI extractions)
CREATE TABLE IF NOT EXISTS public.extracted_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    field_key TEXT NOT NULL,
    field_label TEXT NOT NULL,
    extracted_value TEXT,
    normalized_value JSONB,
    source_page INTEGER,
    evidence_text TEXT,
    confidence_score NUMERIC(4,3),
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'conflict', 'rejected')),
    conflict_details TEXT,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. PDF Templates Table
CREATE TABLE IF NOT EXISTS public.pdf_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    industry_type TEXT NOT NULL,
    jurisdiction TEXT NOT NULL DEFAULT 'AU-QLD',
    description TEXT,
    storage_path TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK (template_type IN ('acroform', 'flat_coordinates', 'hybrid')),
    version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'retired')),
    page_count INTEGER NOT NULL DEFAULT 1,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. PDF Template Field Mappings Table
CREATE TABLE IF NOT EXISTS public.pdf_template_field_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.pdf_templates(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('acroform', 'coordinate_overlay')),
    source_binding TEXT NOT NULL,
    static_fallback_value TEXT,
    is_required BOOLEAN NOT NULL DEFAULT false,
    formatting_rule TEXT,
    page_number INTEGER NOT NULL DEFAULT 1,
    coordinate_x NUMERIC(8,2),
    coordinate_y NUMERIC(8,2),
    width NUMERIC(8,2),
    height NUMERIC(8,2),
    font_size NUMERIC(5,2) DEFAULT 10,
    alignment TEXT DEFAULT 'left' CHECK (alignment IN ('left', 'center', 'right')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. Generated Documents Table
CREATE TABLE IF NOT EXISTS public.generated_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    matter_id UUID NOT NULL REFERENCES public.matters(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.pdf_templates(id) ON DELETE RESTRICT,
    template_version INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    generation_type TEXT NOT NULL CHECK (generation_type IN ('draft', 'final')),
    approval_status TEXT NOT NULL DEFAULT 'awaiting_approval' CHECK (approval_status IN ('draft', 'awaiting_approval', 'approved', 'rejected')),
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    approval_notes TEXT,
    generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. Compliance Rules Table
CREATE TABLE IF NOT EXISTS public.compliance_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
    rule_code TEXT NOT NULL,
    name TEXT NOT NULL,
    industry_type TEXT NOT NULL,
    jurisdiction TEXT NOT NULL DEFAULT 'AU-QLD',
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'retired')),
    description TEXT NOT NULL,
    source_reference TEXT,
    condition_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    severity TEXT NOT NULL CHECK (severity IN ('mandatory', 'warning', 'advisory')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. Compliance Assessments Table
CREATE TABLE IF NOT EXISTS public.compliance_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    matter_id UUID NOT NULL REFERENCES public.matters(id) ON DELETE CASCADE,
    rule_id UUID NOT NULL REFERENCES public.compliance_rules(id) ON DELETE RESTRICT,
    rule_version INTEGER NOT NULL,
    assessment_status TEXT NOT NULL CHECK (assessment_status IN (
        'not_assessed',
        'incomplete',
        'awaiting_review',
        'needs_correction',
        'exception_requiring_review',
        'verified_complete',
        'not_applicable'
    )),
    notes TEXT,
    evidence_references JSONB NOT NULL DEFAULT '[]'::jsonb,
    exception_reason TEXT,
    assessed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. Audit Events Table
CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisation_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_template_field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Helper security function: Get all active organisation IDs for current authenticated user
CREATE OR REPLACE FUNCTION public.get_auth_user_org_ids()
RETURNS TABLE (organisation_id UUID) 
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organisation_id 
    FROM public.organisation_memberships 
    WHERE user_id = auth.uid() 
      AND status = 'active';
$$;

-- RLS: Profiles
CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- RLS: Organisations
CREATE POLICY "Users can view organisations they belong to" 
    ON public.organisations FOR SELECT 
    USING (id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

-- RLS: Organisation Memberships
CREATE POLICY "Members can view membership within their organisation" 
    ON public.organisation_memberships FOR SELECT 
    USING (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

-- RLS: Clients
CREATE POLICY "Members can view clients in their organisation" 
    ON public.clients FOR SELECT 
    USING (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

CREATE POLICY "Members can insert clients in their organisation" 
    ON public.clients FOR INSERT 
    WITH CHECK (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

CREATE POLICY "Members can update clients in their organisation" 
    ON public.clients FOR UPDATE 
    USING (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

CREATE POLICY "Members can delete clients in their organisation" 
    ON public.clients FOR DELETE 
    USING (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

-- RLS: Matters
CREATE POLICY "Members can view matters in their organisation" 
    ON public.matters FOR SELECT 
    USING (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

CREATE POLICY "Members can insert matters in their organisation" 
    ON public.matters FOR INSERT 
    WITH CHECK (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

CREATE POLICY "Members can update matters in their organisation" 
    ON public.matters FOR UPDATE 
    USING (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

CREATE POLICY "Members can delete matters in their organisation" 
    ON public.matters FOR DELETE 
    USING (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

-- RLS: Documents
CREATE POLICY "Members can view documents in their organisation" 
    ON public.documents FOR SELECT 
    USING (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

CREATE POLICY "Members can insert documents in their organisation" 
    ON public.documents FOR INSERT 
    WITH CHECK (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

CREATE POLICY "Members can update documents in their organisation" 
    ON public.documents FOR UPDATE 
    USING (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

CREATE POLICY "Members can delete documents in their organisation" 
    ON public.documents FOR DELETE 
    USING (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

-- RLS: Extracted Fields
CREATE POLICY "Members can view extracted fields in their organisation" 
    ON public.extracted_fields FOR SELECT 
    USING (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

CREATE POLICY "Members can modify extracted fields in their organisation" 
    ON public.extracted_fields FOR ALL 
    USING (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

-- RLS: PDF Templates
CREATE POLICY "Members can view PDF templates in their organisation" 
    ON public.pdf_templates FOR SELECT 
    USING (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

CREATE POLICY "Members can modify PDF templates in their organisation" 
    ON public.pdf_templates FOR ALL 
    USING (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

-- RLS: PDF Template Field Mappings
CREATE POLICY "Members can view field mappings for accessible templates" 
    ON public.pdf_template_field_mappings FOR ALL 
    USING (template_id IN (
        SELECT id FROM public.pdf_templates 
        WHERE organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids())
    ));

-- RLS: Generated Documents
CREATE POLICY "Members can view generated documents in their organisation" 
    ON public.generated_documents FOR SELECT 
    USING (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

CREATE POLICY "Members can insert generated documents in their organisation" 
    ON public.generated_documents FOR INSERT 
    WITH CHECK (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

CREATE POLICY "Members can update generated documents in their organisation" 
    ON public.generated_documents FOR UPDATE 
    USING (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

-- RLS: Compliance Rules
CREATE POLICY "Members can view global or organisation compliance rules" 
    ON public.compliance_rules FOR SELECT 
    USING (organisation_id IS NULL OR organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

CREATE POLICY "Members can manage organisation compliance rules" 
    ON public.compliance_rules FOR ALL 
    USING (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

-- RLS: Compliance Assessments
CREATE POLICY "Members can view compliance assessments in their organisation" 
    ON public.compliance_assessments FOR SELECT 
    USING (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

CREATE POLICY "Members can manage compliance assessments in their organisation" 
    ON public.compliance_assessments FOR ALL 
    USING (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

-- RLS: Audit Events
CREATE POLICY "Members can view audit events in their organisation" 
    ON public.audit_events FOR SELECT 
    USING (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

CREATE POLICY "System can record audit events in organisation" 
    ON public.audit_events FOR INSERT 
    WITH CHECK (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_memberships_user_org ON public.organisation_memberships (user_id, organisation_id);
CREATE INDEX IF NOT EXISTS idx_clients_org ON public.clients (organisation_id);
CREATE INDEX IF NOT EXISTS idx_matters_org_client ON public.matters (organisation_id, client_id);
CREATE INDEX IF NOT EXISTS idx_documents_org_matter ON public.documents (organisation_id, matter_id);
CREATE INDEX IF NOT EXISTS idx_extracted_fields_doc ON public.extracted_fields (document_id);
CREATE INDEX IF NOT EXISTS idx_pdf_mappings_template ON public.pdf_template_field_mappings (template_id);
CREATE INDEX IF NOT EXISTS idx_compliance_assessments_matter ON public.compliance_assessments (matter_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_org ON public.audit_events (organisation_id, created_at DESC);
