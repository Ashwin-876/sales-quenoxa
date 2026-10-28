import React, { useState, useEffect } from 'react';
import {
  Users2,
  Search,
  Filter,
  IndianRupee,
  PhoneCall,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Edit2,
  UserCheck,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Building2,
  Globe,
  AlertCircle,
  Upload,
  RefreshCw,
  MapPin,
  Tag
} from 'lucide-react';
import { Lead, PipelineStage, ExtractedRecord } from '../../../shared/types.js';
import { api } from '../services/api';
import { ViewKey } from '../components/layout/Sidebar';

interface CRMLeadsViewProps {
  onNavigate: (view: ViewKey) => void;
  onRefreshMetrics: () => void;
  onSelectRecordForAnalysis?: (record: ExtractedRecord) => void;
}

const PIPELINE_STAGES: PipelineStage[] = [
  'New Lead',
  'Interested',
  'Follow-up Required',
  'Meeting Scheduled',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost'
];

export const CRMLeadsView: React.FC<CRMLeadsViewProps> = ({
  onNavigate,
  onRefreshMetrics,
  onSelectRecordForAnalysis
}) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await api.getLeads({
        stage: stageFilter !== 'All' ? stageFilter : undefined,
        search: search || undefined
      });
      setLeads(data || []);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [stageFilter]);

  const handleStageChange = async (leadId: string, newStage: PipelineStage) => {
    try {
      await api.updateLead(leadId, { leadStatus: newStage });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, leadStatus: newStage } : l));
      onRefreshMetrics();
    } catch (err: any) {
      alert(err?.message || 'Failed to update stage');
    }
  };

  const handleSaveLeadDetails = async () => {
    if (!editingLead) return;
    try {
      await api.updateLead(editingLead.id, {
        leadStatus: editingLead.leadStatus,
        pipelineValue: editingLead.pipelineValue,
        followUpDate: editingLead.followUpDate,
        notes: editingLead.notes,
        outcome: editingLead.outcome,
        rejectionReason: editingLead.rejectionReason,
        nextAction: editingLead.nextAction
      });
      setEditingLead(null);
      await loadLeads();
      onRefreshMetrics();
    } catch (err: any) {
      alert(err?.message || 'Failed to save lead updates');
    }
  };

  const handleAnalyseCustomer = (lead: Lead) => {
    if (onSelectRecordForAnalysis) {
      const rec: ExtractedRecord = {
        id: lead.recordId || lead.id,
        fileId: 'crm-pipeline',
        customerName: lead.contactPerson || lead.customerName,
        companyName: lead.businessName || lead.companyName,
        email: lead.email,
        phone: lead.phone,
        industry: lead.industry,
        location: lead.location,
        website: lead.website,
        digitalPresence: lead.digitalPresence,
        analysisStatus: lead.analysisStatus || (lead.leadStatus === 'Analyzed' ? 'Analysed' : 'Research pending'),
        recommendedService: lead.recommendedService || lead.proposedService,
        priority: lead.priority || 'High',
        lastContactedAt: lead.lastContactedAt,
        followUpDate: lead.followUpDate,
        rawFields: {},
        sourceRef: { fileName: lead.leadSource || 'CRM Pipeline', fileId: 'crm' },
        status: 'analyzed',
        flags: { isDuplicate: false, hasMissingValues: false, hasInvalidData: false, missingFields: [], invalidFields: [] },
        createdAt: lead.createdAt || new Date().toISOString()
      };
      onSelectRecordForAnalysis(rec);
    } else {
      onNavigate('ai-analysis');
    }
  };

  const getStageBadgeStyle = (stage?: string) => {
    const s = (stage || '').toLowerCase();
    if (s.includes('won') || s.includes('accept')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s.includes('lost') || s.includes('reject')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (s.includes('propos')) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (s.includes('negot')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (s.includes('meet')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (s.includes('follow')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (s.includes('interest')) {
      return 'bg-teal-50 text-teal-700 border-teal-200';
    }
    return 'bg-sky-50 text-sky-700 border-sky-200';
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Customer Lead & Pipeline Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            Individual customer tracking: 13-point profile metrics, live digital presence, AI analysis status, and follow-up schedules.
          </p>
        </div>

        <button
          onClick={() => onNavigate('sales-pipeline')}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center space-x-2 shrink-0 self-start sm:self-auto"
        >
          <span>Open Kanban Board</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Search and Stage Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <form
          onSubmit={(e) => { e.preventDefault(); loadLeads(); }}
          className="flex-1 relative"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads by business name, contact person, phone, email, industry, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-24 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400 transition-all"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-2.5 shrink-0 self-end md:self-auto">
          <span className="text-xs text-slate-500 font-medium">Stage:</span>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
          >
            <option value="All">All Stages ({leads.length})</option>
            {PIPELINE_STAGES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 12-Column Customer Lead Table matching exact design */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="table-container max-h-[660px] overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200/80 bg-slate-50/70 text-slate-600 font-bold tracking-tight sticky top-0 z-10 backdrop-blur-xs">
              <tr>
                <th className="py-3.5 px-4 w-12 text-slate-400 font-medium">#</th>
                <th className="py-3.5 px-3 min-w-[160px]">Business Name</th>
                <th className="py-3.5 px-3 min-w-[120px]">Industry</th>
                <th className="py-3.5 px-3 min-w-[130px]">Contact Person</th>
                <th className="py-3.5 px-3 min-w-[110px]">Phone</th>
                <th className="py-3.5 px-3 min-w-[130px]">Email</th>
                <th className="py-3.5 px-3 min-w-[110px]">Location</th>
                <th className="py-3.5 px-3 min-w-[110px]">Website</th>
                <th className="py-3.5 px-3 min-w-[130px]">Digital Presence</th>
                <th className="py-3.5 px-3 min-w-[120px]">Stage</th>
                <th className="py-3.5 px-3 min-w-[110px]">Follow-up</th>
                <th className="py-3.5 px-4 min-w-[130px] text-right sticky right-0 bg-slate-50/90 z-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={12} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
                      <p className="text-xs text-slate-500 font-medium">Loading CRM leads...</p>
                    </div>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-16 px-4">
                    <div className="flex flex-col items-center justify-center text-center">
                      {/* Document Magnifier Mint Illustration */}
                      <div className="relative w-28 h-28 flex items-center justify-center mb-3">
                        {/* Soft mint circular glow background */}
                        <div className="w-24 h-24 rounded-full bg-emerald-50/80 border border-emerald-100/80 flex items-center justify-center relative shadow-xs">
                          {/* Top-right sparkle rays */}
                          <div className="absolute -top-1 -right-1 flex items-center space-x-0.5">
                            <span className="w-1.5 h-3 bg-emerald-400 rounded-full rotate-45 transform" />
                            <span className="w-1 h-2 bg-emerald-300 rounded-full rotate-12 transform" />
                          </div>

                          {/* White Document Card */}
                          <div className="w-12 h-15 bg-white rounded-lg border border-slate-200/90 shadow-2xs p-2 flex flex-col justify-between">
                            <div className="space-y-1.5">
                              <div className="w-6 h-1 bg-slate-300 rounded-full" />
                              <div className="w-8 h-1 bg-slate-200 rounded-full" />
                              <div className="w-7 h-1 bg-slate-200 rounded-full" />
                              <div className="w-5 h-1 bg-slate-200 rounded-full" />
                            </div>
                          </div>

                          {/* Green Magnifying Glass Icon tilted */}
                          <div className="absolute bottom-2 right-2">
                            <svg className="w-8 h-8 drop-shadow-xs" viewBox="0 0 32 32" fill="none">
                              <circle cx="13" cy="13" r="8" stroke="#10b981" strokeWidth="3" fill="white" />
                              <line x1="19" y1="19" x2="28" y2="28" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        No leads added yet
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        Import leads from Data Explorer to start managing your pipeline.
                      </p>

                      <button
                        onClick={() => onNavigate('data-explorer')}
                        className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center space-x-2"
                      >
                        <Upload className="w-4 h-4 stroke-[2.2]" />
                        <span>Import Leads</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead, idx) => {
                  const businessName = lead.businessName || lead.companyName || 'Business';
                  const contactPerson = lead.contactPerson || lead.customerName || 'Contact';
                  const currentStage = (lead.leadStatus as PipelineStage) || 'New Lead';

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* # */}
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">
                        {idx + 1}
                      </td>

                      {/* Business Name */}
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                          {businessName}
                        </span>
                        {lead.leadSource && (
                          <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">
                            {lead.leadSource}
                          </span>
                        )}
                      </td>

                      {/* Industry */}
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60 inline-block">
                          {lead.industry || 'General Business'}
                        </span>
                      </td>

                      {/* Contact Person */}
                      <td className="py-3.5 px-3">
                        <span className="font-medium text-slate-800 block truncate max-w-[140px]">
                          {contactPerson}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-700">
                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone}`}
                            className="hover:text-emerald-600 transition-colors truncate block"
                          >
                            {lead.phone}
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">N/A</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-3 text-[11px] text-slate-600 truncate max-w-[140px]">
                        {lead.email ? (
                          <a
                            href={`mailto:${lead.email}`}
                            className="hover:text-emerald-600 transition-colors truncate block"
                            title={lead.email}
                          >
                            {lead.email}
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">N/A</span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-3 text-slate-700 text-xs truncate max-w-[120px]">
                        {lead.location || 'Local'}
                      </td>

                      {/* Website */}
                      <td className="py-3.5 px-3">
                        {lead.website ? (
                          <a
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 hover:underline flex items-center space-x-1 font-mono text-[11px]"
                          >
                            <span className="truncate max-w-[90px]">{lead.website.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">None listed</span>
                        )}
                      </td>

                      {/* Digital Presence */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {(lead.digitalPresence && lead.digitalPresence.length > 0 ? lead.digitalPresence : ['Basic']).slice(0, 2).map((item, dIdx) => (
                            <span key={dIdx} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200/80">
                              {item}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Stage */}
                      <td className="py-3.5 px-3">
                        <select
                          value={currentStage}
                          onChange={(e) => handleStageChange(lead.id, e.target.value as PipelineStage)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getStageBadgeStyle(currentStage)} focus:outline-none cursor-pointer transition-colors`}
                        >
                          {PIPELINE_STAGES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>

                      {/* Follow-up */}
                      <td className="py-3.5 px-3 text-[11px] font-mono text-slate-700 font-semibold">
                        {lead.followUpDate || 'None'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right sticky right-0 bg-white/95 backdrop-blur-xs shadow-xs">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleAnalyseCustomer(lead)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors shadow-2xs flex items-center space-x-1 shrink-0"
                            title={`Analyse ${businessName} in AI Workspace`}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Analyse</span>
                          </button>

                          <button
                            onClick={() => setEditingLead(lead)}
                            className="px-2 py-1 text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 transition-colors shadow-2xs"
                            title="Edit notes and pipeline stage"
                          >
                            Edit
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

      {/* Edit Lead Modal */}
      {editingLead && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 text-xs">
            <h3 className="text-base font-bold text-slate-900">Manage Lead: {editingLead.customerName}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{editingLead.companyName}</p>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pipeline Stage:</label>
                  <select
                    value={editingLead.leadStatus}
                    onChange={(e) => setEditingLead({ ...editingLead, leadStatus: e.target.value as PipelineStage })}
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-semibold"
                  >
                    {PIPELINE_STAGES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Deal Value (₹ INR):</label>
                  <input
                    type="number"
                    value={editingLead.pipelineValue}
                    onChange={(e) => setEditingLead({ ...editingLead, pipelineValue: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Next Follow-Up Date:</label>
                <input
                  type="date"
                  value={editingLead.followUpDate || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, followUpDate: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Final Outcome Status:</label>
                <select
                  value={editingLead.outcome || 'Pending'}
                  onChange={(e) => setEditingLead({ ...editingLead, outcome: e.target.value as any })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                >
                  <option value="Pending">Pending</option>
                  <option value="Interested">Interested</option>
                  <option value="Meeting scheduled">Meeting scheduled</option>
                  <option value="Proposal sent">Proposal sent</option>
                  <option value="Accepted">Accepted (Won)</option>
                  <option value="Rejected">Rejected (Lost)</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer & Deal Notes:</label>
                <textarea
                  rows={3}
                  value={editingLead.notes || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                  placeholder="Record call notes, client technical dependencies, or timeline constraints..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  onClick={() => setEditingLead(null)}
                  className="px-3.5 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLeadDetails}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Lead Updates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

