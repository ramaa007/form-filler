// src/app/api/clients/route.ts
import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/store/repository';
import { Client } from '@/types/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId') || 'org-mortgage-prime';
  const repo = getRepository();

  const clients = repo.getClients(orgId);
  return NextResponse.json({ clients });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orgId = body.organisation_id || 'org-mortgage-prime';
    const repo = getRepository();

    if (!body.primary_name) {
      return NextResponse.json({ error: 'Client primary name is required.' }, { status: 400 });
    }

    const newClient: Client = {
      id: `client-${Date.now()}`,
      organisation_id: orgId,
      client_type: body.client_type || 'individual',
      primary_name: body.primary_name,
      email: body.email || null,
      phone: body.phone || null,
      date_of_birth: body.date_of_birth || null,
      residential_address: body.residential_address || null,
      postal_address: body.postal_address || null,
      identification_details: body.identification_details || null,
      employment_details: body.employment_details || null,
      business_details: body.business_details || null,
      universal_profile: body.universal_profile || {
        full_legal_name: body.primary_name,
        date_of_birth: body.date_of_birth || null
      },
      portal_access_enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    repo.saveClient(newClient);

    repo.recordAuditEvent({
      id: `audit-${Date.now()}`,
      organisation_id: orgId,
      action: 'client.created',
      resource_type: 'client',
      resource_id: newClient.id,
      details: { primary_name: newClient.primary_name, client_type: newClient.client_type },
      created_at: new Date().toISOString()
    });

    return NextResponse.json({ client: newClient }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
