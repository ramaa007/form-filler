// src/lib/ai/provider.ts
// Abstract AI Provider Interface for Document Extraction

import { DocumentExtractionResult } from '@/types/ai';

export interface ExtractionOptions {
  industryType?: string;
  matterType?: string;
  expectedCategory?: string;
  jurisdiction?: string;
  targetFields?: Array<{
    key: string;
    label: string;
    description?: string;
  }>;
}

export interface IDocumentExtractionProvider {
  name: string;
  extractFromPdf(
    pdfBuffer: Uint8Array,
    fileName: string,
    options?: ExtractionOptions
  ): Promise<DocumentExtractionResult>;
}
