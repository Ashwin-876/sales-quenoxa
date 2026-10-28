import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ChevronRight,
  Search,
  RefreshCw,
  Megaphone,
  Smartphone,
  BookOpen,
  Settings,
  X,
  Share2,
  Zap,
  ShoppingBag,
  TrendingUp,
  Database,
  Wand2,
  CheckCheck
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

interface CRMLeadItem {
  id: string;
  companyName: string;
  customerName: string;
  phone: string;
  email?: string;
  industry: string;
  designation: string;
  location: string;
  website?: string;
  requirements: string;
}

const DEFAULT_CRM_LEADS: CRMLeadItem[] = [
  {
    id: 'lead-cbe-fit-2',
    companyName: 'Coimbatore Fitness Hub Unit II',
    customerName: 'Ramesh Kumar',
    phone: '+91 98765 43210',
    email: 'ramesh@fitgym64.in',
    industry: 'Fitness and Gyms',
    designation: 'Managing Director',
    location: 'R.S. Puram, Coimbatore',
    website: 'https://fitgym64.in',
    requirements:
      'Looking to automate member renewals, stop front-desk manual registers, and get 20+ fresh gym membership inquiries every week.'
  },
  {
    id: 'lead-anchor-gym',
    companyName: 'Anchor Fitness Gym',
    customerName: 'Priya Sharma',
    phone: '+91 98765 43211',
    email: 'priya@anchorfit.in',
    industry: 'Fitness and Gyms',
    designation: 'Founder & Head Coach',
    location: 'Saibaba Colony, Coimbatore',
    website: 'https://anchorfit.in',
    requirements:
      'Need targeted Meta ads for summer fat-loss bootcamp and Google Maps optimization to rank #1 locally.'
  },
  {
    id: 'lead-arulpower',
    companyName: 'Arulpowergym',
    customerName: 'Arul Prakash',
    phone: '+91 98765 43212',
    email: 'contact@arulpowergym.com',
    industry: 'Fitness and Gyms',
    designation: 'Owner',
    location: 'Gandhipuram, Coimbatore',
    website: 'https://arulpowergym.com',
    requirements:
      'Want automated WhatsApp fee payment reminders and membership renewal tracking software to reduce churn.'
  },
  {
    id: 'lead-boss-fitness',
    companyName: 'Boss Fitness | Unisex gym | Ram nagar',
    customerName: 'Karthik Vel',
    phone: '+91 98765 43213',
    email: 'karthik@bossfitnesscbe.in',
    industry: 'Fitness and Gyms',
    designation: 'Managing Partner',
    location: 'Ram Nagar, Coimbatore',
    website: 'https://bossfitnesscbe.in',
    requirements:
      'Need high-converting landing page and Meta Ads campaign for annual membership drive with QR check-in.'
  },
  {
    id: 'lead-bigmuscles',
    companyName: 'Big Muscles Ladies Gym',
    customerName: 'Sneha R',
    phone: '+91 98765 43214',
    email: 'sneha@bigmusclesladies.in',
    industry: 'Fitness and Gyms',
    designation: 'Center Head',
    location: 'Race Course, Coimbatore',
    website: 'https://bigmusclesladies.in',
    requirements:
      'Looking for female fitness community social media marketing and automated member appointment booking app.'
  }
];

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

  // CRM Leads List & Dropdown State
  const [crmLeads, setCrmLeads] = useState<CRMLeadItem[]>(DEFAULT_CRM_LEADS);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('lead-cbe-fit-2');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [lastSyncedTime, setLastSyncedTime] = useState('Oct 26, 2026, 1:37 PM');
  const [isSyncing, setIsSyncing] = useState(false);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Customer Profile Form State (default initialized to Coimbatore Fitness Hub Unit II)
  const [customerName, setCustomerName] = useState('Ramesh Kumar');
  const [companyName, setCompanyName] = useState('Coimbatore Fitness Hub Unit II');
  const [customerPhone, setCustomerPhone] = useState('+91 98765 43210');
  const [customerEmail, setCustomerEmail] = useState('ramesh@fitgym64.in');
  const [industry, setIndustry] = useState('Fitness and Gyms');
  const [customIndustry, setCustomIndustry] = useState('');
  const [designation, setDesignation] = useState('Managing Director');
  const [location, setLocation] = useState('R.S. Puram, Coimbatore');
  const [website, setWebsite] = useState('https://fitgym64.in');
  const [requirements, setRequirements] = useState(
    'Looking to automate member renewals, stop front-desk manual registers, and get 20+ fresh gym membership inquiries every week.'
  );
  const [preferredChannel, setPreferredChannel] = useState<MarketingChannel>('WhatsApp');
  const [messageType, setMessageType] = useState<MarketingMessageType>('Introduction');
  const [language, setLanguage] = useState<MarketingLanguage>('English');
  const [tone, setTone] = useState<MarketingTone>('Professional');
  const [selectedTimeZone, setSelectedTimeZone] = useState('Asia/Kolkata');
  const [greetingOverride, setGreetingOverride] = useState<string>('auto');

  // Generator & Output State
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputs, setOutputs] = useState<GeneratedMarketingOutputs | null>(null);
  const [activeOutputTab, setActiveOutputTab] = useState<
    'intro' | 'pitch' | 'brochure' | 'followup' | 'email' | 'whatsapp' | 'services' | 'greeting'
  >('intro');
  const [editableContent, setEditableContent] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Catalogue Modal State
  const [showCatalogueModal, setShowCatalogueModal] = useState(false);
  const [catalogueSearch, setCatalogueSearch] = useState('');
  const [allServices, setAllServices] = useState<any[]>([]);

  // Persistence State
  const [savedProfiles, setSavedProfiles] = useState<MarketingCustomerProfile[]>([]);
  const [history, setHistory] = useState<GeneratedMarketingOutputs[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live Local Time Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close customer dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

    const effectiveGreeting =
      greetingOverride && greetingOverride !== 'auto' ? greetingOverride : naturalGreeting;

    return {
      timeStr: `${displayHours}:${minutes} ${ampm}`,
      tzLabel: tzObj.label.split('(')[1]?.replace(')', '') || tzObj.value,
      naturalGreeting,
      effectiveGreeting,
      greetingType: type
    };
  }, [currentTime, selectedTimeZone, greetingOverride]);

  // Load Initial Settings, CRM Records, and Catalogue
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [prov, profs, hist, srvs, recs] = await Promise.all([
        api.getMarketingProviderSettings().catch(() => provider),
        api.getMarketingProfiles().catch(() => []),
        api.getMarketingHistory().catch(() => []),
        api.getMarketingServices().catch(() => []),
        api.getRecords({ limit: 150 }).catch(() => ({ records: [], total: 0 }))
      ]);

      if (prov) {
        setProvider(prov);
        setEditingProvider(prov);
      }
      if (profs) setSavedProfiles(profs);
      if (hist) setHistory(hist);
      if (srvs) setAllServices(srvs);

      // Merge real CRM records if any exist
      if (recs && recs.records && recs.records.length > 0) {
        const mappedRecords: CRMLeadItem[] = recs.records.map((r: ExtractedRecord, idx: number) => ({
          id: r.id || `crm-rec-${idx}`,
          companyName: r.companyName || r.businessName || `Prospect #${idx + 1}`,
          customerName: r.contactPerson || r.customerName || 'Business Owner',
          phone: r.contactNumber || '+91 98765 00000',
          email: r.email,
          industry: r.industry || 'Fitness and Gyms',
          designation: 'Managing Director',
          location: r.location || 'Coimbatore, Tamil Nadu',
          website: r.website || '',
          requirements:
            'Need digital solutions to streamline client acquisition, automated operations, and improve regional brand presence.'
        }));

        // Combine default leads with real extracted records without duplicates
        const combined = [...DEFAULT_CRM_LEADS];
        mappedRecords.forEach(m => {
          if (!combined.some(c => c.companyName.toLowerCase() === m.companyName.toLowerCase())) {
            combined.push(m);
          }
        });
        setCrmLeads(combined);
      }
    } catch (e) {
      console.error('Failed to load initial marketing generator data:', e);
    }
  };

  // If a record was passed from Data Explorer via props
  useEffect(() => {
    if (selectedRecord) {
      setCustomerName(selectedRecord.contactPerson || selectedRecord.customerName || 'Business Owner');
      setCompanyName(selectedRecord.companyName || selectedRecord.businessName || 'Business');
      setCustomerPhone(selectedRecord.contactNumber || '');
      if (selectedRecord.email) setCustomerEmail(selectedRecord.email);
      if (selectedRecord.industry) {
        const match = PREDEFINED_INDUSTRIES.find(i =>
          selectedRecord.industry?.toLowerCase().includes(i.toLowerCase())
        );
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

  // Initial generation on component load
  useEffect(() => {
    handleGenerate(false);
  }, []);

  // Update active editable content when active tab changes or outputs update
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

  // Handle selecting a customer from CRM list
  const handleSelectCustomer = (lead: CRMLeadItem) => {
    setSelectedLeadId(lead.id);
    setCompanyName(lead.companyName);
    setCustomerName(lead.customerName);
    setCustomerPhone(lead.phone);
    setCustomerEmail(lead.email || '');
    if (lead.industry) {
      const match = PREDEFINED_INDUSTRIES.find(i =>
        lead.industry.toLowerCase().includes(i.toLowerCase())
      );
      if (match) {
        setIndustry(match);
      } else {
        setIndustry('Other');
        setCustomIndustry(lead.industry);
      }
    }
    setDesignation(lead.designation || 'Managing Director');
    setLocation(lead.location || 'Coimbatore');
    setWebsite(lead.website || '');
    setRequirements(lead.requirements || '');
    setIsCustomerDropdownOpen(false);

    // Auto-trigger generation for newly selected customer
    triggerCustomerGeneration({
      customerName: lead.customerName,
      companyName: lead.companyName,
      industry: lead.industry,
      designation: lead.designation,
      location: lead.location,
      website: lead.website,
      requirements: lead.requirements
    });
  };

  const triggerCustomerGeneration = async (overrides: Partial<MarketingCustomerProfile>) => {
    setIsGenerating(true);
    const profile: MarketingCustomerProfile = {
      customerName: overrides.customerName || customerName,
      companyName: overrides.companyName || companyName,
      industry: overrides.industry || industry,
      customIndustry: (overrides.industry || industry) === 'Other' ? customIndustry : undefined,
      designation: overrides.designation || designation,
      location: overrides.location || location,
      website: overrides.website || website,
      requirements: overrides.requirements || requirements,
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
      api.getMarketingHistory().then(h => setHistory(h)).catch(() => {});
    } catch (err: any) {
      console.error('Customer generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

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
      api.getMarketingHistory().then(h => setHistory(h)).catch(() => {});
      if (showFeedback) {
        setStatusMessage({
          type: 'success',
          text: `Generated 8 personalized message formats for ${companyName}.`
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to generate messages.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSyncCRM = async () => {
    setIsSyncing(true);
    try {
      const recs = await api.getRecords({ limit: 150 });
      if (recs && recs.records && recs.records.length > 0) {
        const mappedRecords: CRMLeadItem[] = recs.records.map((r: ExtractedRecord, idx: number) => ({
          id: r.id || `crm-rec-${idx}`,
          companyName: r.companyName || r.businessName || `Prospect #${idx + 1}`,
          customerName: r.contactPerson || r.customerName || 'Business Owner',
          phone: r.contactNumber || '+91 98765 00000',
          email: r.email,
          industry: r.industry || 'Fitness and Gyms',
          designation: 'Managing Director',
          location: r.location || 'Coimbatore, Tamil Nadu',
          website: r.website || '',
          requirements:
            'Need digital solutions to streamline client acquisition, automated operations, and improve regional brand presence.'
        }));
        const combined = [...DEFAULT_CRM_LEADS];
        mappedRecords.forEach(m => {
          if (!combined.some(c => c.companyName.toLowerCase() === m.companyName.toLowerCase())) {
            combined.push(m);
          }
        });
        setCrmLeads(combined);
      }
      const now = new Date();
      setLastSyncedTime(
        now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
          ', ' +
          now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      );
      setStatusMessage({ type: 'success', text: 'CRM customer leads synchronized successfully.' });
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: 'Failed to sync CRM leads: ' + e?.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!companyName.trim()) {
      alert('Please provide a company name to save this customer profile.');
      return;
    }
    try {
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
      await api.saveMarketingProfile(profile);
      const profs = await api.getMarketingProfiles();
      setSavedProfiles(profs);
      setStatusMessage({
        type: 'success',
        text: `Customer profile for "${companyName}" saved successfully.`
      });
    } catch (err: any) {
      alert(err?.message || 'Failed to save customer profile');
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
    const textToCopy =
      activeOutputTab === 'email' ? `Subject: ${emailSubject}\n\n${editableContent}` : editableContent;
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
${outputs.recommendedServices
  .map((s, i) => `${i + 1}. ${s.name}\n   Benefit: ${s.benefit}\n   Reason:  ${s.reason}`)
  .join('\n\n')}

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

  // Filtered CRM leads for dropdown search
  const filteredCrmLeads = useMemo(() => {
    if (!customerSearchQuery.trim()) return crmLeads;
    const q = customerSearchQuery.toLowerCase();
    return crmLeads.filter(
      l =>
        l.companyName.toLowerCase().includes(q) ||
        l.customerName.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.email && l.email.toLowerCase().includes(q))
    );
  }, [crmLeads, customerSearchQuery]);

  const selectedLead = useMemo(() => {
    return crmLeads.find(l => l.id === selectedLeadId) || crmLeads[0];
  }, [crmLeads, selectedLeadId]);

  // Service Card Category Icon Helper
  const getServiceIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('mobile') || lower.includes('app')) return <Smartphone className="w-4 h-4 text-emerald-600" />;
    if (lower.includes('meta') || lower.includes('ads') || lower.includes('social'))
      return <Megaphone className="w-4 h-4 text-emerald-600" />;
    if (lower.includes('website') || lower.includes('prompt')) return <Globe className="w-4 h-4 text-emerald-600" />;
    if (lower.includes('profile') || lower.includes('google') || lower.includes('gbp'))
      return <MapPin className="w-4 h-4 text-emerald-600" />;
    if (lower.includes('e-commerce') || lower.includes('store'))
      return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
    if (lower.includes('automation') || lower.includes('api')) return <Zap className="w-4 h-4 text-emerald-600" />;
    if (lower.includes('crm') || lower.includes('erp') || lower.includes('software'))
      return <Database className="w-4 h-4 text-emerald-600" />;
    if (lower.includes('dashboard') || lower.includes('analytics'))
      return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    return <Sparkles className="w-4 h-4 text-emerald-600" />;
  };

  // Word and character counts
  const wordCount = editableContent.trim() ? editableContent.trim().split(/\s+/).length : 0;
  const charCount = editableContent.length;

  // WhatsApp click-to-chat URL
  const whatsappUrl = useMemo(() => {
    const rawNum = customerPhone.replace(/[^0-9]/g, '');
    const cleanNum = rawNum.startsWith('91') ? rawNum : `91${rawNum}`;
    const textParam = encodeURIComponent(
      activeOutputTab === 'whatsapp' ? editableContent : outputs?.whatsappShortMessage || editableContent
    );
    return `https://wa.me/${cleanNum}?text=${textParam}`;
  }, [customerPhone, activeOutputTab, editableContent, outputs]);

  // Gmail Web Composer direct URL for Chrome/Browser
  const gmailUrl = useMemo(() => {
    const to = encodeURIComponent((customerEmail || '').trim());
    const subjectText =
      activeOutputTab === 'email' && emailSubject
        ? emailSubject
        : outputs?.emailSubject || `Business Inquiry: QUENOXA GLOBAL TECHNOLOGIES x ${companyName || 'Business'}`;
    const bodyText =
      activeOutputTab === 'email'
        ? editableContent
        : outputs?.emailBody || editableContent;
    const su = encodeURIComponent(subjectText);
    const body = encodeURIComponent(bodyText);
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${body}`;
  }, [customerEmail, companyName, activeOutputTab, emailSubject, editableContent, outputs]);

  const handleOpenGmail = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!customerEmail.trim()) {
      const emailInput = window.prompt(
        'Please enter the recipient customer email address for Gmail:',
        'contact@' + (companyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company') + '.com'
      );
      if (emailInput && emailInput.trim()) {
        setCustomerEmail(emailInput.trim());
        const to = encodeURIComponent(emailInput.trim());
        const subjectText =
          activeOutputTab === 'email' && emailSubject
            ? emailSubject
            : outputs?.emailSubject || `Business Inquiry: QUENOXA GLOBAL TECHNOLOGIES x ${companyName || 'Business'}`;
        const bodyText =
          activeOutputTab === 'email'
            ? editableContent
            : outputs?.emailBody || editableContent;
        const su = encodeURIComponent(subjectText);
        const body = encodeURIComponent(bodyText);
        const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${body}`;
        window.open(url, '_blank');
        e.preventDefault();
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-5 max-w-[1650px] mx-auto min-h-screen font-sans text-slate-900">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5 sm:mt-0">
            <Sparkles className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Customer Profile Marketing Generator
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                AI + RULE ENGINE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
              Generate tailored business introductions, service pitches, WhatsApp scripts & emails based on industry,
              requirements & local time.
            </p>
          </div>
        </div>

        {/* Right Header Widgets */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Time & Greeting Pill */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">
              {timeInfo.timeStr} (IST, GMT+5:30)
            </span>
            <span className="font-semibold text-emerald-700 ml-1">
              {timeInfo.effectiveGreeting}
            </span>
          </div>

          {/* Quenoxa Provider Settings Button */}
          <button
            onClick={() => setShowProviderModal(true)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Configure service provider details"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="truncate max-w-[170px] font-medium">{provider.companyName}</span>
            <Settings className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 ml-0.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CRM CONNECTION & CUSTOMER DATA SYNC BANNER */}
      {/* ========================================================================= */}
      <div className="w-full rounded-xl bg-emerald-50/70 border border-emerald-200/80 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">
              CRM connected · Customer data sync enabled
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              You can select a customer from CRM. All details will be auto-filled and service recommendations will be
              customized.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>Last synced: {lastSyncedTime}</span>
          </div>
          <button
            onClick={handleSyncCRM}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-xs font-semibold text-emerald-800 flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync Now</span>
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

      {/* ========================================================================= */}
      {/* 3. MAIN 2-COLUMN LAYOUT */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================================= */}
        {/* LEFT COLUMN: 1. CUSTOMER PROFILE INPUT */}
        {/* ======================================================================= */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Customer Profile Input</h2>
                <p className="text-[11px] text-slate-500">Select a customer from CRM and review their details</p>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              {crmLeads.length} leads available
            </span>
          </div>

          {/* Customer CRM Selector Dropdown */}
          <div className="space-y-1.5" ref={customerDropdownRef}>
            <label className="block text-xs font-semibold text-slate-700">
              Select customer from CRM <span className="text-rose-500">*</span>
            </label>

            <div className="relative">
              {/* Trigger Input */}
              <div
                onClick={() => setIsCustomerDropdownOpen(prev => !prev)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-emerald-400 transition-colors"
              >
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-700 truncate font-medium">
                    {companyName ? `${companyName} (${customerName})` : 'Search by business name, contact, phone or email...'}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCustomerDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Dropdown Menu */}
              {isCustomerDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-72 overflow-y-auto p-1.5 space-y-1">
                  <div className="p-1.5 border-b border-slate-100 sticky top-0 bg-white">
                    <input
                      type="text"
                      placeholder="Type to filter prospects..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      autoFocus
                    />
                  </div>

                  {filteredCrmLeads.map((lead) => {
                    const isSelected = lead.id === selectedLeadId;
                    return (
                      <div
                        key={lead.id}
                        onClick={() => handleSelectCustomer(lead)}
                        className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-50/80 border border-emerald-300'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 overflow-hidden">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-bold text-slate-800 truncate">
                              {lead.companyName}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {lead.customerName} {lead.phone ? `· ${lead.phone}` : ''}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 ml-2">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Industry Selection with Synced Badge */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Industry / Business Category <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-medium rounded-md border border-emerald-200 flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5" />
                  Synced from CRM
                </span>
                <button
                  type="button"
                  onClick={() => setIsCustomerDropdownOpen(true)}
                  className="text-[11px] text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Change customer
                </button>
              </div>
            </div>

            <div className="relative">
              <select
                value={industry}
                onChange={(e) => {
                  setIndustry(e.target.value);
                  handleGenerate(false);
                }}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-900 appearance-none pr-8 cursor-pointer"
              >
                {PREDEFINED_INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>

            {industry === 'Other' && (
              <input
                type="text"
                placeholder="Enter custom industry & business type..."
                value={customIndustry}
                onChange={(e) => setCustomIndustry(e.target.value)}
                className="w-full mt-2 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            )}
          </div>

          {/* Row: Contact Designation & Business Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Contact Designation</label>
              <input
                type="text"
                placeholder="e.g. Managing Director"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Business Location</label>
              <input
                type="text"
                placeholder="e.g. R.S. Puram, Coimbatore"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Row: Customer Email & Customer Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Customer Email <span className="text-slate-400 font-normal">(for Direct Gmail)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="e.g. ramesh@fitgym64.in"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-900"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Customer Phone <span className="text-slate-400 font-normal">(for WhatsApp)</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-900"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Customer Website (optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Customer Website <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="https://fitgym64.in"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-900"
              />
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Customer Requirements & Operational Challenges */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Customer Requirements & Operational Challenges
            </label>
            <textarea
              rows={3}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="State customer business pain points, operational challenges, or requested services..."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-900 leading-relaxed"
            />
          </div>

          {/* Bottom 4-Select Inline Bar: CHANNEL, MESSAGE TYPE, LANGUAGE, TONE */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 border-t border-slate-100">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                CHANNEL
              </label>
              <select
                value={preferredChannel}
                onChange={(e) => setPreferredChannel(e.target.value as MarketingChannel)}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Email">Email</option>
                <option value="SMS">SMS</option>
                <option value="LinkedIn">LinkedIn</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                MESSAGE TYPE
              </label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as MarketingMessageType)}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Introduction">Introduction</option>
                <option value="Service Pitch">Service Pitch</option>
                <option value="Brochure Sharing">Brochure Sharing</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Welcome">Welcome</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                LANGUAGE
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as MarketingLanguage)}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="English">English</option>
                <option value="Tamil">Tamil</option>
                <option value="Thanglish">Thanglish</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                TONE
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as MarketingTone)}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Professional">Professional</option>
                <option value="Friendly">Friendly</option>
                <option value="Formal">Formal</option>
                <option value="Short and Direct">Short and Direct</option>
              </select>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: 2. DYNAMIC SERVICES & AI GENERATED CONTENT */}
        {/* ======================================================================= */}
        <div className="lg:col-span-7 space-y-5">
          {/* ===================================================================== */}
          {/* TOP CARD: 2. DYNAMIC SERVICE SELECTION & INDUSTRY MATCH */}
          {/* ===================================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Dynamic Service Selection & Industry Match
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Services tailored for <span className="font-semibold text-slate-700">{companyName || 'Prospect'}</span> ({industry})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCatalogueModal(true)}
                className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Quenoxa 16-Service Catalogue</span>
              </button>
            </div>

            {/* 2x2 Grid of 4 Tailored Services */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(outputs?.recommendedServices && outputs.recommendedServices.length > 0
                ? outputs.recommendedServices
                : [
                    {
                      name: 'Mobile App Development',
                      benefit:
                        'Member management mobile app with automated membership renewals, QR check-in, and workout schedules.',
                      reason: 'Eliminates front-desk chaos and drives member retention through mobile notifications.'
                    },
                    {
                      name: 'Meta Ads (Facebook and Instagram)',
                      benefit:
                        'Targeted local lead generation campaigns capturing fitness inquiries across Coimbatore & surrounding pincodes.',
                      reason: 'Brings a consistent flow of motivated walking inquiries into your facility daily.'
                    },
                    {
                      name: 'Custom Website Development',
                      benefit:
                        'High-speed fitness club landing page showcasing training facilities, trainer profiles, and membership pricing.',
                      reason: 'Establishes top-tier digital credibility and direct WhatsApp tour booking.'
                    },
                    {
                      name: 'Google Business Profile Optimization',
                      benefit:
                        'Local search and Google Maps optimization to rank #1 when prospective members search "gym near me".',
                      reason: 'Captures high-intent local footfall without ongoing advertising costs.'
                    }
                  ]
              )
                .slice(0, 4)
                .map((srv, index) => (
                  <div
                    key={srv.name}
                    className="rounded-xl border border-slate-200/90 bg-white p-3.5 hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <div className="p-1 rounded-md bg-slate-100 shrink-0">
                          {getServiceIcon(srv.name)}
                        </div>
                        <h4 className="font-bold text-xs text-slate-800 truncate">{srv.name}</h4>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed mt-2 line-clamp-2">
                        {srv.benefit}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center space-x-1.5 text-[11px] font-medium text-emerald-800 bg-emerald-50/70 px-2 py-1 rounded-md border border-emerald-200/60 truncate">
                      <Check className="w-3 h-3 text-emerald-600 shrink-0 stroke-[2.5]" />
                      <span className="truncate">{srv.reason}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* BOTTOM CARD: 8 FORMAT TABS & AI GENERATED CONTENT */}
          {/* ===================================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            {/* 8 Format Tabs (2 Rows of 4) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setActiveOutputTab('intro')}
                className={`px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeOutputTab === 'intro'
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A. Introduction</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveOutputTab('pitch')}
                className={`px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeOutputTab === 'pitch'
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>B. Service Pitch</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveOutputTab('brochure')}
                className={`px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeOutputTab === 'brochure'
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>C. Brochure Share</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveOutputTab('followup')}
                className={`px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeOutputTab === 'followup'
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>D. Follow-up</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveOutputTab('email')}
                className={`px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeOutputTab === 'email'
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>E. Email Version</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveOutputTab('whatsapp')}
                className={`px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeOutputTab === 'whatsapp'
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>F. Short WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveOutputTab('services')}
                className={`px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeOutputTab === 'services'
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>G. Service List</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveOutputTab('greeting')}
                className={`px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeOutputTab === 'greeting'
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>H. Greeting</span>
              </button>
            </div>

            {/* Generated Content Sub-Header & Generate Button */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Generated Content</h3>
                  <p className="text-[11px] text-slate-500">
                    Tailored message based on the selected customer and recommended services.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleGenerate(true)}
                disabled={isGenerating}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Generating...' : 'Generate Content'}</span>
              </button>
            </div>

            {/* Content Display / Editor */}
            {isGenerating ? (
              <div className="min-h-[220px] rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-slate-500 space-y-2 p-6">
                <Sparkles className="w-8 h-8 text-emerald-600 animate-spin" />
                <p className="text-xs font-semibold text-slate-700">Synthesizing personalized outreach...</p>
                <p className="text-[11px] text-slate-400">
                  Selecting services, determining local time & formatting for {preferredChannel}
                </p>
              </div>
            ) : editableContent ? (
              <div className="space-y-3">
                {/* If Email Tab: Show Subject Line input & Direct Gmail Launch Banner */}
                {activeOutputTab === 'email' && (
                  <div className="space-y-2 p-3.5 rounded-xl bg-red-50/50 border border-red-200/70">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-2 text-red-950 font-bold">
                        <Mail className="w-4 h-4 text-red-600" />
                        <span>Direct Gmail Outreach (Chrome Web Composer)</span>
                      </div>
                      <a
                        href={gmailUrl}
                        onClick={handleOpenGmail}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
                        title="Opens mail.google.com in Chrome with recipient, subject and message body ready to send"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Open in Gmail (Direct)</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                      <div className="sm:col-span-5 space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                          Recipient Customer Email
                        </label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="e.g. ramesh@fitgym64.in"
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                      </div>

                      <div className="sm:col-span-7 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                            Email Subject Line
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(emailSubject);
                              alert('Email subject copied!');
                            }}
                            className="text-red-700 hover:underline flex items-center gap-1 font-semibold text-[10px]"
                          >
                            <Copy className="w-3 h-3" />
                            Copy
                          </button>
                        </div>
                        <input
                          type="text"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Editable Textarea */}
                <div className="relative">
                  <textarea
                    rows={8}
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                    className="w-full p-4 text-xs font-mono sm:font-sans bg-slate-50/40 border border-slate-200 rounded-xl text-slate-800 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-y"
                    placeholder="Generated message content will appear here..."
                  />
                  <div className="absolute right-3 top-3 text-[10px] font-semibold text-slate-400 bg-white/90 px-2 py-0.5 rounded-md border border-slate-200">
                    Editable Text
                  </div>
                </div>

                {/* Bottom Controls Bar: Counters & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">{charCount}</span> characters
                    <span>·</span>
                    <span className="font-semibold text-slate-700">{wordCount}</span> words
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyContent}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy Message</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGenerate(true)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Regenerate</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5 text-slate-500" />
                      <span>Save Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportTxt}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Export TXT</span>
                    </button>

                    {/* Direct Open in Gmail Action Button */}
                    <a
                      href={gmailUrl}
                      onClick={handleOpenGmail}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      title="Directly open Gmail in Chrome with pre-filled recipient, subject and message content"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Open in Gmail</span>
                    </a>

                    {/* Direct WhatsApp Action Button */}
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      title="Open WhatsApp Click-to-Chat"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Open WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="min-h-[220px] rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="max-w-md">
                  <p className="text-xs font-semibold text-slate-700">
                    Click "Generate Content" to create a personalized introduction, service pitch, WhatsApp message and more for this customer.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Outputs are customized according to Quenoxa's 16 services, customer location, and local time greeting.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: QUENOXA 16-SERVICE CATALOGUE */}
      {/* ========================================================================= */}
      {showCatalogueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    QUENOXA GLOBAL TECHNOLOGIES — 16 Service Catalogue
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official enterprise catalogue used by AI for dynamic customer matching
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCatalogueModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search catalogue by service name, category, or target industry..."
                  value={catalogueSearch}
                  onChange={(e) => setCatalogueSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Modal Service Grid */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allServices
                  .filter(
                    s =>
                      !catalogueSearch ||
                      s.name.toLowerCase().includes(catalogueSearch.toLowerCase()) ||
                      s.category.toLowerCase().includes(catalogueSearch.toLowerCase()) ||
                      (s.suitedIndustries &&
                        s.suitedIndustries.some((i: string) =>
                          i.toLowerCase().includes(catalogueSearch.toLowerCase())
                        ))
                  )
                  .map((srv: any, idx: number) => (
                    <div
                      key={srv.id || idx}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-colors flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                            {srv.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">#{idx + 1}</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 mt-2">{srv.name}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed mt-1">
                          {srv.description}
                        </p>
                      </div>

                      {srv.outcomes && (
                        <div className="space-y-1 pt-2 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Key Outcomes:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {srv.outcomes.map((o: string, oi: number) => (
                              <span
                                key={oi}
                                className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium"
                              >
                                ✓ {o}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>Default provider: {provider.companyName}</span>
              <button
                onClick={() => setShowCatalogueModal(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs"
              >
                Close Catalogue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: PROVIDER SETTINGS CONFIGURATION */}
      {/* ========================================================================= */}
      {showProviderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Service Provider Configuration</h3>
                  <p className="text-[11px] text-slate-500">Configure Quenoxa sender credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowProviderModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-sans">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Provider Company Name</label>
                <input
                  type="text"
                  value={editingProvider.companyName}
                  onChange={(e) => setEditingProvider({ ...editingProvider, companyName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sender Representative Name</label>
                <input
                  type="text"
                  value={editingProvider.senderName}
                  onChange={(e) => setEditingProvider({ ...editingProvider, senderName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={editingProvider.email}
                    onChange={(e) => setEditingProvider({ ...editingProvider, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editingProvider.phone}
                    onChange={(e) => setEditingProvider({ ...editingProvider, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Website</label>
                <input
                  type="text"
                  value={editingProvider.website}
                  onChange={(e) => setEditingProvider({ ...editingProvider, website: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end space-x-2">
              <button
                onClick={() => setShowProviderModal(false)}
                className="px-4 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProviderSettings}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs"
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
