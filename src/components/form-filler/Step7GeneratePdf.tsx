// src/components/form-filler/Step7GeneratePdf.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  ArrowLeft, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ShieldCheck,
  ExternalLink,
  Printer
} from 'lucide-react';
import { 
  AnalyzedFormStructure, 
  FormFieldValueState 
} from '@/types/form-filler';

interface Step7GeneratePdfProps {
  originalPdfBase64: string;
  originalPdfFile: File | null;
  formStructure: AnalyzedFormStructure;
  fieldValues: Record<string, FormFieldValueState>;
  onBackToReview: () => void;
  onRestart: () => void;
}

export const Step7GeneratePdf: React.FC<Step7GeneratePdfProps> = ({
  originalPdfBase64,
  originalPdfFile,
  formStructure,
  fieldValues,
  onBackToReview,
  onRestart
}) => {
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    const generatePdf = async () => {
      try {
        setIsGenerating(true);
        setError(null);

        const formData = new FormData();
        formData.append('originalPdfBase64', originalPdfBase64);
        formData.append('formStructure', JSON.stringify(formStructure));
        formData.append('fieldValues', JSON.stringify(fieldValues));

        const res = await fetch('/api/form/generate', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to generate filled PDF.');
        }

        const blob = await res.blob();
        if (active) {
          createdUrl = URL.createObjectURL(blob);
          setPdfBlobUrl(createdUrl);
        }
      } catch (err: any) {
        if (active) {
          console.error('PDF generation error:', err);
          setError(err.message || 'An error occurred while generating your PDF.');
        }
      } finally {
        if (active) {
          setIsGenerating(false);
        }
      }
    };

    generatePdf();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [originalPdfBase64, formStructure, fieldValues]);

  const handleDownload = () => {
    if (!pdfBlobUrl) return;
    const a = document.createElement('a');
    a.href = pdfBlobUrl;
    const safeName = (formStructure.formName || 'Completed_Application').replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `${safeName}_Completed.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={{ maxWidth: 1040, margin: '40px auto', padding: '0 20px' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          color: '#10b981',
          padding: '6px 14px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 14,
          border: '1px solid rgba(16, 185, 129, 0.25)'
        }}>
          <CheckCircle2 size={14} /> Completed & Verified
        </div>

        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          color: '#f8fafc',
          marginBottom: 10,
          letterSpacing: '-0.02em'
        }}>
          Your completed form is ready.
        </h1>

        <p style={{
          fontSize: 15,
          color: '#94a3b8',
          maxWidth: 620,
          margin: '0 auto',
          lineHeight: 1.6
        }}>
          Original formatting, page order, and headings are preserved. Signatures and declarations are kept blank for your physical or digital signature.
        </p>
      </div>

      {/* Main Action Bar */}
      <div style={{
        backgroundColor: 'rgba(22, 32, 50, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 14,
        padding: '16px 24px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FileText size={24} color="#38bdf8" />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
              {formStructure.formName} (Completed)
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              {formStructure.pageCount} page(s) • Ready for submission
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onBackToReview}
            style={{
              backgroundColor: 'transparent',
              color: '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <ArrowLeft size={16} /> BACK TO REVIEW
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!pdfBlobUrl || isGenerating}
            style={{
              backgroundColor: pdfBlobUrl ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 700,
              cursor: pdfBlobUrl ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: pdfBlobUrl ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none'
            }}
          >
            <Download size={18} />
            DOWNLOAD COMPLETED PDF
          </button>
        </div>
      </div>

      {/* PDF Interactive Preview Window */}
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 14,
        overflow: 'hidden',
        minHeight: 640,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.5)',
        marginBottom: 28
      }}>
        <div style={{
          padding: '10px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(22, 32, 50, 0.6)'
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
            Live Document Preview
          </span>

          {pdfBlobUrl && (
            <a
              href={pdfBlobUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 12,
                color: '#38bdf8',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              Open in new tab <ExternalLink size={12} />
            </a>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isGenerating ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{
                width: 44,
                height: 44,
                border: '3px solid rgba(56, 189, 248, 0.2)',
                borderTopColor: '#38bdf8',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px auto'
              }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc' }}>
                Generating your filled PDF...
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                Placing text, formatting dates & currencies, and flattening forms.
              </div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 16px auto' }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: '#fca5a5' }}>
                {error}
              </div>
              <button
                type="button"
                onClick={onBackToReview}
                style={{
                  marginTop: 16,
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 18px',
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Back to Review
              </button>
            </div>
          ) : pdfBlobUrl ? (
            <iframe
              src={pdfBlobUrl}
              title="Completed PDF Preview"
              style={{
                width: '100%',
                height: '750px',
                border: 'none'
              }}
            />
          ) : null}
        </div>
      </div>

      {/* Footer Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <button
          type="button"
          onClick={onRestart}
          style={{
            backgroundColor: 'transparent',
            color: '#94a3b8',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 8,
            padding: '12px 20px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <RotateCcw size={16} /> Fill Another Form (Start Over)
        </button>

        <button
          type="button"
          onClick={onBackToReview}
          style={{
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: 8,
            padding: '12px 24px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          EDIT DETAILS AND REGENERATE
        </button>
      </div>
    </div>
  );
};
