import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Languages,
  Target,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Download,
  AlertCircle
} from 'lucide-react';
import {
  ExtractedRecord,
  ColdCallScript,
  ColdCallLanguage,
  ColdCallDuration,
  ServiceCatalogItem
} from '../../../shared/types.js';
import { api } from '../services/api';
import { ViewKey } from '../components/layout/Sidebar';

interface ColdCallStudioViewProps {
  selectedRecord: ExtractedRecord | null;
  records: ExtractedRecord[];
  onSelectRecord: (record: ExtractedRecord) => void;
  onNavigate: (view: ViewKey) => void;
  onRefreshRecords?: () => void;
}

export const ColdCallStudioView: React.FC<ColdCallStudioViewProps> = ({
  selectedRecord,
  records,
  onSelectRecord,
  onNavigate,
  onRefreshRecords
}) => {
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [language, setLanguage] = useState<ColdCallLanguage>('thanglish');
  const [duration, setDuration] = useState<ColdCallDuration>('1m');
  const [salesObjective, setSalesObjective] = useState<string>('Book a 15-minute diagnostic meeting');
  const [script, setScript] = useState<ColdCallScript | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [expandedObjection, setExpandedObjection] = useState<string | null>(null);

  // Call logging form state
  const [connected, setConnected] = useState(true);
  const [interested, setInterested] = useState(true);
  const [meetingStatus, setMeetingStatus] = useState('booked');
  const [callNotes, setCallNotes] = useState('');
  const [callLoggedSuccess, setCallLoggedSuccess] = useState(false);
  const [internalRecords, setInternalRecords] = useState<ExtractedRecord[]>(records);

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
        console.error('Failed to auto-fetch records in ColdCallStudioView:', err);
      });
    }
  }, [records]);

  const activeRecord = selectedRecord || (internalRecords.length > 0 ? internalRecords[0] : null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const catalog = await api.getServices();
        setServices(catalog);
        if (catalog.length > 0 && !selectedServiceId) {
          setSelectedServiceId(catalog[0].id);
        }
      } catch (err) {
        console.error('Failed to load services:', err);
      }
    };
    fetchServices();
  }, []);

  const handleGenerateScript = async () => {
    if (!activeRecord) return;
    setLoading(true);
    try {
      const result = await api.generateColdCallScript(activeRecord.id, {
        serviceId: selectedServiceId || undefined,
        language,
        duration,
        salesObjective
      });
      setScript(result);
    } catch (err: any) {
      alert(err?.message || 'Failed to generate script');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeRecord) {
      handleGenerateScript();
    }
  }, [activeRecord?.id, language, duration, selectedServiceId]);

  const handleCopy = () => {
    if (!script) return;
    navigator.clipboard.writeText(script.rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveCallLog = async () => {
    if (!activeRecord) return;
    try {
      await api.logCall({
        leadId: activeRecord.id,
        connected,
        interested,
        meetingStatus,
        finalOutcome: interested ? 'Interested' : 'Pending',
        notes: callNotes,
        objectionsRaised: expandedObjection ? [expandedObjection] : []
      });
      setCallLoggedSuccess(true);
      setTimeout(() => {
        setCallLoggedSuccess(false);
        setShowLogModal(false);
      }, 1500);
    } catch (err: any) {
      alert(err?.message || 'Failed to log call outcome');
    }
  };

  if (!activeRecord) {
    return (
      <div className="p-12 text-center max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-subtle">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-3.5 shadow-xs">
          <PhoneCall className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Select Customer for Calling Script</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Upload documents or load sample prospects to generate conversational scripts in Thanglish, English, or Tamil with objection handling.
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Cold Call Studio</h2>
          <p className="text-xs text-slate-500">
            Tailored pitch generation in Thanglish, English, or Tamil with objection handling and duration calibration.
          </p>
        </div>

        {/* Customer Selector */}
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

      {/* Configuration Controls Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Service Selector */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Service Offering to Pitch
          </label>
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Language Options (Section 11) */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center space-x-1">
            <Languages className="w-3.5 h-3.5" />
            <span>Language Model</span>
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
            {(['thanglish', 'english', 'tamil'] as ColdCallLanguage[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`py-1.5 rounded text-xs font-bold capitalize transition-all ${
                  language === lang
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Duration Options */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Target Duration</span>
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
            {(['30s', '1m', '3m'] as ColdCallDuration[]).map((dur) => (
              <button
                key={dur}
                onClick={() => setDuration(dur)}
                className={`py-1.5 rounded text-xs font-bold transition-all ${
                  duration === dur
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {dur}
              </button>
            ))}
          </div>
        </div>

        {/* Sales Objective */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center space-x-1">
            <Target className="w-3.5 h-3.5" />
            <span>Sales Objective</span>
          </label>
          <select
            value={salesObjective}
            onChange={(e) => setSalesObjective(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none"
          >
            <option value="Book a 15-minute diagnostic meeting">Book a 15-minute diagnostic meeting</option>
            <option value="Introduce Quenoxa & understand requirements">Introduce Quenoxa & understand requirements</option>
            <option value="Arrange live product demo sandbox">Arrange live product demo sandbox</option>
            <option value="Obtain permission to submit proposal">Obtain permission to submit proposal</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-subtle">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-slate-800">Synthesizing {language.toUpperCase()} Script ({duration})...</p>
          <p className="text-[11px] text-slate-400 mt-1">Grounding script in verified customer data and 10 objection paths.</p>
        </div>
      )}

      {/* Script Preview and Action Buttons */}
      {!loading && script && (
        <div className="space-y-6 animate-in fade-in">
          {/* Action Ribbon */}
          <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center space-x-2 text-xs text-emerald-950">
              <span className="font-bold">Target Contact:</span>
              <span>{script.targetPerson} ({script.companyName})</span>
              <span className="text-emerald-500">•</span>
              <span className="font-mono text-emerald-800">{activeRecord.phone}</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100/50 transition-colors shadow-xs flex items-center space-x-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Full Script' : 'Copy Full Script'}</span>
              </button>

              <button
                onClick={handleGenerateScript}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs flex items-center space-x-1"
                title="Regenerate with Gemini"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Regenerate</span>
              </button>

              <button
                onClick={() => setShowLogModal(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs flex items-center space-x-1.5"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Log Call Outcome</span>
              </button>
            </div>
          </div>

          {/* Structured Script Sections (Section 11) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Main Flow */}
            <div className="lg:col-span-2 space-y-4">
              {/* 1. Greeting & Caller Intro */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                  1. Greeting & Introduction
                </span>
                <p className="text-xs text-slate-900 font-medium leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  "{script.greeting} {script.callerIntroduction}"
                </p>
              </div>

              {/* 2. Reason for Calling & Personalized Opening */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                  2. Reason for Calling & Personalized Opening
                </span>
                <p className="text-xs text-slate-900 font-medium leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  "{script.reasonForCalling} {script.personalizedOpening}"
                </p>
              </div>

              {/* 3. Discovery Questions */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-2">
                  3. Diagnostic Discovery Questions
                </span>
                <div className="space-y-2">
                  {script.discoveryQuestions.map((q, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-800 flex items-start space-x-2">
                      <span className="font-bold text-emerald-700">{i + 1}.</span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Service Pitch & Value Proposition */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                  4. Service Pitch ({script.serviceName})
                </span>
                <p className="text-xs text-slate-900 font-medium leading-relaxed bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                  "{script.customerSpecificServicePitch}"
                </p>

                <div className="mt-3">
                  <span className="text-[11px] font-bold text-slate-700 block mb-1">Key Value Deliverables:</span>
                  <ul className="text-xs text-slate-600 list-disc pl-4 space-y-0.5">
                    {script.benefitsAndValueProposition.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 5. Meeting Request & Closing */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                    5. Call to Action / Meeting Request
                  </span>
                  <p className="text-xs text-slate-900 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
                    "{script.meetingOrFollowUpRequest}"
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    6. Closing Statement
                  </span>
                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    "{script.closingStatement}"
                  </p>
                </div>
              </div>
            </div>

            {/* Right Col: 10 Objections Accordion (Mandatory Section 11) */}
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Objection Handling Vault (10 Scenarios)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mb-3">
                  Click any objection to reveal the instant rebuttal during the live call:
                </p>

                <div className="space-y-1.5">
                  {Object.entries(script.objectionHandling).map(([objection, rebuttal]) => {
                    const isOpen = expandedObjection === objection;
                    return (
                      <div
                        key={objection}
                        className="border border-slate-200 rounded-lg overflow-hidden transition-all"
                      >
                        <button
                          onClick={() => setExpandedObjection(isOpen ? null : objection)}
                          className="w-full p-2.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center justify-between"
                        >
                          <span className="truncate pr-2">"{objection}"</span>
                          {isOpen ? <ChevronUp className="w-3.5 h-3.5 shrink-0 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />}
                        </button>
                        {isOpen && (
                          <div className="p-3 bg-emerald-50/60 border-t border-slate-100 text-[11px] text-emerald-950 leading-relaxed font-medium">
                            {rebuttal}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Log Call Outcome (Section 16) */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900">Record Call Outcome & Activity</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Log phone connection, customer interest, and schedule automatic CRM follow-ups.
            </p>

            {callLoggedSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Call successfully recorded in CRM and audit history!</span>
              </div>
            )}

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center space-x-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={connected}
                    onChange={(e) => setConnected(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800">Phone Connected</span>
                </label>

                <label className="flex items-center space-x-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={interested}
                    onChange={(e) => setInterested(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800">Customer Interested</span>
                </label>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Meeting Status:</label>
                <select
                  value={meetingStatus}
                  onChange={(e) => setMeetingStatus(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50"
                >
                  <option value="booked">Meeting Booked</option>
                  <option value="none">No Meeting Requested</option>
                  <option value="declined">Meeting Declined</option>
                  <option value="rescheduled">Callback Scheduled</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Call Notes & Feedback:</label>
                <textarea
                  rows={3}
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Summarize customer reaction, technical specifics discussed, or next steps..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  onClick={() => setShowLogModal(false)}
                  className="px-3.5 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCallLog}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  Save Call Log to CRM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
