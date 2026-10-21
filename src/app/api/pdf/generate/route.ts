// src/app/api/pdf/generate/route.ts
import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/store/repository';
import { UniversalPdfEngine } from '@/lib/pdf/engine';
import { GeneratedDocument } from '@/types/database';
import { FlatCoordinatePlacement } from '@/types/pdf';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId') || 'org-mortgage-prime';
  const matterId = searchParams.get('matterId') || undefined;
  const repo = getRepository();

  const generatedDocs = repo.getGeneratedDocuments(orgId, matterId);
  return NextResponse.json({ generatedDocs });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      organisation_id = 'org-mortgage-prime', 
      matter_id, 
      template_id, 
      generation_type = 'draft', 
      custom_overrides = {},
      apply_draft_watermark = (generation_type === 'draft')
    } = body;

    if (!matter_id || !template_id) {
      return NextResponse.json({ error: 'matter_id and template_id are required.' }, { status: 400 });
    }

    const repo = getRepository();
    const matter = repo.getMatter(organisation_id, matter_id);
    if (!matter) {
      return NextResponse.json({ error: 'Matter not found.' }, { status: 404 });
    }

    const client = repo.getClient(organisation_id, matter.client_id);
    if (!client) {
      return NextResponse.json({ error: 'Associated client record not found.' }, { status: 404 });
    }

    const template = repo.getTemplate(organisation_id, template_id);
    if (!template) {
      return NextResponse.json({ error: 'Template not found.' }, { status: 404 });
    }

    // 1. Resolve Data Bindings
    const resolvedValues: Record<string, any> = {};
    const missingRequired: string[] = [];
    const formattingRules: Record<string, string> = {};
    const coordinatePlacements: FlatCoordinatePlacement[] = [];

    const mappings = template.mappings || [];

    for (const mapping of mappings) {
      let value: any = undefined;

      // Resolve source binding
      const binding = mapping.source_binding;
      if (binding.startsWith('client.')) {
        const path = binding.replace('client.', '');
        if (path === 'primary_name') value = client.primary_name;
        else if (path === 'email') value = client.email;
        else if (path === 'phone') value = client.phone;
        else if (path === 'date_of_birth') value = client.date_of_birth;
        else if (path === 'residential_address') {
          value = client.residential_address 
            ? `${client.residential_address.street}, ${client.residential_address.suburb} ${client.residential_address.state} ${client.residential_address.postcode}`
            : '';
        } else if (path.startsWith('employment.')) {
          const empProp = path.replace('employment.', '');
          value = (client.employment_details as any)?.[empProp];
        } else {
          value = client.universal_profile[path];
        }
      } else if (binding.startsWith('matter.')) {
        const path = binding.replace('matter.', '');
        value = matter.matter_data[path] ?? (matter as any)[path];
      } else if (binding === 'static') {
        value = mapping.static_fallback_value;
      }

      // Check overrides
      if (custom_overrides[mapping.field_name] !== undefined) {
        value = custom_overrides[mapping.field_name];
      }

      // Fallback
      if ((value === undefined || value === null || value === '') && mapping.static_fallback_value) {
        value = mapping.static_fallback_value;
      }

      // Check required constraints for final generation
      if (mapping.is_required && (value === undefined || value === null || value === '')) {
        missingRequired.push(mapping.field_name);
      }

      resolvedValues[mapping.field_name] = value;
      if (mapping.formatting_rule) {
        formattingRules[mapping.field_name] = mapping.formatting_rule;
      }

      if (mapping.target_type === 'coordinate_overlay' && mapping.coordinate_x !== null && mapping.coordinate_y !== null) {
        coordinatePlacements.push({
          id: mapping.id,
          fieldName: mapping.field_name,
          binding: mapping.source_binding,
          pageNumber: mapping.page_number,
          x: Number(mapping.coordinate_x),
          y: Number(mapping.coordinate_y),
          width: Number(mapping.width || 150),
          height: Number(mapping.height || 20),
          fontSize: Number(mapping.font_size || 10),
          alignment: mapping.alignment || 'left',
          formatting: mapping.formatting_rule as any,
          staticValue: mapping.static_fallback_value || undefined
        });
      }
    }

    // If final generation has missing required fields, halt and return clear validation errors
    if (generation_type === 'final' && missingRequired.length > 0) {
      return NextResponse.json({
        error: 'Validation failed: Required form fields are missing.',
        missing_required_fields: missingRequired
      }, { status: 422 });
    }

    // 2. Generate or Load Blank PDF Template Buffer
    let templateBytes: Uint8Array;
    // For universal standalone execution, create base template from synthetic blank
    templateBytes = await UniversalPdfEngine.createSyntheticBlankForm(
      template.name,
      template.industry_type,
      template.jurisdiction
    );

    // 3. Process AcroForm Filling
    let filledBytes = await UniversalPdfEngine.fillAcroForm(
      templateBytes,
      resolvedValues,
      formattingRules,
      false
    );

    // 4. Process Coordinate Overlays (if flat PDF fields configured)
    if (coordinatePlacements.length > 0) {
      filledBytes = await UniversalPdfEngine.overlayCoordinates(
        filledBytes,
        coordinatePlacements,
        resolvedValues
      );
    }

    // 5. Apply Legal Draft Watermark if draft mode
    if (apply_draft_watermark) {
      filledBytes = await UniversalPdfEngine.applyDraftWatermark(filledBytes, 'DRAFT - NOT FOR EXECUTION');
    }

    // 6. Save Generated Document Record
    const genDocId = `gendoc-${Date.now()}`;
    const fileName = `${matter.reference_number}_${template.name.replace(/[^a-zA-Z0-9]+/g, '_')}_${generation_type.toUpperCase()}.pdf`;
    const storagePath = `${organisation_id}/${matter.id}/generated/${fileName}`;

    const genDocRecord: GeneratedDocument = {
      id: genDocId,
      organisation_id,
      matter_id: matter.id,
      template_id: template.id,
      template_version: template.version,
      storage_path: storagePath,
      file_name: fileName,
      generation_type,
      approval_status: generation_type === 'draft' ? 'draft' : 'awaiting_approval',
      created_at: new Date().toISOString()
    };

    repo.saveGeneratedDocument(genDocRecord);

    repo.recordAuditEvent({
      id: `audit-${Date.now()}`,
      organisation_id,
      action: 'pdf.generated',
      resource_type: 'generated_document',
      resource_id: genDocId,
      details: {
        template_name: template.name,
        generation_type,
        missing_fields: missingRequired,
        file_size_bytes: filledBytes.length
      },
      created_at: new Date().toISOString()
    });

    const base64 = Buffer.from(filledBytes).toString('base64');

    return NextResponse.json({
      success: true,
      generated_document: genDocRecord,
      file_name: fileName,
      file_size_bytes: filledBytes.length,
      pdf_base64: base64,
      missing_fields: missingRequired,
      warnings: missingRequired.length > 0 ? [`Warning: ${missingRequired.length} field(s) were blank.`] : []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
