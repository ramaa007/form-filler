// src/app/page.tsx
'use client';

import React, { useState } from 'react';
import { StepIndicator, StepNumber } from '@/components/form-filler/StepIndicator';
import { Step1UploadForm } from '@/components/form-filler/Step1UploadForm';
import { Step2PeopleAndFields } from '@/components/form-filler/Step2PeopleAndFields';
import { Step3UploadDocuments } from '@/components/form-filler/Step3UploadDocuments';
import { Step4ScanningProgress } from '@/components/form-filler/Step4ScanningProgress';
import { Step5ReviewChecklist } from '@/components/form-filler/Step5ReviewChecklist';
import { Step6CheckDetails } from '@/components/form-filler/Step6CheckDetails';
import { Step7GeneratePdf } from '@/components/form-filler/Step7GeneratePdf';
import { FieldEditModal } from '@/components/form-filler/FieldEditModal';

import { 
  AnalyzedFormStructure, 
  FormFieldValueState, 
  UploadedSupportingDoc,
  FormFieldDefinition
} from '@/types/form-filler';
import { FileText, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);

  // Uploaded Form State
  const [originalFormFile, setOriginalFormFile] = useState<File | null>(null);
  const [originalPdfBase64, setOriginalPdfBase64] = useState<string>('');
  const [formFileName, setFormFileName] = useState<string>('');
  const [formStructure, setFormStructure] = useState<AnalyzedFormStructure | null>(null);

  // Supporting Documents State
  const [supportingDocs, setSupportingDocs] = useState<UploadedSupportingDoc[]>([]);

  // Extracted Field Values State
  const [fieldValues, setFieldValues] = useState<Record<string, FormFieldValueState>>({});
  const [docSummaries, setDocSummaries] = useState<any[]>([]);

  // Modal State for Step 6 direct edits
  const [directEditingField, setDirectEditingField] = useState<{
    field: FormFieldDefinition;
    roleLabel?: string;
  } | null>(null);

  // Step 1: Blank form analyzed
  const handleFormAnalyzed = (data: {
    file: File | null;
    fileBase64: string;
    fileName: string;
    structure: AnalyzedFormStructure;
  }) => {
    setOriginalFormFile(data.file);
    setOriginalPdfBase64(data.fileBase64);
    setFormFileName(data.fileName);
    setFormStructure(data.structure);

    // Initialize blank field values from structure
    const initialValues: Record<string, FormFieldValueState> = {};
    (data.structure.sharedFields || []).forEach(f => {
      initialValues[f.id] = {
        fieldId: f.id,
        currentValue: null,
        status: f.isRequired ? 'missing' : 'optional'
      };
    });
    (data.structure.peopleRoles || []).forEach(r => {
      ((data.structure.personFields && data.structure.personFields[r.id]) || []).forEach(f => {
        initialValues[f.id] = {
          fieldId: f.id,
          personRoleId: r.id,
          currentValue: null,
          status: f.isRequired ? 'missing' : 'optional'
        };
      });
    });

    setFieldValues(initialValues);
    setCurrentStep(2);
  };

  // Step 2: Confirm structure & roles
  const handleConfirmStructure = (updatedStructure: AnalyzedFormStructure) => {
    setFormStructure(updatedStructure);

    // Sync skipped / selected state from Step 2 into fieldValues
    setFieldValues(prev => {
      const next = { ...prev };
      const allFields = [
        ...updatedStructure.sharedFields,
        ...Object.values(updatedStructure.personFields).flat()
      ];

      allFields.forEach(f => {
        if (f.isSkipped) {
          next[f.id] = {
            ...(next[f.id] || { fieldId: f.id, currentValue: null }),
            status: 'skipped'
          };
        } else if (next[f.id]?.status === 'skipped') {
          next[f.id] = {
            ...next[f.id],
            status: f.isRequired ? 'missing' : 'optional'
          };
        }
      });
      return next;
    });

    setCurrentStep(3);
  };

  // Step 3: Load sample docs helper
  const handleLoadSampleDocs = () => {
    if (!formStructure) return;
    const sampleDocs: UploadedSupportingDoc[] = [
      { id: 'sample_1', name: 'Sarah_Thompson_Drivers_Licence.pdf', size: 184500, assignedPersonRoleId: 'auto', status: 'ready' },
      { id: 'sample_2', name: 'Sarah_Thompson_Official_Payslip.pdf', size: 215400, assignedPersonRoleId: 'auto', status: 'ready' },
      { id: 'sample_3', name: 'Bank_Statement_Deposit_Schedule.pdf', size: 312000, assignedPersonRoleId: 'both', status: 'ready' }
    ];

    if (formStructure.peopleRoles.length > 1) {
      sampleDocs.push(
        { id: 'sample_4', name: 'David_Miller_Drivers_Licence.pdf', size: 195000, assignedPersonRoleId: formStructure.peopleRoles[1].id, status: 'ready' },
        { id: 'sample_5', name: 'David_Miller_Official_Payslip.pdf', size: 228000, assignedPersonRoleId: formStructure.peopleRoles[1].id, status: 'ready' }
      );
    }

    setSupportingDocs(sampleDocs);
  };

  // Step 4: Scan complete
  const handleScanComplete = (
    newFieldValues: Record<string, FormFieldValueState>,
    summaries: any[]
  ) => {
    // Preserve any user-skipped fields from earlier steps
    setFieldValues(prev => {
      const merged = { ...newFieldValues };
      Object.keys(prev).forEach(fieldId => {
        if (prev[fieldId]?.status === 'skipped') {
          merged[fieldId] = {
            ...merged[fieldId],
            status: 'skipped'
          };
        }
      });
      return merged;
    });
    setDocSummaries(summaries);
    setCurrentStep(5);
  };

  // Step 5: Update a field value
  const handleUpdateFieldValue = (
    fieldId: string, 
    val: any, 
    confirmed: boolean = false,
    statusOverride?: 'found' | 'confirmed' | 'needs_review' | 'missing' | 'manually_entered' | 'optional' | 'skipped'
  ) => {
    setFieldValues(prev => {
      const existing = prev[fieldId] || { fieldId, currentValue: null, status: 'missing' };
      const status = statusOverride 
        ? statusOverride 
        : confirmed 
        ? 'confirmed' 
        : 'manually_entered';

      return {
        ...prev,
        [fieldId]: {
          ...existing,
          currentValue: val,
          status,
          userConfirmed: status === 'confirmed',
          conflicts: []
        }
      };
    });
  };

  // Step 5: Batch confirm all found values
  const handleBatchConfirmFound = () => {
    setFieldValues(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(k => {
        if (updated[k].status === 'found') {
          updated[k] = {
            ...updated[k],
            status: 'confirmed',
            userConfirmed: true
          };
        }
      });
      return updated;
    });
  };

  // Step 5: Upload additional document without restarting
  const handleUploadAdditionalDoc = (files: File[]) => {
    const newDocs: UploadedSupportingDoc[] = files.map(file => ({
      id: `doc_extra_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      file,
      name: file.name,
      size: file.size,
      assignedPersonRoleId: 'auto',
      status: 'ready'
    }));

    setSupportingDocs(prev => [...prev, ...newDocs]);
    // Transition straight to step 4 to scan and update missing fields!
    setCurrentStep(4);
  };

  // Navigation check
  const canNavigateToStep = (step: StepNumber): boolean => {
    if (step === 1) return true;
    if (step === 2) return !!formStructure;
    if (step === 3) return !!formStructure;
    if (step === 4) return !!formStructure && supportingDocs.length > 0;
    if (step === 5) return !!formStructure && Object.keys(fieldValues).length > 0;
    if (step === 6) return !!formStructure && Object.keys(fieldValues).length > 0;
    if (step === 7) return currentStep === 7;
    return false;
  };

  // Restart flow
  const handleRestart = () => {
    setCurrentStep(1);
    setOriginalFormFile(null);
    setOriginalPdfBase64('');
    setFormFileName('');
    setFormStructure(null);
    setSupportingDocs([]);
    setFieldValues({});
    setDocSummaries([]);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0f1d',
      color: '#f8fafc',
      fontFamily: 'var(--font-sans)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Header / Branding */}
      <header style={{
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)'
          }}>
            <FileText size={20} />
          </div>

          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              Universal Form Filler
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              Form-First PDF Automation • Multi-Applicant Verification
            </div>
          </div>
        </div>

        {formStructure && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            backgroundColor: 'rgba(30, 41, 59, 0.6)',
            padding: '6px 14px',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Active Form:</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#38bdf8' }}>
              {formStructure.formName}
            </span>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              padding: '2px 6px',
              borderRadius: 4
            }}>
              {formStructure.peopleRoles.length} Applicant(s)
            </span>
          </div>
        )}
      </header>

      {/* Guided Progress Bar */}
      <StepIndicator
        currentStep={currentStep}
        onStepClick={step => setCurrentStep(step)}
        canNavigateToStep={canNavigateToStep}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingBottom: 60 }}>
        {currentStep === 1 && (
          <Step1UploadForm onFormAnalyzed={handleFormAnalyzed} />
        )}

        {currentStep === 2 && formStructure && (
          <Step2PeopleAndFields
            structure={formStructure}
            fileName={formFileName}
            originalPdfBase64={originalPdfBase64}
            onConfirmStructure={handleConfirmStructure}
            onBackToUpload={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && formStructure && (
          <Step3UploadDocuments
            formStructure={formStructure}
            documents={supportingDocs}
            onDocumentsChange={docs => setSupportingDocs(docs)}
            onProceedToScan={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
            onLoadSampleDocs={handleLoadSampleDocs}
          />
        )}

        {currentStep === 4 && formStructure && (
          <Step4ScanningProgress
            formStructure={formStructure}
            documents={supportingDocs}
            existingValues={fieldValues}
            onScanComplete={handleScanComplete}
            onRetry={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 5 && formStructure && (
          <Step5ReviewChecklist
            formStructure={formStructure}
            fieldValues={fieldValues}
            originalPdfBase64={originalPdfBase64}
            onUpdateFieldValue={handleUpdateFieldValue}
            onBatchConfirmFound={handleBatchConfirmFound}
            onUploadAdditionalDoc={handleUploadAdditionalDoc}
            onProceedToCheckAll={() => setCurrentStep(6)}
            onBackToDocuments={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 6 && formStructure && (
          <Step6CheckDetails
            formStructure={formStructure}
            fieldValues={fieldValues}
            onProceedToGenerate={() => setCurrentStep(7)}
            onBackToReview={() => setCurrentStep(5)}
            onEditField={(field, role) => setDirectEditingField({ field, roleLabel: role })}
            onSkipField={(fieldId) => handleUpdateFieldValue(fieldId, null, false, 'skipped')}
            onUploadMoreDocs={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 7 && formStructure && (
          <Step7GeneratePdf
            originalPdfBase64={originalPdfBase64}
            originalPdfFile={originalFormFile}
            formStructure={formStructure}
            fieldValues={fieldValues}
            onBackToReview={() => setCurrentStep(5)}
            onRestart={handleRestart}
          />
        )}

        {/* Modal for direct edits during Step 6 */}
        {directEditingField && formStructure && (
          <FieldEditModal
            field={directEditingField.field}
            state={fieldValues[directEditingField.field.id] || { fieldId: directEditingField.field.id, currentValue: null, status: 'missing' }}
            roleLabel={directEditingField.roleLabel}
            onSave={(fieldId, val, confirmed) => handleUpdateFieldValue(fieldId, val, confirmed)}
            onSkip={(fieldId) => handleUpdateFieldValue(fieldId, null, false, 'skipped')}
            onClose={() => setDirectEditingField(null)}
            onRequestUploadDoc={() => {
              setDirectEditingField(null);
              setCurrentStep(3);
            }}
          />
        )}
      </main>
    </div>
  );
}
