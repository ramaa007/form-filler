// src/types/ai.ts
import { VerificationStatus } from './database';

export interface ExtractedFieldItem {
  field_key: string;
  field_label: string;
  extracted_value: string | null;
  normalized_value?: any;
  source_page?: number | null;
  evidence_text?: string | null;
  confidence_score: number; // 0.0 to 1.0
  verification_status: VerificationStatus;
  conflict_details?: string | null;
}

export interface DocumentExtractionResult {
  document_id: string;
  file_name: string;
  category_detected: string;
  page_count: number;
  extracted_fields: ExtractedFieldItem[];
  raw_analysis_summary?: string;
  processing_duration_ms: number;
  ai_provider: string;
  model_used: string;
  disclaimer: string;
}

export interface AIProviderConfig {
  apiKey?: string;
  modelName: string;
  maxOutputTokens?: number;
  temperature?: number;
}
