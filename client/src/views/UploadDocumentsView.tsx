import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Eye,
  RefreshCw,
  Sliders,
  Check,
  ChevronRight,
  Info,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { UploadedFileRecord } from '../../../shared/types.js';
import { api } from '../services/api';
import { ViewKey } from '../components/layout/Sidebar';

interface UploadDocumentsViewProps {
  onNavigate: (view: ViewKey) => void;
  onRefreshMetrics: () => void;
}

export const UploadDocumentsView: React.FC<UploadDocumentsViewProps> = ({
  onNavigate,
  onRefreshMetrics
}) => {
  const [files, setFiles] = useState<UploadedFileRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [ocrEnabled, setOcrEnabled] = useState(true);
  const [selectedFileForMapping, setSelectedFileForMapping] = useState<UploadedFileRecord | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    try {
      const data = await api.getFiles();
      setFiles(data);
    } catch (err: any) {
      console.error('Failed to load files:', err);
    }
  };

  useEffect(() => {
    loadFiles();
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
      setUploadMessage({
        type: 'error',
        text: err?.message || 'Failed to upload and parse documents.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file and all its extracted records?')) return;
    try {
      await api.deleteFile(id);
      await loadFiles();
      onRefreshMetrics();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete file');
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Document Ingestion & Parsing Engine</h2>
          <p className="text-xs text-slate-500">
            Automated schema mapping, sheet selection, duplicate detection, and OCR extraction.
          </p>
        </div>

        {/* OCR Engine Toggle */}
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 border border-slate-200 rounded-lg shadow-xs text-xs">
          <span className="text-slate-600 font-medium">Tesseract OCR Engine:</span>
          <button
            onClick={() => setOcrEnabled(!ocrEnabled)}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
              ocrEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {ocrEnabled ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>
      </div>

      {uploadMessage && (
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
            uploadMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center space-x-3">
            {uploadMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{uploadMessage.text}</span>
          </div>
          {uploadMessage.type === 'success' && (
            <button
              onClick={() => onNavigate('ai-analysis')}
              className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs flex items-center space-x-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch AI Analysis &rarr;</span>
            </button>
          )}
        </div>
      )}

      {/* Drag & Drop Area */}
      <div
        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all bg-white ${
          dragActive
            ? 'border-emerald-500 bg-emerald-50/50 scale-[1.005]'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-subtle">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="text-sm font-bold text-slate-900">
          Drag and drop business documents or spreadsheets
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md">
          Supports XLSX, XLS, CSV spreadsheets, PDF tenders/brochures, DOCX specifications, and scanned image files.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".xlsx,.xls,.csv,.pdf,.docx,.txt,.png,.jpg,.jpeg"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        <div className="mt-5 flex items-center space-x-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs disabled:opacity-50"
          >
            {isUploading ? 'Extracting Records...' : 'Browse Local Files'}
          </button>
        </div>

        {/* Supported badges */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {['XLSX', 'XLS', 'CSV', 'PDF (Scanned/Digital)', 'DOCX', 'TXT', 'Tesseract OCR'].map((fmt) => (
            <span
              key={fmt}
              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200"
            >
              {fmt}
            </span>
          ))}
        </div>
      </div>

      {/* Uploaded Files Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Imported File Registry</h3>
            <p className="text-xs text-slate-500">History of uploaded files and extraction validation metrics</p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
            {files.length} Document(s)
          </span>
        </div>

        {files.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500">No documents uploaded yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Uploaded spreadsheets and PDFs will appear here with detected columns and health statistics.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-full min-w-[280px]">Filename</th>
                  <th className="py-3 px-4 whitespace-nowrap">Type & Size</th>
                  <th className="py-3 px-4 whitespace-nowrap text-center">Extracted Records</th>
                  <th className="py-3 px-4 whitespace-nowrap">Data Quality Flags</th>
                  <th className="py-3 px-4 whitespace-nowrap text-center">Imported At</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 min-w-[280px]">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                          {file.fileType.includes('xls') || file.fileType === '.csv' ? (
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <FileText className="w-4 h-4 text-emerald-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate text-xs" title={file.fileName}>{file.fileName}</span>
                          {file.sheetNames && file.sheetNames.length > 0 && (
                            <p className="text-[11px] text-slate-400 truncate">Sheet: {file.sheetNames.join(', ')}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      <span className="font-mono font-bold uppercase text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">{file.fileType}</span>
                      <span className="text-slate-500 ml-1.5 font-medium text-[11px]">({(file.fileSize / 1024).toFixed(1)} KB)</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <span className="font-extrabold text-emerald-700 text-xs bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full inline-flex items-center space-x-1">
                        <span>{file.extractedRecordCount}</span>
                        <span className="font-semibold text-emerald-600 text-[11px]">records</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        {file.duplicateCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {file.duplicateCount} Duplicates
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            0 Duplicates
                          </span>
                        )}

                        {file.missingValueCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            {file.missingValueCount} Missing
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            0 Missing
                          </span>
                        )}
                        {file.ocrApplied && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            OCR Applied
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-center text-slate-500 font-medium font-mono text-[11px]">
                      {new Date(file.uploadDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onNavigate('ai-analysis')}
                          className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all flex items-center space-x-1.5 shadow-xs shrink-0 cursor-pointer"
                          title="Open Gemini AI Analysis on these extracted records"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Analyze with AI</span>
                        </button>
                        <button
                          onClick={() => onNavigate('data-explorer')}
                          className="px-3 py-1.5 text-xs font-bold bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center space-x-1 shadow-2xs shrink-0 cursor-pointer"
                        >
                          <span>Explore</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all shrink-0 cursor-pointer"
                          title="Delete file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
