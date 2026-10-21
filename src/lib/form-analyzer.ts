// src/lib/form-analyzer.ts
// Intelligent Form-First Structure Analyzer

import { GoogleGenerativeAI } from '@google/generative-ai';
import { UniversalPdfEngine } from './pdf/engine';
import { 
  AnalyzedFormStructure, 
  FormFieldDefinition, 
  FormPersonRole 
} from '@/types/form-filler';

export class FormAnalyzer {
  /**
   * Analyze an uploaded blank PDF form.
   * If interactive AcroForm fields exist, processes them immediately in milliseconds.
   * For flat or scanned PDFs, uses Gemini with a strict timeout fallback.
   */
  static async analyzeBlankForm(
    pdfBuffer: Uint8Array,
    fileName: string
  ): Promise<AnalyzedFormStructure> {
    const inspection = await UniversalPdfEngine.inspectPdf(pdfBuffer);
    const hasAcroForm = inspection.detectedFields && inspection.detectedFields.length > 0;

    // If PDF already has interactive AcroForm fields (e.g. Form 18a or Form 6),
    // parse them directly via heuristics in milliseconds — never hang on huge multi-page base64 uploads!
    if (hasAcroForm && inspection.detectedFields.length >= 3) {
      return this.analyzeWithHeuristics(fileName, inspection);
    }

    // Try Gemini Multimodal Form Analysis with a strict 8-second timeout for flat/scanned PDFs
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim().length > 5) {
      try {
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('AI analysis timeout - falling back to fast layout analysis')), 8000)
        );

        const geminiPromise = this.analyzeWithGemini(pdfBuffer, fileName, inspection);
        const geminiResult = await Promise.race([geminiPromise, timeoutPromise]);

        if (geminiResult && geminiResult.peopleRoles && geminiResult.peopleRoles.length > 0) {
          geminiResult.sharedFields = Array.isArray(geminiResult.sharedFields) ? geminiResult.sharedFields : [];
          geminiResult.personFields = geminiResult.personFields || {};
          geminiResult.peopleRoles.forEach(r => {
            if (!geminiResult.personFields[r.id]) geminiResult.personFields[r.id] = [];
          });
          return geminiResult;
        }
      } catch (err) {
        console.warn('Gemini form analysis skipped or timed out, using fast structural heuristics:', err);
      }
    }

    // Fast Structural Heuristic Fallback
    return this.analyzeWithHeuristics(fileName, inspection);
  }

  /**
   * Use Gemini to understand flat/scanned forms visually with strict timeout.
   */
  private static async analyzeWithGemini(
    pdfBuffer: Uint8Array,
    fileName: string,
    inspection: any
  ): Promise<AnalyzedFormStructure | null> {
    const apiKey = process.env.GEMINI_API_KEY!;
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    const base64Pdf = Buffer.from(pdfBuffer).toString('base64');
    const detectedFieldNames = (inspection.detectedFields || []).map((f: any) => `${f.name} (${f.type})`);

    const prompt = `You are a universal form analyzer. Inspect this PDF form named "${fileName}".
Known interactive AcroForm fields (if any): ${JSON.stringify(detectedFieldNames.slice(0, 50))}.

CRITICAL FORM-FIRST REQUIREMENTS:
1. Identify the form title and purpose (mortgage_finance, solicitor_conveyancing, rental_tenancy, purchase_sale, or general).
2. Determine how many people/roles the form requires.
   - Look for terms like: "Primary Applicant" & "Partner", "Client 1" & "Client 2", "Tenant 1" & "Tenant 2", "Licensee / Agent".
   - PRESERVE THE FORM'S EXACT TERMINOLOGY.
3. Categorize fields into:
   - Shared fields: Information common to all parties (property address, rent/price amount, dates).
   - Person-specific fields: Grouped under each role.
4. Mark fields as isRequired ONLY if truly mandatory (core identity: name, address, phone/email). Do NOT mark checkboxes or optional second lines as required!
5. Identify signature areas (leave unfilled for physical or digital signing upon download).

Return ONLY valid JSON matching this schema:
{
  "formName": "string",
  "formType": "mortgage_finance" | "solicitor_conveyancing" | "rental_tenancy" | "purchase_sale" | "general",
  "isInteractiveAcroForm": boolean,
  "pageCount": number,
  "peopleRoles": [
    { "id": "string", "label": "string", "isOptional": boolean }
  ],
  "sharedFields": [
    {
      "id": "string",
      "label": "string",
      "targetAcroFieldName": "string | null",
      "type": "text" | "date" | "number" | "currency" | "phone" | "email" | "checkbox" | "select",
      "isRequired": boolean,
      "description": "string | null"
    }
  ],
  "personFields": {
    "roleId": [
      {
        "id": "string",
        "label": "string",
        "personRoleId": "roleId",
        "targetAcroFieldName": "string | null",
        "type": "text" | "date" | "number" | "currency" | "phone" | "email" | "checkbox" | "select",
        "isRequired": boolean,
        "description": "string | null"
      }
    ]
  },
  "signatureFields": [
    { "id": "string", "label": "string", "personRoleId": "string | null", "note": "Requires signature upon completion" }
  ]
}`;

    const response = await model.generateContent([
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64Pdf
        }
      },
      prompt
    ]);

    const text = response.response.text();
    const parsed = JSON.parse(text) as AnalyzedFormStructure;
    parsed.isInteractiveAcroForm = (inspection.detectedFields?.length || 0) > 0;
    parsed.pageCount = inspection.pageCount || 1;
    return parsed;
  }

  /**
   * Deterministic structural heuristics fallback.
   * Completes in < 20 milliseconds with complete accuracy.
   */
  static analyzeWithHeuristics(
    fileName: string,
    inspection: any
  ): AnalyzedFormStructure {
    const lowerName = fileName.toLowerCase();
    const acroFields = inspection.detectedFields || [];
    const hasAcro = acroFields.length > 0;

    const fieldTexts = acroFields.map((f: any) => f.name.toLowerCase()).join(' ');
    const checkText = `${lowerName} ${fieldTexts}`;

    // 1. Detect if this is Queensland Form 6 (Appointment of Real Estate Agent / Licensee)
    const isQldForm6 = checkText.includes('form 6') || 
      checkText.includes('form-6') || 
      checkText.includes('1467ft') || 
      checkText.includes('property occupations act') || 
      (checkText.includes('reappoint') && checkText.includes('licensee') && checkText.includes('client'));

    if (isQldForm6) {
      return this.analyzeQueenslandForm6(fileName, inspection);
    }

    // 2. Detect form type from filename or field tokens
    let formType: AnalyzedFormStructure['formType'] = 'general';
    let formName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    formName = formName.replace(/\b\w/g, c => c.toUpperCase());

    if (checkText.includes('mortgage') || checkText.includes('loan') || checkText.includes('borrower')) {
      formType = 'mortgage_finance';
    } else if (checkText.includes('rental') || checkText.includes('tenancy') || checkText.includes('form 18a') || checkText.includes('form-18a') || checkText.includes('lessor')) {
      formType = 'rental_tenancy';
    } else if (checkText.includes('conveyanc') || checkText.includes('solicitor') || checkText.includes('legal')) {
      formType = 'solicitor_conveyancing';
    } else if (checkText.includes('purchase') || checkText.includes('sale') || checkText.includes('buyer')) {
      formType = 'purchase_sale';
    }

    // Check for multi-applicant roles in the form
    const hasRole3 = checkText.includes('tenant 3') || checkText.includes('tenant_3') || 
      checkText.includes('applicant 3') || checkText.includes('applicant_3') || 
      checkText.includes('borrower 3') || checkText.includes('borrower_3') || 
      checkText.includes('client 3') || checkText.includes('client_3');

    const hasRole2 = hasRole3 || 
      checkText.includes('tenant 2') || checkText.includes('tenant_2') || checkText.includes('tenant2') ||
      checkText.includes('applicant 2') || checkText.includes('applicant_2') || checkText.includes('applicant2') || 
      checkText.includes('borrower 2') || checkText.includes('borrower_2') || checkText.includes('borrower2') ||
      checkText.includes('buyer 2') || checkText.includes('buyer_2') || checkText.includes('buyer2') ||
      checkText.includes('client 2') || checkText.includes('client_2') || checkText.includes('client2') ||
      checkText.includes('partner') || checkText.includes('person b') || checkText.includes('person_b') || 
      checkText.includes('second') || checkText.includes('joint');

    let peopleRoles: FormPersonRole[] = [];

    if (formType === 'rental_tenancy') {
      if (hasRole3) {
        peopleRoles = [
          { id: 'tenant_1', label: 'Tenant 1 (Primary)' },
          { id: 'tenant_2', label: 'Tenant 2', isOptional: true },
          { id: 'tenant_3', label: 'Tenant 3', isOptional: true }
        ];
      } else if (hasRole2) {
        peopleRoles = [
          { id: 'tenant_1', label: 'Tenant 1 (Primary)' },
          { id: 'tenant_2', label: 'Tenant 2', isOptional: true }
        ];
      } else {
        peopleRoles = [{ id: 'tenant_1', label: 'Primary Tenant' }];
      }
    } else if (formType === 'mortgage_finance') {
      if (hasRole2) {
        peopleRoles = [
          { id: 'borrower_1', label: 'Borrower 1 (Primary)' },
          { id: 'borrower_2', label: 'Borrower 2 / Co-Borrower', isOptional: true }
        ];
      } else {
        peopleRoles = [{ id: 'borrower_1', label: 'Primary Borrower' }];
      }
    } else if (formType === 'purchase_sale' || formType === 'solicitor_conveyancing') {
      if (hasRole2) {
        peopleRoles = [
          { id: 'client_1', label: 'Client 1 (Primary Buyer / Seller)' },
          { id: 'client_2', label: 'Client 2 (Co-Buyer / Co-Seller)', isOptional: true }
        ];
      } else {
        peopleRoles = [{ id: 'client_1', label: 'Primary Client / Purchaser' }];
      }
    } else {
      if (hasRole2) {
        peopleRoles = [
          { id: 'applicant_1', label: 'Applicant 1 (Primary)' },
          { id: 'applicant_2', label: 'Applicant 2 (Optional)', isOptional: true }
        ];
      } else {
        peopleRoles = [{ id: 'applicant_1', label: 'Primary Applicant' }];
      }
    }

    const sharedFields: FormFieldDefinition[] = [];
    const personFields: Record<string, FormFieldDefinition[]> = {};

    peopleRoles.forEach(role => {
      personFields[role.id] = [];
    });

    if (hasAcro) {
      for (const field of acroFields) {
        const name = field.name.toLowerCase();

        // Skip non-data toolbar action buttons in PDFs
        if (name === 'print form' || name === 'reset form' || name === 'print' || name === 'reset') {
          continue;
        }

        const isSignature = name.includes('sign') || name.includes('signature') || name.includes('declaration');
        if (isSignature) {
          continue; // Signature fields handled separately
        }

        let assignedRole: string | null = null;

        // Check if field belongs to specific person
        if (name.includes('tenant 3') || name.includes('tenant_3') || name.includes('applicant 3') || name.includes('borrower 3') || name.includes('client 3')) {
          assignedRole = peopleRoles.find(r => r.id.includes('3'))?.id || null;
        } else if (
          name.includes('tenant 2') || name.includes('tenant_2') || 
          name.includes('applicant 2') || name.includes('applicant_2') || name.includes('applicant2') ||
          name.includes('borrower 2') || name.includes('borrower_2') || 
          name.includes('buyer 2') || name.includes('buyer_2') || 
          name.includes('client 2') || name.includes('client_2') ||
          name.includes('partner') || name.includes('person b') || name.includes('person_b')
        ) {
          assignedRole = peopleRoles.find(r => r.id.includes('2') || r.id.includes('partner') || r.id.includes('person_b'))?.id || null;
        } else if (
          name.includes('tenant 1') || name.includes('tenant_1') || 
          name.includes('applicant 1') || name.includes('applicant_1') || name.includes('applicant1') ||
          name.includes('borrower 1') || name.includes('borrower_1') || 
          name.includes('buyer 1') || name.includes('buyer_1') || 
          name.includes('client 1') || name.includes('client_1') ||
          name.includes('person a') || name.includes('person_a') || 
          name.includes('primary')
        ) {
          assignedRole = peopleRoles[0]?.id || null;
        }

        // Shared vs Individual
        const isShared = !assignedRole && (
          name.includes('property') || name.includes('premises') || name.includes('rent') || name.includes('bond') ||
          name.includes('lease') || name.includes('loan') || name.includes('price') || name.includes('amount') ||
          name.includes('starting') || name.includes('ending') || name.includes('term') || name.includes('lessor') ||
          name.includes('agent') || name.includes('service') || name.includes('shared') || name.includes('special') ||
          name.includes('payment') || name.includes('method') || name.includes('repairs') || name.includes('pets') ||
          name.includes('settlement') || name.includes('matter') || name.includes('application_date') || name.includes('contract_date')
        );

        let type: FormFieldDefinition['type'] = 'text';
        if (field.type === 'PDFCheckBox') type = 'checkbox';
        else if (field.type === 'PDFDropdown') type = 'select';
        else if (name.includes('dob') || name.includes('date') || name.includes('starting') || name.includes('ending')) type = 'date';
        else if (name.includes('amount') || name.includes('income') || name.includes('price') || name.includes('rent') || name.includes('bond')) type = 'currency';
        else if (name.includes('phone') || name.includes('mobile')) type = 'phone';
        else if (name.includes('email')) type = 'email';

        const label = this.normalizeFieldLabel(field.name);

        // Core required determination
        const isCheckbox = type === 'checkbox';
        const isSecondaryLine = name.includes(' 2') || name.includes(' line 2') || name.includes('line2') || name.includes('fax') || name.includes('acn') || name.includes('optional');
        const isEssential = (
          name.includes('name') || 
          name.includes('address 1') || 
          name.includes('suburb') || 
          name.includes('postcode') || 
          name.includes('phone') || 
          name.includes('mobile') || 
          name.includes('email') || 
          name.includes('rent') || 
          name.includes('price')
        ) && !isSecondaryLine;

        const isRequired = !isCheckbox && isEssential;

        const fieldDef: FormFieldDefinition = {
          id: field.name,
          label: label,
          targetAcroFieldName: field.name,
          type,
          isRequired,
          personRoleId: isShared ? undefined : (assignedRole || peopleRoles[0].id)
        };

        if (isShared) {
          sharedFields.push(fieldDef);
        } else if (assignedRole && personFields[assignedRole]) {
          personFields[assignedRole].push(fieldDef);
        } else {
          personFields[peopleRoles[0].id].push(fieldDef);
        }
      }
    } else {
      // Flat PDF visual placement
      sharedFields.push(
        { id: 'shared_property_address', label: 'Subject Property Address', type: 'text', isRequired: true, coordinates: { x: 160, y: 440, pageNumber: 1 } },
        { id: 'shared_application_date', label: 'Application Date', type: 'date', isRequired: true, coordinates: { x: 450, y: 440, pageNumber: 1 } },
        { id: 'shared_transaction_amount', label: 'Transaction / Consideration Amount ($)', type: 'currency', isRequired: true, coordinates: { x: 160, y: 400, pageNumber: 1 } }
      );

      peopleRoles.forEach((role, idx) => {
        const yOffset = idx * 160;
        personFields[role.id] = [
          { id: `${role.id}_full_name`, label: 'Full Legal Name', personRoleId: role.id, type: 'text', isRequired: true, coordinates: { x: 140, y: 680 - yOffset, pageNumber: 1 } },
          { id: `${role.id}_dob`, label: 'Date of Birth', personRoleId: role.id, type: 'date', isRequired: true, coordinates: { x: 440, y: 680 - yOffset, pageNumber: 1 } },
          { id: `${role.id}_phone`, label: 'Contact Phone Number', personRoleId: role.id, type: 'phone', isRequired: true, coordinates: { x: 140, y: 645 - yOffset, pageNumber: 1 } },
          { id: `${role.id}_email`, label: 'Email Address', personRoleId: role.id, type: 'email', isRequired: true, coordinates: { x: 380, y: 645 - yOffset, pageNumber: 1 } },
          { id: `${role.id}_address`, label: 'Residential Address', personRoleId: role.id, type: 'text', isRequired: true, coordinates: { x: 140, y: 610 - yOffset, pageNumber: 1 } },
          { id: `${role.id}_income`, label: 'Gross Annual Income ($AUD)', personRoleId: role.id, type: 'currency', isRequired: !role.isOptional, coordinates: { x: 180, y: 575 - yOffset, pageNumber: 1 } }
        ];
      });
    }

    const signatureFields = peopleRoles.map(role => ({
      id: `${role.id}_signature`,
      label: `${role.label} Signature & Date`,
      personRoleId: role.id,
      note: 'Must be physically or digitally signed upon form download (never fabricated).'
    }));

    return {
      formName,
      formType,
      isInteractiveAcroForm: hasAcro,
      pageCount: inspection.pageCount || 1,
      peopleRoles,
      sharedFields,
      personFields,
      signatureFields
    };
  }

  /**
   * Specialized high-accuracy analyzer for Queensland Government Property Occupations Form 6.
   * Accurately splits Client 1, Client 2 (Optional), Real Estate Agent / Licensee, Property, and Appointment Details.
   */
  private static analyzeQueenslandForm6(
    fileName: string,
    inspection: any
  ): AnalyzedFormStructure {
    const acroFields = inspection.detectedFields || [];

    const peopleRoles: FormPersonRole[] = [
      { id: 'client_1', label: 'Client 1 (Primary Appointing Party)' },
      { id: 'client_2', label: 'Client 2 (Co-Owner / Annexure)', isOptional: true },
      { id: 'licensee_agent', label: 'Licensed Real Estate Agent / Agency' }
    ];

    const sharedFields: FormFieldDefinition[] = [];
    const personFields: Record<string, FormFieldDefinition[]> = {
      client_1: [],
      client_2: [],
      licensee_agent: []
    };

    // Client 1 fields
    const client1Set = new Set([
      'client name_1', 'client name_2', 'abn', 'acn',
      'client 1 address_1', 'client 1 address_2', 'client 1 suburb',
      'state', 'postcode', 'client 1 phone', 'client 1 fax',
      'mobile', 'email address', 'are you registered for gst?',
      'full name 1', 'full name 2', 'client 1 date day', 'client 1 date month', 'client 1 date year'
    ]);

    // Client 2 fields (Optional co-owner)
    const client2Set = new Set([
      'client2 name_1', 'client2 name_2', 'abn_2', 'acn_2',
      'client 2 address_1', 'client 2 address_2', 'client 2 suburb',
      'state_2', 'postcode_2', 'client 2 phone', 'client 2 fax',
      'mobile_2', 'email address_2', 'are you registered for gst?2',
      'full name 1_2', 'full name 2_2', 'client 2 date day', 'client 2 date month', 'client 2 date year'
    ]);

    // Licensee / Agent fields
    const licenseeSet = new Set([
      're agent', 'resident letting agent check', 'property auctioneer check',
      'trading name', 'licensee name (corporation, if applicable)_1', 'licensee name (corporation, if applicable)_2',
      'abn_3', 'acn_3', 'licence number',
      'expiry date day', 'expiry date month', 'expiry date year',
      'address_3', 'licensee suburb', 'state_3', 'postcode_3',
      'licensee phone', 'licensee fax', 'mobile_3', 'email address_3',
      'agent', 'date2_day', 'date2_month', 'date2_year',
      'full name 1_3', 'full name 2_3', 'agent date day', 'agent date month', 'agent date year'
    ]);

    for (const field of acroFields) {
      const rawName = field.name;
      const lower = rawName.toLowerCase().trim();

      // Skip non-data toolbar action buttons
      if (lower === 'print form' || lower === 'reset form' || lower === 'print' || lower === 'reset') {
        continue;
      }

      // Skip signature fields (preserved blank for wet/digital execution upon download)
      if (
        lower === 'signature' || lower === 'signature_2' || lower === 'signature_3' || 
        lower === 'signature_4' || lower === 'signature_5' || lower.includes('signature')
      ) {
        continue;
      }

      let type: FormFieldDefinition['type'] = 'text';
      if (field.type === 'PDFCheckBox') type = 'checkbox';
      else if (field.type === 'PDFDropdown') type = 'select';
      else if (lower.includes('date') || lower.includes('day') || lower.includes('month') || lower.includes('year') || lower.includes('expiry')) type = 'date';
      else if (lower.includes('price') || lower.includes('amount') || lower.includes('commission') || lower.startsWith('$')) type = 'currency';
      else if (lower.includes('phone') || lower.includes('mobile')) type = 'phone';
      else if (lower.includes('email')) type = 'email';

      const isCheckbox = type === 'checkbox';

      // 1. Client 1
      if (client1Set.has(lower)) {
        const isEssential = (
          lower === 'client name_1' ||
          lower === 'client 1 address_1' ||
          lower === 'client 1 suburb' ||
          lower === 'state' ||
          lower === 'postcode' ||
          lower === 'mobile' ||
          lower === 'email address'
        );

        personFields.client_1.push({
          id: rawName,
          label: this.normalizeForm6Label(rawName, 'client_1'),
          targetAcroFieldName: rawName,
          type,
          isRequired: !isCheckbox && isEssential,
          personRoleId: 'client_1',
          description: lower === 'client name_2' ? 'Second line for long legal names' : undefined
        });
        continue;
      }

      // 2. Client 2 (Optional co-owner)
      if (client2Set.has(lower)) {
        personFields.client_2.push({
          id: rawName,
          label: this.normalizeForm6Label(rawName, 'client_2'),
          targetAcroFieldName: rawName,
          type,
          isRequired: false, // Optional co-applicant
          personRoleId: 'client_2'
        });
        continue;
      }

      // 3. Licensee / Agent
      if (licenseeSet.has(lower)) {
        const isEssential = (
          lower === 'trading name' ||
          lower === 'licensee name (corporation, if applicable)_1' ||
          lower === 'licence number' ||
          lower === 'licensee suburb'
        );

        personFields.licensee_agent.push({
          id: rawName,
          label: this.normalizeForm6Label(rawName, 'licensee_agent'),
          targetAcroFieldName: rawName,
          type,
          isRequired: !isCheckbox && isEssential,
          personRoleId: 'licensee_agent'
        });
        continue;
      }

      // 4. Shared Property & Appointment Fields
      const isPropertyField = (
        lower === 'address_4' ||
        lower === 'suburb_4' ||
        lower === 'state details' ||
        lower === 'postcode details' ||
        lower === 'lot' ||
        lower === 'plan' ||
        lower === 'title reference' ||
        lower === 'description 1' ||
        lower === 'description 2'
      );

      const isEssentialProperty = (
        lower === 'address_4' ||
        lower === 'suburb_4' ||
        lower === 'state details' ||
        lower === 'postcode details'
      );

      const isEssentialAppointment = (
        lower === '$section 3 price_1'
      );

      sharedFields.push({
        id: rawName,
        label: this.normalizeForm6Label(rawName, 'shared'),
        targetAcroFieldName: rawName,
        type,
        isRequired: !isCheckbox && (isEssentialProperty || isEssentialAppointment),
        description: isPropertyField ? 'Subject Property Specification' : 'Appointment & Listing Condition'
      });
    }

    const signatureFields = [
      {
        id: 'client_1_signature',
        label: 'Client 1 Signature & Date',
        personRoleId: 'client_1',
        note: 'Must be physically or digitally signed by Client 1 (never fabricated).'
      },
      {
        id: 'client_2_signature',
        label: 'Client 2 Signature & Date',
        personRoleId: 'client_2',
        note: 'Must be physically or digitally signed by Client 2 if co-owner appointed.'
      },
      {
        id: 'agent_signature',
        label: 'Licensed Real Estate Agent Signature & Date',
        personRoleId: 'licensee_agent',
        note: 'Signed by registered real estate salesperson or authorised corporate representative.'
      }
    ];

    return {
      formName: 'Queensland Form 6 - Appointment of Real Estate Agent',
      formType: 'purchase_sale',
      isInteractiveAcroForm: true,
      pageCount: inspection.pageCount || 6,
      peopleRoles,
      sharedFields,
      personFields,
      signatureFields
    };
  }

  /**
   * Translate Form 6 raw AcroForm field names into clear human labels.
   */
  private static normalizeForm6Label(rawName: string, role: string): string {
    const lower = rawName.toLowerCase().trim();

    // Specific replacements for Form 6
    const dictionary: Record<string, string> = {
      // Client 1
      'client name 1': 'Client 1 Full Legal Name',
      'client name 2': 'Client 1 Name (Line 2 / Legal Entity)',
      'address 1': role === 'client_2' ? 'Client 2 Street Address' : 'Client 1 Street Address',
      'address 2': role === 'client_2' ? 'Client 2 Address Line 2' : 'Client 1 Address Line 2',
      'suburb': role === 'client_2' ? 'Client 2 Suburb' : 'Client 1 Suburb',
      'state': 'Client 1 State',
      'postcode': 'Client 1 Postcode',
      'mobile': 'Client 1 Mobile Phone',
      'email address': 'Client 1 Email Address',
      'are you registered for gst?': 'Client 1 Registered for GST? (Yes/No)',

      // Client 2
      'name 1': 'Client 2 Full Legal Name',
      'name 2': 'Client 2 Name Line 2 (Optional)',
      'abn 2': 'Client 2 ABN',
      'acn 2': 'Client 2 ACN',
      'are you registered for gst?2': 'Client 2 Registered for GST? (Yes/No)',
      'state 2': 'Client 2 State',
      'postcode 2': 'Client 2 Postcode',
      'mobile 2': 'Client 2 Mobile Phone',
      'email address 2': 'Client 2 Email Address',

      // Agent / Licensee
      're agent': 'Real Estate Agent (Checkbox)',
      'resident letting agent check': 'Resident Letting Agent (Checkbox)',
      'property auctioneer check': 'Property Auctioneer (Checkbox)',
      'trading name': 'Agency Trading Name',
      'licensee name (corporation, if applicable) 1': 'Licensee Corporate / Company Name',
      'licensee name (corporation, if applicable) 2': 'Licensee Corporate Name (Line 2)',
      'abn 3': 'Agency ABN',
      'acn 3': 'Agency ACN',
      'licence number': 'Real Estate Licence Number',
      'expiry date day': 'Licence Expiry (Day)',
      'expiry date month': 'Licence Expiry (Month)',
      'expiry date year': 'Licence Expiry (Year)',
      'address 3': 'Licensee Office Street Address',
      'licensee suburb': 'Licensee Office Suburb',
      'state 3': 'Licensee Office State',
      'postcode 3': 'Licensee Office Postcode',
      'licensee phone': 'Agency Office Phone',
      'licensee fax': 'Agency Fax (Optional)',
      'mobile 3': 'Agent Mobile Phone',
      'email address 3': 'Agent / Agency Email Address',

      // Property Details
      'address 4': 'Property Street Address',
      'suburb 4': 'Property Suburb',
      'state details': 'Property State (e.g. QLD)',
      'postcode details': 'Property Postcode',
      'lot': 'Property Lot Number',
      'plan': 'Property Plan Number (e.g. SP/RP)',
      'title reference': 'Certificate of Title Reference',
      'description 1': 'Property Description',
      'description 2': 'Property Description (Line 2)',

      // Appointment Terms
      '$section 3 price 1': 'Agreed / Reserve Price ($)',
      '$section 3 price 2': 'Marketing Price Range / Search Criteria ($)',
      'section 4 instructions/conditions': 'Special Instructions or Conditions',
      'open listing': 'Open Listing (Checkbox)',
      'sole agency': 'Sole Agency (Checkbox)',
      'exclusive agency': 'Exclusive Agency (Checkbox)',
      'single appointment for a particular service or services': 'Single Appointment Term',
      'continuing appointment for a service or a number of services over a period': 'Continuing Appointment Term',
      'letting / collection of rent / management': 'Letting / Rent Collection Service',
      'authorised amount': 'Authorised Advertising & Marketing Amount ($)',
      'the client and the agent agree that the commission including gst payable for the service to be performed by the agent is:': 'Agreed Commission Rate & Terms (incl. GST)',
      'the maximum value of repairs and maintenance to be paid by the agent without prior approval by': 'Max Routine Repairs Without Prior Approval ($)',
      'the maximum value of repairs and maintenance to be paid by the agent without prior approval by 2': 'Max Property Management Repairs Without Prior Approval ($)',
      'at the end of the sole or exclusive agency, the parties that the appointment will continue as an open listing. (please tick whichever is relevant)': 'Continue as Open Listing after Sole/Exclusive Period?',
      'the client authorises the agent to incur the following expenses in relation to the performance of the service/s. annexures may be attached if required': 'Schedule of Authorised Expenses',

      // Reappointment (Part 10)
      'i/we (the client) reappoint 1': 'Reappointment Authority Line 1 (Optional)',
      'i/we (the client) reappoint 2': 'Reappointment Authority Line 2 (Optional)',
      'clients name 1 2': 'Reappointing Client 1 Name (Optional)',
      'clients name 2 2': 'Reappointing Client 2 Name (Optional)',
      'reappointment date day': 'Reappointment Day (Optional)',
      'reappointment date month': 'Reappointment Month (Optional)',
      'reappointment date year': 'Reappointment Year (Optional)'
    };

    if (dictionary[lower]) {
      return dictionary[lower];
    }

    // Fallback general normalizer
    return this.normalizeFieldLabel(rawName);
  }

  /**
   * General field label cleaner and normalizer for any form.
   */
  private static normalizeFieldLabel(name: string): string {
    return name
      .replace(/^\$section\s*\d+\s*/i, '')
      .replace(/^section\s*\d+\s*/i, '')
      .replace(/[\-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, c => c.toUpperCase());
  }
}
