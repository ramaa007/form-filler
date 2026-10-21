// src/components/form-filler/StepIndicator.tsx
'use client';

import React from 'react';
import { 
  FileText, 
  Users, 
  UploadCloud, 
  Cpu, 
  CheckSquare, 
  ShieldCheck, 
  Download 
} from 'lucide-react';

export type StepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface StepIndicatorProps {
  currentStep: StepNumber;
  onStepClick?: (step: StepNumber) => void;
  canNavigateToStep?: (step: StepNumber) => boolean;
}

const steps = [
  { number: 1 as StepNumber, label: 'Upload Form', icon: FileText, desc: 'Blank PDF' },
  { number: 2 as StepNumber, label: 'Form Structure', icon: Users, desc: 'People & Fields' },
  { number: 3 as StepNumber, label: 'Upload Docs', icon: UploadCloud, desc: 'Supporting PDFs' },
  { number: 4 as StepNumber, label: 'Scan', icon: Cpu, desc: 'AI Extraction' },
  { number: 5 as StepNumber, label: 'Review', icon: CheckSquare, desc: 'Checklist & Edit' },
  { number: 6 as StepNumber, label: 'Check Details', icon: ShieldCheck, desc: 'Validation' },
  { number: 7 as StepNumber, label: 'Download PDF', icon: Download, desc: 'Completed Form' }
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onStepClick,
  canNavigateToStep
}) => {
  return (
    <div style={{
      width: '100%',
      backgroundColor: 'rgba(17, 24, 39, 0.75)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '16px 24px',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 4
      }}>
        {steps.map((step, idx) => {
          const isCurrent = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          const isClickable = canNavigateToStep ? canNavigateToStep(step.number) : isCompleted;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.number}>
              <button
                type="button"
                onClick={() => isClickable && onStepClick && onStepClick(step.number)}
                disabled={!isClickable && !isCurrent}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'none',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: 8,
                  cursor: isClickable ? 'pointer' : isCurrent ? 'default' : 'not-allowed',
                  opacity: isCurrent ? 1 : isCompleted ? 0.9 : 0.45,
                  transition: 'all 0.2s ease',
                  backgroundColor: isCurrent ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                  borderBottom: isCurrent ? '2px solid #38bdf8' : '2px solid transparent',
                  whiteSpace: 'nowrap'
                }}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  backgroundColor: isCompleted 
                    ? '#10b981' 
                    : isCurrent 
                    ? '#2563eb' 
                    : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  boxShadow: isCurrent ? '0 0 12px rgba(56, 189, 248, 0.5)' : 'none'
                }}>
                  {isCompleted ? '✓' : <Icon size={16} />}
                </div>

                <div style={{ textAlign: 'left' }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: isCurrent ? '#38bdf8' : isCompleted ? '#f8fafc' : '#94a3b8'
                  }}>
                    {step.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    {step.desc}
                  </div>
                </div>
              </button>

              {idx < steps.length - 1 && (
                <div style={{
                  flex: 1,
                  minWidth: 16,
                  height: 2,
                  backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.08)'
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
