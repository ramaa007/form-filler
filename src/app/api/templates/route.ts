// src/app/api/templates/route.ts
import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/store/repository';
import { PdfTemplate, PdfTemplateFieldMapping } from '@/types/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId') || 'org-mortgage-prime';
  const templateId = searchParams.get('templateId');
  const repo = getRepository();

  if (templateId) {
    const template = repo.getTemplate(orgId, templateId);
    if (!template) {
      return NextResponse.json({ error: 'Template not found.' }, { status: 404 });
    }
    return NextResponse.json({ template });
  }

  const templates = repo.getTemplates(orgId);
  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orgId = body.organisation_id || 'org-mortgage-prime';
    const repo = getRepository();

    if (!body.name || !body.industry_type) {
      return NextResponse.json({ error: 'Name and Industry Type are required.' }, { status: 400 });
    }

    const templateId = `tpl-${Date.now()}`;
    const newTemplate: PdfTemplate = {
      id: templateId,
      organisation_id: orgId,
      name: body.name,
      industry_type: body.industry_type,
      jurisdiction: body.jurisdiction || 'AU-QLD',
      description: body.description || null,
      storage_path: `templates/${templateId}.pdf`,
      template_type: body.template_type || 'acroform',
      version: 1,
      status: 'draft',
      page_count: body.page_count || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    repo.saveTemplate(newTemplate);

    // Save field mappings if provided
    if (Array.isArray(body.mappings)) {
      for (const m of body.mappings) {
        const mappingId = `map-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const mapRecord: PdfTemplateFieldMapping = {
          id: mappingId,
          template_id: templateId,
          field_name: m.field_name,
          target_type: m.target_type || 'acroform',
          source_binding: m.source_binding,
          static_fallback_value: m.static_fallback_value || null,
          is_required: Boolean(m.is_required),
          formatting_rule: m.formatting_rule || null,
          page_number: m.page_number || 1,
          coordinate_x: m.coordinate_x || null,
          coordinate_y: m.coordinate_y || null,
          width: m.width || null,
          height: m.height || null,
          font_size: m.font_size || 10,
          alignment: m.alignment || 'left',
          created_at: new Date().toISOString()
        };
        repo.saveTemplateMapping(mapRecord);
      }
    }

    repo.recordAuditEvent({
      id: `audit-${Date.now()}`,
      organisation_id: orgId,
      action: 'template.created',
      resource_type: 'pdf_template',
      resource_id: templateId,
      details: { name: newTemplate.name, type: newTemplate.template_type },
      created_at: new Date().toISOString()
    });

    const populated = repo.getTemplate(orgId, templateId);
    return NextResponse.json({ template: populated }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
