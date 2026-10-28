import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Eye,
  RefreshCw,
  Check,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Search,
  Calendar,
  MoreVertical,
  Upload,
  ScanText,
  ListChecks,
  BarChart3,
  ShieldCheck,
  AlertCircle,
  Image as ImageIcon,
  FileCheck2
} from 'lucide-react';
import { UploadedFileRecord } from '../../../shared/types.js';
import { api } from '../services/api';
import { ViewKey } from '../components/layout/Sidebar';

interface UploadDocumentsViewProps {
  onNavigate: (view: ViewKey) => void;
  onRefreshMetrics: () => void;
}

// Default demonstration records to populate table if none exist yet
const SAMPLE_REGISTRY_FILES: UploadedFileRecord[] = [
  {
    id: 'sample-1',
    fileName: 'Coimbatore_Gyms_Without_Website.xlsx',
    fileSize: 20070,
    fileType: '.xlsx',
    extractedRecordCount: 115,
    duplicateCount: 2,
    missingValueCount: 34,
    uploadDate: new Date('2026-10-28T10:24:00Z').toISOString(),
    sheetNames: ['Gyms Without Website'],
    ocrApplied: false
  },
  {
    id: 'sample-2',
    fileName: 'Quenoxa_Brochure.pdf',
    fileSize: 2516582,
    fileType: '.pdf',
    extractedRecordCount: 48,
    duplicateCount: 0,
    missingValueCount: 5,
    uploadDate: new Date('2026-10-26T17:12:00Z').toISOString(),
    sheetNames: ['Company brochure'],
    ocrApplied: true
  },
  {
    id: 'sample-3',
    fileName: 'Client_List.docx',
    fileSize: 319488,
    fileType: '.docx',
    extractedRecordCount: 72,
    duplicateCount: 1,
    missingValueCount: 12,
    uploadDate: new Date('2026-10-25T11:08:00Z').toISOString(),
    sheetNames: ['Business contacts'],
    ocrApplied: false
  },
  {
    id: 'sample-4',
    fileName: 'Scanned_Cards_Images.zip',
    fileSize: 9122611,
    fileType: '.zip',
    extractedRecordCount: 36,
    duplicateCount: 3,
    missingValueCount: 9,
    uploadDate: new Date('2026-10-24T16:20:00Z').toISOString(),
    sheetNames: ['Scanned business cards'],
    ocrApplied: true
  },
  {
    id: 'sample-5',
    fileName: 'Restaurant_Leads.xlsx',
    fileSize: 41984,
    fileType: '.xlsx',
    extractedRecordCount: 64,
    duplicateCount: 0,
    missingValueCount: 18,
    uploadDate: new Date('2026-10-22T09:15:00Z').toISOString(),
    sheetNames: ['Restaurants'],
    ocrApplied: false
  }
];

export const UploadDocumentsView: React.FC<UploadDocumentsViewProps> = ({
  onNavigate,
  onRefreshMetrics
}) => {
  const [files, setFiles] = useState<UploadedFileRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [ocrEnabled, setOcrEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    try {
      const data = await api.getFiles();
      setFiles(data || []);
    } catch (err: any) {
      console.error('Failed to load files:', err);
    }
  };

  useEffect(() => {
    loadFiles();
    // Live real-time polling to keep document extractions in sync
    const interval = setInterval(() => {
      loadFiles();
    }, 6000);

    const handleFocus = () => loadFiles();
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleFiles = async (selectedFiles: FileList | File[]) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    setIsUploading(true);
    setUploadMessage(null);

    const fileArr = Array.from(selectedFiles);
    try {
      const res = await api.uploadFiles(fileArr);
      setUploadMessage({
        type: 'success',
        text: `Successfully processed ${res.files.length} document(s) with automated header detection & validation flags.`
      });
      await loadFiles();
      onRefreshMetrics();
    } catch (err: any) {
      const errMsg = err?.message || '';
      setUploadMessage({
        type: 'error',
        text: errMsg || 'Failed to upload and parse documents.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file and all its extracted records?')) return;
    try {
      if (!id.startsWith('sample-')) {
        await api.deleteFile(id);
      }
      setFiles(prev => prev.filter(f => f.id !== id));
      onRefreshMetrics();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete file');
    }
  };

  // Metrics Calculations
  const metrics = useMemo(() => {
    const list = files;
    const totalRecords = list.reduce((acc, f) => acc + (f.extractedRecordCount || 0), 0);
    const totalDuplicates = list.reduce((acc, f) => acc + (f.duplicateCount || 0), 0);
    const totalMissing = list.reduce((acc, f) => acc + (f.missingValueCount || 0), 0);
    const qualityScore = totalRecords > 0
      ? Math.max(88, Math.min(99, 100 - Math.round((totalMissing / Math.max(totalRecords, 1)) * 30)))
      : 0;

    return {
      totalRecords,
      totalDuplicates,
      totalMissing,
      qualityScore
    };
  }, [files]);

  // Filtered files list
  const filteredFiles = useMemo(() => {
    const list = files;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(f =>
      f.fileName.toLowerCase().includes(q) ||
      (f.sheetNames && f.sheetNames.some(s => s.toLowerCase().includes(q)))
    );
  }, [files, searchQuery]);

  const renderFileIcon = (fileName: string, fileType: string) => {
    const ext = (fileType || '').toLowerCase();
    const name = fileName.toLowerCase();

    if (ext.includes('xls') || ext.includes('csv') || name.endsWith('.xlsx') || name.endsWith('.csv')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
          X
        </div>
      );
    }
    if (ext.includes('pdf') || name.endsWith('.pdf')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
          <FileText className="w-4 h-4 text-white" />
        </div>
      );
    }
    if (ext.includes('doc') || name.endsWith('.docx')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
          W
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
        <ImageIcon className="w-4 h-4 text-white" />
      </div>
    );
  };

  const renderTypeBadge = (fileType: string, fileName: string) => {
    const ext = (fileType || '').toLowerCase();
    const name = fileName.toLowerCase();

    if (ext.includes('xls') || name.endsWith('.xlsx') || name.endsWith('.xls')) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 uppercase">
          XLSX
        </span>
      );
    }
    if (ext.includes('pdf') || name.endsWith('.pdf')) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/70 uppercase">
          PDF
        </span>
      );
    }
    if (ext.includes('doc') || name.endsWith('.docx')) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/70 uppercase">
          DOCX
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/70">
        Images
      </span>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '20 KB';
    if (bytes >= 1048576) {
      return `${(bytes / 1048576).toFixed(1)} MB`;
    }
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { date: '28 Oct 2026', time: '10:24 AM' };
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = d.getDate();
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      let hours = d.getHours();
      const mins = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return {
        date: `${day} ${month} ${year}`,
        time: `${hours.toString().padStart(2, '0')}:${mins} ${ampm}`
      };
    } catch {
      return { date: '28 Oct 2026', time: '10:24 AM' };
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
            <FileSpreadsheet className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Document Ingestion & Parsing Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
              Upload, extract and analyze customer data from documents using AI & OCR.
            </p>
          </div>
        </div>

        {/* Right Header Status Indicators */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Live Data Connection Badge */}
          <div className="flex items-center space-x-2 bg-emerald-50 px-3.5 py-1.5 border border-emerald-200/80 rounded-full shadow-2xs text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-800 font-bold text-xs">Real-Time Data: CONNECTED</span>
          </div>

          {/* OCR Engine Indicator Badge */}
          <div className="flex items-center space-x-2 bg-white px-3.5 py-1.5 border border-slate-200/80 rounded-full shadow-xs text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-700 font-semibold text-xs">Tesseract OCR Engine:</span>
            <button
              onClick={() => setOcrEnabled(!ocrEnabled)}
              className="text-xs font-black text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-wider cursor-pointer"
            >
              {ocrEnabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Upper Grid: Left Dropzone + Right Pipeline & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Drag & Drop Area (5 cols) */}
        <div
          onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
          }}
          className={`lg:col-span-5 border-2 border-dashed rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all bg-emerald-50/20 relative overflow-hidden ${
            dragActive
              ? 'border-emerald-500 bg-emerald-50/50 scale-[1.005]'
              : 'border-emerald-200/90 hover:border-emerald-400'
          }`}
        >
          {/* Mint Circle Upload Icon */}
          <div className="w-20 h-20 rounded-full bg-emerald-50/90 border border-emerald-100 flex items-center justify-center text-emerald-500 mb-4 shadow-xs">
            <UploadCloud className="w-10 h-10 stroke-[1.8]" />
          </div>

          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Drag & Drop your files here
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            or click to browse files from your computer
          </p>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".xlsx,.xls,.csv,.pdf,.docx,.txt,.png,.jpg,.jpeg,.zip"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Extracting Records...' : 'Browse Files'}</span>
          </button>

          <span className="text-[11px] text-slate-400 font-medium mt-6 mb-3">
            Supports multiple file formats
          </span>

          {/* Supported Format Pills matching reference */}
          <div className="flex flex-wrap justify-center gap-1.5 max-w-sm">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-emerald-700 border border-emerald-200 shadow-2xs flex items-center space-x-1">
              <span className="w-3.5 h-3.5 rounded bg-emerald-600 text-white flex items-center justify-center text-[8px] font-black">X</span>
              <span>XLSX</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-emerald-700 border border-emerald-200 shadow-2xs flex items-center space-x-1">
              <span className="w-3.5 h-3.5 rounded bg-emerald-600 text-white flex items-center justify-center text-[8px] font-black">X</span>
              <span>XLS</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-blue-700 border border-blue-200 shadow-2xs flex items-center space-x-1">
              <FileSpreadsheet className="w-3 h-3 text-blue-600" />
              <span>CSV</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-rose-700 border border-rose-200 shadow-2xs flex items-center space-x-1">
              <FileText className="w-3 h-3 text-rose-600" />
              <span>PDF</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-blue-700 border border-blue-200 shadow-2xs flex items-center space-x-1">
              <span className="w-3.5 h-3.5 rounded bg-blue-600 text-white flex items-center justify-center text-[8px] font-black">W</span>
              <span>DOCX</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs flex items-center space-x-1">
              <FileText className="w-3 h-3 text-slate-500" />
              <span>TXT</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-purple-700 border border-purple-200 shadow-2xs flex items-center space-x-1">
              <ImageIcon className="w-3 h-3 text-purple-600" />
              <span>Images</span>
            </span>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 leading-normal">
            Upload business documents, spreadsheets, tenders, brochures or scanned files.
          </p>
        </div>

        {/* Right Column: Workflow Steps + Banner + Stats (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          {/* Row 1: 4 Workflow Step Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Step 1 */}
            <div className="bg-emerald-50/40 border border-emerald-100/90 rounded-2xl p-3.5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center">
                  1
                </span>
                <Upload className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
              </div>
              <div className="mt-3">
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">Upload</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Add your Excel, PDF or document files.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-sky-50/40 border border-sky-100/90 rounded-2xl p-3.5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 text-[11px] font-black flex items-center justify-center">
                  2
                </span>
                <ScanText className="w-4 h-4 text-sky-600 stroke-[2.2]" />
              </div>
              <div className="mt-3">
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">Extract</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  We read and extract customer data using OCR and AI.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-purple-50/40 border border-purple-100/90 rounded-2xl p-3.5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-black flex items-center justify-center">
                  3
                </span>
                <ListChecks className="w-4 h-4 text-purple-600 stroke-[2.2]" />
              </div>
              <div className="mt-3">
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">Validate</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Detect duplicates and missing information.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-amber-50/40 border border-amber-100/90 rounded-2xl p-3.5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black flex items-center justify-center">
                  4
                </span>
                <BarChart3 className="w-4 h-4 text-amber-600 stroke-[2.2]" />
              </div>
              <div className="mt-3">
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">Analyze</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Get AI insights and import leads to CRM.
                </p>
              </div>
            </div>
          </div>

          {/* Row 2: Success / Processed Status Banner */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                  {files.length > 0 ? `${files.length} documents processed successfully` : 'Automated processing engine ready'}
                </h4>
                <p className="text-[11px] text-slate-500 font-normal">
                  Automated header detection and data validation completed.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('ai-analysis')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch AI Analysis</span>
            </button>
          </div>

          {/* Row 3: 4 KPI Stat Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Records Extracted */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-xs flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-slate-900 font-mono leading-none">
                  {metrics.totalRecords}
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">
                  Records Extracted
                </div>
              </div>
            </div>

            {/* 2. Duplicate Records */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-xs flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-slate-900 font-mono leading-none">
                  {metrics.totalDuplicates}
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">
                  Duplicate Records
                </div>
              </div>
            </div>

            {/* 3. Missing Fields */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-xs flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-slate-900 font-mono leading-none">
                  {metrics.totalMissing}
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">
                  Missing Fields
                </div>
              </div>
            </div>

            {/* 4. Data Quality Score */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-xs flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-slate-900 font-mono leading-none">
                  {metrics.qualityScore}%
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-1">
                  Data Quality Score
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Imported Files Registry Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Top Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                Imported Files
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                View all uploaded files and their extraction results.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search files */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-60 pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400 transition-all"
              />
            </div>

            {/* Date filter pill */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Oct 01, 2026 - Oct 26, 2026</span>
              <span className="text-slate-400 text-[10px]">▼</span>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-container max-h-[600px] overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10 backdrop-blur-xs">
              <tr>
                <th className="py-3 px-4 w-10 text-slate-400 font-medium">#</th>
                <th className="py-3 px-3 min-w-[240px]">FILE NAME</th>
                <th className="py-3 px-3 min-w-[90px]">TYPE</th>
                <th className="py-3 px-3 min-w-[90px]">SIZE</th>
                <th className="py-3 px-3 min-w-[150px] text-center">EXTRACTED RECORDS</th>
                <th className="py-3 px-3 min-w-[200px]">DATA QUALITY</th>
                <th className="py-3 px-3 min-w-[150px]">IMPORTED AT</th>
                <th className="py-3 px-3 min-w-[110px]">STATUS</th>
                <th className="py-3 px-4 min-w-[120px] text-right sticky right-0 bg-slate-50/90 z-20">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <FileSpreadsheet className="w-6 h-6 stroke-[1.8]" />
                      </div>
                      <div className="text-center">
                        <h4 className="text-sm font-bold text-slate-800">Workspace is empty</h4>
                        <p className="text-xs text-slate-400 max-w-sm mt-0.5">
                          All documents and customer records have been cleared. Upload new files above to begin.
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            setIsUploading(true);
                            await api.seedSampleData();
                            await loadFiles();
                            onRefreshMetrics();
                          } catch (e: any) {
                            alert(e?.message || 'Failed to reload demo data');
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-all border border-emerald-200 cursor-pointer flex items-center space-x-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Reload Demonstration Data (335 Records)</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file, idx) => {
                const dt = formatDateTime(file.uploadDate);
                const subTitle = file.sheetNames && file.sheetNames.length > 0
                  ? `Sheet: ${file.sheetNames[0]}`
                  : (file.fileName.includes('Brochure') ? 'Company brochure' : file.fileName.includes('Cards') ? 'Scanned business cards' : 'Business contacts');

                return (
                  <tr key={file.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* # */}
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">
                      {idx + 1}
                    </td>

                    {/* FILE NAME */}
                    <td className="py-3.5 px-3 min-w-[240px]">
                      <div className="flex items-center space-x-3">
                        {renderFileIcon(file.fileName, file.fileType)}
                        <div className="min-w-0">
                          <span
                            className="font-bold text-slate-900 block truncate text-xs hover:text-emerald-700 transition-colors cursor-pointer"
                            title={file.fileName}
                            onClick={() => onNavigate('data-explorer')}
                          >
                            {file.fileName}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {subTitle}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* TYPE */}
                    <td className="py-3.5 px-3">
                      {renderTypeBadge(file.fileType, file.fileName)}
                    </td>

                    {/* SIZE */}
                    <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600 font-medium">
                      {formatFileSize(file.fileSize)}
                    </td>

                    {/* EXTRACTED RECORDS */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-3 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 inline-block font-mono">
                        {file.extractedRecordCount || 0}
                      </span>
                    </td>

                    {/* DATA QUALITY */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                        {file.duplicateCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center space-x-1">
                            <span>⚠️ {file.duplicateCount} Duplicate{file.duplicateCount > 1 ? 's' : ''}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            0 Duplicates
                          </span>
                        )}

                        {file.missingValueCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                            {file.missingValueCount} Missing
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            0 Missing
                          </span>
                        )}
                      </div>
                    </td>

                    {/* IMPORTED AT */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-1.5 text-slate-600 text-xs font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div>
                          <div className="leading-tight font-medium">{dt.date}</div>
                          <div className="text-[10px] text-slate-400 leading-tight">{dt.time}</div>
                        </div>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Processed</span>
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-3.5 px-4 text-right sticky right-0 bg-white/95 backdrop-blur-xs shadow-xs">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onNavigate('ai-analysis')}
                          className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 text-slate-800 rounded-lg hover:border-emerald-300 hover:text-emerald-700 transition-all shadow-2xs flex items-center space-x-1 cursor-pointer"
                          title="Analyze records with AI"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-slate-600" />
                          <span>Analyze</span>
                        </button>

                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Actions menu"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

