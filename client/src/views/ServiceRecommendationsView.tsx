import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Award,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  PhoneCall,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';
import { ExtractedRecord, ServiceRecommendation } from '../../../shared/types.js';
import { api } from '../services/api';
import { ViewKey } from '../components/layout/Sidebar';

export type RecommendationLoadingState = 'idle' | 'loading' | 'success' | 'empty' | 'error' | 'timeout';

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
  const [state, setState] = useState<RecommendationLoadingState>('idle');
  const [loadingStep, setLoadingStep] = useState<string>('Analyzing business requirements...');
  const [isTakingLonger, setIsTakingLonger] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadTimeMs, setLoadTimeMs] = useState<number | null>(null);

  // Client-side cache to make customer switching instantaneous without refetching
  const clientCacheRef = useRef<Map<string, ServiceRecommendation[]>>(new Map());
  // In-flight abort controller
  const abortControllerRef = useRef<AbortController | null>(null);
  // Timer references
  const stepTimerRef = useRef<NodeJS.Timeout[]>([]);
  const slowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);

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
        console.error('[ServiceMatching] Failed to auto-fetch records:', err);
      });
    }
  }, [records]);

  const activeRecord = selectedRecord || (internalRecords.length > 0 ? internalRecords[0] : null);

  const clearTimers = () => {
    stepTimerRef.current.forEach(t => clearTimeout(t));
    stepTimerRef.current = [];
    if (slowTimerRef.current) {
      clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
  };

  const loadRecommendations = useCallback(async (recordId: string, forceFresh = false) => {
    // 1. Cancel previous in-flight request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    clearTimers();

    // 2. Check client memory cache if not forcing fresh
    if (!forceFresh && clientCacheRef.current.has(recordId)) {
      const cached = clientCacheRef.current.get(recordId)!;
      setRecommendations(cached);
      setState(cached.length > 0 ? 'success' : 'empty');
      setErrorMessage(null);
      setIsTakingLonger(false);
      setLoadTimeMs(0);
      if (cached.length > 0) setExpandedId(cached[0].id);
      return;
    }

    // 3. Setup new abort controller and client timeout (12 seconds)
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState('loading');
    setRecommendations([]);
    setErrorMessage(null);
    setIsTakingLonger(false);
    setLoadingStep('Analyzing business requirements...');
    const startTime = performance.now();

    // Staged progress indicators for user feedback
    stepTimerRef.current.push(
      setTimeout(() => {
        setLoadingStep('Matching relevant services from catalog...');
      }, 700)
    );
    stepTimerRef.current.push(
      setTimeout(() => {
        setLoadingStep('Calculating recommendation scores & objection handling...');
      }, 1600)
    );

    // Warning for requests taking longer than 4 seconds
    slowTimerRef.current = setTimeout(() => {
      setIsTakingLonger(true);
    }, 4000);

    // Hard client-side timeout after 12 seconds
    timeoutTimerRef.current = setTimeout(() => {
      controller.abort();
      clearTimers();
      setState('timeout');
      setErrorMessage('Service matching took too long to respond. Please check your connection or retry.');
      console.warn(`[ServiceMatching] Request timed out for customer ${recordId}`);
    }, 12000);

    try {
      const data = await api.getServiceRecommendations(recordId, {
        signal: controller.signal,
        forceFresh
      });

      const elapsed = Math.round(performance.now() - startTime);
      setLoadTimeMs(elapsed);
      clearTimers();

      // Cache result in memory
      clientCacheRef.current.set(recordId, data);
      setRecommendations(data);

      if (data.length === 0) {
        setState('empty');
      } else {
        setState('success');
        setExpandedId(data[0].id);
      }
      console.log(`[ServiceMatching] Successfully loaded ${data.length} services for ${recordId} in ${elapsed}ms`);
    } catch (err: any) {
      // If aborted due to customer change or timeout, don't overwrite state with a generic error
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        // If state was already set to 'timeout', keep it
        return;
      }
      clearTimers();
      const elapsed = Math.round(performance.now() - startTime);
      console.error(`[ServiceMatching] Error loading recommendations (${elapsed}ms):`, err);
      setState('error');
      setErrorMessage(err?.message || 'Unable to load service recommendations.');
    }
  }, []);

  // Fetch when active record changes
  useEffect(() => {
    if (activeRecord?.id) {
      loadRecommendations(activeRecord.id, false);
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      clearTimers();
    };
  }, [activeRecord?.id, loadRecommendations]);

  const handleUpdateStatus = async (recId: string, status: 'approved' | 'rejected' | 'adjusted') => {
    try {
      await api.updateRecommendationStatus(recId, status);
      setRecommendations(prev => {
        const updated = prev.map(r => r.id === recId ? { ...r, approvalStatus: status } : r);
        if (activeRecord?.id) {
          clientCacheRef.current.set(activeRecord.id, updated);
        }
        return updated;
      });
    } catch (err: any) {
      alert(err?.message || 'Failed to update recommendation status');
    }
  };

  const handleRetry = () => {
    if (activeRecord?.id) {
      loadRecommendations(activeRecord.id, false);
    }
  };

  const handleForceRefresh = () => {
    if (activeRecord?.id) {
      // Clear from cache and force re-rank
      clientCacheRef.current.delete(activeRecord.id);
      loadRecommendations(activeRecord.id, true);
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
              setState('loading');
              try {
                await api.seedSampleData();
                const res = await api.getRecords();
                setInternalRecords(res.records);
                if (res.records.length > 0) {
                  onSelectRecord(res.records[0]);
                }
              } catch (e: any) {
                alert(e?.message || 'Failed to seed sample data');
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
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto min-h-[600px]">
      {/* Top Header - Always visible immediately */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Service Matching & Acceptance Engine</h2>
            {loadTimeMs !== null && state === 'success' && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {loadTimeMs === 0 ? 'Instant (cached)' : `${loadTimeMs}ms`}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Algorithmic catalog matching, evidence grounding, objection handling, and acceptance likelihood calibration.
          </p>
        </div>

        {/* Record selector & Controls */}
        <div className="flex items-center space-x-2">
          <select
            value={activeRecord.id}
            onChange={(e) => {
              const rec = internalRecords.find(r => r.id === e.target.value);
              if (rec) onSelectRecord(rec);
            }}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 shadow-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none max-w-xs transition-shadow"
          >
            {internalRecords.map(r => (
              <option key={r.id} value={r.id}>
                {r.customerName} ({r.industry || r.location})
              </option>
            ))}
          </select>

          <button
            onClick={handleForceRefresh}
            disabled={state === 'loading'}
            title="Re-run recommendation engine with fresh catalog"
            className="p-1.5 bg-white border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-700 rounded-lg text-xs transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${state === 'loading' ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* STATE 1: LOADING with professional skeleton & staged steps */}
      {state === 'loading' && (
        <div className="space-y-4">
          {/* Compact Status Banner */}
          <div className="p-4 bg-white rounded-xl border border-emerald-100 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
              <div>
                <p className="text-xs font-bold text-slate-900">{loadingStep}</p>
                <p className="text-[11px] text-slate-500">
                  Target: <span className="font-semibold text-slate-700">{activeRecord.customerName}</span> ({activeRecord.industry || 'General Business'})
                </p>
              </div>
            </div>

            {isTakingLonger && (
              <div className="flex items-center space-x-2 text-[11px] text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>This is taking longer than expected. We're still processing your recommendations.</span>
              </div>
            )}
          </div>

          {/* Skeleton Cards - Avoids layout shift and shows real card structure */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle animate-pulse"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3.5 w-full">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0"></div>
                    <div className="space-y-2 w-3/4">
                      <div className="flex items-center space-x-2">
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-3.5 bg-slate-100 rounded w-16"></div>
                      </div>
                      <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                    </div>
                  </div>
                  <div className="w-16 h-8 bg-slate-100 rounded-lg shrink-0"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STATE 2: TIMEOUT */}
      {state === 'timeout' && (
        <div className="p-8 text-center bg-white rounded-xl border border-amber-200 shadow-subtle max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Request Timed Out</h3>
          <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
            {errorMessage || 'Service matching took longer than expected to rank results.'}
          </p>
          <div className="mt-4 flex items-center justify-center space-x-3">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Matching</span>
            </button>
            <button
              onClick={() => onNavigate('data-explorer')}
              className="px-3.5 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs"
            >
              Review Lead Details
            </button>
          </div>
        </div>
      )}

      {/* STATE 3: ERROR */}
      {state === 'error' && (
        <div className="p-8 text-center bg-white rounded-xl border border-rose-200 shadow-subtle max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Unable to load service recommendations</h3>
          <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
            {errorMessage || 'An error occurred while evaluating catalog services.'}
          </p>
          <div className="mt-4 flex items-center justify-center space-x-3">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
            <button
              onClick={handleForceRefresh}
              className="px-3.5 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs"
            >
              Force Fresh Engine Run
            </button>
          </div>
        </div>
      )}

      {/* STATE 4: EMPTY */}
      {state === 'empty' && (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 shadow-subtle max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 mx-auto mb-3">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No matching services found for this business.</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            The service catalog has no active items matching the industry profile or requirements of{' '}
            <span className="font-semibold text-slate-700">{activeRecord.customerName}</span>.
          </p>
          <div className="mt-5 flex items-center justify-center space-x-3">
            <button
              onClick={() => onNavigate('service-catalog')}
              className="px-3.5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs flex items-center space-x-1.5"
            >
              <span>Manage Service Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleForceRefresh}
              className="px-3.5 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs"
            >
              Refresh Recommendations
            </button>
          </div>
        </div>
      )}

      {/* STATE 5: SUCCESS with Recommendation List */}
      {state === 'success' && recommendations.length > 0 && (
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

                    <button
                      type="button"
                      aria-label={isExpanded ? "Collapse recommendation details" : "Expand recommendation details"}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 text-xs animate-in fade-in">
                    {/* Acceptance Likelihood Engine Dossier */}
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
                        {rec.acceptanceEstimate.historicalCalibrationNote && (
                          <p className="text-[11px] text-slate-400 mt-2 italic">
                            "{rec.acceptanceEstimate.historicalCalibrationNote}"
                          </p>
                        )}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(rec.id, 'approved');
                          }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(rec.id, 'rejected');
                          }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('cold-call-studio');
                          }}
                          className="px-3 py-1.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center space-x-1.5"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Generate Call Script</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('whatsapp-outreach');
                          }}
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
