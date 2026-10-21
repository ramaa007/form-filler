// src/app/api/documents/verify-field/route.ts
import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/store/repository';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      field_id, 
      organisation_id = 'org-mortgage-prime', 
      status, // 'verified' | 'rejected' | 'conflict'
      corrected_value,
      sync_to_client_profile = false,
      client_id
    } = body;

    if (!field_id || !status) {
      return NextResponse.json({ error: 'field_id and status are required.' }, { status: 400 });
    }

    const repo = getRepository();
    const fields = repo.getExtractedFields(organisation_id);
    const target = fields.find(f => f.id === field_id);

    if (!target) {
      return NextResponse.json({ error: 'Extracted field not found.' }, { status: 404 });
    }

    target.verification_status = status;
    if (corrected_value !== undefined) {
      target.extracted_value = corrected_value;
    }
    target.verified_by = 'human_reviewer';
    target.verified_at = new Date().toISOString();

    repo.saveExtractedField(target);

    // If verified and user chose to sync into client universal profile
    if (status === 'verified' && sync_to_client_profile && client_id) {
      const client = repo.getClient(organisation_id, client_id);
      if (client) {
        client.universal_profile = {
          ...client.universal_profile,
          [target.field_key]: target.extracted_value
        };
        client.updated_at = new Date().toISOString();
        repo.saveClient(client);
      }
    }

    repo.recordAuditEvent({
      id: `audit-${Date.now()}`,
      organisation_id,
      action: 'field.verified',
      resource_type: 'extracted_field',
      resource_id: target.id,
      details: {
        field_key: target.field_key,
        status,
        synced_to_client: sync_to_client_profile
      },
      created_at: new Date().toISOString()
    });

    return NextResponse.json({ success: true, field: target });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
