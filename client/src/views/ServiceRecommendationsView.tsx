import React, { useState, useEffect } from 'react';
import {
  Award,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  TrendingUp,
  PhoneCall,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ExtractedRecord, ServiceRecommendation } from '../../../shared/types.js';
import { api } from '../services/api';
import { ViewKey } from '../components/layout/Sidebar';

interface ServiceRecommendationsViewProps {
  selectedRecord: ExtractedRecord | null;
  records: ExtractedRecord[];
  onSelectRecord: (record: ExtractedRecord) => void;
  onNavigate: (view: ViewKey) => void;
  onRefreshRecords?: () => void;
}

export const ServiceRecommendationsView: React.FC<ServiceRecommendationsViewProps> = ({
  selectedRecord,
  records,
  onSelectRecord,
  onNavigate,
  onRefreshRecords
}) => {
  const [internalRecords, setInternalRecords] = useState<ExtractedRecord[]>(records);
  const [recommendations, setRecommendations] = useState<ServiceRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Sync with prop and auto-fetch if empty
  useEffect(() => {
    if (records.length > 0) {
      setInternalRecords(records);
    } else {
      api.getRecords().then(res => {
        if (res.records.length > 0) {
          setInternalRecords(res.records);
          if (!selectedRecord) {
            onSelectRecord(res.records[0]);
          }
        }
      }).catch(err => {
        console.error('Failed to auto-fetch records in ServiceRecommendationsView:', err);
      });
    }
  }, [records]);

  const activeRecord = selectedRecord || (internalRecords.length > 0 ? internalRecords[0] : null);

  const loadRecommendations = async (recordId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getServiceRecommendations(recordId);
      setRecommendations(data);
      if (data.length > 0) setExpandedId(data[0].id);
    } catch (err: any) {
      setError(err?.message || 'Failed to match service recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeRecord?.id) {
      loadRecommendations(activeRecord.id);
    }
  }, [activeRecord?.id]);

  const handleUpdateStatus = async (recId: string, status: 'approved' | 'rejected' | 'adjusted') => {
    try {
      await api.updateRecommendationStatus(recId, status);
      setRecommendations(prev =>
        prev.map(r => r.id === recId ? { ...r, approvalStatus: status } : r)
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to update recommendation status');
    }
  };

  if (!activeRecord) {
    return (
      <div className="p-12 text-center max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-subtle">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-3.5 shadow-xs">
          <Award className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No Customer Selected</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Upload documents or load sample prospects to rank services with AI evidence grounding and likelihood scoring.
        </p>
        <div className="mt-5 flex items-center justify-center space-x-3">
          <button
            onClick={async () => {
              setLoading(true);
              try {
                await api.seedSampleData();
                const res = await api.getRecords();
                setInternalRecords(res.records);
                if (res.records.length > 0) {
                  onSelectRecord(res.records[0]);
                }
              } catch (e: any) {
                alert(e?.message || 'Failed to seed sample data');
              } finally {
                setLoading(false);
              }
            }}
            className="px-3.5 py-2 bg-white text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold hover:bg-emerald-50 transition-colors shadow-xs"
          >
            Load Sample Prospects
          </button>
          <button
            onClick={() => onNavigate('upload-documents')}
            className="px-3.5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 shadow-xs"
          >
            Upload Document
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Service Matching & Acceptance Engine</h2>
          <p className="text-xs text-slate-500">
            Algorithmic catalog matching, evidence grounding, objection handling, and acceptance likelihood calibration.
          </p>
        </div>

        {/* Record selector */}
        <select
          value={activeRecord.id}
          onChange={(e) => {
            const rec = internalRecords.find(r => r.id === e.target.value);
            if (rec) onSelectRecord(rec);
          }}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 shadow-xs focus:ring-1 focus:ring-emerald-500 max-w-xs"
        >
          {internalRecords.map(r => (
            <option key={r.id} value={r.id}>
              {r.customerName} ({r.industry || r.location})
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-subtle">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-slate-800">Ranking Services from Catalog...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
          {error}
        </div>
      )}

      {!loading && recommendations.length > 0 && (
        <div className="space-y-4">
          {recommendations.map((rec) => {
            const isExpanded = expandedId === rec.id;
            return (
              <div
                key={rec.id}
                className={`bg-white rounded-xl border transition-all shadow-subtle ${
                  rec.approvalStatus === 'approved'
                    ? 'border-emerald-300 ring-1 ring-emerald-200'
                    : rec.approvalStatus === 'rejected'
                    ? 'border-slate-200 opacity-60'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Main Card Header */}
                <div
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0 mt-0.5">
                      #{rec.rank}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-slate-900">{rec.serviceName}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          {rec.category}
                        </span>
                        {rec.approvalStatus === 'approved' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Approved by Sales
                          </span>
                        )}
                        {rec.approvalStatus === 'rejected' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            Rejected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{rec.suitabilityExplanation}</p>
                    </div>
                  </div>

                  {/* Likelihood Pill and Expand Arrow */}
                  <div className="flex items-center space-x-4 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center space-x-1 justify-end">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-sm font-extrabold text-slate-900">
                          {rec.acceptanceEstimate.preliminaryEstimate}%
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {rec.acceptanceEstimate.statusLabel}
                      </span>
                    </div>

                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 text-xs animate-in fade-in">
                    {/* Section 10: Acceptance Likelihood Engine Dossier */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-bold text-slate-900 block mb-1">
                          Acceptance Likelihood Diagnostic (Confidence: {rec.acceptanceEstimate.confidenceLevel})
                        </span>
                        <div className="space-y-1 text-slate-600">
                          <p className="font-semibold text-emerald-800">Supporting Evidence:</p>
                          <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                            {rec.acceptanceEstimate.supportingEvidence.map((e, ei) => (
                              <li key={ei}>{e}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-1 text-slate-600">
                        <p className="font-semibold text-amber-800">Uncertainty Factors & Missing Data:</p>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                          {rec.acceptanceEstimate.missingFactors.map((f, fi) => (
                            <li key={fi}>{f}</li>
                          ))}
                        </ul>
                        <p className="text-[11px] text-slate-400 mt-2 italic">
                          "{rec.acceptanceEstimate.historicalCalibrationNote}"
                        </p>
                      </div>
                    </div>

                    {/* Comparison Grid: Benefits, Costs, Complexity, Risks */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-white border border-slate-200 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Est. Investment</span>
                        <p className="font-bold text-slate-900 mt-0.5">{rec.comparison.estimatedCostRange || 'Custom'}</p>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Complexity</span>
                        <p className="font-bold text-slate-900 mt-0.5">{rec.comparison.complexity}</p>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Core Deliverables</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{rec.comparison.benefits[0] || 'Modern architecture'}</p>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Primary Risk Factor</span>
                        <p className="font-medium text-slate-700 mt-0.5">{rec.comparison.risks[0] || 'Data alignment'}</p>
                      </div>
                    </div>

                    {/* Likely Objections & Rebuttals */}
                    <div>
                      <span className="font-bold text-slate-900 block mb-2">Likely Objections & Recommended Rebuttals:</span>
                      <div className="space-y-2">
                        {rec.likelyObjections.map((obj, oi) => (
                          <div key={oi} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                            <span className="font-semibold text-rose-800 block">Client Objection: "{obj.objection}"</span>
                            <span className="text-slate-700 block">Quenoxa Rebuttal: {obj.suggestedRebuttal}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sales Controls & Actions Bar */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500 font-medium">Sales Decision:</span>
                        <button
                          onClick={() => handleUpdateStatus(rec.id, 'approved')}
                          className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1 text-xs transition-colors ${
                            rec.approvalStatus === 'approved'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Approve Match</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(rec.id, 'rejected')}
                          className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1 text-xs transition-colors ${
                            rec.approvalStatus === 'rejected'
                              ? 'bg-rose-600 text-white'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onNavigate('cold-call-studio')}
                          className="px-3 py-1.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center space-x-1.5"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Generate Call Script</span>
                        </button>
                        <button
                          onClick={() => onNavigate('whatsapp-outreach')}
                          className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp Pitch</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
