// src/lib/pdf/engine.ts
// Universal PDF Document & Form Automation Engine

import { PDFDocument, rgb, StandardFonts, degrees, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } from 'pdf-lib';
import { DetectedAcroFormField, FlatCoordinatePlacement, PDFInspectionResult } from '@/types/pdf';

export class UniversalPdfEngine {
  /**
   * Validate that an uploaded file is a genuine PDF and meets security constraints.
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
          pageIndex: 0, // In pdf-lib fields can span widgets across pages
          value: fieldValue,
          options
        });
      }
    } catch {
      // PDF does not contain AcroForm fields or is a flat document
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
   * Format field value according to specified business formatting rules.
   */
  static formatValue(value: any, formattingRule?: string | null): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const str = String(value).trim();

    switch (formattingRule) {
      case 'uppercase':
        return str.toUpperCase();
      case 'lowercase':
        return str.toLowerCase();
      case 'date_au_slash': {
        // Formats YYYY-MM-DD or standard timestamp into DD/MM/YYYY (Australian standard)
        try {
          const d = new Date(str);
          if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
          }
        } catch {}
        return str;
      }
      case 'currency_aud': {
        // Formats numbers into $#,##0.00
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
        // Clean and standardise Australian phone: 04XX XXX XXX
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
   * Fill interactive AcroForm fields.
   */
  static async fillAcroForm(
    templateBuffer: Uint8Array,
    fieldValues: Record<string, any>,
    formattingRules: Record<string, string> = {},
    flatten: boolean = false
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(templateBuffer);
    let form;
    try {
      form = pdfDoc.getForm();
    } catch {
      return templateBuffer; // No form present
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
            if (isChecked) {
              field.check();
            } else {
              field.uncheck();
            }
          } else if (field instanceof PDFDropdown) {
            if (formatted) {
              field.select(formatted);
            }
          } else if (field instanceof PDFRadioGroup) {
            if (formatted) {
              field.select(formatted);
            }
          }
        } catch {
          // Continue if a field fails constraint validation
        }
      }
    }

    if (flatten) {
      try {
        form.flatten();
      } catch {}
    }

    return await pdfDoc.save();
  }

  /**
   * Overlay text and checkmarks on flat PDF pages using precise (x, y) coordinates.
   * Visual editor coordinates use (0,0) as top-left; PDF uses bottom-left origin.
   */
  static async overlayCoordinates(
    pdfBuffer: Uint8Array,
    placements: FlatCoordinatePlacement[],
    fieldValues: Record<string, any>
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pageCount = pdfDoc.getPageCount();

    for (const placement of placements) {
      const pageIndex = (placement.pageNumber || 1) - 1;
      if (pageIndex < 0 || pageIndex >= pageCount) {
        continue;
      }

      const page = pdfDoc.getPage(pageIndex);
      const { height: pageHeight, width: pageWidth } = page.getSize();

      let val = fieldValues[placement.binding] ?? fieldValues[placement.fieldName] ?? placement.staticValue;
      if (val === undefined || val === null || val === '') {
        continue;
      }

      const formattedVal = this.formatValue(val, placement.formatting);
      const fontSize = placement.fontSize || 10;
      const font = helveticaFont;

      // Coordinate conversion: Top-left to PDF Bottom-left origin
      // placement.y is distance from top of page
      const pdfY = pageHeight - (placement.y + fontSize);
      let pdfX = placement.x;

      if (placement.alignment === 'center' && placement.width) {
        const textWidth = font.widthOfTextAtSize(formattedVal, fontSize);
        pdfX = placement.x + (placement.width - textWidth) / 2;
      } else if (placement.alignment === 'right' && placement.width) {
        const textWidth = font.widthOfTextAtSize(formattedVal, fontSize);
        pdfX = placement.x + placement.width - textWidth;
      }

      page.drawText(formattedVal, {
        x: Math.max(0, pdfX),
        y: Math.max(0, pdfY),
        size: fontSize,
        font,
        color: rgb(0.1, 0.1, 0.1)
      });
    }

    return await pdfDoc.save();
  }

  /**
   * Apply a visible, legal Draft Watermark across every page.
   */
  static async applyDraftWatermark(pdfBuffer: Uint8Array, watermarkText: string = 'DRAFT - NOT FOR EXECUTION'): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pageCount = pdfDoc.getPageCount();

    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();
      const fontSize = Math.min(width, height) / 12;
      const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);

      page.drawText(watermarkText, {
        x: (width - textWidth) / 2,
        y: height / 2,
        size: fontSize,
        font,
        color: rgb(0.85, 0.2, 0.2),
        opacity: 0.25,
        rotate: degrees(35)
      });
    }

    return await pdfDoc.save();
  }

  /**
   * Helper to create a synthetic industry standard blank PDF with real AcroForms
   * for immediate demonstration, testing, and template building.
   */
  static async createSyntheticBlankForm(
    title: string,
    industryType: string,
    jurisdiction: string = 'AU-QLD'
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 in points
    const { width, height } = page.getSize();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const form = pdfDoc.getForm();

    // Top Header Banner
    page.drawRectangle({
      x: 36,
      y: height - 80,
      width: width - 72,
      height: 48,
      color: rgb(0.95, 0.96, 0.98),
      borderColor: rgb(0.8, 0.85, 0.9),
      borderWidth: 1
    });

    page.drawText(title, {
      x: 48,
      y: height - 56,
      size: 14,
      font: fontBold,
      color: rgb(0.12, 0.23, 0.44)
    });

    page.drawText(`Jurisdiction: ${jurisdiction} | Industry: ${industryType.toUpperCase()} | Form Rev 2026.1`, {
      x: 48,
      y: height - 72,
      size: 8,
      font: fontRegular,
      color: rgb(0.4, 0.45, 0.5)
    });

    // Section 1: Applicant / Client Details
    let currentY = height - 110;
    page.drawText('1. CLIENT / APPLICANT PARTICULARS', {
      x: 36,
      y: currentY,
      size: 11,
      font: fontBold,
      color: rgb(0.2, 0.25, 0.3)
    });
    currentY -= 6;
    page.drawLine({
      start: { x: 36, y: currentY },
      end: { x: width - 36, y: currentY },
      thickness: 1,
      color: rgb(0.8, 0.85, 0.9)
    });

    currentY -= 24;
    page.drawText('Full Legal Name:', { x: 36, y: currentY, size: 9, font: fontRegular });
    const nameField = form.createTextField('client_full_name');
    nameField.addToPage(page, { x: 140, y: currentY - 4, width: 220, height: 18 });

    page.drawText('Date of Birth:', { x: 375, y: currentY, size: 9, font: fontRegular });
    const dobField = form.createTextField('client_dob');
    dobField.addToPage(page, { x: 445, y: currentY - 4, width: 114, height: 18 });

    currentY -= 28;
    page.drawText('Residential Address:', { x: 36, y: currentY, size: 9, font: fontRegular });
    const addrField = form.createTextField('client_residential_address');
    addrField.addToPage(page, { x: 140, y: currentY - 4, width: 419, height: 18 });

    currentY -= 28;
    page.drawText('Phone Number:', { x: 36, y: currentY, size: 9, font: fontRegular });
    const phoneField = form.createTextField('client_phone');
    phoneField.addToPage(page, { x: 140, y: currentY - 4, width: 150, height: 18 });

    page.drawText('Email Address:', { x: 305, y: currentY, size: 9, font: fontRegular });
    const emailField = form.createTextField('client_email');
    emailField.addToPage(page, { x: 380, y: currentY - 4, width: 179, height: 18 });

    // Section 2: Transaction & Subject Details
    currentY -= 40;
    page.drawText('2. MATTER / TRANSACTION DETAILS', {
      x: 36,
      y: currentY,
      size: 11,
      font: fontBold,
      color: rgb(0.2, 0.25, 0.3)
    });
    currentY -= 6;
    page.drawLine({
      start: { x: 36, y: currentY },
      end: { x: width - 36, y: currentY },
      thickness: 1,
      color: rgb(0.8, 0.85, 0.9)
    });

    currentY -= 24;
    page.drawText('Subject Property / Title:', { x: 36, y: currentY, size: 9, font: fontRegular });
    const propField = form.createTextField('matter_property_address');
    propField.addToPage(page, { x: 160, y: currentY - 4, width: 399, height: 18 });

    currentY -= 28;
    page.drawText('Consideration / Price ($AUD):', { x: 36, y: currentY, size: 9, font: fontRegular });
    const amountField = form.createTextField('matter_amount');
    amountField.addToPage(page, { x: 175, y: currentY - 4, width: 140, height: 18 });

    page.drawText('Key Date (Settlement/Due):', { x: 330, y: currentY, size: 9, font: fontRegular });
    const dateField = form.createTextField('matter_settlement_date');
    dateField.addToPage(page, { x: 450, y: currentY - 4, width: 109, height: 18 });

    // Section 3: Industry Specifics
    currentY -= 40;
    page.drawText('3. FINANCIAL & COMPLIANCE VERIFICATION', {
      x: 36,
      y: currentY,
      size: 11,
      font: fontBold,
      color: rgb(0.2, 0.25, 0.3)
    });
    currentY -= 6;
    page.drawLine({
      start: { x: 36, y: currentY },
      end: { x: width - 36, y: currentY },
      thickness: 1,
      color: rgb(0.8, 0.85, 0.9)
    });

    currentY -= 24;
    page.drawText('Gross Annual Income ($AUD):', { x: 36, y: currentY, size: 9, font: fontRegular });
    const incomeField = form.createTextField('client_income');
    incomeField.addToPage(page, { x: 180, y: currentY - 4, width: 135, height: 18 });

    page.drawText('Employer Name:', { x: 330, y: currentY, size: 9, font: fontRegular });
    const employerField = form.createTextField('client_employer');
    employerField.addToPage(page, { x: 415, y: currentY - 4, width: 144, height: 18 });

    currentY -= 28;
    page.drawText('Verified ID Document Cited:', { x: 36, y: currentY, size: 9, font: fontRegular });
    const idCheck = form.createCheckBox('compliance_id_verified');
    idCheck.addToPage(page, { x: 185, y: currentY - 2, width: 14, height: 14 });

    page.drawText('Declaration Acknowledged:', { x: 230, y: currentY, size: 9, font: fontRegular });
    const declCheck = form.createCheckBox('compliance_declaration_confirmed');
    declCheck.addToPage(page, { x: 365, y: currentY - 2, width: 14, height: 14 });

    // Section 4: Signature & Human Review Declaration Box
    currentY -= 60;
    page.drawRectangle({
      x: 36,
      y: currentY - 80,
      width: width - 72,
      height: 90,
      borderColor: rgb(0.7, 0.75, 0.8),
      borderWidth: 1,
      color: rgb(0.98, 0.98, 0.99)
    });

    page.drawText('DECLARATION & VERIFICATION NOTICE', {
      x: 48,
      y: currentY - 8,
      size: 9,
      font: fontBold,
      color: rgb(0.2, 0.25, 0.3)
    });

    page.drawText(
      'I hereby verify that all details provided in this form are accurate and complete based on supporting documentation verified.',
      { x: 48, y: currentY - 24, size: 8, font: fontRegular, color: rgb(0.3, 0.35, 0.4) }
    );

    page.drawText('Authorised Signatory / Applicant Signature:', { x: 48, y: currentY - 55, size: 8, font: fontRegular });
    page.drawLine({
      start: { x: 240, y: currentY - 56 },
      end: { x: 420, y: currentY - 56 },
      thickness: 1,
      color: rgb(0.4, 0.45, 0.5)
    });

    page.drawText('Date:', { x: 440, y: currentY - 55, size: 8, font: fontRegular });
    const sigDateField = form.createTextField('signature_date');
    sigDateField.addToPage(page, { x: 470, y: currentY - 60, width: 80, height: 16 });

    // Footer with legal disclaimer
    page.drawText(
      'Notice: Universal AI Document Platform Form Generator. Not legal advice or automated credit approval.',
      { x: 36, y: 24, size: 7, font: fontRegular, color: rgb(0.5, 0.5, 0.5) }
    );

    return await pdfDoc.save();
  }
}
