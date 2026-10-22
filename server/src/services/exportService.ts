import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const xlsx = require('xlsx');
import { db } from '../db/database.js';

export class ExportService {
  /**
   * Export all extracted records or CRM leads to an Excel buffer
   */
  public static exportRecordsToExcel(fileId?: string): Buffer {
    let rows: any[];
    if (fileId) {
      rows = db.prepare('SELECT * FROM extracted_records WHERE file_id = ?').all(fileId);
    } else {
      rows = db.prepare('SELECT * FROM extracted_records').all();
    }

    const data = rows.map(r => ({
      'Record ID': r.id,
      'Customer Name': r.customer_name,
      'Company Name': r.company_name,
      'Email': r.email,
      'Phone': r.phone,
      'Industry': r.industry,
      'Location': r.location,
      'Source File': r.sheet_name ? `${r.file_id} [Sheet: ${r.sheet_name}]` : r.file_id,
      'Row Number': r.row_number,
      'Status': r.status,
      'Is Duplicate': r.is_duplicate ? 'Yes' : 'No',
      'Has Missing Values': r.has_missing_values ? 'Yes' : 'No',
      'Created At': r.created_at
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Quenoxa Records');

    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Export CRM Leads to Excel buffer
   */
  public static exportLeadsToExcel(): Buffer {
    const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all() as any[];
    const data = leads.map(l => ({
      'Lead ID': l.id,
      'Customer Name': l.customer_name,
      'Company Name': l.company_name,
      'Email': l.email,
      'Phone': l.phone,
      'Industry': l.industry,
      'Location': l.location,
      'Pipeline Stage': l.lead_status,
      'Pipeline Value (USD)': l.pipeline_value,
      'Recommended Service': l.recommended_service || 'N/A',
      'Follow-Up Date': l.follow_up_date || 'N/A',
      'Outcome': l.outcome || 'Pending',
      'Notes': l.notes || ''
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sales Pipeline');

    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Export Records to CSV string
   */
  public static exportRecordsToCsv(fileId?: string): string {
    let rows: any[];
    if (fileId) {
      rows = db.prepare('SELECT * FROM extracted_records WHERE file_id = ?').all(fileId);
    } else {
      rows = db.prepare('SELECT * FROM extracted_records').all();
    }

    const headers = ['Record ID', 'Customer Name', 'Company Name', 'Email', 'Phone', 'Industry', 'Location', 'Status'];
    const lines = [headers.join(',')];

    for (const r of rows) {
      lines.push([
        `"${r.id}"`,
        `"${(r.customer_name || '').replace(/"/g, '""')}"`,
        `"${(r.company_name || '').replace(/"/g, '""')}"`,
        `"${(r.email || '').replace(/"/g, '""')}"`,
        `"${(r.phone || '').replace(/"/g, '""')}"`,
        `"${(r.industry || '').replace(/"/g, '""')}"`,
        `"${(r.location || '').replace(/"/g, '""')}"`,
        `"${r.status}"`
      ].join(','));
    }

    return lines.join('\n');
  }
}
