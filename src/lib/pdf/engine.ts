// src/lib/pdf/engine.ts
// Universal PDF Document & Form Automation Engine

import { 
  PDFDocument, 
  rgb, 
  StandardFonts, 
  degrees, 
  PDFTextField, 
  PDFCheckBox, 
  PDFDropdown, 
  PDFRadioGroup 
} from 'pdf-lib';
import { 
  AnalyzedFormStructure, 
  FormFieldValueState, 
  FormFieldDefinition 
} from '@/types/form-filler';

export interface DetectedAcroFormField {
  name: string;
  type: 'PDFTextField' | 'PDFCheckBox' | 'PDFDropdown' | 'PDFRadioGroup' | 'Unknown';
  pageIndex: number;
  value?: string | boolean;
  options?: string[];
  rect?: { x: number; y: number; width: number; height: number };
}

export interface PDFInspectionResult {
  pageCount: number;
  isEncrypted: boolean;
  fileSizeBytes: number;
  detectedFields: DetectedAcroFormField[];
  pageDimensions: Array<{ pageNumber: number; width: number; height: number; rotation: number }>;
}

export class UniversalPdfEngine {
  /**
   * Validate that an uploaded file is a genuine PDF.
   */
  static validatePdf(buffer: Uint8Array, maxSizeBytes: number = 25 * 1024 * 1024): { valid: boolean; error?: string } {
    if (!buffer || buffer.length === 0) {
      return { valid: false, error: 'File is empty.' };
    }

    if (buffer.length > maxSizeBytes) {
      return { valid: false, error: `File size exceeds maximum allowed limit of ${Math.round(maxSizeBytes / (1024 * 1024))}MB.` };
    }

    // Check magic bytes: %PDF-
    const headerStr = String.fromCharCode(...buffer.slice(0, 5));
    if (!headerStr.startsWith('%PDF-')) {
      return { valid: false, error: 'Security validation failed: File does not have a genuine PDF header (%PDF-).' };
    }

    return { valid: true };
  }

  /**
   * Inspect a PDF document: detect encryption, page count, dimensions, and AcroForm fields.
   */
  static async inspectPdf(buffer: Uint8Array): Promise<PDFInspectionResult> {
    const validation = this.validatePdf(buffer);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    let pdfDoc: PDFDocument;
    try {
      pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('encrypt')) {
        return {
          pageCount: 0,
          isEncrypted: true,
          fileSizeBytes: buffer.length,
          detectedFields: [],
          pageDimensions: []
        };
      }
      throw err;
    }

    const isEncrypted = pdfDoc.isEncrypted;
    const pageCount = pdfDoc.getPageCount();
    const pageDimensions: Array<{ pageNumber: number; width: number; height: number; rotation: number }> = [];

    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();
      pageDimensions.push({
        pageNumber: i + 1,
        width,
        height,
        rotation: page.getRotation().angle
      });
    }

    const detectedFields: DetectedAcroFormField[] = [];

    try {
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      for (const field of fields) {
        const name = field.getName();
        let fieldType: DetectedAcroFormField['type'] = 'Unknown';
        let fieldValue: string | boolean | undefined = undefined;
        let options: string[] | undefined = undefined;

        if (field instanceof PDFTextField) {
          fieldType = 'PDFTextField';
          fieldValue = field.getText();
        } else if (field instanceof PDFCheckBox) {
          fieldType = 'PDFCheckBox';
          fieldValue = field.isChecked();
        } else if (field instanceof PDFDropdown) {
          fieldType = 'PDFDropdown';
          fieldValue = field.getSelected() ? field.getSelected()[0] : undefined;
          options = field.getOptions();
        } else if (field instanceof PDFRadioGroup) {
          fieldType = 'PDFRadioGroup';
          fieldValue = field.getSelected() || undefined;
          options = field.getOptions();
        }

        detectedFields.push({
          name,
          type: fieldType,
          pageIndex: 0,
          value: fieldValue,
          options
        });
      }
    } catch {
      // PDF does not contain AcroForm fields
    }

    return {
      pageCount,
      isEncrypted,
      fileSizeBytes: buffer.length,
      detectedFields,
      pageDimensions
    };
  }

  /**
   * Format field value according to standard presentation rules.
   */
  static formatValue(value: any, rule?: string): string {
    if (value === null || value === undefined) return '';
    const str = String(value).trim();
    if (!rule) return str;

    switch (rule) {
      case 'uppercase':
        return str.toUpperCase();
      case 'lowercase':
        return str.toLowerCase();
      case 'date_slash_au': {
        const d = new Date(str);
        if (!isNaN(d.getTime())) {
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
        }
        return str;
      }
      case 'currency_aud': {
        const numeric = parseFloat(str.replace(/[^0-9.-]+/g, ''));
        if (!isNaN(numeric)) {
          return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
            minimumFractionDigits: 2
          }).format(numeric);
        }
        return str.startsWith('$') ? str : `$${str}`;
      }
      case 'phone_au': {
        const digits = str.replace(/\D/g, '');
        if (digits.length === 10 && digits.startsWith('04')) {
          return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
        }
        return str;
      }
      default:
        return str;
    }
  }

  /**
   * Complete form filling:
   * Supports both interactive AcroForms and flat/scanned PDFs with coordinate placement.
   */
  static async fillCompletedForm(
    originalPdfBuffer: Uint8Array,
    formStructure: AnalyzedFormStructure,
    fieldValues: Record<string, FormFieldValueState>
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(originalPdfBuffer);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let form: any = null;
    try {
      form = pdfDoc.getForm();
    } catch {
      form = null;
    }

    const allFields: FormFieldDefinition[] = [
      ...formStructure.sharedFields,
      ...Object.values(formStructure.personFields).flat()
    ];

    for (const fieldDef of allFields) {
      const state = fieldValues[fieldDef.id];
      if (!state || state.currentValue === null || state.currentValue === undefined || state.currentValue === '') {
        continue;
      }

      const rawVal = state.currentValue;
      const formatted = this.formatValue(rawVal, fieldDef.formatRule);

      // 1. Try filling interactive AcroForm field if exists
      if (form && fieldDef.targetAcroFieldName) {
        try {
          const acroField = form.getField(fieldDef.targetAcroFieldName);
          if (acroField instanceof PDFTextField) {
            acroField.setText(formatted);
            continue;
          } else if (acroField instanceof PDFCheckBox) {
            const isChecked = rawVal === true || rawVal === 'true' || rawVal === 'yes' || rawVal === '1';
            if (isChecked) acroField.check();
            else acroField.uncheck();
            continue;
          } else if (acroField instanceof PDFDropdown || acroField instanceof PDFRadioGroup) {
            acroField.select(formatted);
            continue;
          }
        } catch {
          // Fall through to coordinate placement if field not found in form dictionary
        }
      }

      // 2. If flat PDF or coordinate placement defined, draw onto page
      if (fieldDef.coordinates) {
        const pageIdx = (fieldDef.coordinates.pageNumber || 1) - 1;
        if (pageIdx >= 0 && pageIdx < pdfDoc.getPageCount()) {
          const page = pdfDoc.getPage(pageIdx);
          if (fieldDef.type === 'checkbox') {
            const isChecked = rawVal === true || rawVal === 'true' || rawVal === 'yes' || rawVal === '1';
            if (isChecked) {
              page.drawText('X', {
                x: fieldDef.coordinates.x,
                y: fieldDef.coordinates.y,
                size: 11,
                font: helveticaBold,
                color: rgb(0.1, 0.2, 0.4)
              });
            }
          } else {
            page.drawText(formatted, {
              x: fieldDef.coordinates.x,
              y: fieldDef.coordinates.y,
              size: 10,
              font: helvetica,
              color: rgb(0.1, 0.15, 0.25)
            });
          }
        }
      }
    }

    return await pdfDoc.save();
  }

  /**
   * Interactive AcroForm filling with formatting rules.
   */
  static async fillAcroForm(
    templateBuffer: Uint8Array,
    fieldValues: Record<string, any>,
    formattingRules: Record<string, string> = {},
    flatten: boolean = false
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(templateBuffer);
    let form: any;
    try {
      form = pdfDoc.getForm();
    } catch {
      return templateBuffer;
    }

    const fields = form.getFields();
    for (const field of fields) {
      const fieldName = field.getName();
      if (Object.prototype.hasOwnProperty.call(fieldValues, fieldName)) {
        const rawValue = fieldValues[fieldName];
        const formatRule = formattingRules[fieldName];
        const formatted = this.formatValue(rawValue, formatRule);

        try {
          if (field instanceof PDFTextField) {
            field.setText(formatted);
          } else if (field instanceof PDFCheckBox) {
            const isChecked = rawValue === true || rawValue === 'true' || rawValue === 'yes' || rawValue === '1';
            if (isChecked) field.check();
            else field.uncheck();
          } else if (field instanceof PDFDropdown || field instanceof PDFRadioGroup) {
            if (formatted) field.select(formatted);
          }
        } catch {}
      }
    }

    if (flatten) {
      try { form.flatten(); } catch {}
    }
    return await pdfDoc.save();
  }

  /**
   * Overlay text onto flat PDF coordinates.
   */
  static async overlayCoordinates(
    pdfBuffer: Uint8Array,
    placements: any[],
    fieldValues: Record<string, any>
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    for (const p of placements) {
      const pageIndex = (p.pageNumber || 1) - 1;
      if (pageIndex >= 0 && pageIndex < pdfDoc.getPageCount()) {
        const page = pdfDoc.getPage(pageIndex);
        const val = fieldValues[p.fieldName || p.binding] || '';
        if (val) {
          page.drawText(String(val), {
            x: p.x,
            y: p.y,
            size: p.fontSize || 10,
            font: helvetica
          });
        }
      }
    }
    return await pdfDoc.save();
  }

  /**
   * Watermarking helper.
   */
  static async applyDraftWatermark(
    pdfBuffer: Uint8Array,
    watermarkText: string = 'DRAFT'
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pageCount = pdfDoc.getPageCount();

    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();
      page.drawText(watermarkText, {
        x: width / 4,
        y: height / 2,
        size: 38,
        font: helveticaBold,
        color: rgb(0.85, 0.2, 0.2),
        opacity: 0.18,
        rotate: degrees(45)
      });
    }
    return await pdfDoc.save();
  }

  /**
   * Backward-compatible synthetic form generator for unit tests.
   */
  static async createSyntheticBlankForm(
    title: string,
    industryType: string = 'universal',
    jurisdiction: string = 'AU-QLD'
  ): Promise<Uint8Array> {
    const sample = await this.createSampleForm('joint_mortgage');
    return sample.buffer;
  }
  static async createSampleForm(
    type: 'single_rental' | 'joint_mortgage' | 'flat_conveyancing'
  ): Promise<{ fileName: string; buffer: Uint8Array }> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const form = pdfDoc.getForm();

    const { width, height } = page.getSize();

    if (type === 'joint_mortgage') {
      // Header
      page.drawRectangle({
        x: 36,
        y: height - 80,
        width: width - 72,
        height: 52,
        color: rgb(0.94, 0.96, 0.99),
        borderColor: rgb(0.2, 0.4, 0.8),
        borderWidth: 1.5
      });
      page.drawText('JOINT HOME LOAN APPLICATION FORM', {
        x: 48,
        y: height - 52,
        size: 16,
        font: fontBold,
        color: rgb(0.1, 0.2, 0.4)
      });
      page.drawText('Standard Mortgage Form • Primary Applicant & Partner / Co-Borrower', {
        x: 48,
        y: height - 68,
        size: 9,
        font: fontRegular,
        color: rgb(0.3, 0.4, 0.5)
      });

      // Section 1: Primary Applicant
      let y = height - 110;
      page.drawText('1. PRIMARY APPLICANT DETAILS', { x: 36, y, size: 11, font: fontBold, color: rgb(0.15, 0.2, 0.3) });
      y -= 4;
      page.drawLine({ start: { x: 36, y }, end: { x: width - 36, y }, thickness: 1, color: rgb(0.8, 0.85, 0.9) });

      y -= 22;
      page.drawText('Full Legal Name:', { x: 36, y, size: 9, font: fontRegular });
      const pName = form.createTextField('borrower_1_full_name');
      pName.addToPage(page, { x: 130, y: y - 4, width: 230, height: 18 });

      page.drawText('Date of Birth:', { x: 375, y, size: 9, font: fontRegular });
      const pDob = form.createTextField('borrower_1_dob');
      pDob.addToPage(page, { x: 445, y: y - 4, width: 114, height: 18 });

      y -= 26;
      page.drawText('Residential Address:', { x: 36, y, size: 9, font: fontRegular });
      const pAddr = form.createTextField('borrower_1_address');
      pAddr.addToPage(page, { x: 130, y: y - 4, width: 429, height: 18 });

      y -= 26;
      page.drawText('Phone Number:', { x: 36, y, size: 9, font: fontRegular });
      const pPhone = form.createTextField('borrower_1_phone');
      pPhone.addToPage(page, { x: 130, y: y - 4, width: 140, height: 18 });

      page.drawText('Email Address:', { x: 285, y, size: 9, font: fontRegular });
      const pEmail = form.createTextField('borrower_1_email');
      pEmail.addToPage(page, { x: 360, y: y - 4, width: 199, height: 18 });

      y -= 26;
      page.drawText('Gross Income ($AUD):', { x: 36, y, size: 9, font: fontRegular });
      const pIncome = form.createTextField('borrower_1_income');
      pIncome.addToPage(page, { x: 145, y: y - 4, width: 125, height: 18 });

      // Section 2: Second Applicant / Partner
      y -= 38;
      page.drawText('2. SECOND APPLICANT / PARTNER DETAILS', { x: 36, y, size: 11, font: fontBold, color: rgb(0.15, 0.2, 0.3) });
      y -= 4;
      page.drawLine({ start: { x: 36, y }, end: { x: width - 36, y }, thickness: 1, color: rgb(0.8, 0.85, 0.9) });

      y -= 22;
      page.drawText('Full Legal Name:', { x: 36, y, size: 9, font: fontRegular });
      const sName = form.createTextField('borrower_2_full_name');
      sName.addToPage(page, { x: 130, y: y - 4, width: 230, height: 18 });

      page.drawText('Date of Birth:', { x: 375, y, size: 9, font: fontRegular });
      const sDob = form.createTextField('borrower_2_dob');
      sDob.addToPage(page, { x: 445, y: y - 4, width: 114, height: 18 });

      y -= 26;
      page.drawText('Residential Address:', { x: 36, y, size: 9, font: fontRegular });
      const sAddr = form.createTextField('borrower_2_address');
      sAddr.addToPage(page, { x: 130, y: y - 4, width: 429, height: 18 });

      y -= 26;
      page.drawText('Phone Number:', { x: 36, y, size: 9, font: fontRegular });
      const sPhone = form.createTextField('borrower_2_phone');
      sPhone.addToPage(page, { x: 130, y: y - 4, width: 140, height: 18 });

      page.drawText('Email Address:', { x: 285, y, size: 9, font: fontRegular });
      const sEmail = form.createTextField('borrower_2_email');
      sEmail.addToPage(page, { x: 360, y: y - 4, width: 199, height: 18 });

      y -= 26;
      page.drawText('Gross Income ($AUD):', { x: 36, y, size: 9, font: fontRegular });
      const sIncome = form.createTextField('borrower_2_income');
      sIncome.addToPage(page, { x: 145, y: y - 4, width: 125, height: 18 });

      // Section 3: Joint Application Details
      y -= 38;
      page.drawText('3. JOINT LOAN & PROPERTY DETAILS (SHARED)', { x: 36, y, size: 11, font: fontBold, color: rgb(0.15, 0.2, 0.3) });
      y -= 4;
      page.drawLine({ start: { x: 36, y }, end: { x: width - 36, y }, thickness: 1, color: rgb(0.8, 0.85, 0.9) });

      y -= 22;
      page.drawText('Subject Property Address:', { x: 36, y, size: 9, font: fontRegular });
      const propField = form.createTextField('shared_property_address');
      propField.addToPage(page, { x: 165, y: y - 4, width: 394, height: 18 });

      y -= 26;
      page.drawText('Requested Loan Amount ($AUD):', { x: 36, y, size: 9, font: fontRegular });
      const loanField = form.createTextField('shared_loan_amount');
      loanField.addToPage(page, { x: 185, y: y - 4, width: 130, height: 18 });

      page.drawText('Application Date:', { x: 330, y, size: 9, font: fontRegular });
      const appDateField = form.createTextField('shared_application_date');
      appDateField.addToPage(page, { x: 420, y: y - 4, width: 139, height: 18 });

      // Section 4: Signatures & Declarations (Must remain blank for physical/digital signature)
      y -= 46;
      page.drawText('4. SIGNATURES & DECLARATIONS (LEAVE BLANK FOR SIGNING)', { x: 36, y, size: 11, font: fontBold, color: rgb(0.6, 0.1, 0.1) });
      y -= 4;
      page.drawLine({ start: { x: 36, y }, end: { x: width - 36, y }, thickness: 1, color: rgb(0.8, 0.85, 0.9) });

      y -= 22;
      page.drawRectangle({ x: 36, y: y - 40, width: 240, height: 40, color: rgb(0.98, 0.98, 0.98), borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 1 });
      page.drawText('Borrower 1 Signature: [ Do not fill digitally ]', { x: 44, y: y - 25, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

      page.drawRectangle({ x: 319, y: y - 40, width: 240, height: 40, color: rgb(0.98, 0.98, 0.98), borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 1 });
      page.drawText('Borrower 2 Signature: [ Do not fill digitally ]', { x: 327, y: y - 25, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

      return {
        fileName: 'Joint_Home_Loan_Application.pdf',
        buffer: await pdfDoc.save()
      };
    } else if (type === 'single_rental') {
      // Single person rental form
      page.drawRectangle({
        x: 36,
        y: height - 80,
        width: width - 72,
        height: 52,
        color: rgb(0.95, 0.98, 0.95),
        borderColor: rgb(0.1, 0.6, 0.3),
        borderWidth: 1.5
      });
      page.drawText('RESIDENTIAL TENANCY APPLICATION FORM', {
        x: 48,
        y: height - 52,
        size: 16,
        font: fontBold,
        color: rgb(0.1, 0.4, 0.2)
      });
      page.drawText('Individual Tenant Application Form • Residential Tenancies', {
        x: 48,
        y: height - 68,
        size: 9,
        font: fontRegular,
        color: rgb(0.3, 0.5, 0.3)
      });

      let y = height - 110;
      page.drawText('1. PRIMARY TENANT PARTICULARS', { x: 36, y, size: 11, font: fontBold, color: rgb(0.15, 0.2, 0.3) });
      y -= 4;
      page.drawLine({ start: { x: 36, y }, end: { x: width - 36, y }, thickness: 1, color: rgb(0.8, 0.85, 0.9) });

      y -= 22;
      page.drawText('Full Legal Name:', { x: 36, y, size: 9, font: fontRegular });
      const tName = form.createTextField('tenant_1_full_name');
      tName.addToPage(page, { x: 130, y: y - 4, width: 230, height: 18 });

      page.drawText('Date of Birth:', { x: 375, y, size: 9, font: fontRegular });
      const tDob = form.createTextField('tenant_1_dob');
      tDob.addToPage(page, { x: 445, y: y - 4, width: 114, height: 18 });

      y -= 26;
      page.drawText('Current Address:', { x: 36, y, size: 9, font: fontRegular });
      const tAddr = form.createTextField('tenant_1_address');
      tAddr.addToPage(page, { x: 130, y: y - 4, width: 429, height: 18 });

      y -= 26;
      page.drawText('Phone Number:', { x: 36, y, size: 9, font: fontRegular });
      const tPhone = form.createTextField('tenant_1_phone');
      tPhone.addToPage(page, { x: 130, y: y - 4, width: 140, height: 18 });

      page.drawText('Email Address:', { x: 285, y, size: 9, font: fontRegular });
      const tEmail = form.createTextField('tenant_1_email');
      tEmail.addToPage(page, { x: 360, y: y - 4, width: 199, height: 18 });

      y -= 26;
      page.drawText('Annual Income ($AUD):', { x: 36, y, size: 9, font: fontRegular });
      const tIncome = form.createTextField('tenant_1_income');
      tIncome.addToPage(page, { x: 145, y: y - 4, width: 125, height: 18 });

      y -= 40;
      page.drawText('2. PROPERTY PREMISES (SHARED DETAILS)', { x: 36, y, size: 11, font: fontBold, color: rgb(0.15, 0.2, 0.3) });
      y -= 4;
      page.drawLine({ start: { x: 36, y }, end: { x: width - 36, y }, thickness: 1, color: rgb(0.8, 0.85, 0.9) });

      y -= 22;
      page.drawText('Rental Property Address:', { x: 36, y, size: 9, font: fontRegular });
      const rAddr = form.createTextField('shared_property_address');
      rAddr.addToPage(page, { x: 160, y: y - 4, width: 399, height: 18 });

      y -= 26;
      page.drawText('Proposed Rent ($/wk):', { x: 36, y, size: 9, font: fontRegular });
      const rAmount = form.createTextField('shared_rent_amount');
      rAmount.addToPage(page, { x: 160, y: y - 4, width: 120, height: 18 });

      page.drawText('Lease Start Date:', { x: 310, y, size: 9, font: fontRegular });
      const rDate = form.createTextField('shared_lease_start');
      rDate.addToPage(page, { x: 410, y: y - 4, width: 149, height: 18 });

      // Signatures
      y -= 46;
      page.drawText('3. DECLARATION & SIGNATURE (UNFILLED)', { x: 36, y, size: 11, font: fontBold, color: rgb(0.6, 0.1, 0.1) });
      y -= 22;
      page.drawRectangle({ x: 36, y: y - 40, width: 300, height: 40, color: rgb(0.98, 0.98, 0.98), borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 1 });
      page.drawText('Applicant Signature: [ Sign physically upon receipt ]', { x: 44, y: y - 25, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

      return {
        fileName: 'Rental_Tenancy_Application.pdf',
        buffer: await pdfDoc.save()
      };
    } else {
      // Flat conveyancing form (No AcroForms - tests coordinate placement!)
      page.drawRectangle({
        x: 36,
        y: height - 80,
        width: width - 72,
        height: 52,
        color: rgb(0.98, 0.96, 0.93),
        borderColor: rgb(0.7, 0.4, 0.1),
        borderWidth: 1.5
      });
      page.drawText('CONVEYANCING PURCHASE PARTICULARS', {
        x: 48,
        y: height - 52,
        size: 16,
        font: fontBold,
        color: rgb(0.4, 0.2, 0.05)
      });
      page.drawText('Flat Contract Document (Coordinate Mapping Tested) • Buyer 1 & Buyer 2', {
        x: 48,
        y: height - 68,
        size: 9,
        font: fontRegular,
        color: rgb(0.5, 0.35, 0.2)
      });

      let y = height - 110;
      page.drawText('1. BUYER 1 PARTICULARS', { x: 36, y, size: 11, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
      y -= 4;
      page.drawLine({ start: { x: 36, y }, end: { x: width - 36, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

      y -= 22;
      page.drawText('Full Legal Name: ___________________________________________', { x: 36, y, size: 10, font: fontRegular });
      page.drawText('Date of Birth: ________________', { x: 380, y, size: 10, font: fontRegular });

      y -= 28;
      page.drawText('Residential Address: ___________________________________________________________', { x: 36, y, size: 10, font: fontRegular });

      y -= 28;
      page.drawText('Phone: _____________________', { x: 36, y, size: 10, font: fontRegular });
      page.drawText('Email: ____________________________________', { x: 260, y, size: 10, font: fontRegular });

      y -= 38;
      page.drawText('2. BUYER 2 PARTICULARS', { x: 36, y, size: 11, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
      y -= 4;
      page.drawLine({ start: { x: 36, y }, end: { x: width - 36, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

      y -= 22;
      page.drawText('Full Legal Name: ___________________________________________', { x: 36, y, size: 10, font: fontRegular });
      page.drawText('Date of Birth: ________________', { x: 380, y, size: 10, font: fontRegular });

      y -= 28;
      page.drawText('Residential Address: ___________________________________________________________', { x: 36, y, size: 10, font: fontRegular });

      y -= 28;
      page.drawText('Phone: _____________________', { x: 36, y, size: 10, font: fontRegular });
      page.drawText('Email: ____________________________________', { x: 260, y, size: 10, font: fontRegular });

      y -= 38;
      page.drawText('3. PROPERTY & TRANSACTION DETAILS (SHARED)', { x: 36, y, size: 11, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
      y -= 4;
      page.drawLine({ start: { x: 36, y }, end: { x: width - 36, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

      y -= 22;
      page.drawText('Subject Property Address: _____________________________________________________', { x: 36, y, size: 10, font: fontRegular });

      y -= 28;
      page.drawText('Purchase Price ($AUD): ___________________', { x: 36, y, size: 10, font: fontRegular });
      page.drawText('Settlement Date: _____________________', { x: 320, y, size: 10, font: fontRegular });

      return {
        fileName: 'Conveyancing_Flat_Particulars.pdf',
        buffer: await pdfDoc.save()
      };
    }
  }

  /**
   * Helper to create realistic sample supporting PDFs:
   * Drivers Licence, Payslip, Bank Statement.
   */
  static async createSampleSupportingDoc(
    type: 'driver_licence_sarah' | 'payslip_sarah' | 'driver_licence_david' | 'payslip_david' | 'bank_statement'
  ): Promise<{ fileName: string; buffer: Uint8Array }> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 420.95]); // A5 landscape-style voucher
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const { width, height } = page.getSize();

    if (type === 'driver_licence_sarah') {
      page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, color: rgb(0.96, 0.98, 1.0), borderColor: rgb(0.2, 0.4, 0.7), borderWidth: 2 });
      page.drawText('STATE DRIVER LICENCE — QUEENSLAND', { x: 40, y: height - 60, size: 14, font: fontBold, color: rgb(0.1, 0.3, 0.6) });
      page.drawText('Licence No: 78945612', { x: 40, y: height - 85, size: 11, font: fontBold });
      page.drawText('Name: SARAH JANE THOMPSON', { x: 40, y: height - 110, size: 12, font: fontBold });
      page.drawText('Date of Birth: 14/06/1988', { x: 40, y: height - 135, size: 11, font: fontRegular });
      page.drawText('Address: 124 Palm Avenue, Surfers Paradise QLD 4217', { x: 40, y: height - 160, size: 11, font: fontRegular });
      page.drawText('Class: C  •  Expiry: 22/08/2029', { x: 40, y: height - 185, size: 10, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

      return { fileName: 'Sarah_Thompson_Drivers_Licence.pdf', buffer: await pdfDoc.save() };
    } else if (type === 'payslip_sarah') {
      page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, color: rgb(0.98, 0.98, 0.98), borderColor: rgb(0.3, 0.6, 0.3), borderWidth: 2 });
      page.drawText('OFFICIAL PAYSLIP — PACIFIC HEALTHCARE GROUP', { x: 40, y: height - 60, size: 14, font: fontBold, color: rgb(0.1, 0.5, 0.2) });
      page.drawText('Employee: Sarah Jane Thompson', { x: 40, y: height - 85, size: 12, font: fontBold });
      page.drawText('Position: Senior Clinical Manager', { x: 40, y: height - 105, size: 10, font: fontRegular });
      page.drawText('Gross Annual Salary: $118,500.00 AUD', { x: 40, y: height - 130, size: 12, font: fontBold, color: rgb(0.1, 0.4, 0.1) });
      page.drawText('Phone Contact: 0423 987 654', { x: 40, y: height - 155, size: 11, font: fontRegular });
      page.drawText('Email: sarah.thompson@example.com', { x: 40, y: height - 175, size: 11, font: fontRegular });
      page.drawText('Residential Address on File: 124 Palm Avenue, Surfers Paradise QLD 4217', { x: 40, y: height - 195, size: 10, font: fontRegular });

      return { fileName: 'Sarah_Thompson_Official_Payslip.pdf', buffer: await pdfDoc.save() };
    } else if (type === 'driver_licence_david') {
      page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, color: rgb(0.96, 0.98, 1.0), borderColor: rgb(0.2, 0.4, 0.7), borderWidth: 2 });
      page.drawText('STATE DRIVER LICENCE — QUEENSLAND', { x: 40, y: height - 60, size: 14, font: fontBold, color: rgb(0.1, 0.3, 0.6) });
      page.drawText('Licence No: 45612389', { x: 40, y: height - 85, size: 11, font: fontBold });
      page.drawText('Name: DAVID ROBERT MILLER', { x: 40, y: height - 110, size: 12, font: fontBold });
      page.drawText('Date of Birth: 22/11/1985', { x: 40, y: height - 135, size: 11, font: fontRegular });
      page.drawText('Address: 58 Ocean Boulevard, Broadbeach QLD 4218', { x: 40, y: height - 160, size: 11, font: fontRegular });
      page.drawText('Class: C  •  Expiry: 14/05/2030', { x: 40, y: height - 185, size: 10, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

      return { fileName: 'David_Miller_Drivers_Licence.pdf', buffer: await pdfDoc.save() };
    } else if (type === 'payslip_david') {
      page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, color: rgb(0.98, 0.98, 0.98), borderColor: rgb(0.3, 0.6, 0.3), borderWidth: 2 });
      page.drawText('OFFICIAL PAYSLIP — APEX ENGINEERING PTY LTD', { x: 40, y: height - 60, size: 14, font: fontBold, color: rgb(0.1, 0.5, 0.2) });
      page.drawText('Employee: David Robert Miller', { x: 40, y: height - 85, size: 12, font: fontBold });
      page.drawText('Position: Senior Project Engineer', { x: 40, y: height - 105, size: 10, font: fontRegular });
      page.drawText('Gross Annual Salary: $95,000.00 AUD', { x: 40, y: height - 130, size: 12, font: fontBold, color: rgb(0.1, 0.4, 0.1) });
      page.drawText('Phone Contact: 0412 345 678', { x: 40, y: height - 155, size: 11, font: fontRegular });
      page.drawText('Email: david.miller@example.com', { x: 40, y: height - 175, size: 11, font: fontRegular });
      page.drawText('Residential Address on File: 58 Ocean Boulevard, Broadbeach QLD 4218', { x: 40, y: height - 195, size: 10, font: fontRegular });

      return { fileName: 'David_Miller_Official_Payslip.pdf', buffer: await pdfDoc.save() };
    } else {
      // bank_statement
      page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, color: rgb(0.97, 0.98, 0.99), borderColor: rgb(0.2, 0.3, 0.5), borderWidth: 2 });
      page.drawText('COMMONWEALTH BANK STATEMENT & SETTLEMENT SCHEDULE', { x: 40, y: height - 60, size: 12, font: fontBold, color: rgb(0.1, 0.2, 0.4) });
      page.drawText('Account: Home Purchase Settlement Account', { x: 40, y: height - 85, size: 10, font: fontRegular });
      page.drawText('Subject Property: 74 Coastal Highway, Mermaid Waters QLD 4218', { x: 40, y: height - 110, size: 11, font: fontBold });
      page.drawText('Requested Loan / Consideration Amount: $875,000.00 AUD', { x: 40, y: height - 135, size: 11, font: fontBold });
      page.drawText('Statement / Application Date: 21/10/2026', { x: 40, y: height - 160, size: 10, font: fontRegular });
      page.drawText('Verified Account Deposit Balance: $195,450.00 AUD', { x: 40, y: height - 185, size: 10, font: fontRegular, color: rgb(0.2, 0.5, 0.2) });

      return { fileName: 'Bank_Statement_Deposit_Schedule.pdf', buffer: await pdfDoc.save() };
    }
  }
}
