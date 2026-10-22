import React, { useState, useEffect } from 'react';
import {
  Users2,
  Search,
  Filter,
  DollarSign,
  PhoneCall,
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
  AlertCircle
} from 'lucide-react';
import { Lead, PipelineStage, ExtractedRecord } from '../../../shared/types.js';
import { api } from '../services/api';
import { ViewKey } from '../components/layout/Sidebar';

interface CRMLeadsViewProps {
  onNavigate: (view: ViewKey) => void;
  onRefreshMetrics: () => void;
  onSelectRecordForAnalysis?: (record: ExtractedRecord) => void;
}

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

  const PIPELINE_STAGES: PipelineStage[] = [
    'New Lead',
    'Analyzed',
    'Qualified',
    'Contacted',
    'Interested',
    'Follow-up Required',
    'Meeting Scheduled',
    'Proposal Sent',
    'Negotiation',
    'Won',
    'Lost',
    'Not Qualified'
  ];

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await api.getLeads({
        stage: stageFilter !== 'All' ? stageFilter : undefined,
        search: search || undefined
      });
      setLeads(data);
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

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Lead & Pipeline Management</h2>
          <p className="text-xs text-slate-500">
            Individual customer tracking: 13-point profile metrics, live digital presence, AI analysis status, and follow-up schedules.
          </p>
        </div>

        <button
          onClick={() => onNavigate('sales-pipeline')}
          className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs flex items-center space-x-1.5"
        >
          <span>Open Kanban Board</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={(e) => { e.preventDefault(); loadLeads(); }} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads by business name, contact person, phone, email, industry, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-20 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs text-slate-500 font-medium">Stage:</span>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 shadow-xs focus:ring-1 focus:ring-emerald-500"
          >
            <option value="All">All Stages ({leads.length})</option>
            {PIPELINE_STAGES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Full 13-Column Customer Lead Table with sticky headers */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="table-container max-h-[640px] overflow-auto">
          <table className="w-full text-left text-xs table-sticky-header">
            <thead className="border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider bg-slate-100/90 backdrop-blur-xs">
              <tr>
                <th className="py-3 px-3 min-w-[160px]">1. Business Name</th>
                <th className="py-3 px-3 min-w-[120px]">2. Industry</th>
                <th className="py-3 px-3 min-w-[130px]">3. Contact Person</th>
                <th className="py-3 px-3 min-w-[110px]">4. Phone Number</th>
                <th className="py-3 px-3 min-w-[130px]">5. Email</th>
                <th className="py-3 px-3 min-w-[100px]">6. Location</th>
                <th className="py-3 px-3 min-w-[110px]">7. Website</th>
                <th className="py-3 px-3 min-w-[140px]">8. Existing Digital Presence</th>
                <th className="py-3 px-3 min-w-[100px]">9. Analysis Status</th>
                <th className="py-3 px-3 min-w-[150px]">10. Recommended Service</th>
                <th className="py-3 px-3 min-w-[90px]">11. Lead Priority</th>
                <th className="py-3 px-3 min-w-[105px]">12. Last Contacted</th>
                <th className="py-3 px-3 min-w-[105px]">13. Next Follow-up</th>
                <th className="py-3 px-3 min-w-[150px] text-right sticky right-0 bg-slate-100 z-10 shadow-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400">Loading CRM leads...</td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400">
                    No leads in CRM yet. Import records from Data Explorer.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const businessName = lead.businessName || lead.companyName || 'Business';
                  const contactPerson = lead.contactPerson || lead.customerName || 'Contact';
                  const priority = lead.priority || 'High';
                  const analysisStatus = lead.analysisStatus || (lead.leadStatus === 'Analyzed' ? 'Analysed' : 'Research pending');

                  return (
                    <tr key={lead.id} className="hover:bg-emerald-50/40 transition-colors">
                      {/* 1. Business Name */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{businessName}</span>
                        <span className="text-[10px] text-slate-400">{lead.leadSource || 'Direct'}</span>
                      </td>

                      {/* 2. Industry */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {lead.industry || 'General Business'}
                        </span>
                      </td>

                      {/* 3. Contact Person */}
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800">{contactPerson}</span>
                      </td>

                      {/* 4. Phone Number */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                        {lead.phone || 'N/A'}
                      </td>

                      {/* 5. Email */}
                      <td className="py-3 px-3 text-[11px] text-slate-600 truncate max-w-[140px]" title={lead.email}>
                        {lead.email || 'N/A'}
                      </td>

                      {/* 6. Location */}
                      <td className="py-3 px-3 text-slate-700">
                        {lead.location || 'Local'}
                      </td>

                      {/* 7. Website */}
                      <td className="py-3 px-3">
                        {lead.website ? (
                          <a
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-600 hover:underline flex items-center space-x-1 font-mono text-[11px]"
                          >
                            <span className="truncate max-w-[90px]">{lead.website.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">None listed</span>
                        )}
                      </td>

                      {/* 8. Existing Digital Presence */}
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {(lead.digitalPresence && lead.digitalPresence.length > 0 ? lead.digitalPresence : ['Basic Presence']).slice(0, 2).map((item, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                              {item}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* 9. Analysis Status */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          analysisStatus === 'Analysed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : analysisStatus === 'Research pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {analysisStatus}
                        </span>
                      </td>

                      {/* 10. Recommended Primary Service */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-emerald-800 text-[11px] block">
                          {lead.recommendedService || lead.proposedService || 'Custom Automation'}
                        </span>
                      </td>

                      {/* 11. Lead Priority */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          priority === 'High'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : priority === 'Medium'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {priority}
                        </span>
                      </td>

                      {/* 12. Last Contacted Date */}
                      <td className="py-3 px-3 text-[11px] font-mono text-slate-600">
                        {lead.lastContactedAt ? lead.lastContactedAt.slice(0, 10) : 'Never'}
                      </td>

                      {/* 13. Next Follow-up Date */}
                      <td className="py-3 px-3 text-[11px] font-mono text-slate-700 font-semibold">
                        {lead.followUpDate || 'None'}
                      </td>

                      {/* Actions: Functional Analyse Customer Button + Edit */}
                      <td className="py-3 px-3 text-right sticky right-0 bg-white/95 backdrop-blur-xs shadow-xs">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Prominent Analyse Customer Button */}
                          <button
                            onClick={() => handleAnalyseCustomer(lead)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors shadow-xs flex items-center space-x-1 shrink-0"
                            title={`Analyse ${businessName} in AI Workspace`}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Analyse</span>
                          </button>

                          <button
                            onClick={() => setEditingLead(lead)}
                            className="px-2 py-1 text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 transition-colors shadow-xs"
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
                  <label className="font-bold text-slate-700 block mb-1">Deal Value ($ USD):</label>
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
