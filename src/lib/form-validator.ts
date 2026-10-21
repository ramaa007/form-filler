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
    let unresolvedCount = 0;

    // 1. Validate Shared Fields
    const sharedMissing: FormFieldDefinition[] = [];
    const sharedConflicting: FormFieldDefinition[] = [];
    let sharedRequiredCount = 0;
    let sharedConfirmedCount = 0;

    for (const field of formStructure.sharedFields) {
      if (field.isRequired) {
        sharedRequiredCount++;
        totalRequired++;
      }

      const state = fieldValues[field.id];
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

      for (const field of pFields) {
        if (field.isRequired) {
          roleRequired++;
          totalRequired++;
        }

        const state = fieldValues[field.id];
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
        isComplete: missing.length === 0 && conflicting.length === 0,
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
      personStats,
      sharedStats: {
        totalRequired: sharedRequiredCount,
        confirmedRequired: sharedConfirmedCount,
        isComplete: sharedComplete,
        missingFields: sharedMissing,
        conflictingFields: sharedConflicting
      },
      unresolvedCount
    };
  }
}
