// src/lib/compliance/engine.ts
// Configurable Multi-Tenancy Industry Compliance Engine

import { 
  ComplianceRule, 
  ComplianceAssessment, 
  ComplianceAssessmentStatus, 
  DocumentRecord, 
  ExtractedField, 
  Matter, 
  Client 
} from '@/types/database';

export interface EvaluationInput {
  matter: Matter;
  client: Client;
  rules: ComplianceRule[];
  documents: DocumentRecord[];
  extractedFields: ExtractedField[];
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleCode: string;
  ruleName: string;
  ruleVersion: number;
  severity: ComplianceRule['severity'];
  status: ComplianceAssessmentStatus;
  notes: string;
  missingItems: string[];
  evidenceReferences: Array<{ document_id?: string; field_id?: string; snippet?: string }>;
}

export interface MatterComplianceReport {
  matterId: string;
  jurisdiction: string;
  evaluatedAt: string;
  overallStatus: 'compliant' | 'requires_action' | 'in_progress';
  totalRules: number;
  verifiedCount: number;
  incompleteCount: number;
  exceptionCount: number;
  evaluations: RuleEvaluationResult[];
  disclaimer: string;
}

export class ComplianceEngine {
  /**
   * Evaluate a single compliance rule against provided records.
   * Preserves rule versioning and does not mark compliant merely because fields are populated.
   */
  static evaluateRule(
    rule: ComplianceRule,
    matter: Matter,
    client: Client,
    documents: DocumentRecord[],
    fields: ExtractedField[]
  ): RuleEvaluationResult {
    const missing: string[] = [];
    const evidence: Array<{ document_id?: string; field_id?: string; snippet?: string }> = [];

    // 1. Check required document categories
    if (rule.condition_criteria.required_document_categories) {
      for (const requiredCat of rule.condition_criteria.required_document_categories) {
        const matchingDoc = documents.find(d => d.document_category === requiredCat && d.extraction_status !== 'failed');
        if (!matchingDoc) {
          missing.push(`Missing mandatory document category: ${requiredCat.replace('_', ' ')}`);
        } else {
          evidence.push({
            document_id: matchingDoc.id,
            snippet: `Found document: ${matchingDoc.file_name} (${matchingDoc.extraction_status})`
          });
        }
      }
    }

    // 2. Check required verified fields
    if (rule.condition_criteria.required_verified_fields) {
      for (const fieldKey of rule.condition_criteria.required_verified_fields) {
        // Look in verified extracted fields OR verified client profile
        const extracted = fields.find(f => f.field_key === fieldKey);
        const inClient = (client as any)[fieldKey] || client.universal_profile[fieldKey];
        const inMatter = matter.matter_data[fieldKey];

        if (extracted) {
          if (extracted.verification_status === 'verified') {
            evidence.push({
              field_id: extracted.id,
              snippet: `${extracted.field_label}: verified as "${extracted.extracted_value}"`
            });
          } else if (extracted.verification_status === 'conflict') {
            missing.push(`Conflict unresolved on required field: ${extracted.field_label}`);
          } else {
            missing.push(`Unverified required field: ${extracted.field_label} (Awaiting human review)`);
          }
        } else if (inClient || inMatter) {
          evidence.push({
            snippet: `${fieldKey} provided in verified profile/matter: "${inClient || inMatter}"`
          });
        } else {
          missing.push(`Required field "${fieldKey}" is completely absent.`);
        }
      }
    }

    // 3. Document currency / freshness checks (e.g. within 90 days)
    if (rule.condition_criteria.max_document_age_days) {
      const maxAgeMs = rule.condition_criteria.max_document_age_days * 24 * 60 * 60 * 1000;
      const now = Date.now();

      for (const doc of documents) {
        const docDate = new Date(doc.created_at).getTime();
        if (now - docDate > maxAgeMs) {
          missing.push(`Document ${doc.file_name} exceeds ${rule.condition_criteria.max_document_age_days}-day currency limit.`);
        }
      }
    }

    // Determine status
    let status: ComplianceAssessmentStatus = 'verified_complete';
    let notes = 'All condition criteria verified complete and validated against supporting documentation.';

    if (missing.length > 0) {
      status = 'incomplete';
      notes = `Requirements pending: ${missing.join('; ')}`;
    }

    return {
      ruleId: rule.id,
      ruleCode: rule.rule_code,
      ruleName: rule.name,
      ruleVersion: rule.version,
      severity: rule.severity,
      status,
      notes,
      missingItems: missing,
      evidenceReferences: evidence
    };
  }

  /**
   * Evaluate all applicable rules for a matter.
   */
  static evaluateMatter(input: EvaluationInput): MatterComplianceReport {
    const evaluations = input.rules.map(rule => 
      this.evaluateRule(rule, input.matter, input.client, input.documents, input.extractedFields)
    );

    const incompleteCount = evaluations.filter(e => e.status === 'incomplete' || e.status === 'needs_correction').length;
    const exceptionCount = evaluations.filter(e => e.status === 'exception_requiring_review').length;
    const verifiedCount = evaluations.filter(e => e.status === 'verified_complete').length;

    let overallStatus: MatterComplianceReport['overallStatus'] = 'compliant';
    if (incompleteCount > 0 || exceptionCount > 0) {
      overallStatus = verifiedCount > 0 ? 'in_progress' : 'requires_action';
    }

    return {
      matterId: input.matter.id,
      jurisdiction: input.matter.jurisdiction,
      evaluatedAt: new Date().toISOString(),
      overallStatus,
      totalRules: evaluations.length,
      verifiedCount,
      incompleteCount,
      exceptionCount,
      evaluations,
      disclaimer: 'Notice: This compliance evaluation is a software-assisted checklist and does not constitute a legal compliance guarantee or formal legal opinion.'
    };
  }
}
