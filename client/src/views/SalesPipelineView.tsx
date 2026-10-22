import React, { useState, useEffect } from 'react';
import {
  KanbanSquare,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  PhoneCall,
  MessageSquare,
  Mail,
  UserCheck,
  Building2
} from 'lucide-react';
import { Lead, PipelineStage } from '../../../shared/types.js';
import { api } from '../services/api';
import { ViewKey } from '../components/layout/Sidebar';

interface SalesPipelineViewProps {
  onNavigate: (view: ViewKey) => void;
  onRefreshMetrics: () => void;
}

const PIPELINE_COLUMNS: PipelineStage[] = [
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
  'Lost'
];

export const SalesPipelineView: React.FC<SalesPipelineViewProps> = ({
  onNavigate,
  onRefreshMetrics
}) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await api.getLeads();
      setLeads(data);
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
    const currentIndex = PIPELINE_COLUMNS.indexOf(currentStage);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex < 0 || targetIndex >= PIPELINE_COLUMNS.length) return;

    const targetStage = PIPELINE_COLUMNS[targetIndex];
    try {
      await api.updateLead(leadId, { leadStatus: targetStage });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, leadStatus: targetStage } : l));
      onRefreshMetrics();
    } catch (err: any) {
      alert(err?.message || 'Failed to update pipeline stage');
    }
  };

  const totalValue = leads.reduce((acc, curr) => acc + (Number(curr.pipelineValue) || 0), 0);

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Visual Sales Pipeline & Velocity</h2>
          <p className="text-xs text-slate-500">
            Kanban workflow from initial document import through closing and acceptance.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Cumulative Pipeline:</span>
          <span className="text-sm font-extrabold text-emerald-700 font-mono">
            ${totalValue.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="overflow-x-auto pb-4">
        <div className="flex space-x-4 min-w-max">
          {PIPELINE_COLUMNS.map((stage) => {
            const columnLeads = leads.filter(l => l.leadStatus === stage);
            const colValue = columnLeads.reduce((acc, curr) => acc + (Number(curr.pipelineValue) || 0), 0);

            return (
              <div
                key={stage}
                className="w-72 bg-slate-50/80 rounded-xl border border-slate-200/90 flex flex-col max-h-[750px] shrink-0 shadow-subtle"
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-slate-200 bg-white rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs truncate">{stage}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {columnLeads.length}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Est. Value</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      ${colValue.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Card List */}
                <div className="p-2.5 flex-1 overflow-y-auto space-y-2.5">
                  {columnLeads.length === 0 ? (
                    <div className="p-6 text-center text-[11px] text-slate-400 italic">
                      No deals in this stage
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs hover:border-emerald-300 transition-all space-y-2"
                      >
                        <div>
                          <span className="font-bold text-slate-900 text-xs block truncate">
                            {lead.customerName}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium block truncate">
                            {lead.companyName}
                          </span>
                        </div>

                        {lead.recommendedService && (
                          <div className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100 font-medium truncate">
                            {lead.recommendedService}
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900 font-mono">
                            ${Number(lead.pipelineValue || 0).toLocaleString()}
                          </span>

                          {/* Move stage controls */}
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => moveStage(lead.id, lead.leadStatus, 'prev')}
                              disabled={PIPELINE_COLUMNS.indexOf(stage) === 0}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                              title="Move stage backwards"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => moveStage(lead.id, lead.leadStatus, 'next')}
                              disabled={PIPELINE_COLUMNS.indexOf(stage) === PIPELINE_COLUMNS.length - 1}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                              title="Advance to next stage"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
