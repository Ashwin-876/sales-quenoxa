import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Send,
  Languages,
  Sparkles,
  Phone,
  CheckCircle2,
  Clock,
  Radio,
  SlidersHorizontal
} from 'lucide-react';
import {
  ExtractedRecord,
  WhatsAppMessage,
  WhatsAppTemplateType,
  ColdCallLanguage,
  ServiceCatalogItem
} from '../../../shared/types.js';
import { api } from '../services/api';
import { ViewKey } from '../components/layout/Sidebar';

interface WhatsAppOutreachViewProps {
  selectedRecord: ExtractedRecord | null;
  records: ExtractedRecord[];
  onSelectRecord: (record: ExtractedRecord) => void;
  onNavigate: (view: ViewKey) => void;
  onRefreshRecords?: () => void;
}

export const WhatsAppOutreachView: React.FC<WhatsAppOutreachViewProps> = ({
  selectedRecord,
  records,
  onSelectRecord,
  onNavigate,
  onRefreshRecords
}) => {
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [templateType, setTemplateType] = useState<WhatsAppTemplateType>('first_introduction');
  const [language, setLanguage] = useState<ColdCallLanguage>('thanglish');
  const [message, setMessage] = useState<WhatsAppMessage | null>(null);
  const [editableContent, setEditableContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [openedStatus, setOpenedStatus] = useState<string | null>(null);
  const [businessApiMode, setBusinessApiMode] = useState(false);
  const [customerOptIn, setCustomerOptIn] = useState(true);
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
        console.error('Failed to auto-fetch records in WhatsAppOutreachView:', err);
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

  const generateMessage = async () => {
    if (!activeRecord) return;
    try {
      const res = await api.generateWhatsAppMessage(activeRecord.id, {
        serviceId: selectedServiceId || undefined,
        templateType,
        language
      });
      setMessage(res);
      setEditableContent(res.messageContent);
      setOpenedStatus(null);
    } catch (err: any) {
      console.error('Failed to generate message:', err);
    }
  };

  useEffect(() => {
    if (activeRecord) {
      generateMessage();
    }
  }, [activeRecord?.id, templateType, language, selectedServiceId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editableContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = async () => {
    if (!activeRecord || !message) return;

    // Recalculate click to chat URL with user edited content
    const cleanPhone = activeRecord.phone.replace(/[\s\-\(\)\.]/g, '').replace(/^\+/, '');
    const encoded = encodeURIComponent(editableContent);
    const targetUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;

    // Open WhatsApp in new tab
    window.open(targetUrl, '_blank');

    // Strict Section 12 Requirement:
    // "Opening WhatsApp must not be recorded as a confirmed send. Record the action as 'WhatsApp opened' unless sending is confirmed through an authorized integration."
    try {
      await api.logWhatsAppOpened({
        leadId: activeRecord.id,
        phoneNumber: activeRecord.phone,
        templateType,
        language,
        messageContent: editableContent,
        clickToChatUrl: targetUrl
      });
      setOpenedStatus('WhatsApp opened (Recorded in CRM as unconfirmed send)');
    } catch (err) {
      console.error('Failed to log WhatsApp opening:', err);
    }
  };

  const templates: { key: WhatsAppTemplateType; label: string }[] = [
    { key: 'first_introduction', label: 'First Introduction' },
    { key: 'service_pitch', label: 'Service Pitch' },
    { key: 'meeting_request', label: 'Meeting Request' },
    { key: 'demo_invitation', label: 'Demo Invitation' },
    { key: 'proposal_follow_up', label: 'Proposal Follow-up' },
    { key: 'callback_follow_up', label: 'Callback Follow-up' },
    { key: 'post_meeting_follow_up', label: 'Post-Meeting Follow-up' },
    { key: 'objection_response', label: 'Objection Response' },
  ];

  if (!activeRecord) {
    return (
      <div className="p-12 text-center max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-subtle">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-3.5 shadow-xs">
          <MessageSquare className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Select Customer for WhatsApp Outreach</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Upload documents or load sample prospects to launch 1-click personalized WhatsApp messaging with international number encoding.
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

  const cleanPhone = activeRecord.phone.replace(/[\s\-\(\)\.]/g, '');

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Direct WhatsApp Outreach Module</h2>
          <p className="text-xs text-slate-500">
            Click-to-chat URL encoding, multi-lingual Thanglish/English messaging, and audit logging.
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

      {/* Recipient Information Pill */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-xs block">{activeRecord.customerName}</span>
            <span className="text-[11px] text-slate-500 font-mono">
              Raw: {activeRecord.phone || 'No phone'} → Cleaned: {cleanPhone || 'Missing'}
            </span>
          </div>
        </div>

        {/* Language & Service pickers */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
          >
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs">
            {(['thanglish', 'english', 'tamil'] as ColdCallLanguage[]).map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`px-2.5 py-1 rounded font-bold capitalize transition-colors ${
                  language === l ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Template Selector Tabs (Section 12) */}
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

      {/* Message Preview and Editor Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Box */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-subtle p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Personalized Message Content (Editable)
            </h3>
            <span className="text-[11px] text-slate-400">
              {editableContent.length} characters
            </span>
          </div>

          <textarea
            rows={7}
            value={editableContent}
            onChange={(e) => setEditableContent(e.target.value)}
            className="w-full p-4 border border-slate-200 rounded-xl text-xs font-sans text-slate-900 leading-relaxed bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          {/* Formatted Click-to-Chat URL Display */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px]">
            <span className="font-bold text-slate-600 block mb-1">Click-to-Chat Protocol URL:</span>
            <code className="text-[10px] text-emerald-800 break-all select-all font-mono">
              https://wa.me/{cleanPhone.replace(/^\+/, '')}?text={encodeURIComponent(editableContent).slice(0, 100)}...
            </code>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs flex items-center space-x-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Message'}</span>
              </button>
            </div>

            <button
              onClick={handleOpenWhatsApp}
              disabled={!activeRecord.phone}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open WhatsApp (wa.me)</span>
            </button>
          </div>

          {/* Status notice */}
          {openedStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{openedStatus}</span>
            </div>
          )}
        </div>

        {/* Right Info Box: Compliance & Business Platform Simulation */}
        <div className="space-y-4">
          {/* Strict Security Policy Notice */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle space-y-2.5 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-900 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Security & Sending Transparency</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              In adherence with Section 12 specifications, Quenoxa logs click-to-chat triggers strictly as <strong>"WhatsApp opened"</strong>.
              We do not scrape WhatsApp Web or claim unconfirmed message delivery.
            </p>
          </div>

          {/* Official WhatsApp Business Platform Integration Settings */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-subtle space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Official Cloud API Mode</span>
              <button
                onClick={() => setBusinessApiMode(!businessApiMode)}
                className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${businessApiMode ? 'bg-emerald-600' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${businessApiMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </button>
            </div>

            <div className="space-y-2 text-slate-600">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customerOptIn}
                  onChange={(e) => setCustomerOptIn(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-[11px] font-medium">Customer has explicitly opted-in to digital communications</span>
              </label>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[10px] space-y-1">
                <p>• Approved Meta Template: <code className="text-emerald-700">quenoxa_intro_v1</code></p>
                <p>• Delivery Webhook: <code className="text-slate-600">/api/v1/webhooks/whatsapp</code></p>
                <p>• Opt-out keywords: STOP, UNSUBSCRIBE</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
