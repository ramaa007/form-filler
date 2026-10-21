// src/components/form-filler/Step4ScanningProgress.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  RotateCw, 
  FileText, 
  Sparkles,
  Search,
  ShieldCheck
} from 'lucide-react';
import { 
  AnalyzedFormStructure, 
  FormFieldValueState, 
  UploadedSupportingDoc 
} from '@/types/form-filler';

interface Step4ScanningProgressProps {
  formStructure: AnalyzedFormStructure;
  documents: UploadedSupportingDoc[];
  existingValues: Record<string, FormFieldValueState>;
  onScanComplete: (fieldValues: Record<string, FormFieldValueState>, summaries: any[]) => void;
  onRetry: () => void;
  onBack: () => void;
}

export const Step4ScanningProgress: React.FC<Step4ScanningProgressProps> = ({
  formStructure,
  documents,
  existingValues,
  onScanComplete,
  onRetry,
  onBack
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const scanSteps = [
    'Reading PDF pages & extracting visual layouts...',
    'Identifying applicant names & role lineages...',
    'Matching facts strictly to target form fields...',
    'Checking cross-document consistency & conflict resolution...',
    'Generating review checklist...'
  ];

  useEffect(() => {
    let isMounted = true;

    const runScan = async () => {
      try {
        // Step progression timers
        const timer1 = setTimeout(() => setCurrentStepIndex(1), 700);
        const timer2 = setTimeout(() => setCurrentStepIndex(2), 1400);
        const timer3 = setTimeout(() => setCurrentStepIndex(3), 2200);

        const formData = new FormData();
        formData.append('formStructure', JSON.stringify(formStructure));
        formData.append('existingValues', JSON.stringify(existingValues));

        // Check if sample docs or user uploaded files
        const hasRealFiles = documents.some(d => d.file);
        if (hasRealFiles) {
          documents.forEach((doc, idx) => {
            if (doc.file) {
              formData.append(`doc_${idx}`, doc.file);
              formData.append(`doc_${idx}_role`, doc.assignedPersonRoleId || 'auto');
            }
          });
        } else {
          // Sample pack trigger
          formData.append('loadSampleDocs', 'true');
        }

        const res = await fetch('/api/documents/scan', {
          method: 'POST',
          body: formData
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Document scanning failed.');
        }

        if (isMounted) {
          setCurrentStepIndex(4);
          setTimeout(() => {
            onScanComplete(data.fieldValues, data.docSummaries || []);
          }, 600);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Scan error:', err);
          setError(err.message || 'Failed to scan and match documents.');
        }
      }
    };

    runScan();

    return () => {
      isMounted = false;
    };
  }, [formStructure, documents]);

  return (
    <div style={{ maxWidth: 640, margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        backgroundColor: error ? 'rgba(239, 68, 68, 0.15)' : 'rgba(37, 99, 235, 0.15)',
        color: error ? '#ef4444' : '#38bdf8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px auto',
        boxShadow: error ? 'none' : '0 0 25px rgba(56, 189, 248, 0.3)'
      }}>
        {error ? (
          <AlertCircle size={40} />
        ) : (
          <Cpu size={40} style={{ animation: 'spin 3s linear infinite' }} />
        )}
      </div>

      <h2 style={{ fontSize: 26, fontWeight: 700, color: '#f8fafc', marginBottom: 12 }}>
        {error ? 'Scanning Interrupted' : 'Scanning & Matching Documents'}
      </h2>

      <p style={{ fontSize: 15, color: '#94a3b8', marginBottom: 32, lineHeight: 1.5 }}>
        {error 
          ? error 
          : `Processing ${documents.length} document(s) against the requirements of ${formStructure.formName}.`}
      </p>

      {!error ? (
        <div style={{
          backgroundColor: 'rgba(22, 32, 50, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          padding: '24px',
          textAlign: 'left',
          marginBottom: 24
        }}>
          {scanSteps.map((stepText, idx) => {
            const isDone = currentStepIndex > idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: idx < scanSteps.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                  opacity: isDone || isCurrent ? 1 : 0.35
                }}
              >
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor: isDone ? '#10b981' : isCurrent ? '#2563eb' : 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff'
                }}>
                  {isDone ? '✓' : idx + 1}
                </div>

                <span style={{
                  fontSize: 14,
                  fontWeight: isCurrent ? 600 : 400,
                  color: isCurrent ? '#38bdf8' : isDone ? '#f8fafc' : '#94a3b8'
                }}>
                  {stepText}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              backgroundColor: 'transparent',
              color: '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 8,
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ← Back to Documents
          </button>

          <button
            type="button"
            onClick={onRetry}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <RotateCw size={16} /> Retry Scanning
          </button>
        </div>
      )}
    </div>
  );
};
