import React, { useState, useEffect } from 'react';
import {
  Mail,
  Copy,
  Check,
  ExternalLink,
  Send,
  RefreshCw,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  ExtractedRecord,
  ColdEmail,
  ColdEmailTemplateType,
  EmailTone,
  ServiceCatalogItem
} from '../../../shared/types.js';
import { api } from '../services/api';
import { ViewKey } from '../components/layout/Sidebar';

interface ColdEmailStudioViewProps {
  selectedRecord: ExtractedRecord | null;
  records: ExtractedRecord[];
  onSelectRecord: (record: ExtractedRecord) => void;
  onNavigate: (view: ViewKey) => void;
  onRefreshRecords?: () => void;
}

export const ColdEmailStudioView: React.FC<ColdEmailStudioViewProps> = ({
  selectedRecord,
  records,
  onSelectRecord,
  onNavigate,
  onRefreshRecords
}) => {
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [templateType, setTemplateType] = useState<ColdEmailTemplateType>('initial_cold_email');
  const [tone, setTone] = useState<EmailTone>('Professional & Direct');
  const [emailData, setEmailData] = useState<ColdEmail | null>(null);

  // Editable fields
  const [toField, setToField] = useState('');
  const [ccField, setCcField] = useState('');
  const [subjectField, setSubjectField] = useState('');
  const [bodyField, setBodyField] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
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
        console.error('Failed to auto-fetch records in ColdEmailStudioView:', err);
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

  const generateEmail = async () => {
    if (!activeRecord) return;
    try {
      const res = await api.generateColdEmail(activeRecord.id, {
        serviceId: selectedServiceId || undefined,
        templateType,
        tone,
        language: 'English'
      });
      setEmailData(res);
      setToField(res.to);
      setSubjectField(res.subject);
      setBodyField(res.body);
      setStatusMessage(null);
    } catch (err) {
      console.error('Failed to generate email:', err);
    }
  };

  useEffect(() => {
    if (activeRecord) {
      generateEmail();
    }
  }, [activeRecord?.id, templateType, tone, selectedServiceId]);

  const handleCopy = () => {
    const fullText = `To: ${toField}\nSubject: ${subjectField}\n\n${bodyField}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenComposer = async () => {
    if (!toField) return;
    const mailto = `mailto:${encodeURIComponent(toField)}?subject=${encodeURIComponent(subjectField)}&body=${encodeURIComponent(bodyField)}`;
    window.location.href = mailto;

    // Log action as composer_opened (Section 13)
    try {
      await api.logEmailOutreach({
        leadId: activeRecord?.id,
        recipientEmail: toField,
        ccEmail: ccField || undefined,
        subject: subjectField,
        body: bodyField,
        templateType,
        tone,
        language: 'English',
        mailtoUrl: mailto,
        isActualSend: false
      });
      setStatusMessage('Mail composer opened in external client. Logged in CRM.');
    } catch (err) {
      console.error('Failed to log composer opening:', err);
    }
  };

  const handleDirectSend = async () => {
    if (!toField) return;
    setIsSending(true);
    try {
      await api.logEmailOutreach({
        leadId: activeRecord?.id,
        recipientEmail: toField,
        ccEmail: ccField || undefined,
        subject: subjectField,
        body: bodyField,
        templateType,
        tone,
        language: 'English',
        isActualSend: true
      });
      setStatusMessage('Email dispatched via authorized sender integration. Status: Confirmed Send.');
    } catch (err: any) {
      alert(err?.message || 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const templates: { key: ColdEmailTemplateType; label: string }[] = [
    { key: 'initial_cold_email', label: 'Initial Cold Outreach' },
    { key: 'website_dev_offer', label: 'Website Dev Offer' },
    { key: 'ai_automation_pitch', label: 'AI & Automation Pitch' },
    { key: 'custom_software_proposal', label: 'Custom Software Proposal' },
    { key: 'business_introduction', label: 'Business Introduction' },
    { key: 'meeting_request', label: 'Meeting Request' },
    { key: 'proposal_follow_up', label: 'Proposal Follow-up' },
    { key: 'post_meeting_follow_up', label: 'Post-Meeting Follow-up' },
  ];

  const tones: EmailTone[] = [
    'Professional & Direct',
    'Consultative & Helpful',
    'Urgent & Value-Driven',
    'Executive & Concise'
  ];

  if (!activeRecord) {
    return (
      <div className="p-12 text-center max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-subtle">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-3.5 shadow-xs">
          <Mail className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Select Customer for Cold Email</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Upload documents or load sample prospects to generate multi-tone structured enterprise emails and mailto execution.
        </p>
        <div className="mt-5 flex items-center justify-center space-x-3">
          <button
            onClick={async () => {
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
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Cold Email Studio</h2>
          <p className="text-xs text-slate-500">
            Multi-tone strategic messaging, Mailto client triggers, and authorized delivery tracking.
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

      {/* Control Configuration Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-700">Pitch Service:</span>
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900"
          >
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-700">Voice Tone:</span>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as EmailTone)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900"
          >
            {tones.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Template Tabs (Section 13) */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-white border border-slate-200 rounded-xl shadow-xs">
        {templates.map((t) => (
          <button
            key={t.key}
            onClick={() => setTemplateType(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              templateType === t.key
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Email Composer Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-subtle p-6 space-y-4">
        {statusMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-bold text-slate-600 block mb-1">Recipient (To):</label>
            <input
              type="text"
              value={toField}
              onChange={(e) => setToField(e.target.value)}
              placeholder="customer@domain.com"
              className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-emerald-500 font-mono text-xs"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">Carbon Copy (CC):</label>
            <input
              type="text"
              value={ccField}
              onChange={(e) => setCcField(e.target.value)}
              placeholder="sales-lead@quenoxa.com"
              className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-emerald-500 font-mono text-xs"
            />
          </div>
        </div>

        <div className="text-xs">
          <label className="font-bold text-slate-600 block mb-1">Subject Line:</label>
          <input
            type="text"
            value={subjectField}
            onChange={(e) => setSubjectField(e.target.value)}
            className="w-full p-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-emerald-500 text-xs font-semibold text-slate-900"
          />
        </div>

        <div className="text-xs">
          <label className="font-bold text-slate-600 block mb-1">Email Body Content:</label>
          <textarea
            rows={12}
            value={bodyField}
            onChange={(e) => setBodyField(e.target.value)}
            className="w-full p-4 border border-slate-200 rounded-xl text-xs font-sans text-slate-900 leading-relaxed bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Action Controls Bar */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs flex items-center space-x-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Email'}</span>
            </button>
            <button
              onClick={generateEmail}
              className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenComposer}
              className="px-3.5 py-2 bg-white border border-slate-300 text-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs flex items-center space-x-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
              <span>Open Email Composer (mailto)</span>
            </button>

            <button
              onClick={handleDirectSend}
              disabled={isSending || !toField}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending...' : 'Confirm Send (In-App API)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
