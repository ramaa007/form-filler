// src/app/api/auth/session/route.ts
import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/store/repository';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repo = getRepository();

  const orgs = repo.getOrganisations();
  const selectedOrgId = searchParams.get('orgId') || orgs[0]?.id || 'org-mortgage-prime';
  const activeOrg = repo.getOrganisation(selectedOrgId) || orgs[0];

  return NextResponse.json({
    user: {
      id: 'usr-admin-demo',
      email: 'alex.director@universalplatform.com.au',
      full_name: 'Alex Sterling',
      role: 'org_owner'
    },
    activeOrganisation: activeOrg,
    accessibleOrganisations: orgs.map(o => ({
      id: o.id,
      name: o.name,
      industry_type: o.industry_type,
      jurisdiction: o.jurisdiction
    }))
  });
}
