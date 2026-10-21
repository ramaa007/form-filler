// src/components/form-filler/FormPdfViewer.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  ExternalLink, 
  Maximize2, 
  Eye, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';

interface FormPdfViewerProps {
  pdfBase64: string;
  formName?: string;
  height?: number | string;
  title?: string;
  subtitle?: string;
  mode?: 'blank' | 'filled';
  onModeChange?: (mode: 'blank' | 'filled') => void;
  hasFilledData?: boolean;
}

export const FormPdfViewer: React.FC<FormPdfViewerProps> = ({
  pdfBase64,
  formName = 'Uploaded Form',
  height = '620px',
  title = 'Document Viewer',
  subtitle,
  mode = 'blank',
  onModeChange,
  hasFilledData = false
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(true);

  useEffect(() => {
    if (!pdfBase64) {
      setBlobUrl(null);
      setIsGeneratingUrl(false);
      return;
    }

    try {
      setIsGeneratingUrl(true);
      const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
    } catch (e) {
      console.error('Failed to create PDF blob URL:', e);
      setBlobUrl(null);
    } finally {
      setIsGeneratingUrl(false);
    }

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [pdfBase64]);

  return (
    <div style={{
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: 14,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.5)',
      height: '100%'
    }}>
      {/* Top Viewer Toolbar */}
      <div style={{
        padding: '12px 18px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(22, 32, 50, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <FileText size={16} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
              {title}
              <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 500 }}>
                • {formName}
              </span>
            </div>
            {subtitle && (
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* View mode toggle & Action tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onModeChange && hasFilledData && (
            <div style={{
              display: 'flex',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              borderRadius: 20,
              padding: 3,
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <button
                type="button"
                onClick={() => onModeChange('blank')}
                style={{
                  backgroundColor: mode === 'blank' ? '#2563eb' : 'transparent',
                  color: mode === 'blank' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: 16,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Original Form
              </button>
              <button
                type="button"
                onClick={() => onModeChange('filled')}
                style={{
                  backgroundColor: mode === 'filled' ? '#10b981' : 'transparent',
                  color: mode === 'filled' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: 16,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Sparkles size={11} /> Filled Form
              </button>
            </div>
          )}

          {blobUrl && (
            <a
              href={blobUrl}
              target="_blank"
              rel="noreferrer"
              title="Open full PDF in browser tab"
              style={{
                fontSize: 12,
                color: '#38bdf8',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                padding: '5px 10px',
                borderRadius: 6,
                border: '1px solid rgba(56, 189, 248, 0.25)',
                fontWeight: 600
              }}
            >
              Open Full Tab <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* Main PDF display container */}
      <div style={{
        flex: 1,
        minHeight: typeof height === 'number' ? `${height}px` : height,
        height: typeof height === 'number' ? `${height}px` : height,
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {isGeneratingUrl ? (
          <div style={{ textAlign: 'center', padding: 30 }}>
            <div style={{
              width: 32,
              height: 32,
              border: '3px solid rgba(56, 189, 248, 0.2)',
              borderTopColor: '#38bdf8',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px auto'
            }} />
            <div style={{ fontSize: 13, color: '#94a3b8' }}>
              Rendering Document Preview...
            </div>
          </div>
        ) : blobUrl ? (
          <iframe
            src={`${blobUrl}#toolbar=1&navpanes=0`}
            title="PDF Document Preview"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#1e293b'
            }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
            <FileText size={36} color="#64748b" style={{ margin: '0 auto 12px auto' }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>
              Preview Unavailable
            </div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              The uploaded document could not be previewed directly.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
