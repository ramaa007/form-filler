// src/app/api/compliance/evaluate/route.ts
import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/store/repository';
import { ComplianceEngine } from '@/lib/compliance/engine';
import { ComplianceAssessment } from '@/types/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { organisation_id = 'org-mortgage-prime', matter_id } = body;

    if (!matter_id) {
      return NextResponse.json({ error: 'matter_id is required.' }, { status: 400 });
    }

    const repo = getRepository();
    const matter = repo.getMatter(organisation_id, matter_id);
    if (!matter) {
      return NextResponse.json({ error: 'Matter not found.' }, { status: 404 });
    }

    const client = repo.getClient(organisation_id, matter.client_id);
    if (!client) {
      return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
    }

    const documents = repo.getDocuments(organisation_id, matter_id);
    const extractedFields = repo.getExtractedFields(organisation_id);
    const rules = repo.getComplianceRules(
      organisation_id, 
      matter.matter_type.includes('mortgage') ? 'mortgage_finance' : matter.matter_type.includes('conveyancing') ? 'solicitor_conveyancing' : 'real_estate', 
      matter.jurisdiction
    );

    const report = ComplianceEngine.evaluateMatter({
      matter,
      client,
      documents,
      extractedFields,
      rules
    });

    // Save individual assessment records
    for (const ev of report.evaluations) {
      const assessment: ComplianceAssessment = {
        id: `assess-${matter.id}-${ev.ruleId}`,
        organisation_id,
        matter_id: matter.id,
        rule_id: ev.ruleId,
        rule_version: ev.ruleVersion,
        assessment_status: ev.status,
        notes: ev.notes,
        evidence_references: ev.evidenceReferences,
        assessed_at: new Date().toISOString()
      };
      repo.saveComplianceAssessment(assessment);
    }

    repo.recordAuditEvent({
      id: `audit-${Date.now()}`,
      organisation_id,
      action: 'compliance.evaluated',
      resource_type: 'matter',
      resource_id: matter.id,
      details: {
        overall_status: report.overallStatus,
        total_rules: report.totalRules,
        verified: report.verifiedCount,
        incomplete: report.incompleteCount
      },
      created_at: new Date().toISOString()
    });

    return NextResponse.json({ report });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
