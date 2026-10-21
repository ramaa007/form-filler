# Database Architecture & Migrations

The database is powered by PostgreSQL with version-controlled migrations in `supabase/migrations/`.

## Tables

1. `organisations`: Multi-tenant business accounts with slug, branding JSON, retention policy days, and default jurisdiction.
2. `profiles`: User account details linked to `auth.users`.
3. `organisation_memberships`: Role-based membership linking users to organisations with roles (`platform_admin`, `org_owner`, `org_admin`, `staff`, `compliance_officer`, `client_portal`).
4. `clients`: Permanent, reusable universal client profiles storing contact, address, identification, employment, and extensible universal attributes.
5. `matters`: Case files and transactions (mortgage applications, conveyancing purchases/sales, residential tenancies).
6. `documents`: Ingested source PDF documents, blank templates, and category classifications.
7. `extracted_fields`: Granular AI-extracted attributes with evidence snippets, confidence scores, and verification status (`unverified`, `verified`, `conflict`, `rejected`).
8. `pdf_templates`: Reusable AcroForm or flat coordinate form templates.
9. `pdf_template_field_mappings`: Bindings between PDF target fields and client/matter source paths with formatting rules.
10. `generated_documents`: Generated draft and final PDF documents with approval status (`awaiting_approval`, `approved`, `rejected`).
11. `compliance_rules`: Configurable statutory rules, versions, conditions, and severity.
12. `compliance_assessments`: Immutable audit records of matter rule assessments.
13. `audit_events`: Immutable audit trail for all tenant actions.

## Row Level Security (RLS)

All tables have RLS enabled using the helper function:

```sql
CREATE OR REPLACE FUNCTION public.get_auth_user_org_ids()
RETURNS TABLE (organisation_id UUID) 
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
    SELECT organisation_id 
    FROM public.organisation_memberships 
    WHERE user_id = auth.uid() 
      AND status = 'active';
$$;
```

Policies enforce:
```sql
CREATE POLICY "Tenant Data Isolation" 
ON public.clients FOR ALL 
USING (organisation_id IN (SELECT organisation_id FROM public.get_auth_user_org_ids()));
```
