// src/app/api/matters/route.ts
import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/store/repository';
import { Matter } from '@/types/database';
import { ComplianceEngine } from '@/lib/compliance/engine';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId') || 'org-mortgage-prime';
  const matterId = searchParams.get('matterId');
  const repo = getRepository();

  if (matterId) {
    const matter = repo.getMatter(orgId, matterId);
    if (!matter) {
      return NextResponse.json({ error: 'Matter not found in organisation.' }, { status: 404 });
    }

    const client = repo.getClient(orgId, matter.client_id);
    const documents = repo.getDocuments(orgId, matterId);
    const extractedFields = repo.getExtractedFields(orgId);
    const generatedDocs = repo.getGeneratedDocuments(orgId, matterId);
    const rules = repo.getComplianceRules(orgId, matter.matter_type.includes('mortgage') ? 'mortgage_finance' : matter.matter_type.includes('conveyancing') ? 'solicitor_conveyancing' : 'real_estate', matter.jurisdiction);

    const complianceReport = client ? ComplianceEngine.evaluateMatter({
      matter,
      client,
      rules,
      documents,
      extractedFields
    }) : null;

    return NextResponse.json({
      matter,
      client,
      documents,
      extractedFields,
      generatedDocs,
      complianceReport
    });
  }

  const matters = repo.getMatters(orgId).map(m => {
    const client = repo.getClient(orgId, m.client_id);
    const docs = repo.getDocuments(orgId, m.id);
    return {
      ...m,
      client_name: client?.primary_name || 'Unknown Client',
      document_count: docs.length
    };
  });

  return NextResponse.json({ matters });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orgId = body.organisation_id || 'org-mortgage-prime';
    const repo = getRepository();

    if (!body.title || !body.client_id || !body.matter_type) {
      return NextResponse.json({ error: 'Title, Client, and Matter Type are required.' }, { status: 400 });
    }

    const refNum = `MAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newMatter: Matter = {
      id: `matter-${Date.now()}`,
      organisation_id: orgId,
      client_id: body.client_id,
      matter_type: body.matter_type,
      title: body.title,
      reference_number: body.reference_number || refNum,
      jurisdiction: body.jurisdiction || 'AU-QLD',
      status: 'open',
      matter_data: body.matter_data || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    repo.saveMatter(newMatter);

    repo.recordAuditEvent({
      id: `audit-${Date.now()}`,
      organisation_id: orgId,
      action: 'matter.created',
      resource_type: 'matter',
      resource_id: newMatter.id,
      details: { title: newMatter.title, reference: newMatter.reference_number },
      created_at: new Date().toISOString()
    });

    return NextResponse.json({ matter: newMatter }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
