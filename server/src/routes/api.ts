import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/environment.js';
import { db, resetAccountData, syncGivenDataOnly } from '../db/database.js';
import { seedRealInitialFilesAndRecords } from '../db/realTimeDataSeeder.js';
import { DocumentParser } from '../services/documentParser.js';
import { GeminiService } from '../services/geminiService.js';
import { AnalyticsService } from '../services/analyticsService.js';
import { ExportService } from '../services/exportService.js';
import {
  ServiceCatalogItem,
  ExtractedRecord,
  UploadedFileRecord,
  Lead,
  FollowUpTask,
  CallLog,
  PipelineStage,
  IndustryCatalogueItem,
  ServiceRecommendation,
  CustomerAnalysis
} from '../../../shared/types.js';

export const apiRouter = Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(config.uploadsDir)) {
      fs.mkdirSync(config.uploadsDir, { recursive: true });
    }
    cb(null, config.uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4().slice(0, 8)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadSizeBytes }
});

// Helper: Audit Logger
function logAudit(action: string, entityType: string, entityId?: string, details?: any) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      'ashwin-kumar',
      action,
      entityType,
      entityId || null,
      typeof details === 'object' ? JSON.stringify(details) : details || null
    );
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

function safeParseDigitalPresence(raw: string | null | undefined, website?: string, phone?: string): string[] {
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') return [parsed];
    } catch {
      return [raw];
    }
  }
  return website ? ['Website', 'Google Maps'] : (phone ? ['WhatsApp Available', 'Direct Line'] : ['Needs verification']);
}

// ==============================================================================
// 1. AUTH & TEAM ROUTES
// ==============================================================================
apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = db.prepare('SELECT * FROM users LIMIT 1').get() as any;
  return res.json({
    id: user?.id || 'admin-1',
    email: user?.email || 'ashwin@quenoxa.com',
    fullName: user?.full_name || 'Ashwin Kumar',
    role: user?.role || 'admin',
    avatarUrl: user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  });
});

apiRouter.get('/team', (req: Request, res: Response) => {
  const users = db.prepare('SELECT * FROM users').all() as any[];
  const leads = db.prepare('SELECT assigned_employee_id, lead_status, outcome FROM leads').all() as any[];
  const calls = db.prepare('SELECT user_id FROM call_logs').all() as any[];

  const team = users.map(u => {
    const userLeads = leads.filter(l => l.assigned_employee_id === u.id);
    const won = userLeads.filter(l => l.lead_status === 'Won' || l.outcome === 'Accepted').length;
    const completedCalls = calls.filter(c => c.user_id === u.id).length;
    const rate = userLeads.length > 0 ? Math.round((won / userLeads.length) * 100) : 0;

    return {
      id: u.id,
      name: u.full_name,
      email: u.email,
      role: u.role === 'admin' ? 'Admin' : u.role === 'sales_manager' ? 'Sales Manager' : u.role === 'business_analyst' ? 'Business Analyst' : 'Sales Rep',
      avatar: u.avatar_url,
      activeLeads: userLeads.length,
      completedCalls,
      closedWonDeals: won,
      acceptanceRate: rate
    };
  });

  return res.json(team);
});

// ==============================================================================
// 2. DOCUMENT UPLOAD & PARSING ROUTES
// ==============================================================================
apiRouter.post('/files/upload', upload.array('files', 10), async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files provided for upload.' });
  }

  const results: any[] = [];

  for (const file of files) {
    const fileId = uuidv4();
    try {
      const parseResult = await DocumentParser.parseFile(file.path, file.originalname, fileId);

      // Save to uploaded_files table
      db.prepare(`
        INSERT INTO uploaded_files (
          id, file_name, file_size, file_type, storage_path, status,
          extracted_record_count, duplicate_count, invalid_count, missing_value_count,
          sheet_names, detected_headers, column_mappings, is_scanned, ocr_applied
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        fileId,
        file.originalname,
        file.size,
        path.extname(file.originalname),
        file.path,
        'processed',
        parseResult.totalExtracted,
        parseResult.duplicateCount,
        parseResult.invalidCount,
        parseResult.missingValueCount,
        JSON.stringify(parseResult.sheetNames || []),
        JSON.stringify(parseResult.detectedHeaders || []),
        JSON.stringify(parseResult.columnMappings || {}),
        parseResult.isScanned ? 1 : 0,
        parseResult.ocrApplied ? 1 : 0
      );

      // Save extracted records in batch
      const insertRecordStmt = db.prepare(`
        INSERT INTO extracted_records (
          id, file_id, customer_name, company_name, email, phone, industry, location,
          raw_fields, sheet_name, row_number, page_number, status,
          is_duplicate, has_missing_values, has_invalid_data, missing_fields, invalid_fields
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const rec of parseResult.records) {
        insertRecordStmt.run(
          rec.id,
          rec.fileId,
          rec.customerName,
          rec.companyName,
          rec.email,
          rec.phone,
          rec.industry,
          rec.location,
          JSON.stringify(rec.rawFields),
          rec.sourceRef.sheetName || null,
          rec.sourceRef.rowNumber || null,
          rec.sourceRef.pageNumber || null,
          rec.status,
          rec.flags.isDuplicate ? 1 : 0,
          rec.flags.hasMissingValues ? 1 : 0,
          rec.flags.hasInvalidData ? 1 : 0,
          JSON.stringify(rec.flags.missingFields),
          JSON.stringify(rec.flags.invalidFields)
        );
      }

      logAudit('UPLOAD_FILE', 'uploaded_files', fileId, { fileName: file.originalname, extractedCount: parseResult.totalExtracted });

      results.push({
        fileId,
        fileName: file.originalname,
        recordCount: parseResult.totalExtracted,
        sheetNames: parseResult.sheetNames,
        detectedHeaders: parseResult.detectedHeaders,
        columnMappings: parseResult.columnMappings
      });
    } catch (err: any) {
      console.error('File parsing error:', err);
      // Mark file failed
      db.prepare(`
        INSERT INTO uploaded_files (
          id, file_name, file_size, file_type, storage_path, status, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        fileId,
        file.originalname,
        file.size,
        path.extname(file.originalname),
        file.path,
        'failed',
        err?.message || 'Unknown parsing failure'
      );
      results.push({
        fileId,
        fileName: file.originalname,
        error: err?.message || 'Failed to parse file'
      });
    }
  }

  return res.json({ success: true, files: results });
});

apiRouter.get('/files', (req: Request, res: Response) => {
  const files = db.prepare('SELECT * FROM uploaded_files ORDER BY created_at DESC').all() as any[];
  const formatted: UploadedFileRecord[] = files.map(f => ({
    id: f.id,
    fileName: f.file_name,
    fileSize: f.file_size,
    fileType: f.file_type,
    uploadDate: f.created_at,
    status: f.status,
    extractedRecordCount: f.extracted_record_count,
    duplicateCount: f.duplicate_count,
    invalidCount: f.invalid_count,
    missingValueCount: f.missing_value_count,
    sheetNames: f.sheet_names ? JSON.parse(f.sheet_names) : [],
    detectedHeaders: f.detected_headers ? JSON.parse(f.detected_headers) : [],
    columnMappings: f.column_mappings ? JSON.parse(f.column_mappings) : {},
    errorMessage: f.error_message,
    isScanned: Boolean(f.is_scanned),
    ocrApplied: Boolean(f.ocr_applied)
  }));
  return res.json(formatted);
});

apiRouter.delete('/files/:id', (req: Request, res: Response) => {
  const fileId = req.params.id;
  db.prepare('DELETE FROM extracted_records WHERE file_id = ?').run(fileId);
  db.prepare('DELETE FROM uploaded_files WHERE id = ?').run(fileId);
  logAudit('DELETE_FILE', 'uploaded_files', fileId as string);
  return res.json({ success: true });
});

// ==============================================================================
// 3. EXTRACTED DATA EXPLORER ROUTES
// ==============================================================================
apiRouter.get('/records', (req: Request, res: Response) => {
  const { fileId, search, status, duplicateOnly, missingOnly, callStatus, crmStatus, limit = 500, offset = 0 } = req.query;

  let query = 'SELECT * FROM extracted_records WHERE 1=1';
  const params: any[] = [];

  if (fileId) {
    query += ' AND file_id = ?';
    params.push(fileId);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (duplicateOnly === 'true') {
    query += ' AND is_duplicate = 1';
  }
  if (missingOnly === 'true') {
    query += ' AND has_missing_values = 1';
  }
  if (callStatus === 'completed') {
    query += " AND call_completed = 1 AND (crm_status != 'rejected' OR crm_status IS NULL)";
  } else if (callStatus === 'pending') {
    query += " AND (call_completed = 0 OR call_completed IS NULL) AND (crm_status != 'rejected' OR crm_status IS NULL)";
  }

  if (crmStatus === 'pending') {
    query += " AND (crm_status = 'pending' OR crm_status IS NULL OR crm_status = 'raw') AND (crm_status != 'rejected' OR crm_status IS NULL)";
  } else if (crmStatus === 'accepted') {
    query += " AND crm_status = 'accepted'";
  } else if (crmStatus === 'rejected') {
    query += " AND crm_status = 'rejected'";
  } else if (crmStatus === 'in_crm') {
    query += " AND (crm_status = 'in_crm' OR status = 'in_crm') AND (crm_status != 'rejected' OR crm_status IS NULL)";
  } else if (crmStatus !== 'all_inclusive') {
    // By default, active leads automatically exclude rejected customers
    query += " AND (crm_status != 'rejected' OR crm_status IS NULL)";
  }

  if (search) {
    query += ' AND (customer_name LIKE ? OR company_name LIKE ? OR email LIKE ? OR phone LIKE ? OR industry LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s, s);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const rows = db.prepare(query).all(...params) as any[];

  const records: any[] = rows.map(r => {
    const website = r.website || (r.email && r.email.includes('@') ? `https://${r.email.split('@')[1]}` : undefined);
    const digitalPresence = safeParseDigitalPresence(r.digital_presence, website, r.phone);
    const analysisStatus = r.status === 'analyzed' ? 'Analysed' : (r.analysis_status || 'New');
    const priority = r.priority || (r.email && r.phone ? 'High' : 'Medium');

    const analysisRow = db.prepare('SELECT recommended_services FROM customer_analyses WHERE record_id = ?').get(r.id) as any;
    let recommendedService: string | undefined = undefined;
    if (analysisRow?.recommended_services) {
      try {
        const recs = JSON.parse(analysisRow.recommended_services);
        if (recs.length > 0) recommendedService = recs[0].serviceName;
      } catch {}
    }

    const crmStatusVal = r.crm_status || (r.status === 'in_crm' ? 'in_crm' : 'pending');

    return {
      id: r.id,
      fileId: r.file_id,
      customerName: r.customer_name,
      companyName: r.company_name,
      contactPerson: r.customer_name,
      businessName: r.company_name,
      email: r.email,
      phone: r.phone,
      industry: r.industry,
      location: r.location,
      website,
      digitalPresence,
      analysisStatus,
      priority,
      recommendedService: recommendedService || (analysisStatus === 'Analysed' ? 'Lead CRM & Workflow Automation' : undefined),
      lastContactedAt: r.last_contacted_at || null,
      callCompleted: Boolean(r.call_completed),
      callCompletedAt: r.call_completed_at || null,
      crmStatus: crmStatusVal,
      rejectionReason: r.rejection_reason || null,
      acceptedAt: r.accepted_at || null,
      rejectedAt: r.rejected_at || null,
      followUpDate: r.follow_up_date || null,
      rawFields: r.raw_fields ? JSON.parse(r.raw_fields) : {},
      sourceRef: {
        fileName: 'Imported Document',
        fileId: r.file_id,
        sheetName: r.sheet_name || undefined,
        rowNumber: r.row_number || undefined,
        pageNumber: r.page_number || undefined
      },
      status: r.status,
      flags: {
        isDuplicate: Boolean(r.is_duplicate),
        hasMissingValues: Boolean(r.has_missing_values),
        hasInvalidData: Boolean(r.has_invalid_data),
        missingFields: r.missing_fields ? JSON.parse(r.missing_fields) : [],
        invalidFields: r.invalid_fields ? JSON.parse(r.invalid_fields) : []
      },
      createdAt: r.created_at
    };
  });

  // Calculate active leads count (excluding rejected customers)
  const activeCount = (db.prepare("SELECT COUNT(*) as cnt FROM extracted_records WHERE (crm_status != 'rejected' OR crm_status IS NULL)").get() as { cnt: number }).cnt;
  const callsCompletedCount = (db.prepare("SELECT COUNT(*) as cnt FROM extracted_records WHERE call_completed = 1 AND (crm_status != 'rejected' OR crm_status IS NULL)").get() as { cnt: number }).cnt;
  const callsPendingCount = (db.prepare("SELECT COUNT(*) as cnt FROM extracted_records WHERE (call_completed = 0 OR call_completed IS NULL) AND (crm_status != 'rejected' OR crm_status IS NULL)").get() as { cnt: number }).cnt;

  const crmCounts = {
    total: activeCount,
    pending: (db.prepare("SELECT COUNT(*) as cnt FROM extracted_records WHERE (crm_status = 'pending' OR crm_status IS NULL OR crm_status = 'raw') AND (crm_status != 'rejected' OR crm_status IS NULL)").get() as any).cnt,
    accepted: (db.prepare("SELECT COUNT(*) as cnt FROM extracted_records WHERE crm_status = 'accepted'").get() as any).cnt,
    rejected: (db.prepare("SELECT COUNT(*) as cnt FROM extracted_records WHERE crm_status = 'rejected'").get() as any).cnt,
    inCrm: (db.prepare("SELECT COUNT(*) as cnt FROM extracted_records WHERE (crm_status = 'in_crm' OR status = 'in_crm') AND (crm_status != 'rejected' OR crm_status IS NULL)").get() as any).cnt,
  };

  return res.json({
    records,
    totalCount: activeCount,
    callsCompletedCount,
    callsPendingCount,
    crmCounts
  });
});

apiRouter.get('/records/:id', (req: Request, res: Response) => {
  const r = db.prepare('SELECT * FROM extracted_records WHERE id = ?').get(req.params.id) as any;
  if (!r) return res.status(404).json({ error: 'Record not found' });

  const website = r.website || (r.email && r.email.includes('@') ? `https://${r.email.split('@')[1]}` : undefined);
  const digitalPresence = safeParseDigitalPresence(r.digital_presence, website, r.phone);
  const analysisStatus = r.status === 'analyzed' ? 'Analysed' : (r.analysis_status || 'New');
  const priority = r.priority || (r.email && r.phone ? 'High' : 'Medium');

  const analysisRow = db.prepare('SELECT recommended_services FROM customer_analyses WHERE record_id = ?').get(r.id) as any;
  let recommendedService: string | undefined = undefined;
  if (analysisRow?.recommended_services) {
    try {
      const recs = JSON.parse(analysisRow.recommended_services);
      if (recs.length > 0) recommendedService = recs[0].serviceName;
    } catch {}
  }

  const record = {
    id: r.id,
    fileId: r.file_id,
    customerName: r.customer_name,
    companyName: r.company_name,
    contactPerson: r.customer_name,
    businessName: r.company_name,
    email: r.email,
    phone: r.phone,
    industry: r.industry,
    location: r.location,
    website,
    digitalPresence,
    analysisStatus,
    priority,
    recommendedService: recommendedService || (analysisStatus === 'Analysed' ? 'Lead CRM & Workflow Automation' : undefined),
    lastContactedAt: r.last_contacted_at || null,
    callCompleted: Boolean(r.call_completed),
    callCompletedAt: r.call_completed_at || null,
    crmStatus: r.crm_status || (r.status === 'in_crm' ? 'in_crm' : 'pending'),
    rejectionReason: r.rejection_reason || null,
    acceptedAt: r.accepted_at || null,
    rejectedAt: r.rejected_at || null,
    followUpDate: r.follow_up_date || null,
    rawFields: r.raw_fields ? JSON.parse(r.raw_fields) : {},
    sourceRef: {
      fileName: 'Imported Document',
      fileId: r.file_id,
      sheetName: r.sheet_name || undefined,
      rowNumber: r.row_number || undefined,
      pageNumber: r.page_number || undefined
    },
    status: r.status,
    flags: {
      isDuplicate: Boolean(r.is_duplicate),
      hasMissingValues: Boolean(r.has_missing_values),
      hasInvalidData: Boolean(r.has_invalid_data),
      missingFields: r.missing_fields ? JSON.parse(r.missing_fields) : [],
      invalidFields: r.invalid_fields ? JSON.parse(r.invalid_fields) : []
    },
    createdAt: r.created_at
  };

  return res.json(record);
});

apiRouter.patch('/records/:id/call-status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { callCompleted } = req.body;

  const record = db.prepare('SELECT id, customer_name, company_name FROM extracted_records WHERE id = ?').get(id) as any;
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }

  const isCompleted = callCompleted ? 1 : 0;
  const completedAt = isCompleted ? new Date().toISOString().replace('T', ' ').slice(0, 19) : null;

  db.prepare(`
    UPDATE extracted_records 
    SET call_completed = ?, 
        call_completed_at = ?,
        last_contacted_at = COALESCE(?, last_contacted_at),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(isCompleted, completedAt, completedAt, id);

  // Sync to leads table if a corresponding lead exists
  try {
    db.prepare(`
      UPDATE leads
      SET call_completed = ?,
          call_completed_at = ?,
          last_contacted_at = COALESCE(?, last_contacted_at),
          updated_at = datetime('now')
      WHERE extracted_record_id = ?
    `).run(isCompleted, completedAt, completedAt, id);
  } catch {}

  logAudit('UPDATE_CALL_STATUS', 'extracted_records', String(id), {
    customerName: record.customer_name,
    company: record.company_name,
    callCompleted: Boolean(isCompleted),
    callCompletedAt: completedAt
  });

  return res.json({
    success: true,
    id,
    callCompleted: Boolean(isCompleted),
    callCompletedAt: completedAt
  });
});

// Accept Lead & Move to CRM
apiRouter.post('/records/:id/accept', (req: Request, res: Response) => {
  const { id } = req.params;

  const rec = db.prepare('SELECT * FROM extracted_records WHERE id = ?').get(id) as any;
  if (!rec) {
    return res.status(404).json({ error: 'Customer lead record not found' });
  }

  // Requirement 2: Rejected leads must not be transferred to CRM
  if (rec.crm_status === 'rejected') {
    return res.status(400).json({
      error: 'Rejected leads cannot be transferred to CRM. Please clear the rejection status first.'
    });
  }

  // Prevent duplicate CRM entries: check existing lead by extracted_record_id, or by matching company_name / phone
  let existingLead = db.prepare('SELECT id FROM leads WHERE extracted_record_id = ?').get(id) as any;
  if (!existingLead && rec.company_name) {
    existingLead = db.prepare('SELECT id FROM leads WHERE LOWER(company_name) = LOWER(?)').get(rec.company_name) as any;
  }
  let leadId = existingLead?.id;

  if (rec.crm_status === 'accepted' && existingLead) {
    return res.json({
      success: true,
      message: 'Lead is already transferred to CRM.',
      leadId,
      crmStatus: 'accepted'
    });
  }

  if (!existingLead) {
    leadId = uuidv4();
    db.prepare(`
      INSERT INTO leads (
        id, extracted_record_id, customer_name, company_name, email, phone,
        industry, location, lead_source, lead_status, pipeline_value,
        recommended_service, website, digital_presence, analysis_status,
        priority, call_completed, call_completed_at, outcome
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Document Import', 'Accepted', 45000, ?, ?, ?, ?, ?, ?, ?, 'Accepted')
    `).run(
      leadId,
      rec.id,
      rec.customer_name,
      rec.company_name,
      rec.email,
      rec.phone,
      rec.industry,
      rec.location,
      rec.recommended_service || 'Lead CRM & Workflow Automation',
      rec.website || (rec.email && rec.email.includes('@') ? `https://${rec.email.split('@')[1]}` : null),
      rec.digital_presence || null,
      rec.analysis_status || (rec.status === 'analyzed' ? 'Analysed' : 'New'),
      rec.priority || 'Medium',
      rec.call_completed || 0,
      rec.call_completed_at || null
    );
  } else {
    db.prepare("UPDATE leads SET lead_status = 'Accepted', outcome = 'Accepted', rejection_reason = NULL, updated_at = datetime('now') WHERE id = ?").run(leadId);
  }

  // Update extracted record to accepted and in_crm
  db.prepare(`
    UPDATE extracted_records
    SET crm_status = 'accepted',
        status = 'in_crm',
        accepted_at = datetime('now'),
        rejection_reason = NULL,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(id);

  logAudit('ACCEPT_LEAD_TO_CRM', 'leads', String(leadId), {
    customerName: rec.customer_name,
    company: rec.company_name,
    recordId: id
  });

  return res.json({
    success: true,
    message: 'Lead successfully moved to CRM.',
    leadId,
    crmStatus: 'accepted'
  });
});

// Reject Customer Lead (with reliable database transaction & rejected_leads_history)
apiRouter.post('/records/:id/reject', (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason = '' } = req.body;

  const rec = db.prepare('SELECT * FROM extracted_records WHERE id = ?').get(id) as any;
  if (!rec) {
    return res.status(404).json({ error: 'Customer lead record not found' });
  }

  // Prevent duplicate rejection actions
  if (rec.crm_status === 'rejected') {
    return res.status(400).json({ error: 'Customer has already been rejected.' });
  }

  const rejectionReason = (reason && String(reason).trim()) ? String(reason).trim() : 'Not qualified / Not interested';
  const historyId = `rej_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  try {
    const rejectTransaction = db.transaction(() => {
      // 1. Update extracted_records status
      db.prepare(`
        UPDATE extracted_records
        SET crm_status = 'rejected',
            rejection_reason = ?,
            rejected_at = datetime('now'),
            updated_at = datetime('now')
        WHERE id = ?
      `).run(rejectionReason, id);

      // 2. If lead already exists in CRM leads table, update its outcome to Rejected / Lost
      const existingLead = db.prepare('SELECT id FROM leads WHERE extracted_record_id = ?').get(id) as any;
      if (existingLead) {
        db.prepare(`
          UPDATE leads
          SET lead_status = 'Lost',
              outcome = 'Rejected',
              rejection_reason = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).run(rejectionReason, existingLead.id);
      }

      // 3. Save full customer details into rejected_leads_history
      db.prepare(`
        INSERT INTO rejected_leads_history (
          id, record_id, lead_id, customer_name, company_name, phone, email,
          industry, location, website, rejection_reason, rejection_date,
          rejected_by, raw_details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)
      `).run(
        historyId,
        String(id),
        existingLead?.id || null,
        rec.customer_name || 'Unnamed Customer',
        rec.company_name || 'Unnamed Company',
        rec.phone || null,
        rec.email || null,
        rec.industry || null,
        rec.location || null,
        rec.website || null,
        rejectionReason,
        'Ashwin Kumar',
        JSON.stringify({
          priority: rec.priority,
          digitalPresence: rec.digital_presence,
          fileId: rec.file_id
        })
      );

      // 4. Record audit log
      logAudit('REJECT_CUSTOMER_LEAD', 'extracted_records', String(id), {
        customerName: rec.customer_name,
        company: rec.company_name,
        reason: rejectionReason,
        historyId
      });
    });

    rejectTransaction();

    // Query refreshed counts for instant UI reconciliation
    const totalActive = (db.prepare("SELECT COUNT(*) as cnt FROM extracted_records WHERE (crm_status != 'rejected' OR crm_status IS NULL)").get() as any).cnt;
    const pendingCount = (db.prepare("SELECT COUNT(*) as cnt FROM extracted_records WHERE (crm_status = 'pending' OR crm_status IS NULL OR crm_status = 'raw') AND (crm_status != 'rejected' OR crm_status IS NULL)").get() as any).cnt;
    const rejectedCount = (db.prepare("SELECT COUNT(*) as cnt FROM extracted_records WHERE crm_status = 'rejected'").get() as any).cnt;
    const acceptedCount = (db.prepare("SELECT COUNT(*) as cnt FROM extracted_records WHERE crm_status = 'accepted'").get() as any).cnt;
    const inCrmCount = (db.prepare("SELECT COUNT(*) as cnt FROM extracted_records WHERE (crm_status = 'in_crm' OR status = 'in_crm') AND (crm_status != 'rejected' OR crm_status IS NULL)").get() as any).cnt;
    const callsPending = (db.prepare("SELECT COUNT(*) as cnt FROM extracted_records WHERE (call_completed = 0 OR call_completed IS NULL) AND (crm_status != 'rejected' OR crm_status IS NULL)").get() as any).cnt;

    return res.json({
      success: true,
      message: 'Customer rejected successfully.',
      recordId: id,
      crmStatus: 'rejected',
      counts: {
        total: totalActive,
        pending: pendingCount,
        rejected: rejectedCount,
        accepted: acceptedCount,
        inCrm: inCrmCount,
        callsPending
      }
    });
  } catch (err: any) {
    console.error('Customer rejection transaction failed:', err);
    return res.status(500).json({
      error: `Failed to reject customer due to database transaction failure: ${err?.message || 'Internal error'}`
    });
  }
});

// GET /rejected-leads: Full history of rejected leads accessible to authorized users
apiRouter.get('/rejected-leads', (req: Request, res: Response) => {
  const { search, limit = 100, offset = 0 } = req.query;

  let query = 'SELECT * FROM rejected_leads_history WHERE 1=1';
  const params: any[] = [];

  if (search) {
    query += ' AND (customer_name LIKE ? OR company_name LIKE ? OR phone LIKE ? OR email LIKE ? OR rejection_reason LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s, s);
  }

  query += ' ORDER BY rejection_date DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const items = db.prepare(query).all(...params) as any[];
  const totalCount = (db.prepare('SELECT COUNT(*) as cnt FROM rejected_leads_history').get() as any).cnt;

  return res.json({
    items,
    totalCount
  });
});

// POST /records/:id/restore: Restore a rejected customer back to active/pending leads
apiRouter.post('/records/:id/restore', (req: Request, res: Response) => {
  const { id } = req.params;

  const rec = db.prepare('SELECT * FROM extracted_records WHERE id = ?').get(id) as any;
  if (!rec) {
    return res.status(404).json({ error: 'Customer record not found' });
  }

  try {
    const restoreTx = db.transaction(() => {
      db.prepare(`
        UPDATE extracted_records
        SET crm_status = 'pending',
            rejection_reason = NULL,
            rejected_at = NULL,
            updated_at = datetime('now')
        WHERE id = ?
      `).run(id);

      db.prepare(`
        UPDATE leads
        SET lead_status = 'New Lead',
            outcome = 'Pending',
            rejection_reason = NULL,
            updated_at = datetime('now')
        WHERE extracted_record_id = ?
      `).run(id);

      logAudit('RESTORE_CUSTOMER_LEAD', 'extracted_records', String(id), {
        customerName: rec.customer_name,
        company: rec.company_name
      });
    });

    restoreTx();

    const totalActive = (db.prepare("SELECT COUNT(*) as cnt FROM extracted_records WHERE (crm_status != 'rejected' OR crm_status IS NULL)").get() as any).cnt;
    const pendingCount = (db.prepare("SELECT COUNT(*) as cnt FROM extracted_records WHERE (crm_status = 'pending' OR crm_status IS NULL OR crm_status = 'raw') AND (crm_status != 'rejected' OR crm_status IS NULL)").get() as any).cnt;
    const rejectedCount = (db.prepare("SELECT COUNT(*) as cnt FROM extracted_records WHERE crm_status = 'rejected'").get() as any).cnt;
    const acceptedCount = (db.prepare("SELECT COUNT(*) as cnt FROM extracted_records WHERE crm_status = 'accepted'").get() as any).cnt;

    return res.json({
      success: true,
      message: 'Customer restored to active leads successfully.',
      recordId: id,
      counts: {
        total: totalActive,
        pending: pendingCount,
        rejected: rejectedCount,
        accepted: acceptedCount
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to restore customer' });
  }
});

// ==============================================================================
// 4. GEMINI AI BUSINESS ANALYSIS & SERVICE MATCHING
// ==============================================================================
apiRouter.get('/analysis/:recordId', async (req: Request, res: Response) => {
  const recordId = req.params.recordId;
  const recordRow = db.prepare('SELECT * FROM extracted_records WHERE id = ?').get(recordId) as any;
  if (!recordRow) return res.status(404).json({ error: 'Record not found' });

  // Check if existing analysis exists in DB (unless forceFresh requested)
  const forceFresh = req.query.forceFresh === 'true';
  const existing = forceFresh ? null : (db.prepare('SELECT * FROM customer_analyses WHERE record_id = ? ORDER BY created_at DESC LIMIT 1').get(recordId) as any);
  if (existing) {
    return res.json({
      id: existing.id,
      recordId: existing.record_id,
      generatedAt: existing.created_at,
      modelUsed: existing.model_used,
      customerProfile: JSON.parse(existing.customer_profile),
      digitalPresence: existing.digital_presence ? JSON.parse(existing.digital_presence) : undefined,
      businessProblems: existing.business_problems ? JSON.parse(existing.business_problems) : undefined,
      businessGapAnalysis: existing.business_gap_analysis ? JSON.parse(existing.business_gap_analysis) : undefined,
      recommendedServices: existing.recommended_services ? JSON.parse(existing.recommended_services) : undefined,
      suggestedServicePackage: existing.suggested_service_package ? JSON.parse(existing.suggested_service_package) : undefined,
      salesStrategy: existing.sales_strategy ? JSON.parse(existing.sales_strategy) : undefined,
      dataQuality: existing.data_quality ? JSON.parse(existing.data_quality) : undefined,
      factEvidenceMap: JSON.parse(existing.fact_evidence_map),
      // legacy bridges
      businessRequirements: existing.business_requirements ? JSON.parse(existing.business_requirements) : undefined,
      missingInformation: existing.missing_information ? JSON.parse(existing.missing_information) : undefined,
      advantagesAndDisadvantages: existing.advantages_and_disadvantages ? JSON.parse(existing.advantages_and_disadvantages) : undefined,
      recommendedNextActions: existing.recommended_next_actions ? JSON.parse(existing.recommended_next_actions) : undefined
    });
  }

  // Parse record object
  const record: ExtractedRecord = {
    id: recordRow.id,
    fileId: recordRow.file_id,
    customerName: recordRow.customer_name,
    companyName: recordRow.company_name,
    email: recordRow.email,
    phone: recordRow.phone,
    industry: recordRow.industry,
    location: recordRow.location,
    rawFields: recordRow.raw_fields ? JSON.parse(recordRow.raw_fields) : {},
    sourceRef: {
      fileName: 'Imported Document',
      fileId: recordRow.file_id,
      sheetName: recordRow.sheet_name,
      rowNumber: recordRow.row_number
    },
    status: recordRow.status,
    flags: {
      isDuplicate: Boolean(recordRow.is_duplicate),
      hasMissingValues: Boolean(recordRow.has_missing_values),
      hasInvalidData: Boolean(recordRow.has_invalid_data),
      missingFields: recordRow.missing_fields ? JSON.parse(recordRow.missing_fields) : [],
      invalidFields: recordRow.invalid_fields ? JSON.parse(recordRow.invalid_fields) : []
    },
    createdAt: recordRow.created_at
  };

  // Get active catalog
  const catalogRows = db.prepare('SELECT * FROM service_catalog WHERE is_active = 1').all() as any[];
  const activeCatalog: ServiceCatalogItem[] = catalogRows.map(s => ({
    id: s.id,
    name: s.name,
    category: s.category,
    description: s.description,
    targetCustomer: s.target_customer,
    qualifyingRequirements: s.qualifying_requirements ? JSON.parse(s.qualifying_requirements) : [],
    expectedBenefits: s.expected_benefits ? JSON.parse(s.expected_benefits) : [],
    limitations: s.limitations ? JSON.parse(s.limitations) : [],
    pricingRange: s.pricing_range,
    implementationComplexity: s.implementation_complexity,
    deliveryRequirements: s.delivery_requirements ? JSON.parse(s.delivery_requirements) : [],
    isActive: true
  }));

  const analysis = await GeminiService.analyzeCustomerRecord(record, activeCatalog);

  // Store in customer_analyses
  db.prepare(`
    INSERT INTO customer_analyses (
      id, record_id, model_used, customer_profile, business_requirements,
      missing_information, business_gap_analysis, advantages_and_disadvantages,
      recommended_next_actions, fact_evidence_map,
      digital_presence, business_problems, recommended_services,
      suggested_service_package, sales_strategy, data_quality
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    analysis.id,
    analysis.recordId,
    analysis.modelUsed,
    JSON.stringify(analysis.customerProfile),
    JSON.stringify(analysis.businessRequirements || {}),
    JSON.stringify(analysis.missingInformation || {}),
    JSON.stringify(analysis.businessGapAnalysis || {}),
    JSON.stringify(analysis.advantagesAndDisadvantages || []),
    JSON.stringify(analysis.recommendedNextActions || {}),
    JSON.stringify(analysis.factEvidenceMap || {}),
    JSON.stringify(analysis.digitalPresence || []),
    JSON.stringify(analysis.businessProblems || []),
    JSON.stringify(analysis.recommendedServices || []),
    JSON.stringify(analysis.suggestedServicePackage || {}),
    JSON.stringify(analysis.salesStrategy || {}),
    JSON.stringify(analysis.dataQuality || {})
  );

  // Update record status to analyzed
  db.prepare("UPDATE extracted_records SET status = 'analyzed', analysis_status = 'Analysed' WHERE id = ?").run(recordId);

  logAudit('GENERATE_AI_ANALYSIS', 'customer_analyses', analysis.id, { companyName: record.companyName });

  return res.json(analysis);
});

// In-memory catalog cache with 5-minute TTL
let activeCatalogCache: { data: ServiceCatalogItem[]; timestamp: number } | null = null;
function getCachedActiveCatalog(): ServiceCatalogItem[] {
  const now = Date.now();
  if (activeCatalogCache && now - activeCatalogCache.timestamp < 300000) {
    return activeCatalogCache.data;
  }
  const catalogRows = db.prepare('SELECT * FROM service_catalog WHERE is_active = 1').all() as any[];
  const data: ServiceCatalogItem[] = catalogRows.map(s => ({
    id: s.id,
    name: s.name,
    category: s.category,
    description: s.description,
    targetCustomer: s.target_customer,
    qualifyingRequirements: s.qualifying_requirements ? JSON.parse(s.qualifying_requirements) : [],
    expectedBenefits: s.expected_benefits ? JSON.parse(s.expected_benefits) : [],
    limitations: s.limitations ? JSON.parse(s.limitations) : [],
    pricingRange: s.pricing_range,
    implementationComplexity: s.implementation_complexity,
    deliveryRequirements: s.delivery_requirements ? JSON.parse(s.delivery_requirements) : [],
    isActive: true
  }));
  activeCatalogCache = { data, timestamp: now };
  return data;
}

apiRouter.get('/analysis/:recordId/services', async (req: Request, res: Response) => {
  const recordId = String(req.params.recordId);
  const forceFresh = req.query.forceFresh === 'true';

  const recordRow = db.prepare('SELECT * FROM extracted_records WHERE id = ?').get(recordId) as any;
  if (!recordRow) return res.status(404).json({ error: 'Customer record not found' });

  // 1. Return cached recommendations immediately if available (unless forceFresh requested)
  if (!forceFresh) {
    const cachedRows = db.prepare(`
      SELECT * FROM service_recommendations 
      WHERE record_id = ? 
      ORDER BY rank ASC
    `).all(recordId) as any[];

    if (cachedRows.length > 0) {
      const recommendations: ServiceRecommendation[] = cachedRows.map(c => ({
        id: c.id,
        recordId: c.record_id,
        serviceId: c.service_id,
        serviceName: c.service_name,
        category: c.category,
        rank: c.rank,
        relevanceScore: c.relevance_score,
        suitabilityExplanation: c.suitability_explanation,
        supportingEvidence: c.supporting_evidence ? JSON.parse(c.supporting_evidence) : [],
        missingInformationAndAssumptions: c.missing_info_and_assumptions ? JSON.parse(c.missing_info_and_assumptions) : [],
        comparison: c.comparison ? JSON.parse(c.comparison) : { benefits: [], limitations: [], complexity: 'Medium', risks: [] },
        likelyObjections: c.likely_objections ? JSON.parse(c.likely_objections) : [],
        suggestedNextAction: c.suggested_next_action,
        acceptanceEstimate: c.acceptance_estimate ? JSON.parse(c.acceptance_estimate) : {
          preliminaryEstimate: Math.round(c.relevance_score * 0.8),
          confidenceLevel: 'Medium',
          isPreliminary: true,
          statusLabel: 'Preliminary Estimate',
          supportingEvidence: [],
          missingFactors: [],
          mainReasonsForUncertainty: [],
          recommendedActionsToImprove: []
        },
        approvalStatus: c.approval_status || 'pending',
        manualNotes: c.manual_notes || undefined
      }));

      return res.json(recommendations);
    }
  }

  // 2. Fetch active catalog from cache/db
  const activeCatalog = getCachedActiveCatalog();
  if (activeCatalog.length === 0) {
    return res.json([]);
  }

  const record: ExtractedRecord = {
    id: recordRow.id,
    fileId: recordRow.file_id,
    customerName: recordRow.customer_name,
    companyName: recordRow.company_name,
    email: recordRow.email,
    phone: recordRow.phone,
    industry: recordRow.industry,
    location: recordRow.location,
    website: recordRow.website,
    rawFields: recordRow.raw_fields ? JSON.parse(recordRow.raw_fields) : {},
    sourceRef: { fileName: 'Imported Document', fileId: recordRow.file_id },
    status: recordRow.status,
    flags: {
      isDuplicate: Boolean(recordRow.is_duplicate),
      hasMissingValues: Boolean(recordRow.has_missing_values),
      hasInvalidData: Boolean(recordRow.has_invalid_data),
      missingFields: [],
      invalidFields: []
    },
    createdAt: recordRow.created_at
  };

  // 3. Resolve customer analysis (check DB first to prevent redundant expensive LLM calls)
  let analysis: CustomerAnalysis;
  const existingAnalysisRow = db.prepare(`
    SELECT * FROM customer_analyses WHERE record_id = ? ORDER BY created_at DESC LIMIT 1
  `).get(recordId) as any;

  if (existingAnalysisRow) {
    analysis = {
      id: existingAnalysisRow.id,
      recordId: existingAnalysisRow.record_id,
      generatedAt: existingAnalysisRow.created_at,
      modelUsed: existingAnalysisRow.model_used,
      customerProfile: JSON.parse(existingAnalysisRow.customer_profile),
      digitalPresence: existingAnalysisRow.digital_presence ? JSON.parse(existingAnalysisRow.digital_presence) : undefined,
      businessProblems: existingAnalysisRow.business_problems ? JSON.parse(existingAnalysisRow.business_problems) : undefined,
      businessGapAnalysis: existingAnalysisRow.business_gap_analysis ? JSON.parse(existingAnalysisRow.business_gap_analysis) : undefined,
      recommendedServices: existingAnalysisRow.recommended_services ? JSON.parse(existingAnalysisRow.recommended_services) : undefined,
      suggestedServicePackage: existingAnalysisRow.suggested_service_package ? JSON.parse(existingAnalysisRow.suggested_service_package) : undefined,
      salesStrategy: existingAnalysisRow.sales_strategy ? JSON.parse(existingAnalysisRow.sales_strategy) : undefined,
      dataQuality: existingAnalysisRow.data_quality ? JSON.parse(existingAnalysisRow.data_quality) : undefined,
      factEvidenceMap: existingAnalysisRow.fact_evidence_map ? JSON.parse(existingAnalysisRow.fact_evidence_map) : { verifiedFacts: [], aiHypotheses: [] }
    };
  } else {
    // Generate instant deterministic analysis using the industry catalogue intelligence engine
    const industryRows = db.prepare('SELECT * FROM industry_catalogue').all() as any[];
    const indLower = `${record.industry || ''} ${record.companyName || ''}`.toLowerCase();
    const matchedIndustry = industryRows.find(i => {
      if (i.industry_name && indLower.includes(i.industry_name.toLowerCase())) return true;
      try {
        const cats = JSON.parse(i.business_categories || '[]');
        return cats.some((c: string) => indLower.includes(c.toLowerCase()));
      } catch { return false; }
    }) || industryRows[0];

    analysis = GeminiService.buildDeterministicAnalysis(record, activeCatalog, matchedIndustry);
  }

  // 4. Match services using the ranking and acceptance engine (<1ms)
  const recommendations = await GeminiService.matchServices(record, analysis, activeCatalog);

  // 5. Cache recommendations cleanly in database in a single transaction
  try {
    const saveTx = db.transaction((recs: ServiceRecommendation[]) => {
      db.prepare('DELETE FROM service_recommendations WHERE record_id = ?').run(recordId);
      const insertRec = db.prepare(`
        INSERT INTO service_recommendations (
          id, record_id, service_id, service_name, category, rank, relevance_score,
          suitability_explanation, supporting_evidence, missing_info_and_assumptions,
          comparison, likely_objections, suggested_next_action, acceptance_estimate, approval_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const r of recs) {
        insertRec.run(
          r.id,
          r.recordId,
          r.serviceId,
          r.serviceName,
          r.category,
          r.rank,
          r.relevanceScore,
          r.suitabilityExplanation,
          JSON.stringify(r.supportingEvidence || []),
          JSON.stringify(r.missingInformationAndAssumptions || []),
          JSON.stringify(r.comparison || {}),
          JSON.stringify(r.likelyObjections || []),
          r.suggestedNextAction || '',
          JSON.stringify(r.acceptanceEstimate || {}),
          r.approvalStatus || 'pending'
        );
      }
    });
    saveTx(recommendations);
  } catch (err: any) {
    console.error('Failed to cache service recommendations:', err);
  }

  logAudit('MATCH_SERVICES', 'service_recommendations', recordId, { count: recommendations.length });

  return res.json(recommendations);
});

// Update recommendation status (approved/rejected/adjusted)
apiRouter.put('/recommendations/:id/status', (req: Request, res: Response) => {
  const { status, notes } = req.body;
  db.prepare(`
    UPDATE service_recommendations
    SET approval_status = ?, manual_notes = ?
    WHERE id = ?
  `).run(status, notes || null, req.params.id);

  logAudit('UPDATE_RECOMMENDATION_STATUS', 'service_recommendations', req.params.id as string, { status });
  return res.json({ success: true });
});

// ==============================================================================
// 5. COLD CALL STUDIO
// ==============================================================================
apiRouter.post('/analysis/:recordId/cold-call', async (req: Request, res: Response) => {
  const recordId = req.params.recordId;
  const { serviceId, language = 'thanglish', duration = '1m', salesObjective = 'Book a 15-minute diagnostic meeting' } = req.body;

  const recordRow = db.prepare('SELECT * FROM extracted_records WHERE id = ?').get(recordId) as any;
  if (!recordRow) return res.status(404).json({ error: 'Record not found' });

  const record: ExtractedRecord = {
    id: recordRow.id,
    fileId: recordRow.file_id,
    customerName: recordRow.customer_name,
    companyName: recordRow.company_name,
    email: recordRow.email,
    phone: recordRow.phone,
    industry: recordRow.industry,
    location: recordRow.location,
    rawFields: recordRow.raw_fields ? JSON.parse(recordRow.raw_fields) : {},
    sourceRef: { fileName: 'Imported Document', fileId: recordRow.file_id },
    status: recordRow.status,
    flags: { isDuplicate: false, hasMissingValues: false, hasInvalidData: false, missingFields: [], invalidFields: [] },
    createdAt: recordRow.created_at
  };

  let serviceRow = serviceId
    ? db.prepare('SELECT * FROM service_catalog WHERE id = ?').get(serviceId) as any
    : db.prepare('SELECT * FROM service_catalog WHERE is_active = 1 LIMIT 1').get() as any;

  if (!serviceRow) {
    return res.status(400).json({ error: 'No active service available' });
  }

  const service: ServiceCatalogItem = {
    id: serviceRow.id,
    name: serviceRow.name,
    category: serviceRow.category,
    description: serviceRow.description,
    targetCustomer: serviceRow.target_customer,
    qualifyingRequirements: serviceRow.qualifying_requirements ? JSON.parse(serviceRow.qualifying_requirements) : [],
    expectedBenefits: serviceRow.expected_benefits ? JSON.parse(serviceRow.expected_benefits) : [],
    limitations: serviceRow.limitations ? JSON.parse(serviceRow.limitations) : [],
    pricingRange: serviceRow.pricing_range,
    implementationComplexity: serviceRow.implementation_complexity,
    deliveryRequirements: [],
    isActive: true
  };

  const script = await GeminiService.generateColdCallScript(record, service, {
    language,
    duration,
    salesObjective
  });

  // Save to cold_call_scripts table
  db.prepare(`
    INSERT INTO cold_call_scripts (
      id, record_id, service_id, service_name, language, duration, sales_objective,
      greeting, caller_intro, reason_for_calling, personalized_opening, discovery_questions,
      service_pitch, benefits_value_prop, objection_handling, meeting_followup_request,
      closing_statement, raw_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    script.id,
    script.recordId,
    service.id,
    script.serviceName,
    script.language,
    script.duration,
    script.salesObjective,
    script.greeting,
    script.callerIntroduction,
    script.reasonForCalling,
    script.personalizedOpening,
    JSON.stringify(script.discoveryQuestions),
    script.customerSpecificServicePitch,
    JSON.stringify(script.benefitsAndValueProposition),
    JSON.stringify(script.objectionHandling),
    script.meetingOrFollowUpRequest,
    script.closingStatement,
    script.rawText
  );

  logAudit('GENERATE_COLD_CALL_SCRIPT', 'cold_call_scripts', script.id, { language, duration, service: service.name });

  return res.json(script);
});

// ==============================================================================
// 6. DIRECT WHATSAPP OUTREACH
// ==============================================================================
apiRouter.post('/analysis/:recordId/whatsapp', (req: Request, res: Response) => {
  const recordId = req.params.recordId;
  const { serviceId, templateType = 'first_introduction', language = 'thanglish' } = req.body;

  const recordRow = db.prepare('SELECT * FROM extracted_records WHERE id = ?').get(recordId) as any;
  if (!recordRow) return res.status(404).json({ error: 'Record not found' });

  const record: ExtractedRecord = {
    id: recordRow.id,
    fileId: recordRow.file_id,
    customerName: recordRow.customer_name,
    companyName: recordRow.company_name,
    email: recordRow.email,
    phone: recordRow.phone,
    industry: recordRow.industry,
    location: recordRow.location,
    rawFields: {},
    sourceRef: { fileName: 'Imported Document', fileId: recordRow.file_id },
    status: recordRow.status,
    flags: { isDuplicate: false, hasMissingValues: false, hasInvalidData: false, missingFields: [], invalidFields: [] },
    createdAt: recordRow.created_at
  };

  const serviceRow = serviceId
    ? db.prepare('SELECT * FROM service_catalog WHERE id = ?').get(serviceId) as any
    : db.prepare('SELECT * FROM service_catalog WHERE is_active = 1 LIMIT 1').get() as any;

  const service: ServiceCatalogItem = {
    id: serviceRow?.id || uuidv4(),
    name: serviceRow?.name || 'Custom AI & Machine Learning Solutions',
    category: serviceRow?.category || 'AI and machine learning',
    description: serviceRow?.description || '',
    targetCustomer: '',
    qualifyingRequirements: [],
    expectedBenefits: serviceRow?.expected_benefits ? JSON.parse(serviceRow.expected_benefits) : [],
    limitations: [],
    implementationComplexity: 'Medium',
    deliveryRequirements: [],
    isActive: true
  };

  const message = GeminiService.generateWhatsAppMessage(record, service, {
    templateType,
    language
  });

  return res.json(message);
});

// Record WhatsApp opened (explicitly NOT confirmed sent!)
apiRouter.post('/outreach/whatsapp-opened', (req: Request, res: Response) => {
  const { leadId, customerId, phoneNumber, templateType, language, messageContent, clickToChatUrl } = req.body;
  const id = uuidv4();

  db.prepare(`
    INSERT INTO whatsapp_activity (
      id, lead_id, customer_id, phone_number, template_type, language,
      message_content, click_to_chat_url, status, opened_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'wa_opened', datetime('now'))
  `).run(
    id,
    leadId || null,
    customerId || null,
    phoneNumber,
    templateType || 'first_introduction',
    language || 'thanglish',
    messageContent,
    clickToChatUrl
  );

  logAudit('WHATSAPP_OPENED', 'whatsapp_activity', id, { phoneNumber, status: 'WhatsApp opened (unconfirmed send)' });

  return res.json({ success: true, activityId: id, status: 'wa_opened' });
});

// ==============================================================================
// 7. COLD EMAIL STUDIO
// ==============================================================================
apiRouter.post('/analysis/:recordId/email', (req: Request, res: Response) => {
  const recordId = req.params.recordId;
  const { serviceId, templateType = 'initial_cold_email', tone = 'Professional & Direct', language = 'English' } = req.body;

  const recordRow = db.prepare('SELECT * FROM extracted_records WHERE id = ?').get(recordId) as any;
  if (!recordRow) return res.status(404).json({ error: 'Record not found' });

  const record: ExtractedRecord = {
    id: recordRow.id,
    fileId: recordRow.file_id,
    customerName: recordRow.customer_name,
    companyName: recordRow.company_name,
    email: recordRow.email,
    phone: recordRow.phone,
    industry: recordRow.industry,
    location: recordRow.location,
    rawFields: {},
    sourceRef: { fileName: 'Imported Document', fileId: recordRow.file_id },
    status: recordRow.status,
    flags: { isDuplicate: false, hasMissingValues: false, hasInvalidData: false, missingFields: [], invalidFields: [] },
    createdAt: recordRow.created_at
  };

  const serviceRow = serviceId
    ? db.prepare('SELECT * FROM service_catalog WHERE id = ?').get(serviceId) as any
    : db.prepare('SELECT * FROM service_catalog WHERE is_active = 1 LIMIT 1').get() as any;

  const service: ServiceCatalogItem = {
    id: serviceRow?.id || uuidv4(),
    name: serviceRow?.name || 'Automated Business Workflows & RPA',
    category: serviceRow?.category || 'Business automation',
    description: serviceRow?.description || '',
    targetCustomer: '',
    qualifyingRequirements: [],
    expectedBenefits: serviceRow?.expected_benefits ? JSON.parse(serviceRow.expected_benefits) : [],
    limitations: [],
    implementationComplexity: 'Medium',
    deliveryRequirements: [],
    isActive: true
  };

  const email = GeminiService.generateColdEmail(record, service, {
    templateType,
    tone,
    language
  });

  return res.json(email);
});

// Record Email Status (Draft vs Composer Opened vs Sent)
apiRouter.post('/outreach/email-send', (req: Request, res: Response) => {
  const { leadId, recipientEmail, ccEmail, subject, body, templateType, tone, language, mailtoUrl, isActualSend } = req.body;
  const id = uuidv4();
  const status = isActualSend ? 'sent' : 'composer_opened';

  db.prepare(`
    INSERT INTO email_activity (
      id, lead_id, recipient_email, cc_email, subject, body,
      template_type, tone, language, mailto_url, status, sent_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    leadId || null,
    recipientEmail,
    ccEmail || null,
    subject,
    body,
    templateType || 'initial_cold_email',
    tone || 'Professional & Direct',
    language || 'English',
    mailtoUrl || null,
    status,
    isActualSend ? new Date().toISOString() : null
  );

  logAudit(isActualSend ? 'EMAIL_SENT_CONFIRMED' : 'EMAIL_COMPOSER_OPENED', 'email_activity', id, { recipientEmail, status });

  return res.json({ success: true, activityId: id, status });
});

// ==============================================================================
// 8. CRM & LEADS MANAGEMENT
// ==============================================================================
apiRouter.get('/leads', (req: Request, res: Response) => {
  const { stage, search, assignedTo } = req.query;
  let query = 'SELECT * FROM leads WHERE 1=1';
  const params: any[] = [];

  if (stage && stage !== 'All') {
    query += ' AND lead_status = ?';
    params.push(stage);
  }
  if (assignedTo) {
    query += ' AND assigned_employee_id = ?';
    params.push(assignedTo);
  }
  if (search) {
    query += ' AND (customer_name LIKE ? OR company_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params) as any[];

  const leads: Lead[] = rows.map(r => {
    const callCount = (db.prepare('SELECT COUNT(*) as cnt FROM call_logs WHERE lead_id = ?').get(r.id) as { cnt: number }).cnt;
    const waCount = (db.prepare('SELECT COUNT(*) as cnt FROM whatsapp_activity WHERE lead_id = ?').get(r.id) as { cnt: number }).cnt;
    const emailCount = (db.prepare('SELECT COUNT(*) as cnt FROM email_activity WHERE lead_id = ?').get(r.id) as { cnt: number }).cnt;

    const website = r.website || (r.email && r.email.includes('@') ? `https://${r.email.split('@')[1]}` : undefined);
    const digitalPresence = safeParseDigitalPresence(r.digital_presence, website, r.phone);
    const analysisStatus = r.analysis_status || (r.recommended_service ? 'Analysed' : 'New');
    const priority = r.priority || (r.lead_status === 'Won' || r.lead_status === 'Interested' ? 'High' : 'Medium');

    return {
      id: r.id,
      recordId: r.extracted_record_id,
      customerName: r.customer_name,
      companyName: r.company_name,
      contactPerson: r.customer_name,
      businessName: r.company_name,
      email: r.email,
      phone: r.phone,
      industry: r.industry,
      location: r.location,
      website,
      digitalPresence,
      analysisStatus,
      priority,
      leadSource: r.lead_source,
      assignedEmployeeId: r.assigned_employee_id,
      assignedEmployeeName: 'Ashwin Kumar',
      recommendedService: r.recommended_service || 'Lead CRM & Automation',
      proposedService: r.proposed_service,
      leadStatus: r.lead_status as PipelineStage,
      pipelineValue: Number(r.pipeline_value || 0),
      callHistoryCount: callCount,
      whatsAppHistoryCount: waCount,
      emailHistoryCount: emailCount,
      lastContactedAt: r.last_contacted_at || null,
      followUpDate: r.follow_up_date,
      outcome: r.outcome,
      rejectionReason: r.rejection_reason,
      nextAction: r.next_action,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  });

  return res.json(leads);
});

apiRouter.post('/records/:id/to-crm', (req: Request, res: Response) => {
  const recordId = req.params.id;
  const { pipelineStage = 'New Lead', pipelineValue = 45000, recommendedService } = req.body;

  const rec = db.prepare('SELECT * FROM extracted_records WHERE id = ?').get(recordId) as any;
  if (!rec) return res.status(404).json({ error: 'Record not found' });

  const leadId = uuidv4();
  db.prepare(`
    INSERT INTO leads (
      id, extracted_record_id, customer_name, company_name, email, phone,
      industry, location, lead_source, lead_status, pipeline_value, recommended_service,
      website, digital_presence, analysis_status, priority
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Document Import', ?, ?, ?, ?, ?, ?, ?)
  `).run(
    leadId,
    rec.id,
    rec.customer_name,
    rec.company_name,
    rec.email,
    rec.phone,
    rec.industry,
    rec.location,
    pipelineStage,
    pipelineValue,
    recommendedService || null,
    rec.website || (rec.email ? `https://${rec.email.split('@')[1]}` : null),
    rec.digital_presence || null,
    rec.analysis_status || (rec.status === 'analyzed' ? 'Analysed' : 'New'),
    rec.priority || 'Medium'
  );

  db.prepare("UPDATE extracted_records SET status = 'in_crm' WHERE id = ?").run(recordId);

  logAudit('ADD_RECORD_TO_CRM', 'leads', leadId, { customerName: rec.customer_name, company: rec.company_name });

  return res.json({ success: true, leadId });
});

apiRouter.post('/records/batch-to-crm', (req: Request, res: Response) => {
  const { recordIds, defaultStage = 'New Lead', defaultValue = 45000 } = req.body;
  if (!Array.isArray(recordIds) || recordIds.length === 0) {
    return res.status(400).json({ error: 'No record IDs provided' });
  }

  const insertStmt = db.prepare(`
    INSERT INTO leads (
      id, extracted_record_id, customer_name, company_name, email, phone,
      industry, location, lead_source, lead_status, pipeline_value
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Document Import', ?, ?)
  `);

  const updateStmt = db.prepare("UPDATE extracted_records SET status = 'in_crm' WHERE id = ?");

  let added = 0;
  for (const id of recordIds) {
    const rec = db.prepare('SELECT * FROM extracted_records WHERE id = ?').get(id) as any;
    if (rec) {
      insertStmt.run(
        uuidv4(),
        rec.id,
        rec.customer_name,
        rec.company_name,
        rec.email,
        rec.phone,
        rec.industry,
        rec.location,
        defaultStage,
        defaultValue
      );
      updateStmt.run(id);
      added++;
    }
  }

  logAudit('BATCH_ADD_TO_CRM', 'leads', undefined, { count: added });
  return res.json({ success: true, addedCount: added });
});

apiRouter.put('/leads/:id', (req: Request, res: Response) => {
  const leadId = req.params.id;
  const { leadStatus, pipelineValue, outcome, rejectionReason, nextAction, followUpDate, notes } = req.body;

  db.prepare(`
    UPDATE leads SET
      lead_status = COALESCE(?, lead_status),
      pipeline_value = COALESCE(?, pipeline_value),
      outcome = COALESCE(?, outcome),
      rejection_reason = COALESCE(?, rejection_reason),
      next_action = COALESCE(?, next_action),
      follow_up_date = COALESCE(?, follow_up_date),
      notes = COALESCE(?, notes),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    leadStatus || null,
    pipelineValue !== undefined ? Number(pipelineValue) : null,
    outcome || null,
    rejectionReason || null,
    nextAction || null,
    followUpDate || null,
    notes || null,
    leadId
  );

  // If status moved to Proposal Sent or Won/Lost, sync proposals/sales_outcomes
  if (leadStatus === 'Proposal Sent') {
    const propId = uuidv4();
    db.prepare(`
      INSERT INTO proposals (id, lead_id, title, value, status, sent_date)
      VALUES (?, ?, 'Enterprise Solution Proposal', ?, 'sent', date('now'))
    `).run(propId, leadId, pipelineValue || 120000);
  } else if (leadStatus === 'Won' || outcome === 'Accepted') {
    const outcomeId = uuidv4();
    db.prepare(`
      INSERT INTO sales_outcomes (id, lead_id, outcome, contract_value)
      VALUES (?, ?, 'Accepted', ?)
    `).run(outcomeId, leadId, pipelineValue || 180000);
    // Update proposal to accepted
    db.prepare("UPDATE proposals SET status = 'accepted' WHERE lead_id = ?").run(leadId);
  } else if (leadStatus === 'Lost' || outcome === 'Rejected') {
    const outcomeId = uuidv4();
    db.prepare(`
      INSERT INTO sales_outcomes (id, lead_id, outcome, rejection_reason)
      VALUES (?, ?, 'Rejected', ?)
    `).run(outcomeId, leadId, rejectionReason || 'Pricing or timeline mismatch');
    db.prepare("UPDATE proposals SET status = 'rejected' WHERE lead_id = ?").run(leadId);
  }

  logAudit('UPDATE_LEAD', 'leads', leadId as string, { leadStatus, outcome });
  return res.json({ success: true });
});

// ==============================================================================
// 9. CALL LOGGING & FOLLOW-UP MANAGEMENT
// ==============================================================================
apiRouter.post('/calls', (req: Request, res: Response) => {
  const { leadId, durationSeconds = 120, connected, interested, objectionsRaised = [], customerFeedback, meetingStatus = 'none', callbackDate, finalOutcome, notes } = req.body;
  const id = uuidv4();

  db.prepare(`
    INSERT INTO call_logs (
      id, lead_id, duration_seconds, connected, interested,
      objections_raised, customer_feedback, meeting_status, callback_date,
      final_outcome, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    leadId,
    durationSeconds,
    connected ? 1 : 0,
    interested ? 1 : 0,
    JSON.stringify(objectionsRaised),
    customerFeedback || null,
    meetingStatus,
    callbackDate || null,
    finalOutcome || 'Pending',
    notes || null
  );

  // If callback or meeting scheduled, create follow-up task
  if (callbackDate) {
    db.prepare(`
      INSERT INTO follow_up_tasks (
        id, lead_id, task_type, title, description, due_date, priority, status
      ) VALUES (?, ?, 'callback', 'Scheduled Phone Callback', ?, ?, 'high', 'upcoming')
    `).run(uuidv4(), leadId, `Follow-up call with customer regarding ${customerFeedback || 'service discussion'}`, callbackDate);
  }

  if (meetingStatus === 'booked') {
    db.prepare(`
      INSERT INTO meetings (id, lead_id, title, scheduled_at, duration_minutes)
      VALUES (?, ?, 'Product Diagnostic Meeting', datetime('now', '+2 days'), 30)
    `).run(uuidv4(), leadId);
    db.prepare("UPDATE leads SET lead_status = 'Meeting Scheduled' WHERE id = ?").run(leadId);
  }

  logAudit('LOG_CALL', 'call_logs', id, { connected, interested, finalOutcome });
  return res.json({ success: true, callLogId: id });
});

apiRouter.get('/calls', (req: Request, res: Response) => {
  const logs = db.prepare(`
    SELECT c.*, l.customer_name, l.company_name, l.phone
    FROM call_logs c
    LEFT JOIN leads l ON c.lead_id = l.id
    ORDER BY c.call_timestamp DESC
  `).all() as any[];

  const formatted: CallLog[] = logs.map(l => ({
    id: l.id,
    leadId: l.lead_id,
    customerName: l.customer_name || 'Client',
    companyName: l.company_name || 'Company',
    employeeName: 'Ashwin Kumar',
    timestamp: l.call_timestamp,
    durationSeconds: l.duration_seconds,
    connected: Boolean(l.connected),
    interested: Boolean(l.interested),
    requirementsIdentified: l.requirements_identified ? JSON.parse(l.requirements_identified) : [],
    servicesDiscussed: l.services_discussed ? JSON.parse(l.services_discussed) : [],
    objectionsRaised: l.objections_raised ? JSON.parse(l.objections_raised) : [],
    customerFeedback: l.customer_feedback || '',
    meetingStatus: l.meeting_status || 'none',
    callbackDate: l.callback_date,
    proposalStatus: l.proposal_status,
    finalOutcome: l.final_outcome,
    notes: l.notes || ''
  }));

  return res.json(formatted);
});

apiRouter.get('/follow-ups', (req: Request, res: Response) => {
  const { status } = req.query;
  const todayStr = new Date().toISOString().split('T')[0];

  let query = `
    SELECT f.*, l.customer_name, l.company_name
    FROM follow_up_tasks f
    LEFT JOIN leads l ON f.lead_id = l.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status === 'due_today') {
    query += " AND f.due_date <= ? AND f.status != 'completed' AND f.status != 'cancelled'";
    params.push(todayStr);
  } else if (status && status !== 'All') {
    query += ' AND f.status = ?';
    params.push(status);
  }

  query += ' ORDER BY f.due_date ASC';
  const rows = db.prepare(query).all(...params) as any[];

  const tasks: FollowUpTask[] = rows.map(r => {
    let taskStatus = r.status;
    if (taskStatus !== 'completed' && taskStatus !== 'cancelled') {
      if (r.due_date === todayStr) taskStatus = 'due_today';
      else if (r.due_date < todayStr) taskStatus = 'overdue';
      else taskStatus = 'upcoming';
    }

    return {
      id: r.id,
      leadId: r.lead_id,
      customerName: r.customer_name || 'Corporate Contact',
      companyName: r.company_name || 'Organization',
      taskType: r.task_type,
      title: r.title,
      description: r.description || '',
      dueDate: r.due_date,
      priority: r.priority,
      status: taskStatus,
      aiSuggestedMessage: r.ai_suggested_message || 'Hello, following up on our previous discussion regarding Quenoxa digital solutions.',
      createdAt: r.created_at
    };
  });

  return res.json(tasks);
});

apiRouter.put('/follow-ups/:id', (req: Request, res: Response) => {
  const { status, dueDate } = req.body;
  db.prepare(`
    UPDATE follow_up_tasks SET
      status = COALESCE(?, status),
      due_date = COALESCE(?, due_date),
      completed_at = CASE WHEN ? = 'completed' THEN datetime('now') ELSE completed_at END,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(status || null, dueDate || null, status || null, req.params.id);

  return res.json({ success: true });
});

// ==============================================================================
// 10. SERVICE CATALOG ADMIN
// ==============================================================================
apiRouter.get('/services', (req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM service_catalog ORDER BY category ASC, name ASC').all() as any[];
  const services: ServiceCatalogItem[] = rows.map(s => ({
    id: s.id,
    name: s.name,
    category: s.category,
    description: s.description,
    targetCustomer: s.target_customer,
    qualifyingRequirements: s.qualifying_requirements ? JSON.parse(s.qualifying_requirements) : [],
    expectedBenefits: s.expected_benefits ? JSON.parse(s.expected_benefits) : [],
    limitations: s.limitations ? JSON.parse(s.limitations) : [],
    pricingRange: s.pricing_range,
    implementationComplexity: s.implementation_complexity,
    deliveryRequirements: s.delivery_requirements ? JSON.parse(s.delivery_requirements) : [],
    isActive: Boolean(s.is_active),
    createdAt: s.created_at,
    updatedAt: s.updated_at
  }));
  return res.json(services);
});

apiRouter.post('/services', (req: Request, res: Response) => {
  const { name, category, description, targetCustomer, qualifyingRequirements, expectedBenefits, limitations, pricingRange, implementationComplexity, deliveryRequirements, isActive } = req.body;
  const id = uuidv4();

  db.prepare(`
    INSERT INTO service_catalog (
      id, name, category, description, target_customer,
      qualifying_requirements, expected_benefits, limitations,
      pricing_range, implementation_complexity, delivery_requirements, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    name,
    category,
    description,
    targetCustomer,
    JSON.stringify(qualifyingRequirements || []),
    JSON.stringify(expectedBenefits || []),
    JSON.stringify(limitations || []),
    pricingRange || null,
    implementationComplexity || 'Medium',
    JSON.stringify(deliveryRequirements || []),
    isActive !== false ? 1 : 0
  );

  activeCatalogCache = null;
  logAudit('CREATE_SERVICE', 'service_catalog', id, { name, category });
  return res.json({ success: true, id });
});

apiRouter.put('/services/:id', (req: Request, res: Response) => {
  const { name, category, description, targetCustomer, qualifyingRequirements, expectedBenefits, limitations, pricingRange, implementationComplexity, isActive } = req.body;

  db.prepare(`
    UPDATE service_catalog SET
      name = COALESCE(?, name),
      category = COALESCE(?, category),
      description = COALESCE(?, description),
      target_customer = COALESCE(?, target_customer),
      qualifying_requirements = COALESCE(?, qualifying_requirements),
      expected_benefits = COALESCE(?, expected_benefits),
      limitations = COALESCE(?, limitations),
      pricing_range = COALESCE(?, pricing_range),
      implementation_complexity = COALESCE(?, implementation_complexity),
      is_active = COALESCE(?, is_active),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name || null,
    category || null,
    description || null,
    targetCustomer || null,
    qualifyingRequirements ? JSON.stringify(qualifyingRequirements) : null,
    expectedBenefits ? JSON.stringify(expectedBenefits) : null,
    limitations ? JSON.stringify(limitations) : null,
    pricingRange || null,
    implementationComplexity || null,
    isActive !== undefined ? (isActive ? 1 : 0) : null,
    req.params.id
  );

  activeCatalogCache = null;
  logAudit('UPDATE_SERVICE', 'service_catalog', req.params.id as string, { name });
  return res.json({ success: true });
});

apiRouter.delete('/services/:id', (req: Request, res: Response) => {
  db.prepare('DELETE FROM service_catalog WHERE id = ?').run(req.params.id);
  activeCatalogCache = null;
  logAudit('DELETE_SERVICE', 'service_catalog', req.params.id as string);
  return res.json({ success: true });
});

// ==============================================================================
// 10B. INDUSTRY-SPECIFIC SERVICE INTELLIGENCE (SECTION 7 SPEC: 14 INDUSTRIES A TO N)
// ==============================================================================
apiRouter.get('/industries', (req: Request, res: Response) => {
  const { search } = req.query;
  let query = 'SELECT * FROM industry_catalogue WHERE 1=1';
  const params: any[] = [];
  if (search) {
    query += ' AND (industry_name LIKE ? OR business_categories LIKE ? OR common_problems LIKE ? OR mapped_services LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  query += ' ORDER BY code ASC';
  const rows = db.prepare(query).all(...params) as any[];
  const industries: IndustryCatalogueItem[] = rows.map(r => ({
    id: r.id,
    code: r.code,
    industryName: r.industry_name,
    businessCategories: JSON.parse(r.business_categories || '[]'),
    commonProblems: JSON.parse(r.common_problems || '[]'),
    mappedServices: JSON.parse(r.mapped_services || '[]'),
    solutionDescriptions: JSON.parse(r.solution_descriptions || '[]'),
    exampleWorkflow: r.example_workflow,
    isCustom: Boolean(r.is_custom)
  }));
  return res.json(industries);
});

apiRouter.post('/industries', (req: Request, res: Response) => {
  const { code, industryName, businessCategories = [], commonProblems = [], mappedServices = [], solutionDescriptions = [], exampleWorkflow } = req.body;
  if (!industryName) return res.status(400).json({ error: 'Industry name is required' });
  const id = uuidv4();
  const generatedCode = code || String.fromCharCode(65 + Math.floor(Math.random() * 26)) + (Date.now() % 100);
  db.prepare(`
    INSERT INTO industry_catalogue (
      id, code, industry_name, business_categories, common_problems,
      mapped_services, solution_descriptions, example_workflow, is_custom
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    id,
    generatedCode,
    industryName,
    JSON.stringify(businessCategories),
    JSON.stringify(commonProblems),
    JSON.stringify(mappedServices),
    JSON.stringify(solutionDescriptions),
    exampleWorkflow || null
  );
  logAudit('CREATE_INDUSTRY', 'industry_catalogue', id, { industryName });
  return res.json({ success: true, id });
});

apiRouter.put('/industries/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { industryName, businessCategories, commonProblems, mappedServices, solutionDescriptions, exampleWorkflow } = req.body;
  const existing = db.prepare('SELECT * FROM industry_catalogue WHERE id = ?').get(id) as any;
  if (!existing) return res.status(404).json({ error: 'Industry not found' });
  db.prepare(`
    UPDATE industry_catalogue SET
      industry_name = ?,
      business_categories = ?,
      common_problems = ?,
      mapped_services = ?,
      solution_descriptions = ?,
      example_workflow = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    industryName || existing.industry_name,
    businessCategories ? JSON.stringify(businessCategories) : existing.business_categories,
    commonProblems ? JSON.stringify(commonProblems) : existing.common_problems,
    mappedServices ? JSON.stringify(mappedServices) : existing.mapped_services,
    solutionDescriptions ? JSON.stringify(solutionDescriptions) : existing.solution_descriptions,
    exampleWorkflow !== undefined ? exampleWorkflow : existing.example_workflow,
    id
  );
  logAudit('UPDATE_INDUSTRY', 'industry_catalogue', id, { industryName });
  return res.json({ success: true });
});

apiRouter.delete('/industries/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  db.prepare('DELETE FROM industry_catalogue WHERE id = ?').run(id);
  logAudit('DELETE_INDUSTRY', 'industry_catalogue', id);
  return res.json({ success: true });
});

// ==============================================================================
// 11. REPORTS & SALES ANALYTICS
// ==============================================================================
apiRouter.get('/analytics/dashboard', (req: Request, res: Response) => {
  const { timeRange, solutionFilter } = req.query;
  const metrics = AnalyticsService.getDashboardMetrics({
    timeRange: timeRange as string,
    solutionFilter: solutionFilter as string
  });
  return res.json(metrics);
});

apiRouter.get('/reports/excel', (req: Request, res: Response) => {
  const { type = 'leads', fileId } = req.query;
  const buffer = type === 'records'
    ? ExportService.exportRecordsToExcel(fileId as string)
    : ExportService.exportLeadsToExcel();

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=quenoxa-${type}-export-${Date.now()}.xlsx`);
  return res.send(buffer);
});

apiRouter.get('/reports/csv', (req: Request, res: Response) => {
  const csv = ExportService.exportRecordsToCsv(req.query.fileId as string);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=quenoxa-records-${Date.now()}.csv`);
  return res.send(csv);
});

// ==============================================================================
// 12. SYSTEM SETTINGS
// ==============================================================================
apiRouter.get('/settings', (req: Request, res: Response) => {
  const geminiKeyRow = db.prepare("SELECT value FROM system_settings WHERE key = 'gemini_api_key'").get() as { value: string } | undefined;
  const geminiModelRow = db.prepare("SELECT value FROM system_settings WHERE key = 'gemini_model'").get() as { value: string } | undefined;
  const supabaseUrlRow = db.prepare("SELECT value FROM system_settings WHERE key = 'supabase_url'").get() as { value: string } | undefined;

  return res.json({
    geminiApiKeyConfigured: Boolean(geminiKeyRow?.value || config.geminiApiKey),
    geminiModel: geminiModelRow?.value || config.geminiModel,
    supabaseConfigured: Boolean(supabaseUrlRow?.value || config.supabaseUrl),
    supabaseUrl: supabaseUrlRow?.value || config.supabaseUrl || '',
    ocrEngineEnabled: config.tesseractEnabled,
    whatsAppApiEnabled: true,
    smtpEmailEnabled: true,
    maxUploadSizeBytes: config.maxUploadSizeBytes,
    batchProcessingLimit: config.batchProcessingLimit
  });
});

apiRouter.post('/settings', (req: Request, res: Response) => {
  const { geminiApiKey, geminiModel, supabaseUrl, supabaseKey } = req.body;

  if (geminiApiKey !== undefined) {
    const cleanKey = typeof geminiApiKey === 'string' ? geminiApiKey.trim().replace(/\.+$/, '') : '';
    db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('gemini_api_key', ?)").run(cleanKey);
  }
  if (geminiModel) {
    db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('gemini_model', ?)").run(geminiModel);
  }
  if (supabaseUrl !== undefined) {
    db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('supabase_url', ?)").run(supabaseUrl);
  }
  if (supabaseKey !== undefined) {
    db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('supabase_key', ?)").run(supabaseKey);
  }

  logAudit('UPDATE_SETTINGS', 'system_settings');
  return res.json({ success: true });
});

// ==============================================================================
// 13. SEED SAMPLE REAL DATASET FOR IMMEDIATE WORKFLOW TESTING
// ==============================================================================
apiRouter.post('/seed-sample', (req: Request, res: Response) => {
  try {
    db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('account_cleared_by_user', '0')").run();
  } catch {}
  seedRealInitialFilesAndRecords(db, true);
  syncGivenDataOnly();
  logAudit('SEED_SAMPLE_DATA', 'system', undefined, { count: 335 });
  return res.json({ success: true, count: 335 });
});

// ==============================================================================
// 14. RESET ACCOUNT DATA (CLEAN SLATE / NEW ACCOUNT STATE)
// ==============================================================================
apiRouter.post('/account/reset', (req: Request, res: Response) => {
  resetAccountData();
  logAudit('RESET_ACCOUNT_DATA', 'system', undefined, { message: 'All account data reset to clean new account state' });
  return res.json({
    success: true,
    message: 'All customer records, documents, outreach, calls, and CRM pipeline have been reset. Account is ready in clean new account state.'
  });
});

apiRouter.post('/reset-data', (req: Request, res: Response) => {
  resetAccountData();
  logAudit('RESET_ACCOUNT_DATA', 'system', undefined, { message: 'All account data reset to clean new account state' });
  return res.json({
    success: true,
    message: 'All customer records, documents, outreach, calls, and CRM pipeline have been reset. Account is ready in clean new account state.'
  });
});

apiRouter.post('/database/seed-sample-data', (req: Request, res: Response) => {
  try {
    db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('account_cleared_by_user', '0')").run();
  } catch {}
  seedRealInitialFilesAndRecords(db, true);
  syncGivenDataOnly();
  return res.json({
    success: true,
    message: 'Demonstration documents and records have been reloaded.'
  });
});

