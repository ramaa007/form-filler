// src/types/pdf.ts

export interface DetectedAcroFormField {
  name: string;
  type: 'PDFTextField' | 'PDFCheckBox' | 'PDFDropdown' | 'PDFRadioGroup' | 'PDFOptionList' | 'Unknown';
  pageIndex: number;
  value?: string | boolean;
  options?: string[];
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PDFInspectionResult {
  pageCount: number;
  isEncrypted: boolean;
  fileSizeBytes: number;
  detectedFields: DetectedAcroFormField[];
  pageDimensions: Array<{
    pageNumber: number;
    width: number;
    height: number;
    rotation: number;
  }>;
}

export interface FlatCoordinatePlacement {
  id: string;
  pageNumber: number;
  fieldName: string;
  binding: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  alignment: 'left' | 'center' | 'right';
  formatting?: 'uppercase' | 'date_au_slash' | 'currency_aud' | 'phone_au' | 'lowercase';
  staticValue?: string;
}

export interface PDFGenerationRequest {
  templateId: string;
  matterId: string;
  generationType: 'draft' | 'final';
  customFieldOverrides?: Record<string, any>;
  applyDraftWatermark?: boolean;
}

export interface PDFGenerationResult {
  success: boolean;
  generatedDocumentId: string;
  storagePath: string;
  downloadUrl?: string;
  pdfBytesBase64?: string;
  fileSizeBytes: number;
  missingRequiredFields: string[];
  warnings: string[];
}
