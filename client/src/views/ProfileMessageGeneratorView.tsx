import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Download,
  Save,
  Trash2,
  ExternalLink,
  MessageSquare,
  Mail,
  Send,
  Building2,
  Clock,
  Globe,
  Phone,
  Briefcase,
  Sliders,
  ChevronDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  User,
  MapPin,
  ListFilter,
  CheckCircle2,
  FileText,
  AlertCircle,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import {
  MarketingCustomerProfile,
  ProviderSettings,
  MarketingRecommendedService,
  GeneratedMarketingOutputs,
  MarketingChannel,
  MarketingMessageType,
  MarketingLanguage,
  MarketingTone,
  ExtractedRecord
} from '../../../shared/types.js';
import { api } from '../services/api';
import { ViewKey } from '../components/layout/Sidebar';

interface ProfileMessageGeneratorViewProps {
  onNavigate: (view: ViewKey) => void;
  selectedRecord?: ExtractedRecord | null;
}

const PREDEFINED_INDUSTRIES = [
  'Fitness and Gyms',
  'Protein and Supplements',
  'Restaurants and Hotels',
  'Retail and E-commerce',
  'Educational Institutions',
  'Healthcare and Clinics',
  'Real Estate',
  'Manufacturing',
  'IT and Software',
  'Professional Services',
  'Other'
];

const TIME_ZONES = [
  { label: 'India Standard Time (IST, GMT+5:30)', value: 'Asia/Kolkata', offset: 5.5 },
  { label: 'Gulf Standard Time (Dubai, GMT+4)', value: 'Asia/Dubai', offset: 4 },
  { label: 'Singapore / Malaysia (SGT, GMT+8)', value: 'Asia/Singapore', offset: 8 },
  { label: 'UK (GMT / BST)', value: 'Europe/London', offset: 1 },
  { label: 'US Eastern Time (EST, GMT-4)', value: 'America/New_York', offset: -4 },
  { label: 'US Pacific Time (PST, GMT-7)', value: 'America/Los_Angeles', offset: -7 },
  { label: 'Coordinated Universal Time (UTC)', value: 'UTC', offset: 0 }
];

export const ProfileMessageGeneratorView: React.FC<ProfileMessageGeneratorViewProps> = ({
  onNavigate,
  selectedRecord
}) => {
  // Provider Settings State
  const [provider, setProvider] = useState<ProviderSettings>({
    companyName: 'QUENOXA GLOBAL TECHNOLOGIES',
    senderName: 'Ashwin',
    website: 'https://www.quenoxa.com',
    email: 'info@quenoxa.com',
    phone: '6369480281'
  });
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderSettings>(provider);

  // Customer Profile Form State
  const [customerName, setCustomerName] = useState(selectedRecord?.customerName || 'Vignesh Kumar');
  const [companyName, setCompanyName] = useState(selectedRecord?.companyName || 'Apex Fitness Studio');
  const [industry, setIndustry] = useState(selectedRecord?.industry || 'Fitness and Gyms');
  const [customIndustry, setCustomIndustry] = useState('');
  const [designation, setDesignation] = useState('Managing Director');
  const [location, setLocation] = useState(selectedRecord?.location || 'Coimbatore, Tamil Nadu');
  const [website, setWebsite] = useState(selectedRecord?.website || '');
  const [requirements, setRequirements] = useState(
    'Looking to automate member renewals, stop front-desk manual registers, and get 20+ fresh gym membership inquiries every week.'
  );
  const [preferredChannel, setPreferredChannel] = useState<MarketingChannel>('WhatsApp');
  const [messageType, setMessageType] = useState<MarketingMessageType>('Introduction');
  const [language, setLanguage] = useState<MarketingLanguage>('English');
  const [tone, setTone] = useState<MarketingTone>('Professional');
  const [selectedTimeZone, setSelectedTimeZone] = useState('Asia/Kolkata');
  const [greetingOverride, setGreetingOverride] = useState<string>('auto');

  // Generator State
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputs, setOutputs] = useState<GeneratedMarketingOutputs | null>(null);
  const [activeOutputTab, setActiveOutputTab] = useState<
    'intro' | 'pitch' | 'brochure' | 'followup' | 'email' | 'whatsapp' | 'services' | 'greeting'
  >('intro');
  const [editableContent, setEditableContent] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Persistence State
  const [savedProfiles, setSavedProfiles] = useState<MarketingCustomerProfile[]>([]);
  const [history, setHistory] = useState<GeneratedMarketingOutputs[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Current Local Time Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute Greeting for Selected Time Zone
  const timeInfo = useMemo(() => {
    const tzObj = TIME_ZONES.find(t => t.value === selectedTimeZone) || TIME_ZONES[0];
    const utcTime = currentTime.getTime() + currentTime.getTimezoneOffset() * 60000;
    const targetDate = new Date(utcTime + 3600000 * tzObj.offset);
    const hours = targetDate.getHours();
    const minutes = targetDate.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    let naturalGreeting = 'Good morning';
    let type: 'Morning' | 'Afternoon' | 'Evening' = 'Morning';
    if (hours >= 12 && hours < 17) {
      naturalGreeting = 'Good afternoon';
      type = 'Afternoon';
    } else if (hours >= 17 || hours < 5) {
      naturalGreeting = 'Good evening';
      type = 'Evening';
    }

    const effectiveGreeting = greetingOverride && greetingOverride !== 'auto'
      ? greetingOverride
      : naturalGreeting;

    return {
      timeStr: `${displayHours}:${minutes} ${ampm}`,
      tzLabel: tzObj.label.split('(')[1]?.replace(')', '') || tzObj.value,
      naturalGreeting,
      effectiveGreeting,
      greetingType: type
    };
  }, [currentTime, selectedTimeZone, greetingOverride]);

  // Load Initial Settings & Profiles
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [prov, profs, hist] = await Promise.all([
        api.getMarketingProviderSettings().catch(() => provider),
        api.getMarketingProfiles().catch(() => []),
        api.getMarketingHistory().catch(() => [])
      ]);
      if (prov) {
        setProvider(prov);
        setEditingProvider(prov);
      }
      if (profs) setSavedProfiles(profs);
      if (hist) setHistory(hist);
    } catch (e) {
      console.error('Failed to load initial marketing data:', e);
    }
  };

  // If a record was passed from Data Explorer, populate it
  useEffect(() => {
    if (selectedRecord) {
      setCustomerName(selectedRecord.contactPerson || selectedRecord.customerName || '');
      setCompanyName(selectedRecord.companyName || selectedRecord.businessName || '');
      if (selectedRecord.industry) {
        const match = PREDEFINED_INDUSTRIES.find(i => selectedRecord.industry?.toLowerCase().includes(i.toLowerCase()));
        if (match) {
          setIndustry(match);
        } else {
          setIndustry('Other');
          setCustomIndustry(selectedRecord.industry);
        }
      }
      if (selectedRecord.location) setLocation(selectedRecord.location);
      if (selectedRecord.website) setWebsite(selectedRecord.website);
    }
  }, [selectedRecord]);

  // Initial trigger generation when component mounts
  useEffect(() => {
    handleGenerate(false);
  }, []);

  // Update active editable content when switching tabs or when outputs change
  useEffect(() => {
    if (!outputs) return;
    switch (activeOutputTab) {
      case 'greeting':
        setEditableContent(outputs.detectedGreeting);
        break;
      case 'intro':
        setEditableContent(outputs.introductionMessage);
        break;
      case 'pitch':
        setEditableContent(outputs.servicePitchMessage);
        break;
      case 'brochure':
        setEditableContent(outputs.brochureSharingMessage);
        break;
      case 'followup':
        setEditableContent(outputs.followupMessage);
        break;
      case 'email':
        setEmailSubject(outputs.emailSubject);
        setEditableContent(outputs.emailBody);
        break;
      case 'whatsapp':
        setEditableContent(outputs.whatsappShortMessage);
        break;
      case 'services':
        setEditableContent(outputs.industryServiceList);
        break;
      default:
        setEditableContent(outputs.introductionMessage);
    }
  }, [activeOutputTab, outputs]);

  const handleGenerate = async (showFeedback = true) => {
    if (!companyName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter the customer company name.' });
      return;
    }

    setIsGenerating(true);
    if (showFeedback) setStatusMessage(null);

    const profile: MarketingCustomerProfile = {
      customerName,
      companyName,
      industry,
      customIndustry: industry === 'Other' ? customIndustry : undefined,
      designation,
      location,
      website,
      requirements,
      preferredChannel,
      messageType,
      language,
      tone,
      timeZone: selectedTimeZone,
      greetingOverride: greetingOverride !== 'auto' ? greetingOverride : undefined
    };

    try {
      const res = await api.generateMarketingMessages(profile, provider);
      setOutputs(res);
      // Reload history in background
      api.getMarketingHistory().then(h => setHistory(h)).catch(() => {});
      if (showFeedback) {
        setStatusMessage({ type: 'success', text: `Generated 8 personalized message formats for ${companyName}.` });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to generate messages.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!companyName.trim()) {
      alert('Please provide a company name to save this customer profile.');
      return;
    }
    setIsSavingProfile(true);
    try {
      const profile: MarketingCustomerProfile = {
        id: selectedProfileId || undefined,
        customerName,
        companyName,
        industry,
        customIndustry: industry === 'Other' ? customIndustry : undefined,
        designation,
        location,
        website,
        requirements,
        preferredChannel,
        messageType,
        language,
        tone,
        timeZone: selectedTimeZone,
        greetingOverride: greetingOverride !== 'auto' ? greetingOverride : undefined
      };
      const saved = await api.saveMarketingProfile(profile);
      setSelectedProfileId(saved.id || '');
      const profs = await api.getMarketingProfiles();
      setSavedProfiles(profs);
      setStatusMessage({ type: 'success', text: `Customer profile for "${companyName}" saved successfully.` });
    } catch (err: any) {
      alert(err?.message || 'Failed to save customer profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLoadProfile = (profId: string) => {
    setSelectedProfileId(profId);
    const p = savedProfiles.find(x => x.id === profId);
    if (!p) return;
    setCustomerName(p.customerName || '');
    setCompanyName(p.companyName || '');
    setIndustry(p.industry || 'Fitness and Gyms');
    setCustomIndustry(p.customIndustry || '');
    setDesignation(p.designation || '');
    setLocation(p.location || '');
    setWebsite(p.website || '');
    setRequirements(p.requirements || '');
    if (p.preferredChannel) setPreferredChannel(p.preferredChannel);
    if (p.messageType) setMessageType(p.messageType);
    if (p.language) setLanguage(p.language);
    if (p.tone) setTone(p.tone);
    if (p.timeZone) setSelectedTimeZone(p.timeZone);
    if (p.greetingOverride) setGreetingOverride(p.greetingOverride);
    setStatusMessage({ type: 'success', text: `Loaded customer profile for "${p.companyName}".` });
  };

  const handleDeleteProfile = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this saved customer profile?')) return;
    try {
      await api.deleteMarketingProfile(id);
      setSavedProfiles(prev => prev.filter(p => p.id !== id));
      if (selectedProfileId === id) setSelectedProfileId('');
    } catch (err: any) {
      alert(err?.message || 'Failed to delete profile');
    }
  };

  const handleSaveProviderSettings = async () => {
    try {
      const res = await api.updateMarketingProviderSettings(editingProvider);
      setProvider(res);
      setShowProviderModal(false);
      setStatusMessage({ type: 'success', text: 'Service provider details updated successfully.' });
      handleGenerate(false);
    } catch (e: any) {
      alert(e?.message || 'Failed to update provider settings');
    }
  };

  const handleCopyContent = () => {
    const textToCopy = activeOutputTab === 'email'
      ? `Subject: ${emailSubject}\n\n${editableContent}`
      : editableContent;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportTxt = () => {
    if (!outputs) return;
    const fileContent = `================================================================================
QUENOXA GLOBAL TECHNOLOGIES — CUSTOMER MARKETING DOSSIER
Generated: ${new Date().toLocaleString()}
Service Provider: ${provider.companyName} (${provider.senderName} | ${provider.phone} | ${provider.website})
================================================================================

TARGET CUSTOMER PROFILE:
Customer Name: ${customerName}
Company Name:  ${companyName}
Industry:      ${industry === 'Other' ? customIndustry : industry}
Designation:   ${designation || 'N/A'}
Location:      ${location}
Website:       ${website || 'None'}
Stated Needs:  ${requirements}
Channel:       ${preferredChannel}
Language:      ${language}
Tone:          ${tone}
Local Time:    ${timeInfo.timeStr} (${timeInfo.tzLabel}) — Greeting: ${outputs.detectedGreeting}

================================================================================
1. RECOMMENDED DIGITAL & AUTOMATION SERVICES:
${outputs.recommendedServices.map((s, i) => `${i + 1}. ${s.name}\n   Benefit: ${s.benefit}\n   Reason:  ${s.reason}`).join('\n\n')}

================================================================================
2. PERSONALIZED GREETING:
${outputs.detectedGreeting}

================================================================================
3. WELCOME & INTRODUCTION MESSAGE:
${outputs.introductionMessage}

================================================================================
4. BENEFIT-FOCUSED SERVICE PITCH:
${outputs.servicePitchMessage}

================================================================================
5. BROCHURE SHARING MESSAGE:
${outputs.brochureSharingMessage}

================================================================================
6. RESPECTFUL FOLLOW-UP MESSAGE:
${outputs.followupMessage}

================================================================================
7. EMAIL VERSION:
Subject: ${outputs.emailSubject}

${outputs.emailBody}

================================================================================
8. SHORT WHATSAPP VERSION (COPY & PASTE):
${outputs.whatsappShortMessage}

================================================================================
Document certified by Quenoxa AI Communications Engine
https://www.quenoxa.com | info@quenoxa.com
================================================================================`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Marketing_Dossier.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = editableContent.trim() ? editableContent.trim().split(/\s+/).length : 0;
  const charCount = editableContent.length;

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1650px] mx-auto min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Sparkles className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Customer Profile Marketing Generator
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300/80">
                  AI + Rule Engine
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
                Generate tailored business introductions, service pitches, WhatsApp scripts & emails based on industry, requirements & local time.
              </p>
            </div>
          </div>
        </div>

        {/* Header Right: Provider Config Badge + Live Time Pill */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Live Customer Time & Greeting Badge */}
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <div className="flex items-center space-x-1.5">
              <span className="font-mono font-bold text-slate-900">{timeInfo.timeStr}</span>
              <span className="text-[11px] text-slate-400">({timeInfo.tzLabel})</span>
              <span className="text-slate-300">·</span>
              <span className="font-bold text-emerald-700">{timeInfo.effectiveGreeting}</span>
            </div>
          </div>

          {/* Service Provider Pill */}
          <button
            onClick={() => setShowProviderModal(true)}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Configure service provider details"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="truncate max-w-[180px]">{provider.companyName}</span>
            <span className="text-emerald-500 text-[10px]">⚙️</span>
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-2xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 ml-4 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Main 2-Column Grid: Left Input Form (5 cols) + Right Output Engine (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: CUSTOMER PROFILE INPUT FORM */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  1. Customer Profile Input
                </h3>
                <p className="text-[11px] text-slate-400">
                  Target prospect details & campaign preferences
                </p>
              </div>
            </div>

            {/* Saved Profile Dropdown */}
            {savedProfiles.length > 0 && (
              <div className="relative">
                <select
                  value={selectedProfileId}
                  onChange={(e) => handleLoadProfile(e.target.value)}
                  className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Load Saved Profile...</option>
                  {savedProfiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.companyName} ({p.customerName || p.industry})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Form Grid */}
          <div className="space-y-4 text-xs font-sans">
            {/* Row: Customer Name & Company Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Customer / Contact Person <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vignesh Kumar"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-900 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Company / Business Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Fitness Studio"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold text-slate-900 transition-all"
                />
              </div>
            </div>

            {/* Row: Industry Selection + Custom Industry if 'Other' */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-700">
                Industry / Business Category <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-900 appearance-none pr-8 cursor-pointer"
                >
                  {PREDEFINED_INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {industry === 'Other' && (
                <div>
                  <input
                    type="text"
                    placeholder="Enter custom industry / domain (e.g. Solar Energy Installation)"
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-emerald-50/40 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-900"
                  />
                </div>
              )}
            </div>

            {/* Row: Designation & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Contact Designation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Managing Director / Founder"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Business Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Coimbatore, Tamil Nadu"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium"
                />
              </div>
            </div>

            {/* Customer Website (optional) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Customer Website <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="https://www.customerbusiness.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                />
              </div>
            </div>

            {/* Customer Stated Requirements */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Customer Requirements & Operational Challenges
              </label>
              <textarea
                rows={3}
                placeholder="Describe current issues, goals, or stated requirements (e.g. needs member management app, wanting to increase inquiries, manual Excel tracking problems)..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 resize-none font-normal leading-relaxed"
              />
            </div>

            {/* Channel, Message Type & Language Options */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {/* Channel */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Channel
                </label>
                <select
                  value={preferredChannel}
                  onChange={(e) => setPreferredChannel(e.target.value as MarketingChannel)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Email">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="LinkedIn">LinkedIn</option>
                </select>
              </div>

              {/* Message Type */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Message Type
                </label>
                <select
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value as MarketingMessageType)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                >
                  <option value="Introduction">Introduction</option>
                  <option value="Service Pitch">Service Pitch</option>
                  <option value="Welcome">Welcome</option>
                  <option value="Brochure Sharing">Brochure Sharing</option>
                  <option value="Follow-up">Follow-up</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as MarketingLanguage)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                >
                  <option value="English">English</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Thanglish">Thanglish</option>
                </select>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as MarketingTone)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
                >
                  <option value="Professional">Professional</option>
                  <option value="Friendly">Friendly</option>
                  <option value="Formal">Formal</option>
                  <option value="Short and Direct">Short & Direct</option>
                </select>
              </div>
            </div>

            {/* Time-Based Personalization Controls */}
            <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Time-Based Personalization</span>
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                  {timeInfo.effectiveGreeting} ({timeInfo.greetingType})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {/* Timezone */}
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Customer Timezone</span>
                  <select
                    value={selectedTimeZone}
                    onChange={(e) => setSelectedTimeZone(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium"
                  >
                    {TIME_ZONES.map(tz => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Greeting Override */}
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">Greeting Selection</span>
                  <select
                    value={greetingOverride}
                    onChange={(e) => setGreetingOverride(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium"
                  >
                    <option value="auto">Auto-Detect ({timeInfo.naturalGreeting})</option>
                    <option value="Good morning">Force "Good morning"</option>
                    <option value="Good afternoon">Force "Good afternoon"</option>
                    <option value="Good evening">Force "Good evening"</option>
                    <option value="Hello">Universal "Hello"</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Form Bottom Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => handleGenerate(true)}
              disabled={isGenerating}
              className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generating Tailored Messages...' : 'Generate AI Marketing Messages'}</span>
            </button>

            <button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 active:scale-98 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center space-x-1.5 cursor-pointer"
              title="Save customer profile for future campaigns"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>{isSavingProfile ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: AI ANALYSIS, SERVICE SELECTION & 8 OUTPUT FORMATS */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-5">
          {/* Top Panel: Dynamic Industry Analysis & Matched Services */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    2. Dynamic Service Selection & Industry Match
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Services tailored for <strong className="text-slate-700">{companyName || 'your customer'}</strong> ({industry === 'Other' ? customIndustry : industry})
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full self-start sm:self-auto">
                Quenoxa 16-Service Catalogue
              </span>
            </div>

            {/* Recommended Services Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {outputs?.recommendedServices?.map((service, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between hover:border-emerald-300 hover:bg-emerald-50/30 transition-all shadow-2xs"
                >
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {service.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                      {service.benefit}
                    </p>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center space-x-1 text-[10px] text-emerald-700 font-medium">
                    <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">{service.reason}</span>
                  </div>
                </div>
              )) || (
                <div className="col-span-2 py-6 text-center text-slate-400 text-xs">
                  Fill in customer details and click generate to review tailored services.
                </div>
              )}
            </div>
          </div>

          {/* Bottom Panel: 8 Tailored Output Formats Engine */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            {/* Output Navigation Tabs (8 distinct formats) */}
            <div className="p-3 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap gap-1.5">
              {[
                { id: 'intro', label: 'A. Introduction', icon: Sparkles },
                { id: 'pitch', label: 'B. Service Pitch', icon: Send },
                { id: 'brochure', label: 'C. Brochure Share', icon: FileText },
                { id: 'followup', label: 'D. Follow-up', icon: Clock },
                { id: 'email', label: 'E. Email Version', icon: Mail },
                { id: 'whatsapp', label: 'F. Short WhatsApp', icon: MessageSquare },
                { id: 'services', label: 'G. Service List', icon: Layers },
                { id: 'greeting', label: 'H. Greeting', icon: HelpCircle }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeOutputTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveOutputTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Output Card Body */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* Optional Email Subject Bar (if in Email mode) */}
              {activeOutputTab === 'email' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email Subject Line:
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold text-slate-900"
                  />
                </div>
              )}

              {/* Editable Text Area for Active Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-700">
                    Personalized Message Content (Editable):
                  </span>
                  <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-mono">
                    <span>{wordCount} words</span>
                    <span>·</span>
                    <span>{charCount} chars</span>
                  </div>
                </div>

                <textarea
                  rows={activeOutputTab === 'whatsapp' || activeOutputTab === 'greeting' ? 6 : 11}
                  value={editableContent}
                  onChange={(e) => setEditableContent(e.target.value)}
                  className="w-full p-4 text-xs sm:text-[13px] bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 leading-relaxed font-sans resize-y shadow-inner"
                  placeholder="Generated message will appear here..."
                />
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center space-x-2">
                  {/* Copy Button */}
                  <button
                    onClick={handleCopyContent}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Message'}</span>
                  </button>

                  {/* Regenerate Button */}
                  <button
                    onClick={() => handleGenerate(true)}
                    disabled={isGenerating}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>Regenerate</span>
                  </button>

                  {/* Export All 8 to TXT */}
                  <button
                    onClick={handleExportTxt}
                    className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer"
                    title="Export complete 8-format dossier as text file"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Export Dossier (.TXT)</span>
                  </button>
                </div>

                {/* Direct Action Link (wa.me or mailto:) */}
                <div className="flex items-center space-x-2">
                  {preferredChannel === 'WhatsApp' ? (
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        activeOutputTab === 'whatsapp' ? editableContent : outputs?.whatsappShortMessage || editableContent
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in WhatsApp</span>
                    </a>
                  ) : (
                    <a
                      href={`mailto:?subject=${encodeURIComponent(emailSubject || 'Digital Opportunities for ' + companyName)}&body=${encodeURIComponent(editableContent)}`}
                      className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Open in Mail</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SAVED CUSTOMER PROFILES & RECENT HISTORY SECTION */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Saved Profiles & Campaign History
              </h3>
              <p className="text-[11px] text-slate-400">
                Quickly load past customer profiles and review generated outreach messages
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-slate-600">
              {savedProfiles.length} saved profile{savedProfiles.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Profiles Table */}
        {savedProfiles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-3">Contact Person</th>
                  <th className="py-2.5 px-3">Industry</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Language</th>
                  <th className="py-2.5 px-3">Tone</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {savedProfiles.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => handleLoadProfile(p.id || '')}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {p.companyName}
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {p.customerName} {p.designation ? `(${p.designation})` : ''}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {p.customIndustry || p.industry}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {p.preferredChannel}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {p.language}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {p.tone}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoadProfile(p.id || '');
                            handleGenerate(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                        >
                          Load & Generate
                        </button>
                        <button
                          onClick={(e) => handleDeleteProfile(p.id || '', e)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100"
                          title="Delete saved profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            No saved profiles yet. Click &quot;Save Profile&quot; in the form above to store customer profiles.
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SERVICE PROVIDER CONFIGURATION MODAL */}
      {/* ========================================================================= */}
      {showProviderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Configure Service Provider
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Used dynamically across all outgoing pitches & messages
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProviderModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Provider Company Name
                </label>
                <input
                  type="text"
                  value={editingProvider.companyName}
                  onChange={(e) => setEditingProvider({ ...editingProvider, companyName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Sender Name / Sign-off Person
                </label>
                <input
                  type="text"
                  value={editingProvider.senderName}
                  onChange={(e) => setEditingProvider({ ...editingProvider, senderName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={editingProvider.phone}
                    onChange={(e) => setEditingProvider({ ...editingProvider, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editingProvider.email}
                    onChange={(e) => setEditingProvider({ ...editingProvider, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={editingProvider.website}
                  onChange={(e) => setEditingProvider({ ...editingProvider, website: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowProviderModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProviderSettings}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
