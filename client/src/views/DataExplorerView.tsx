import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  PlusCircle,
  Sparkles,
  Award,
  PhoneCall,
  MessageSquare,
  Mail,
  UserPlus,
  Eye,
  CheckSquare,
  Square,
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { ExtractedRecord } from '../../../shared/types.js';
import { api } from '../services/api';
import { ViewKey } from '../components/layout/Sidebar';

interface DataExplorerViewProps {
  onNavigate: (view: ViewKey) => void;
  onSelectRecordForAnalysis: (record: ExtractedRecord) => void;
  onSelectRecordForRecommendation: (record: ExtractedRecord) => void;
  onSelectRecordForColdCall: (record: ExtractedRecord) => void;
  onSelectRecordForWhatsApp: (record: ExtractedRecord) => void;
  onSelectRecordForEmail: (record: ExtractedRecord) => void;
}

export const DataExplorerView: React.FC<DataExplorerViewProps> = ({
  onNavigate,
  onSelectRecordForAnalysis,
  onSelectRecordForRecommendation,
  onSelectRecordForColdCall,
  onSelectRecordForWhatsApp,
  onSelectRecordForEmail
}) => {
  const [records, setRecords] = useState<ExtractedRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [duplicateFilter, setDuplicateFilter] = useState(false);
  const [missingFilter, setMissingFilter] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [inspectedRecord, setInspectedRecord] = useState<ExtractedRecord | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await api.getRecords({
        search: search || undefined,
        duplicateOnly: duplicateFilter || undefined,
        missingOnly: missingFilter || undefined,
      });
      setRecords(data.records);
      setTotalCount(data.totalCount);
    } catch (err: any) {
      console.error('Failed to load records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [duplicateFilter, missingFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRecords();
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map(r => r.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleAddToCrm = async (record: ExtractedRecord) => {
    try {
      await api.addRecordToCrm(record.id);
      setActionSuccessMsg(`Added ${record.customerName} (${record.companyName}) to CRM Leads pipeline.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      loadRecords();
    } catch (err: any) {
      alert(err?.message || 'Failed to add to CRM');
    }
  };

  const handleBatchAddToCrm = async () => {
    if (selectedIds.size === 0) return;
    try {
      const res = await api.batchAddRecordsToCrm(Array.from(selectedIds));
      setActionSuccessMsg(`Successfully added ${res.addedCount} records to CRM Leads!`);
      setSelectedIds(new Set());
      setTimeout(() => setActionSuccessMsg(null), 4000);
      loadRecords();
    } catch (err: any) {
      alert(err?.message || 'Failed to batch add records');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Interactive Data Explorer</h2>
          <p className="text-xs text-slate-500">
            Multi-column records with document provenance, validation anomalies, and 1-click sales studio triggers.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href="/api/v1/reports/excel?type=records"
            download
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Excel</span>
          </a>
          <a
            href="/api/v1/reports/csv"
            download
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, company, email, phone, or industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-20 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setDuplicateFilter(!duplicateFilter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              duplicateFilter
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Duplicates Only
          </button>
          <button
            onClick={() => setMissingFilter(!missingFilter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              missingFilter
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Missing Values Only
          </button>
        </div>
      </div>

      {/* Batch Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center space-x-2 text-emerald-900 font-semibold">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            <span>{selectedIds.size} record(s) selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBatchAddToCrm}
              className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-xs flex items-center space-x-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Selected to CRM</span>
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Interactive Table with Sticky Headers */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="table-container max-h-[640px] overflow-auto">
          <table className="w-full text-left text-xs table-sticky-header">
            <thead className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <button onClick={toggleSelectAll} className="p-0.5 text-slate-400 hover:text-slate-600">
                    {selectedIds.size === records.length && records.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3.5 whitespace-nowrap">Business Name</th>
                <th className="py-3 px-3 whitespace-nowrap">Industry</th>
                <th className="py-3 px-3 whitespace-nowrap">Contact Person</th>
                <th className="py-3 px-3 whitespace-nowrap">Phone Number</th>
                <th className="py-3 px-3 whitespace-nowrap">Email</th>
                <th className="py-3 px-3 whitespace-nowrap">Location</th>
                <th className="py-3 px-3 whitespace-nowrap">Website</th>
                <th className="py-3 px-3 whitespace-nowrap">Existing Digital Presence</th>
                <th className="py-3 px-3 whitespace-nowrap">Analysis Status</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Recommended Primary Service</th>
                <th className="py-3 px-3 whitespace-nowrap">Lead Priority</th>
                <th className="py-3 px-3 whitespace-nowrap">Last Contacted</th>
                <th className="py-3 px-3 whitespace-nowrap">Next Follow-up</th>
                <th className="py-3 px-4 text-right whitespace-nowrap sticky right-0 bg-slate-50 shadow-xs">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400">
                    Loading customer lead records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-slate-400">
                    No customer records found matching filters.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const isSelected = selectedIds.has(r.id);
                  const isAnalyzed = r.status === 'analyzed' || r.analysisStatus === 'Analysed';
                  const priority = r.priority || (r.email && r.phone ? 'High' : 'Medium');

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/90 transition-colors ${
                        isSelected ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => toggleSelectOne(r.id)}
                          className="p-0.5 text-slate-400 hover:text-slate-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* 1. Business Name */}
                      <td className="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span>{r.companyName || r.businessName || 'Unnamed Business'}</span>
                        </div>
                      </td>

                      {/* 2. Industry */}
                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                          {r.industry || 'General Business'}
                        </span>
                      </td>

                      {/* 3. Contact Person */}
                      <td className="py-3 px-3 text-slate-800 font-medium whitespace-nowrap">
                        {r.customerName || r.contactPerson || 'Decision Maker'}
                      </td>

                      {/* 4. Phone Number */}
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {r.phone ? (
                          <span className="text-emerald-700 font-semibold">{r.phone}</span>
                        ) : (
                          <span className="text-slate-400 italic">Not listed</span>
                        )}
                      </td>

                      {/* 5. Email */}
                      <td className="py-3 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                        {r.email ? (
                          <span className="text-slate-800">{r.email}</span>
                        ) : (
                          <span className="text-slate-400 italic">Not listed</span>
                        )}
                      </td>

                      {/* 6. Location */}
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {r.location || 'India'}
                      </td>

                      {/* 7. Website */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {r.website ? (
                          <a
                            href={r.website.startsWith('http') ? r.website : `https://${r.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-800 hover:underline flex items-center space-x-1 text-[11px]"
                          >
                            <span className="truncate max-w-[120px]">{r.website.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">None verified</span>
                        )}
                      </td>

                      {/* 8. Existing Digital Presence */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          {r.digitalPresence && r.digitalPresence.length > 0 ? (
                            r.digitalPresence.slice(0, 2).map((item, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                              >
                                {item}
                              </span>
                            ))
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                              Needs check
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 9. Analysis Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isAnalyzed
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : r.status === 'in_crm'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isAnalyzed ? 'Analysed' : r.analysisStatus || 'New'}
                        </span>
                      </td>

                      {/* 10. Recommended Primary Service */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="text-[11px] font-semibold text-slate-900 block truncate max-w-[180px]">
                          {r.recommendedService || (isAnalyzed ? 'Lead CRM & Automation' : 'Run Analysis')}
                        </span>
                      </td>

                      {/* 11. Lead Priority */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            priority === 'High'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : priority === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {priority}
                        </span>
                      </td>

                      {/* 12. Last Contacted Date */}
                      <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {r.lastContactedAt ? new Date(r.lastContactedAt).toLocaleDateString() : 'Never'}
                      </td>

                      {/* 13. Next Follow-up Date */}
                      <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {r.followUpDate ? new Date(r.followUpDate).toLocaleDateString() : 'Not set'}
                      </td>

                      {/* Primary Functional Action: "Analyse Customer" button + quick triggers */}
                      <td className="py-3 px-4 text-right whitespace-nowrap sticky right-0 bg-white/95 group-hover:bg-slate-50/95 shadow-xs">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* THE REQUIRED FUNCTIONAL "ANALYSE CUSTOMER" BUTTON */}
                          <button
                            onClick={() => {
                              onSelectRecordForAnalysis(r);
                              onNavigate('ai-analysis');
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs flex items-center space-x-1.5 transition-all transform active:scale-95"
                            title={`Open complete customer analysis workspace for ${r.companyName || r.customerName}`}
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
                            <span>Analyse Customer</span>
                          </button>

                          {/* Quick Studio Dropdown / Icons */}
                          <button
                            onClick={() => {
                              onSelectRecordForColdCall(r);
                              onNavigate('cold-call-studio');
                            }}
                            className="p-1.5 rounded hover:bg-emerald-50 text-emerald-700 hover:text-emerald-900 border border-slate-200"
                            title="Generate Cold Call Script"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              onSelectRecordForWhatsApp(r);
                              onNavigate('whatsapp-outreach');
                            }}
                            className="p-1.5 rounded hover:bg-emerald-50 text-emerald-700 hover:text-emerald-900 border border-slate-200"
                            title="Open WhatsApp Outreach"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              onSelectRecordForEmail(r);
                              onNavigate('cold-email-studio');
                            }}
                            className="p-1.5 rounded hover:bg-emerald-50 text-emerald-700 hover:text-emerald-900 border border-slate-200"
                            title="Generate Cold Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setInspectedRecord(r)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200"
                            title="View Document Provenance"
                          >
                            <Eye className="w-3.5 h-3.5" />
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

      {/* Drawer / Modal for Detailed Record View (Section 6) */}
      {inspectedRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Customer Document Dossier</span>
                <h3 className="text-lg font-bold text-slate-900">{inspectedRecord.customerName}</h3>
                <p className="text-xs text-slate-500">{inspectedRecord.companyName}</p>
              </div>
              <button
                onClick={() => setInspectedRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5 text-xs">
              {/* Document Source Reference */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-semibold text-slate-700 block">Extracted Document Provenance</span>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Source Filename:</span>
                    <span className="font-medium text-slate-900">{inspectedRecord.sourceRef.fileName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Spreadsheet Sheet / Page:</span>
                    <span className="font-medium text-slate-900">
                      {inspectedRecord.sourceRef.sheetName || 'N/A'} (Row #{inspectedRecord.sourceRef.rowNumber || '1'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Verified Contact Information</h4>
                <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Direct Phone / WhatsApp:</span>
                    <span className="font-mono font-medium text-slate-900">{inspectedRecord.phone || 'None provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Corporate Email:</span>
                    <span className="font-medium text-slate-900 break-all">{inspectedRecord.email || 'None provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Industry Domain:</span>
                    <span className="font-medium text-slate-900">{inspectedRecord.industry}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Physical Location:</span>
                    <span className="font-medium text-slate-900">{inspectedRecord.location}</span>
                  </div>
                </div>
              </div>

              {/* Raw Document Fields */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Original Document Raw Attributes</h4>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48">
                  {JSON.stringify(inspectedRecord.rawFields, null, 2)}
                </pre>
              </div>

              {/* Data Health & Validation */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Data Quality Assessment</h4>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-600">Duplicate Check:</span>
                    <span className={`font-semibold ${inspectedRecord.flags.isDuplicate ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {inspectedRecord.flags.isDuplicate ? 'Duplicate Found in Batch' : 'Clean & Unique'}
                    </span>
                  </div>
                  {inspectedRecord.flags.missingFields.length > 0 && (
                    <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800">
                      Missing Fields: {inspectedRecord.flags.missingFields.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onSelectRecordForAnalysis(inspectedRecord);
                    onNavigate('ai-analysis');
                  }}
                  className="px-3 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 flex items-center justify-center space-x-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Run AI Analysis</span>
                </button>
                <button
                  onClick={() => {
                    onSelectRecordForColdCall(inspectedRecord);
                    onNavigate('cold-call-studio');
                  }}
                  className="px-3 py-2 bg-white border border-slate-300 text-slate-800 font-semibold rounded-lg hover:bg-slate-50 flex items-center justify-center space-x-1.5"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-600" />
                  <span>Cold Call Studio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
