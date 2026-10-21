// src/app/api/organisations/route.ts
import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/store/repository';
import { Organisation } from '@/types/database';

export async function GET(request: Request) {
  const repo = getRepository();
  const orgs = repo.getOrganisations();
  return NextResponse.json({ organisations: orgs });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const repo = getRepository();

    if (!body.name || !body.industry_type) {
      return NextResponse.json({ error: 'Name and Industry Type are required.' }, { status: 400 });
    }

    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newOrg: Organisation = {
      id: `org-${Date.now()}`,
      name: body.name,
      slug,
      industry_type: body.industry_type,
      jurisdiction: body.jurisdiction || 'AU-QLD',
      branding: {
        product_name: body.branding?.product_name || `${body.name} Portal`,
        primary_color: body.branding?.primary_color || '#2563eb',
        logo_url: body.branding?.logo_url || null
      },
      retention_policy_days: Number(body.retention_policy_days) || 365,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    repo.createOrganisation(newOrg);

    repo.recordAuditEvent({
      id: `audit-${Date.now()}`,
      organisation_id: newOrg.id,
      action: 'organisation.created',
      resource_type: 'organisation',
      resource_id: newOrg.id,
      details: { name: newOrg.name, industry: newOrg.industry_type },
      created_at: new Date().toISOString()
    });

    return NextResponse.json({ organisation: newOrg }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
