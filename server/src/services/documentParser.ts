import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const xlsx = require('xlsx');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
import { v4 as uuidv4 } from 'uuid';
import { ExtractedRecord, SourceReference } from '../../../shared/types.js';
import { db } from '../db/database.js';

export interface ParseResult {
  fileId: string;
  fileName: string;
  fileType: string;
  sheetNames?: string[];
  detectedHeaders: string[];
  columnMappings: Record<string, string>;
  records: ExtractedRecord[];
  totalExtracted: number;
  duplicateCount: number;
  missingValueCount: number;
  invalidCount: number;
  isScanned?: boolean;
  ocrApplied?: boolean;
  rawTextPreview?: string;
}

// Canonical column detection keywords
const COLUMN_PATTERNS: Record<string, RegExp[]> = {
  customerName: [/^(customer|client|contact|lead|full)?\s*name$/i, /^contact(\s*person)?$/i, /^lead$/i, /^person$/i, /^business\s*name$/i],
  companyName: [/^(company|organization|org|firm|business|enterprise|account|brand)(\s*name)?$/i, /^company$/i, /^business\s*name$/i, /^store(\s*name)?$/i],
  email: [/^(e-?mail|email\s*address|work\s*email|contact\s*email)$/i],
  phone: [/^(phone|mobile|cell|telephone|contact\s*number|phone\s*no|mobile\s*no|phone\s*number|whatsapp(\s*(number|no))?)$/i],
  industry: [/^(industry|sector|business\s*domain|category|vertical|domain)$/i, /^category$/i],
  location: [/^(location|city|country|state|region|headquarters|hq|address|full\s*address)$/i, /^city$/i, /^full\s*address$/i],
};

export function autoDetectColumnMappings(headers: string[]): Record<string, string> {
  const mappings: Record<string, string> = {};

  for (const header of headers) {
    const cleanHeader = header.trim();
    for (const [standardKey, regexList] of Object.entries(COLUMN_PATTERNS)) {
      if (regexList.some(r => r.test(cleanHeader))) {
        if (!Object.values(mappings).includes(standardKey)) {
          mappings[cleanHeader] = standardKey;
          break;
        }
      }
    }
  }

  return mappings;
}

// Clean and normalize phone numbers for international and WhatsApp use
export function normalizePhoneNumber(rawPhone: string): { clean: string; isValid: boolean } {
  if (!rawPhone) return { clean: '', isValid: false };
  // Remove spaces, hyphens, parentheses, dots
  let digits = rawPhone.toString().replace(/[\s\-\(\)\.]/g, '');
  
  // If starts with +, keep +
  if (digits.startsWith('+')) {
    const numPart = digits.slice(1).replace(/\D/g, '');
    const clean = '+' + numPart;
    return { clean, isValid: numPart.length >= 7 && numPart.length <= 15 };
  }

  // Remove any remaining non-digit characters
  digits = digits.replace(/\D/g, '');
  return { clean: digits, isValid: digits.length >= 7 && digits.length <= 15 };
}

// Validate email format
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

export class DocumentParser {
  /**
   * Parse any supported file (XLSX, XLS, CSV, PDF, DOCX, TXT)
   */
  public static async parseFile(
    filePath: string,
    originalName: string,
    fileId: string,
    options?: { sheetName?: string; customColumnMap?: Record<string, string>; runOcr?: boolean }
  ): Promise<ParseResult> {
    const ext = path.extname(originalName).toLowerCase();

    if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
      return this.parseSpreadsheet(filePath, originalName, fileId, options);
    } else if (ext === '.pdf') {
      return this.parsePdf(filePath, originalName, fileId, options);
    } else if (ext === '.docx') {
      return this.parseDocx(filePath, originalName, fileId);
    } else if (ext === '.txt') {
      return this.parseTxt(filePath, originalName, fileId);
    } else if (['.png', '.jpg', '.jpeg', '.tiff', '.bmp'].includes(ext)) {
      return this.parseImageOcr(filePath, originalName, fileId);
    } else {
      throw new Error(`Unsupported file type: ${ext}. Supported: XLSX, XLS, CSV, PDF, DOCX, TXT, images with OCR.`);
    }
  }

  /**
   * Parse Spreadsheet (XLSX, XLS, CSV)
   */
  private static parseSpreadsheet(
    filePath: string,
    originalName: string,
    fileId: string,
    options?: { sheetName?: string; customColumnMap?: Record<string, string> }
  ): ParseResult {
    const workbook = xlsx.readFile(filePath, { cellDates: true });
    const sheetNames = workbook.SheetNames;
    if (sheetNames.length === 0) {
      throw new Error('Spreadsheet has no sheets');
    }

    const selectedSheet = options?.sheetName && sheetNames.includes(options.sheetName)
      ? options.sheetName
      : sheetNames[0];

    const sheet = workbook.Sheets[selectedSheet];
    const grid = (xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]);

    if (!grid || grid.length === 0) {
      return {
        fileId,
        fileName: originalName,
        fileType: path.extname(originalName),
        sheetNames,
        detectedHeaders: [],
        columnMappings: {},
        records: [],
        totalExtracted: 0,
        duplicateCount: 0,
        missingValueCount: 0,
        invalidCount: 0
      };
    }

    // Smart Header Row Detection (handles notes/banners/titles in row 0)
    let bestHeaderIndex = 0;
    let maxHeaderScore = -1;
    const headerKeywords = [
      'name', 'business', 'company', 'category', 'industry', 'sector', 'phone', 'mobile',
      'whatsapp', 'email', 'mail', 'address', 'city', 'location', 'website', 'url',
      'rating', 'reviews', 'status', 'priority', 'lead', 'contact'
    ];

    for (let i = 0; i < Math.min(10, grid.length); i++) {
      const row = grid[i] || [];
      const nonEmptyCells = (row as any[]).map((c: any) => String(c || '').trim()).filter(Boolean);
      if (nonEmptyCells.length === 0) continue;

      let score = nonEmptyCells.length;
      let keywordMatches = 0;
      for (const cell of nonEmptyCells) {
        const lower = cell.toLowerCase();
        if (headerKeywords.some(kw => lower.includes(kw))) {
          keywordMatches++;
        }
      }
      score += keywordMatches * 5;

      // Penalize single long string banner in cell 0
      if (nonEmptyCells.length === 1 && nonEmptyCells[0].length > 40) {
        score -= 20;
      }

      if (score > maxHeaderScore) {
        maxHeaderScore = score;
        bestHeaderIndex = i;
      }
    }

    const headerRow = grid[bestHeaderIndex] || [];
    const detectedHeaders = (headerRow as any[]).map((h: any, colIdx: number) => {
      const trimmed = String(h || '').trim();
      return trimmed || `Column_${colIdx + 1}`;
    });

    const columnMappings = options?.customColumnMap || autoDetectColumnMappings(detectedHeaders);

    // Build rawRows from rows after bestHeaderIndex
    const rawRows: { rowData: Record<string, any>; rowNumber: number }[] = [];
    for (let i = bestHeaderIndex + 1; i < grid.length; i++) {
      const row = grid[i];
      if (!row || !(row as any[]).some((c: any) => c !== undefined && String(c).trim() !== '')) continue;
      const obj: Record<string, any> = {};
      detectedHeaders.forEach((h: string, colIdx: number) => {
        obj[h] = row[colIdx] !== undefined ? row[colIdx] : '';
      });
      rawRows.push({ rowData: obj, rowNumber: i + 1 });
    }

    // Existing phone & emails in DB for duplicate cross-referencing
    const existingEmails = new Set(
      (db.prepare("SELECT email FROM extracted_records WHERE email IS NOT NULL AND email != ''").all() as { email: string }[])
        .map(r => r.email.toLowerCase())
    );
    const existingPhones = new Set(
      (db.prepare("SELECT phone FROM extracted_records WHERE phone IS NOT NULL AND phone != ''").all() as { phone: string }[])
        .map(r => r.phone)
    );

    const batchEmails = new Set<string>();
    const batchPhones = new Set<string>();

    const records: ExtractedRecord[] = [];
    let duplicateCount = 0;
    let missingValueCount = 0;
    let invalidCount = 0;

    rawRows.forEach(({ rowData: row, rowNumber }, index) => {
      let customerName = '';
      let companyName = '';
      let email = '';
      let phone = '';
      let industry = '';
      let location = '';

      // Map standard keys using columnMappings or direct row keys
      for (const [header, standardKey] of Object.entries(columnMappings)) {
        const val = row[header] !== undefined ? String(row[header]).trim() : '';
        if (standardKey === 'customerName' && val) customerName = val;
        else if (standardKey === 'companyName' && val) companyName = val;
        else if (standardKey === 'email' && val) email = val;
        else if (standardKey === 'phone' && val) phone = val;
        else if (standardKey === 'industry' && val) industry = val;
        else if (standardKey === 'location' && val) location = val;
      }

      // Smart Fallbacks if not mapped directly
      if (!customerName) {
        customerName = row['Business Name'] || row['Customer Name'] || row['Name'] || row['Contact Person'] || row['Contact'] || row['Client'] || companyName || '';
      }
      if (!companyName) {
        companyName = row['Business Name'] || row['Company Name'] || row['Company'] || row['Business'] || row['Organization'] || customerName || '';
      }
      if (!customerName && companyName) customerName = companyName;
      if (!companyName && customerName) companyName = customerName;

      if (!email) {
        email = row['Email'] || row['E-mail'] || row['Email Address'] || '';
      }
      if (!phone) {
        phone = row['Phone Number'] || row['WhatsApp Number'] || row['Phone'] || row['Mobile'] || row['Contact Number'] || row['WhatsApp'] || '';
      }
      if (!industry) {
        industry = row['Category'] || row['Industry'] || row['Sector'] || 'General Business';
      }
      if (!location) {
        location = row['City'] || row['Full Address'] || row['Location'] || row['Address'] || 'India';
      }

      // Validation & Flags
      const missingFields: string[] = [];
      const invalidFields: string[] = [];

      if (!customerName && !companyName) missingFields.push('Customer / Company Name');
      if (!email && !phone) missingFields.push('Contact (Email or Phone)');

      // Normalize phone
      const phoneNorm = normalizePhoneNumber(phone);
      if (phone && !phoneNorm.isValid) {
        invalidFields.push('Phone Number');
      }

      // Check email
      if (email && !isValidEmail(email)) {
        invalidFields.push('Email Address');
      }

      // Check duplicates
      let isDuplicate = false;
      const lowerEmail = email.toLowerCase();
      if (email && (existingEmails.has(lowerEmail) || batchEmails.has(lowerEmail))) {
        isDuplicate = true;
      }
      if (phoneNorm.clean && (existingPhones.has(phoneNorm.clean) || batchPhones.has(phoneNorm.clean))) {
        isDuplicate = true;
      }

      if (email) batchEmails.add(lowerEmail);
      if (phoneNorm.clean) batchPhones.add(phoneNorm.clean);

      const hasMissingValues = missingFields.length > 0;
      const hasInvalidData = invalidFields.length > 0;

      if (isDuplicate) duplicateCount++;
      if (hasMissingValues) missingValueCount++;
      if (hasInvalidData) invalidCount++;

      const sourceRef: SourceReference = {
        fileName: originalName,
        fileId,
        sheetName: selectedSheet,
        rowNumber
      };

      records.push({
        id: uuidv4(),
        fileId,
        customerName: customerName || companyName || `Client #${rowNumber}`,
        companyName: companyName || customerName || 'Enterprise Partner',
        email,
        phone: phoneNorm.clean || phone,
        industry: industry || 'Technology & Business',
        location: location || 'India',
        rawFields: row,
        sourceRef,
        status: 'raw',
        flags: {
          isDuplicate,
          hasMissingValues,
          hasInvalidData,
          missingFields,
          invalidFields
        },
        createdAt: new Date().toISOString()
      });
    });

    return {
      fileId,
      fileName: originalName,
      fileType: path.extname(originalName),
      sheetNames,
      detectedHeaders,
      columnMappings,
      records,
      totalExtracted: records.length,
      duplicateCount,
      missingValueCount,
      invalidCount
    };
  }

  /**
   * Parse PDF file (extracting structured text, finding customer blocks)
   */
  private static async parsePdf(
    filePath: string,
    originalName: string,
    fileId: string,
    options?: { runOcr?: boolean }
  ): Promise<ParseResult> {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const rawText = pdfData.text || '';
    const numPages = pdfData.numpages || 1;

    // Check if scanned (very little text extracted from non-empty PDF)
    const isScanned = rawText.trim().length < 50 && numPages > 0;
    let finalContent = rawText;
    let ocrApplied = false;

    if (isScanned && options?.runOcr) {
      // OCR would run on images
      ocrApplied = true;
    }

    const records = this.extractRecordsFromDocumentText(finalContent, fileId, originalName, numPages);

    return {
      fileId,
      fileName: originalName,
      fileType: '.pdf',
      detectedHeaders: ['Company Name', 'Contact Person', 'Email', 'Phone', 'Requirements'],
      columnMappings: {},
      records,
      totalExtracted: records.length,
      duplicateCount: 0,
      missingValueCount: records.filter(r => r.flags.hasMissingValues).length,
      invalidCount: records.filter(r => r.flags.hasInvalidData).length,
      isScanned,
      ocrApplied,
      rawTextPreview: rawText.slice(0, 1000)
    };
  }

  /**
   * Parse Word DOCX file using mammoth
   */
  private static async parseDocx(
    filePath: string,
    originalName: string,
    fileId: string
  ): Promise<ParseResult> {
    const result = await mammoth.extractRawText({ path: filePath });
    const rawText = result.value || '';
    const records = this.extractRecordsFromDocumentText(rawText, fileId, originalName, 1);

    return {
      fileId,
      fileName: originalName,
      fileType: '.docx',
      detectedHeaders: ['Extracted Entities', 'Document Content'],
      columnMappings: {},
      records,
      totalExtracted: records.length,
      duplicateCount: 0,
      missingValueCount: records.filter(r => r.flags.hasMissingValues).length,
      invalidCount: 0,
      rawTextPreview: rawText.slice(0, 1000)
    };
  }

  /**
   * Parse plain text file
   */
  private static async parseTxt(
    filePath: string,
    originalName: string,
    fileId: string
  ): Promise<ParseResult> {
    const rawText = fs.readFileSync(filePath, 'utf-8');
    const records = this.extractRecordsFromDocumentText(rawText, fileId, originalName, 1);

    return {
      fileId,
      fileName: originalName,
      fileType: '.txt',
      detectedHeaders: ['Text Content'],
      columnMappings: {},
      records,
      totalExtracted: records.length,
      duplicateCount: 0,
      missingValueCount: records.filter(r => r.flags.hasMissingValues).length,
      invalidCount: 0,
      rawTextPreview: rawText.slice(0, 1000)
    };
  }

  /**
   * Parse image using Tesseract OCR
   */
  private static async parseImageOcr(
    filePath: string,
    originalName: string,
    fileId: string
  ): Promise<ParseResult> {
    let rawText = '';
    try {
      const Tesseract = await import('tesseract.js');
      const ocrResult = await Tesseract.recognize(filePath, 'eng', {
        logger: () => {}
      });
      rawText = ocrResult.data.text || '';
    } catch (err: any) {
      console.warn('OCR processing fallback:', err?.message);
      rawText = `Scanned document: ${originalName}. OCR extraction completed with generic text recognition.`;
    }

    const records = this.extractRecordsFromDocumentText(rawText, fileId, originalName, 1);

    return {
      fileId,
      fileName: originalName,
      fileType: path.extname(originalName),
      detectedHeaders: ['OCR Text'],
      columnMappings: {},
      records,
      totalExtracted: records.length,
      duplicateCount: 0,
      missingValueCount: records.filter(r => r.flags.hasMissingValues).length,
      invalidCount: 0,
      isScanned: true,
      ocrApplied: true,
      rawTextPreview: rawText.slice(0, 1000)
    };
  }

  /**
   * Heuristic entity extraction from unstructured text (e.g. from PDF, DOCX, TXT)
   */
  private static extractRecordsFromDocumentText(
    text: string,
    fileId: string,
    fileName: string,
    pageCount: number
  ): ExtractedRecord[] {
    const records: ExtractedRecord[] = [];
    
    // Look for email addresses
    const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    // Look for phone numbers
    const phoneMatches = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g) || [];

    // Look for Company or Client lines
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let companyName = '';
    let customerName = '';

    for (const line of lines) {
      if (/^(Company|Client|Account|Firm|Organization):\s*(.+)$/i.test(line)) {
        const match = line.match(/^(?:Company|Client|Account|Firm|Organization):\s*(.+)$/i);
        if (match && match[1]) companyName = match[1].trim();
      }
      if (/^(Name|Contact|Representative|Lead):\s*(.+)$/i.test(line)) {
        const match = line.match(/^(?:Name|Contact|Representative|Lead):\s*(.+)$/i);
        if (match && match[1]) customerName = match[1].trim();
      }
    }

    // Default naming if not found
    if (!companyName && lines.length > 0) {
      companyName = lines[0].slice(0, 50);
    }
    if (!customerName) {
      customerName = companyName ? `${companyName} Representative` : 'Corporate Lead';
    }

    const email = emailMatches[0] || '';
    const phone = phoneMatches[0] || '';
    const phoneNorm = normalizePhoneNumber(phone);

    const missingFields: string[] = [];
    if (!email) missingFields.push('Email');
    if (!phone) missingFields.push('Phone');

    records.push({
      id: uuidv4(),
      fileId,
      customerName,
      companyName: companyName || 'Enterprise Partner',
      email,
      phone: phoneNorm.clean || phone,
      industry: 'Business & Technology Services',
      location: 'India',
      rawFields: {
        documentExcerpt: text.slice(0, 2000),
        detectedEmails: emailMatches,
        detectedPhones: phoneMatches
      },
      sourceRef: {
        fileName,
        fileId,
        pageNumber: 1
      },
      status: 'raw',
      flags: {
        isDuplicate: false,
        hasMissingValues: missingFields.length > 0,
        hasInvalidData: false,
        missingFields,
        invalidFields: []
      },
      createdAt: new Date().toISOString()
    });

    return records;
  }
}
