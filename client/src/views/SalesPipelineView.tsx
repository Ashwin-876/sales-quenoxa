import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Users,
  Star,
  PhoneCall,
  Calendar,
  FileText,
  Handshake,
  Trophy,
  XCircle,
  IndianRupee,
  User,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  Building2,
  ArrowRight,
  ExternalLink,
  Filter
} from 'lucide-react';
import { Lead, PipelineStage } from '../../../shared/types.js';
import { api } from '../services/api';
import { ViewKey } from '../components/layout/Sidebar';

interface SalesPipelineViewProps {
  onNavigate: (view: ViewKey) => void;
  onRefreshMetrics: () => void;
}

interface StageDefinition {
  id: PipelineStage;
  title: string;
  topBorderClass: string;
  iconBgClass: string;
  iconColorClass: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STAGES: StageDefinition[] = [
  {
    id: 'New Lead',
    title: 'New Lead',
    topBorderClass: 'border-t-4 border-t-sky-500',
    iconBgClass: 'bg-sky-50 border border-sky-100',
    iconColorClass: 'text-sky-500',
    icon: Users
  },
  {
    id: 'Interested',
    title: 'Interested',
    topBorderClass: 'border-t-4 border-t-emerald-500',
    iconBgClass: 'bg-emerald-50 border border-emerald-100',
    iconColorClass: 'text-emerald-500',
    icon: Star
  },
  {
    id: 'Follow-up Required',
    title: 'Follow-up Required',
    topBorderClass: 'border-t-4 border-t-amber-400',
    iconBgClass: 'bg-amber-50 border border-amber-100',
    iconColorClass: 'text-amber-500',
    icon: PhoneCall
  },
  {
    id: 'Meeting Scheduled',
    title: 'Meeting Scheduled',
    topBorderClass: 'border-t-4 border-t-purple-500',
    iconBgClass: 'bg-purple-50 border border-purple-100',
    iconColorClass: 'text-purple-500',
    icon: Calendar
  },
  {
    id: 'Proposal Sent',
    title: 'Proposal Sent',
    topBorderClass: 'border-t-4 border-t-rose-500',
    iconBgClass: 'bg-rose-50 border border-rose-100',
    iconColorClass: 'text-rose-500',
    icon: FileText
  },
  {
    id: 'Negotiation',
    title: 'Negotiation',
    topBorderClass: 'border-t-4 border-t-blue-500',
    iconBgClass: 'bg-blue-50 border border-blue-100',
    iconColorClass: 'text-blue-500',
    icon: Handshake
  },
  {
    id: 'Won',
    title: 'Won',
    topBorderClass: 'border-t-4 border-t-emerald-500',
    iconBgClass: 'bg-emerald-50 border border-emerald-100',
    iconColorClass: 'text-emerald-500',
    icon: Trophy
  },
  {
    id: 'Lost',
    title: 'Lost',
    topBorderClass: 'border-t-4 border-t-rose-400',
    iconBgClass: 'bg-rose-50 border border-rose-100',
    iconColorClass: 'text-rose-400',
    icon: XCircle
  }
];

// Helper to reliably map any backend status to one of our 8 displayed stages
const mapToPrimaryStage = (status?: string): PipelineStage => {
  if (!status) return 'New Lead';
  const s = status.toLowerCase();
  if (s.includes('won') || s.includes('accept')) return 'Won';
  if (s.includes('lost') || s.includes('reject')) return 'Lost';
  if (s.includes('negot')) return 'Negotiation';
  if (s.includes('propos')) return 'Proposal Sent';
  if (s.includes('meet') || s.includes('schedul')) return 'Meeting Scheduled';
  if (s.includes('follow')) return 'Follow-up Required';
  if (s.includes('interest')) return 'Interested';
  if (s.includes('contact')) return 'Interested';
  return 'New Lead';
};

export const SalesPipelineView: React.FC<SalesPipelineViewProps> = ({
  onNavigate,
  onRefreshMetrics
}) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await api.getLeads();
      setLeads(data || []);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const moveStage = async (leadId: string, currentStage: PipelineStage, direction: 'prev' | 'next') => {
    const stageIndex = STAGES.findIndex(s => s.id === currentStage);
    if (stageIndex === -1) return;
    const targetIndex = direction === 'next' ? stageIndex + 1 : stageIndex - 1;
    if (targetIndex < 0 || targetIndex >= STAGES.length) return;

    const targetStage = STAGES[targetIndex].id;
    try {
      await api.updateLead(leadId, { leadStatus: targetStage });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, leadStatus: targetStage } : l));
      onRefreshMetrics();
    } catch (err: any) {
      alert(err?.message || 'Failed to update pipeline stage');
    }
  };

  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const q = searchQuery.toLowerCase();
    return leads.filter(l =>
      (l.customerName || '').toLowerCase().includes(q) ||
      (l.companyName || '').toLowerCase().includes(q) ||
      (l.recommendedService || '').toLowerCase().includes(q)
    );
  }, [leads, searchQuery]);

  const totalValue = useMemo(() => {
    return leads.reduce((acc, curr) => acc + (Number(curr.pipelineValue) || 0), 0);
  }, [leads]);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
            <BarChart3 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Visual Sales Pipeline & Velocity
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              Kanban workflow from initial document import through closing and acceptance.
            </p>
          </div>
        </div>

        {/* Cumulative Pipeline Metric Pill */}
        <div className="flex items-center space-x-3 bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-xs self-start sm:self-auto">
          <span className="text-emerald-600 font-bold text-lg select-none">₹</span>
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-500">Cumulative Pipeline:</span>
            <span className="text-lg font-black text-emerald-600 font-mono tracking-tight leading-none mt-0.5">
              ₹{(totalValue ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Action / Search Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/70 backdrop-blur-xs p-3 rounded-2xl border border-slate-200/60 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deals by name or service..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400 transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => loadLeads()}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Pipeline</span>
          </button>
          <button
            onClick={() => onNavigate('crm')}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all shadow-xs"
          >
            <span>Open CRM Leads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 8-Stage Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {STAGES.map((stage) => {
          const stageLeads = filteredLeads.filter(
            l => mapToPrimaryStage(l.leadStatus) === stage.id
          );
          const stageValue = stageLeads.reduce(
            (acc, curr) => acc + (Number(curr.pipelineValue) || 0),
            0
          );
          const Icon = stage.icon;

          return (
            <div
              key={stage.id}
              className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col min-h-[380px] overflow-hidden ${stage.topBorderClass}`}
            >
              {/* Card Header */}
              <div className="p-4 sm:p-5 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${stage.iconBgClass} ${stage.iconColorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-900 text-sm tracking-tight">
                      {stage.title}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-slate-800 px-2 py-0.5 rounded-md">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Subheader: Est. Value */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Est. Value</span>
                  <span className="font-bold text-slate-900 font-mono text-xs">
                    ₹{(stageValue ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Card Body: Deals List or Empty State */}
              <div className="flex-1 p-3 flex flex-col">
                {stageLeads.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-10 px-4">
                    <div className="w-14 h-14 rounded-full bg-slate-100/80 border border-slate-200/50 flex items-center justify-center text-slate-400 mb-2.5">
                      <User className="w-7 h-7 stroke-[1.5]" />
                    </div>
                    <p className="text-xs text-slate-400 font-medium text-center">
                      No deals in this stage
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
                    {stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition-all space-y-2 group"
                      >
                        <div>
                          <span className="font-bold text-slate-900 text-xs block truncate group-hover:text-emerald-700 transition-colors">
                            {lead.customerName || 'Unnamed Contact'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium block truncate">
                            {lead.companyName || 'No Company'}
                          </span>
                        </div>

                        {lead.recommendedService && (
                          <div className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100/80 font-medium truncate inline-block">
                            {lead.recommendedService}
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 font-mono">
                            ₹{(Number(lead.pipelineValue) || 0).toLocaleString('en-IN')}
                          </span>

                          {/* Move stage controls */}
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => moveStage(lead.id, stage.id, 'prev')}
                              disabled={STAGES.findIndex(s => s.id === stage.id) === 0}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 disabled:opacity-20 transition-colors"
                              title="Move stage backwards"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => moveStage(lead.id, stage.id, 'next')}
                              disabled={STAGES.findIndex(s => s.id === stage.id) === STAGES.length - 1}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 disabled:opacity-20 transition-colors"
                              title="Advance to next stage"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

