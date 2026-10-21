// src/components/form-filler/Step1UploadForm.tsx
'use client';

import React, { useState, useRef } from 'react';
import { 
  FileUp, 
  FileText, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  Shield,
  Layers
} from 'lucide-react';
import { AnalyzedFormStructure } from '@/types/form-filler';

interface Step1UploadFormProps {
  onFormAnalyzed: (data: {
    file: File | null;
    fileBase64: string;
    fileName: string;
    structure: AnalyzedFormStructure;
  }) => void;
}

export const Step1UploadForm: React.FC<Step1UploadFormProps> = ({ onFormAnalyzed }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setError('Please upload a genuine PDF file only.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setError('Please upload a genuine PDF file only.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const [scanMessage, setScanMessage] = useState('SCANNING BLANK FORM...');

  const handleUploadAndAnalyze = async (sampleType?: string) => {
    setError(null);
    setIsScanning(true);
    setScanMessage('Reading PDF & extracting form fields...');

    const timer1 = setTimeout(() => setScanMessage('Detecting applicant roles & shared fields...'), 1200);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const formData = new FormData();
      if (sampleType) {
        formData.append('sampleType', sampleType);
      } else if (selectedFile) {
        formData.append('formFile', selectedFile);
      } else {
        setError('Please select or drop a blank PDF form first.');
        setIsScanning(false);
        clearTimeout(timer1);
        clearTimeout(timeoutId);
        return;
      }

      const res = await fetch('/api/form/analyze', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timer1);
      clearTimeout(timeoutId);

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to scan and analyze blank form.');
      }

      onFormAnalyzed({
        file: selectedFile,
        fileBase64: data.fileBase64,
        fileName: data.fileName,
        structure: data.structure
      });
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timeoutId);
      console.error('Scan error:', err);
      if (err.name === 'AbortError') {
        setError('Scanning took longer than expected. Please try again.');
      } else {
        setError(err.message || 'An error occurred while scanning your form.');
      }
    } finally {
      setIsScanning(false);
      setScanMessage('SCANNING BLANK FORM...');
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: '40px auto', padding: '0 20px' }}>
      {/* Title & Prompt */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          color: '#38bdf8',
          padding: '6px 14px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 16,
          border: '1px solid rgba(56, 189, 248, 0.25)'
        }}>
          <Sparkles size={14} /> Step 1 of 6 • Form-First Intelligence
        </div>
        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          color: '#f8fafc',
          marginBottom: 12,
          letterSpacing: '-0.02em'
        }}>
          Which form would you like to complete?
        </h1>
        <p style={{
          fontSize: 16,
          color: '#94a3b8',
          maxWidth: 620,
          margin: '0 auto',
          lineHeight: 1.6
        }}>
          Upload your blank PDF form first. We will scan every page to identify all required information, the people or roles involved, and individual versus shared fields.
        </p>
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 24,
          fontSize: 14
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Prominent PDF Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: isDragging ? '2px dashed #38bdf8' : '2px dashed rgba(255, 255, 255, 0.18)',
          borderRadius: 16,
          backgroundColor: isDragging ? 'rgba(56, 189, 248, 0.05)' : 'rgba(22, 32, 50, 0.7)',
          padding: '48px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginBottom: 24
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          color: '#38bdf8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto'
        }}>
          <FileUp size={36} />
        </div>

        {selectedFile ? (
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 8
            }}>
              <CheckCircle2 size={18} />
              {selectedFile.name}
            </div>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to scan
            </p>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
              Click to choose a different PDF
            </p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 18, fontWeight: 600, color: '#f8fafc', marginBottom: 6 }}>
              Drop your blank PDF form here, or browse
            </p>
            <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 440, margin: '0 auto' }}>
              Accepts PDF files only • Mortgage, conveyancing, rental, purchase, or general forms
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 16,
              fontSize: 12,
              color: '#64748b'
            }}>
              <Shield size={14} /> Interactive AcroForms, flat PDFs, and scanned documents supported
            </div>
          </div>
        )}
      </div>

      {/* Prominent Action Button */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <button
          type="button"
          onClick={() => handleUploadAndAnalyze()}
          disabled={!selectedFile || isScanning}
          style={{
            backgroundColor: selectedFile && !isScanning ? '#2563eb' : 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            padding: '16px 36px',
            fontSize: 16,
            fontWeight: 700,
            cursor: selectedFile && !isScanning ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            boxShadow: selectedFile && !isScanning ? '0 4px 14px rgba(37, 99, 235, 0.4)' : 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          {isScanning ? (
            <>
              <div style={{
                width: 18,
                height: 18,
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTopColor: '#ffffff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              {scanMessage}
            </>
          ) : (
            <>
              <FileText size={18} />
              UPLOAD FORM
            </>
          )}
        </button>
      </div>

      {/* Quick Testing Options (Zero Friction) */}
      <div style={{
        backgroundColor: 'rgba(22, 32, 50, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        padding: '20px 24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={16} color="#38bdf8" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc' }}>
              Or test immediately with a sample form:
            </span>
          </div>
          <span style={{ fontSize: 11, color: '#64748b' }}>
            Fully synthetic blank PDFs with AcroForms & flat coordinates
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <button
            type="button"
            onClick={() => handleUploadAndAnalyze('joint_mortgage')}
            disabled={isScanning}
            style={{
              backgroundColor: 'rgba(37, 99, 235, 0.08)',
              border: '1px solid rgba(37, 99, 235, 0.25)',
              borderRadius: 8,
              padding: '12px 14px',
              textAlign: 'left',
              cursor: isScanning ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s ease'
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#60a5fa', marginBottom: 2 }}>
              Joint Mortgage Application
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              Primary Applicant & Partner (2 people + shared)
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleUploadAndAnalyze('single_rental')}
            disabled={isScanning}
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 8,
              padding: '12px 14px',
              textAlign: 'left',
              cursor: isScanning ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s ease'
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#34d399', marginBottom: 2 }}>
              Single Rental Tenancy Form
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              Individual Tenant (1 person + property)
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleUploadAndAnalyze('flat_conveyancing')}
            disabled={isScanning}
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 8,
              padding: '12px 14px',
              textAlign: 'left',
              cursor: isScanning ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s ease'
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24', marginBottom: 2 }}>
              Flat Conveyancing Particulars
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              Scanned / Flat PDF (Buyer 1 & Buyer 2)
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
