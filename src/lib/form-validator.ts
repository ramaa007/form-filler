// src/lib/form-validator.ts
// Form Validation & Completeness Checker

import { 
  AnalyzedFormStructure, 
  FormFieldValueState, 
  FormValidationSummary, 
  FormFieldDefinition 
} from '@/types/form-filler';

export class FormValidator {
  /**
   * Validate all required fields across every person role and shared sections.
   */
  static validate(
    formStructure: AnalyzedFormStructure,
    fieldValues: Record<string, FormFieldValueState>
  ): FormValidationSummary {
    let totalRequired = 0;
    let totalConfirmed = 0;
    let totalSkipped = 0;
    let unresolvedCount = 0;

    // 1. Validate Shared Fields
    const sharedMissing: FormFieldDefinition[] = [];
    const sharedConflicting: FormFieldDefinition[] = [];
    let sharedRequiredCount = 0;
    let sharedConfirmedCount = 0;
    let sharedSkippedCount = 0;

    for (const field of formStructure.sharedFields) {
      const state = fieldValues[field.id];
      const isExplicitlySkipped = state?.status === 'skipped' || field.isSkipped === true;

      if (isExplicitlySkipped) {
        sharedSkippedCount++;
        totalSkipped++;
        continue;
      }

      if (field.isRequired) {
        sharedRequiredCount++;
        totalRequired++;
      }

      const hasValue = state && state.currentValue !== null && state.currentValue !== undefined && String(state.currentValue).trim() !== '';
      const isConflicted = state && state.status === 'needs_review' && state.conflicts && state.conflicts.length > 1;

      if (isConflicted) {
        sharedConflicting.push(field);
        unresolvedCount++;
      }

      if (field.isRequired) {
        if (!hasValue || state.status === 'missing') {
          sharedMissing.push(field);
        } else if (state.status === 'confirmed' || state.status === 'manually_entered') {
          sharedConfirmedCount++;
          totalConfirmed++;
        } else if (state.status === 'found' && !isConflicted) {
          // Found from document, ready for review/confirmation
          sharedConfirmedCount++;
          totalConfirmed++;
        }
      }
    }

    // 2. Validate Person-Specific Fields
    const personStats: FormValidationSummary['personStats'] = [];

    for (const role of formStructure.peopleRoles) {
      const pFields = formStructure.personFields[role.id] || [];
      const missing: FormFieldDefinition[] = [];
      const conflicting: FormFieldDefinition[] = [];
      let roleRequired = 0;
      let roleConfirmed = 0;
      let roleSkipped = 0;

      for (const field of pFields) {
        const state = fieldValues[field.id];
        const isExplicitlySkipped = state?.status === 'skipped' || field.isSkipped === true;

        if (isExplicitlySkipped) {
          roleSkipped++;
          totalSkipped++;
          continue;
        }

        if (field.isRequired) {
          roleRequired++;
          totalRequired++;
        }

        const hasValue = state && state.currentValue !== null && state.currentValue !== undefined && String(state.currentValue).trim() !== '';
        const isConflicted = state && state.status === 'needs_review' && state.conflicts && state.conflicts.length > 1;

        if (isConflicted) {
          conflicting.push(field);
          unresolvedCount++;
        }

        if (field.isRequired) {
          if (!hasValue || state.status === 'missing') {
            missing.push(field);
          } else if (state.status === 'confirmed' || state.status === 'manually_entered') {
            roleConfirmed++;
            totalConfirmed++;
          } else if (state.status === 'found' && !isConflicted) {
            roleConfirmed++;
            totalConfirmed++;
          }
        }
      }

      personStats.push({
        roleId: role.id,
        roleLabel: role.label,
        totalRequired: roleRequired,
        confirmedRequired: roleConfirmed,
        skippedCount: roleSkipped,
        isComplete: (role.isOptional && roleConfirmed === 0) ? true : (missing.length === 0 && conflicting.length === 0),
        missingFields: missing,
        conflictingFields: conflicting
      });
    }

    const sharedComplete = sharedMissing.length === 0 && sharedConflicting.length === 0;
    const allPersonsComplete = personStats.every(p => p.isComplete);
    const isValid = sharedComplete && allPersonsComplete && unresolvedCount === 0;

    return {
      isValid,
      totalRequired,
      totalConfirmed,
      totalSkipped,
      personStats,
      sharedStats: {
        totalRequired: sharedRequiredCount,
        confirmedRequired: sharedConfirmedCount,
        skippedCount: sharedSkippedCount,
        isComplete: sharedComplete,
        missingFields: sharedMissing,
        conflictingFields: sharedConflicting
      },
      unresolvedCount
    };
  }
}
