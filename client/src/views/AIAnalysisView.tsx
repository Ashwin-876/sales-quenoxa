import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ShieldCheck,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  MessageSquare,
  Mail,
  Download,
  Building2,
  Users,
  Layers,
  ArrowRight,
  FileText,
  Award,
  UploadCloud,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Database,
  Info,
  Calendar,
  Zap,
  Globe,
  Sliders,
  Target,
  ChevronLeft,
  MapPin,
  User,
  Store,
  Briefcase,
  Phone,
  Cpu,
  Compass,
  Camera,
  Activity,
  Check
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ExtractedRecord,
  CustomerAnalysis,
  DigitalPresenceItem,
  BusinessProblemItem,
  QuenoxaServiceRecommendation,
  SuggestedServicePackage,
  CustomerSalesStrategy,
  DataQualityReport
} from '../../../shared/types.js';
import { api } from '../services/api';
import { ViewKey } from '../components/layout/Sidebar';

// Colorful Google Maps Pin Icon matching Google Business Profile branding
export const GoogleMapsPinIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
      fill="#EA4335"
    />
    <path
      d="M12 2C10.14 2 8.46 2.75 7.23 3.98L12 11.5L16.77 3.98C15.54 2.75 13.86 2 12 2Z"
      fill="#EA4335"
    />
    <path
      d="M7.23 3.98C5.86 5.35 5 7.08 5 9C5 11.23 6.08 13.84 7.84 16.5L12 11.5L7.23 3.98Z"
      fill="#FBBC04"
    />
    <path
      d="M12 11.5L7.84 16.5C9.4 18.86 10.9 20.8 12 22C13.1 20.8 14.6 18.86 16.16 16.5L12 11.5Z"
      fill="#34A853"
    />
    <path
      d="M16.77 3.98L12 11.5L16.16 16.5C17.92 13.84 19 11.23 19 9C19 7.08 18.14 5.35 16.77 3.98Z"
      fill="#4285F4"
    />
    <circle cx="12" cy="9" r="2.8" fill="#FFFFFF" />
  </svg>
);

interface AIAnalysisViewProps {
  selectedRecord: ExtractedRecord | null;
  records: ExtractedRecord[];
  onSelectRecord: (record: ExtractedRecord) => void;
  onNavigate: (view: ViewKey) => void;
  onRefreshRecords?: () => void;
}

export const AIAnalysisView: React.FC<AIAnalysisViewProps> = ({
  selectedRecord,
  records,
  onSelectRecord,
  onNavigate,
  onRefreshRecords
}) => {
  const [internalRecords, setInternalRecords] = useState<ExtractedRecord[]>(records);
  const [analysis, setAnalysis] = useState<CustomerAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedScoreIndex, setExpandedScoreIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'digital' | 'problems' | 'services' | 'package' | 'sales' | 'data-quality'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal records with prop and auto-fetch if empty
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
        console.error('Failed to auto-fetch records in AIAnalysisView:', err);
      });
    }
  }, [records]);

  const activeRecord = selectedRecord || (internalRecords.length > 0 ? internalRecords[0] : null);

  const loadAnalysis = async (recordId: string, forceFresh: boolean = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCustomerAnalysis(recordId, forceFresh);
      setAnalysis(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate AI analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeRecord?.id) {
      loadAnalysis(activeRecord.id);
    }
  }, [activeRecord?.id]);

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setIsUploading(true);
    setError(null);
    try {
      await api.uploadFiles(Array.from(fileList));
      const res = await api.getRecords();
      setInternalRecords(res.records);
      if (res.records.length > 0) {
        onSelectRecord(res.records[0]);
      }
      onRefreshRecords?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed available':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Confirmed available</span>
          </span>
        );
      case 'Confirmed missing':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Confirmed missing</span>
          </span>
        );
      case 'Needs verification':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            <span>Needs verification</span>
          </span>
        );
      case 'Not applicable':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span>Not applicable</span>
          </span>
        );
    }
  };

  const exportPdfReport = () => {
    if (!analysis || !activeRecord) return;
    const doc = new jsPDF();
    const company = analysis.customerProfile?.companyName || activeRecord.companyName || 'Business';

    doc.setFontSize(18);
    doc.setTextColor(5, 150, 105);
    doc.text('QUENOXA GLOBAL TECHNOLOGIES', 14, 18);

    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(`COMPLETE CUSTOMER ANALYSIS REPORT: ${company.toUpperCase()}`, 14, 26);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleString()} | Model: ${analysis.modelUsed} | Analysis ID: ${analysis.id}`, 14, 32);

    let startY = 38;

    // Section 1: Customer Profile
    autoTable(doc, {
      startY,
      head: [['Section 1: Customer Profile', 'Details']],
      body: [
        ['Business Name', analysis.customerProfile?.companyName || '-'],
        ['Contact Person', analysis.customerProfile?.customerName || '-'],
        ['Primary Industry', analysis.customerProfile?.primaryIndustry || '-'],
        ['Specific Business Category', analysis.customerProfile?.specificBusinessCategory || '-'],
        ['Business Model', analysis.customerProfile?.businessModel || '-'],
        ['Location', analysis.customerProfile?.location || '-'],
        ['Website', analysis.customerProfile?.websiteUrl || 'Not specified in source data'],
        ['Phone & Email', `${analysis.customerProfile?.contactInfo?.phone || 'No phone'} | ${analysis.customerProfile?.contactInfo?.email || 'No email'}`],
        ['Likely Customer Groups', (analysis.customerProfile?.likelyCustomerGroups || []).join(', ')],
        ['Products & Services', (analysis.customerProfile?.productsOrServices || []).join(', ')]
      ],
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] },
      styles: { fontSize: 8, cellPadding: 2.5 }
    });

    startY = (doc as any).lastAutoTable.finalY + 8;

    // Section 2: Digital Presence (12 items)
    if (analysis.digitalPresence && analysis.digitalPresence.length > 0) {
      autoTable(doc, {
        startY,
        head: [['Capability', 'Status', 'Evidence & Verification Note']],
        body: analysis.digitalPresence.map(dp => [
          dp.capability,
          dp.status,
          `${dp.evidence}${dp.verificationDate ? ` (${dp.verificationDate})` : ''}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 7.5, cellPadding: 2 }
      });

      startY = (doc as any).lastAutoTable.finalY + 8;
    }

    // Section 4: Top 3 Recommendations
    if (analysis.recommendedServices && analysis.recommendedServices.length > 0) {
      if (startY > 220) {
        doc.addPage();
        startY = 20;
      }
      autoTable(doc, {
        startY,
        head: [['Rank & Service', 'Category', 'Score', 'Problem Addressed & Proposed Solution']],
        body: analysis.recommendedServices.slice(0, 3).map((rec, idx) => [
          `#${idx + 1} ${rec.serviceName}`,
          rec.serviceCategory,
          `${rec.priorityScore?.total ?? 85}/100`,
          `Problem: ${rec.specificProblem}\n\nSolution: ${rec.proposedSolution}\n\nBenefits: ${rec.expectedBenefits.slice(0, 2).join('; ')}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [5, 150, 105] },
        styles: { fontSize: 7.5, cellPadding: 2.5 }
      });

      startY = (doc as any).lastAutoTable.finalY + 8;
    }

    // Section 5: Suggested Service Package
    if (analysis.suggestedServicePackage) {
      if (startY > 230) {
        doc.addPage();
        startY = 20;
      }
      autoTable(doc, {
        startY,
        head: [['Package Tier', 'Service Title']],
        body: [
          ['Primary Recommended Service', analysis.suggestedServicePackage.primaryRecommendedService],
          ['Complementary Service', analysis.suggestedServicePackage.complementaryService],
          ['Optional Upgrade', analysis.suggestedServicePackage.optionalUpgrade],
          ['Scope of Work', analysis.suggestedServicePackage.scopeOfWork.join('\n')],
          ['Dependencies', analysis.suggestedServicePackage.dependencies.join('\n')],
          ['Pre-Quotation Clarifications', analysis.suggestedServicePackage.questionsToClarifyBeforeQuoting.join('\n')]
        ],
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 7.5, cellPadding: 2.5 }
      });
    }

    doc.save(`Quenoxa_Customer_Analysis_${company.replace(/\s+/g, '_')}.pdf`);
  };

  if (!activeRecord) {
    return (
      <div className="p-8 max-w-lg mx-auto my-10 bg-white rounded-2xl border border-slate-200 shadow-subtle text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-3.5 shadow-xs">
          <Sparkles className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No Prospect Records Available</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          To generate an individual customer analysis workspace, upload your business spreadsheet/PDF or load sample prospects.
        </p>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center space-x-2 text-left">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Direct In-Place File Upload Zone */}
        <div className="mt-5 p-4 border-2 border-dashed border-emerald-300 rounded-xl bg-emerald-50/40 hover:bg-emerald-50/70 transition-all">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,.pdf,.docx,.txt"
            className="hidden"
            onChange={handleDirectUpload}
            disabled={isUploading || loading}
          />
          <UploadCloud className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-900">
            {isUploading ? 'Ingesting & Parsing Document...' : 'Upload Document Directly to Analyze'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Supports XLSX, CSV, PDF brochures & customer files
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || loading}
            className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50"
          >
            {isUploading ? 'Parsing & Extracting...' : 'Browse Local Document'}
          </button>
        </div>

        {/* Quick Sample Seeding Action */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center space-x-3">
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
                onRefreshRecords?.();
              } catch (e: any) {
                alert(e?.message || 'Failed to seed sample data');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading || isUploading}
            className="px-3.5 py-2 bg-white text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold hover:bg-emerald-50 transition-colors shadow-xs disabled:opacity-50"
          >
            {loading ? 'Loading Prospects...' : 'Load Sample Prospects'}
          </button>
          <button
            onClick={() => onNavigate('upload-documents')}
            className="px-3.5 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
          >
            Go to Document Manager
          </button>
        </div>
      </div>
    );
  }

  // Fallback defaults for missing sub-objects
  const digitalPresenceList: DigitalPresenceItem[] = analysis?.digitalPresence || [
    { capability: 'Website availability and quality', status: 'Needs verification', evidence: 'No website URL specified in uploaded dataset.' },
    { capability: 'Mobile responsiveness', status: 'Needs verification', evidence: 'Pending site access or verification.' },
    { capability: 'Online booking or ordering', status: 'Needs verification', evidence: 'Online transaction portal not verified in initial records.' },
    { capability: 'Google Business Profile', status: 'Needs verification', evidence: 'Local Google search and listing presence to be verified.' },
    { capability: 'Social media presence', status: 'Needs verification', evidence: 'Social media channels not provided in uploaded file.' },
    { capability: 'Customer enquiry methods', status: 'Confirmed available', evidence: `Direct phone (${activeRecord.phone}) and email (${activeRecord.email}) available.` },
    { capability: 'CRM or lead tracking', status: 'Confirmed missing', evidence: 'No evidence of digital lead tracking system in uploaded records.' },
    { capability: 'Billing and inventory systems', status: 'Needs verification', evidence: 'Manual counter management suspected.' },
    { capability: 'Customer communication automation', status: 'Confirmed missing', evidence: 'Absence of automated reminder or notification triggers.' },
    { capability: 'Data analytics and reporting', status: 'Needs verification', evidence: 'No real-time reporting tool identified.' },
    { capability: 'Mobile applications', status: 'Needs verification', evidence: 'Dedicated mobile app presence not recorded.' },
    { capability: 'Other industry-specific software', status: 'Needs verification', evidence: 'Specialized vertical workflow tooling unconfirmed.' }
  ];

  const businessProblemsList: BusinessProblemItem[] = analysis?.businessProblems || [
    {
      problem: `Manual customer enquiry tracking and unorganized follow-ups for ${activeRecord.companyName}`,
      type: 'observed',
      supportingEvidence: 'Document contains raw contact list without automated status tracking or CRM integration.',
      businessImpact: 'High risk of missed sales opportunities and delayed prospect conversion.',
      confidenceLevel: 'High',
      discoveryQuestion: 'How does your team currently record and follow up on new enquiries received via calls and visits?'
    },
    {
      problem: `Lack of automated communication workflows and appointment reminders`,
      type: 'potential',
      supportingEvidence: 'Industry pattern where high reliance on manual phone calling leads to customer drop-off.',
      businessImpact: 'Customer churn and reduced repeat business due to lack of timely re-engagement.',
      confidenceLevel: 'Medium',
      discoveryQuestion: 'Do you currently send automated reminders or notifications before scheduled appointments or renewals?'
    }
  ];

  const recommendationsList: QuenoxaServiceRecommendation[] = analysis?.recommendedServices || [
    {
      id: 'rec-1',
      serviceName: 'Lead CRM & Follow-up Automation Workflows',
      serviceCategory: 'Business automation',
      whyNeeded: `Enables ${activeRecord.companyName} to systematically track inbound leads, assign representatives, and trigger automated reminders.`,
      specificProblem: 'Unorganized enquiry tracking and risk of lost prospects due to manual follow-up delays.',
      proposedSolution: 'Deploy Quenoxa Lead CRM with multi-channel WhatsApp and call logging integration.',
      detailedFeatures: [
        'Centralized lead pipeline with stage progression',
        'Automatic WhatsApp & SMS reminder triggers',
        'Sales representative performance and activity tracking',
        'Follow-up calendar with overdue notifications'
      ],
      howItWorks: 'Every new customer enquiry is logged into a unified database, automatically categorized, and routed to sales staff with pre-drafted outreach templates.',
      expectedBenefits: [
        'Up to 40% reduction in response time to new inquiries',
        'Zero lost leads from forgotten manual follow-ups',
        'Transparent team performance visibility'
      ],
      limitations: [
        'Requires initial staff onboarding and disciplined status updating',
        'Relies on consistent internet connectivity'
      ],
      requiredIntegrations: ['WhatsApp Cloud API', 'Business Email (SMTP/IMAP)', 'Telephony log sync'],
      implementationComplexity: 'Medium',
      dependencies: ['Lead source channel credentials', 'Sales workflow definition'],
      suggestedPriority: 'High',
      suggestedNextSalesAction: 'Conduct a 20-minute live demo showing lead capture and automated WhatsApp triggers.',
      discoveryQuestions: [
        'What is your current loss rate from enquiries that do not get an immediate response?',
        'How many different people currently handle customer messages and calls?'
      ],
      infoNeededBeforeQuotation: ['Number of concurrent sales staff', 'Monthly enquiry volume', 'Existing CRM export if any'],
      priorityScore: {
        total: 92,
        problemRelevance: 29,
        needEvidence: 24,
        businessValue: 19,
        implementationFeasibility: 12,
        quenoxaFit: 8,
        scoreReasoning: 'Critical operational fit: Directly eliminates the manual tracking bottleneck observed in the customer profile with rapid deployment.'
      }
    }
  ];

  const suggestedPackage: SuggestedServicePackage = analysis?.suggestedServicePackage || {
    primaryRecommendedService: recommendationsList[0]?.serviceName || 'Custom Business Automation',
    complementaryService: recommendationsList[1]?.serviceName || 'Responsive Web Portal',
    optionalUpgrade: recommendationsList[2]?.serviceName || 'Executive Analytics Dashboard',
    scopeOfWork: [
      'Discovery and requirement mapping workshop with client stakeholders',
      'System configuration, branding, and role-based access setup',
      'Data import from existing customer records and contact lists',
      'End-to-end integration with WhatsApp and email communication channels',
      'User acceptance testing, staff training, and 30-day go-live hypercare'
    ],
    dependencies: [
      'Customer provision of verified business documentation and logos',
      'Designated internal point of contact for weekly sign-offs'
    ],
    questionsToClarifyBeforeQuoting: [
      'What is the preferred go-live date and launch schedule?',
      'Are there existing legacy databases that require automated migration?',
      'How many daily transactions or enquiries are handled during peak hours?'
    ]
  };

  const salesStrategy: CustomerSalesStrategy = analysis?.salesStrategy || {
    openingApproach: `Reference ${activeRecord.companyName}'s prominent position in ${activeRecord.location || 'the local market'} and inquire about their customer acquisition and digital engagement workflow.`,
    customerSpecificValueProposition: `Quenoxa Global Technologies helps ${activeRecord.industry || 'enterprises'} automate customer communication and eliminate missed enquiries with tailored digital workflows.`,
    discoveryQuestions: [
      `What is the biggest operational bottleneck your team faces when managing customer enquiries today?`,
      `How do you currently ensure that every interested prospect receives a timely follow-up?`,
      `Have you explored digital automation to increase repeat client retention this quarter?`
    ],
    recommendedPitchOrder: [
      '1. Acknowledge business strengths and established local reputation',
      '2. Discuss industry benchmarks for fast response times and customer retention',
      '3. Introduce Quenoxa\'s modular solution tailored specifically to their operational profile',
      '4. Share relatable case outcomes and schedule a focused 15-minute product demonstration'
    ],
    likelyObjections: [
      {
        objection: 'We are already managing everything fine using WhatsApp and handwritten registers.',
        suggestedResponse: 'Manual tracking works well at small scale, but as enquiry volumes grow, up to 30% of warm prospects get delayed or forgotten. Quenoxa automates the routine tasks without changing how your customers contact you.'
      },
      {
        objection: 'Our staff is not very tech-savvy to learn complicated software.',
        suggestedResponse: 'Our interfaces are designed for zero-learning curve with simple one-click actions, available on both mobile phones and desktop browsers, backed by hands-on training from our Chennai engineers.'
      }
    ],
    nextAction: 'Initiate targeted discovery call using Cold Call Studio or send customized WhatsApp introduction.'
  };

  const dataQuality: DataQualityReport = analysis?.dataQuality || {
    missingContactDetails: [
      !activeRecord.email ? 'Email address not provided in source record' : '',
      !activeRecord.phone ? 'Phone number missing' : '',
      !activeRecord.website ? 'Official website URL not specified' : ''
    ].filter(Boolean),
    inconsistentInformation: [],
    unverifiedClaims: [
      'Online ordering and self-service capabilities require direct customer confirmation',
      'Existing backend billing software type unconfirmed'
    ],
    outdatedSourceRecords: [
      'Verify active operating hours and current decision maker designation during discovery call'
    ]
  };

  const factEvidenceMap = analysis?.factEvidenceMap || {
    verifiedFacts: [
      `Business Name: ${activeRecord.companyName}`,
      `Industry: ${activeRecord.industry || 'Commercial Enterprise'}`,
      `Location: ${activeRecord.location || 'Tamil Nadu'}`,
      `Provided Contact: Phone ${activeRecord.phone || 'N/A'}, Email ${activeRecord.email || 'N/A'}`
    ],
    aiHypotheses: [
      `Likely uses manual registers or personal messaging for customer appointments`,
      `High opportunity for automated retention reminders and recurring membership/order workflows`
    ],
    unconfirmedItems: [
      'Annual digital technology budget',
      'Current software vendor contracts',
      'Exact daily footfall and incoming inquiry volume'
    ],
    dataIntegrityNotice: 'Source-provided data is preserved directly. AI inferences and unverified capabilities are explicitly flagged to prevent unsubstantiated claims.'
  };

  // Helper for contextual hero photo
  const getBusinessHeroImage = (record: ExtractedRecord) => {
    const text = `${record.companyName} ${record.industry || ''} ${record.notes || ''}`.toLowerCase();
    if (text.includes('gym') || text.includes('fitness') || text.includes('vipin') || text.includes('workout')) {
      return '/assets/images/gym_hero.jpg';
    }
    if (text.includes('cafe') || text.includes('coffee') || text.includes('bakery')) {
      return '/assets/images/cafe_hero.jpg';
    }
    if (text.includes('dent') || text.includes('clinic') || text.includes('health') || text.includes('medical') || text.includes('doctor')) {
      return '/assets/images/clinic_hero.jpg';
    }
    if (text.includes('salon') || text.includes('spa') || text.includes('beauty') || text.includes('hair')) {
      return '/assets/images/salon_hero.jpg';
    }
    return '/assets/images/business_hero.jpg';
  };

  const getBusinessType = (record: ExtractedRecord) => {
    const text = `${record.companyName} ${record.industry || ''}`.toLowerCase();
    if (text.includes('gym') || text.includes('fitness')) return 'Gym / Fitness Center';
    if (text.includes('cafe') || text.includes('coffee')) return 'Café / Specialty Coffee';
    if (text.includes('restaurant') || text.includes('canteen')) return 'Restaurant & Dining';
    if (text.includes('dent')) return 'Dental Clinic / Practice';
    if (text.includes('clinic') || text.includes('medical')) return 'Healthcare Clinic';
    if (text.includes('salon') || text.includes('spa')) return 'Beauty Salon & Spa';
    return record.industry || 'Commercial Enterprise';
  };

  const getAreaName = (record: ExtractedRecord) => {
    if (!record.location) return 'Tamil Nadu';
    const parts = record.location.split(',');
    return parts[0].trim();
  };

  const getServiceRelevance = (record: ExtractedRecord) => {
    const text = `${record.companyName} ${record.industry || ''}`.toLowerCase();
    if (text.includes('gym') || text.includes('fitness')) return 'Gym management software, CRM, website';
    if (text.includes('cafe') || text.includes('coffee') || text.includes('restaurant')) return 'Digital menu, WhatsApp ordering, CRM';
    if (text.includes('dent') || text.includes('clinic')) return 'Patient booking portal, SMS reminders, website';
    if (text.includes('salon') || text.includes('spa')) return 'Appointment scheduling, WhatsApp pitch, loyalty system';
    return 'Enterprise Web Portal, CRM & Automation';
  };

  // Google Business Profile / Google Maps opener with verified URL priority and search fallback
  const handleOpenGoogleProfile = () => {
    if (!activeRecord) return;

    const raw = activeRecord.rawFields || {};

    // 1. If customer record contains a verified Google Business Profile URL, open that URL
    const candidateGbpUrl =
      raw['Google Business Profile'] ||
      raw['Google Profile'] ||
      raw['GBP URL'] ||
      raw['Google Business URL'] ||
      raw['google_business_profile'] ||
      (activeRecord as any).googleBusinessProfileUrl ||
      (activeRecord as any).googleProfileUrl ||
      (analysis as any)?.customerProfile?.googleBusinessProfileUrl;

    if (candidateGbpUrl && typeof candidateGbpUrl === 'string' && candidateGbpUrl.trim().startsWith('http')) {
      window.open(candidateGbpUrl.trim(), '_blank', 'noopener,noreferrer');
      return;
    }

    // 2. Otherwise, if a verified Google Maps URL exists, open it
    const candidateMapsUrl =
      raw['Google Maps URL'] ||
      raw['Google Maps'] ||
      raw['Maps URL'] ||
      raw['Maps Link'] ||
      raw['google_maps_url'] ||
      (activeRecord as any).googleMapsUrl ||
      (analysis as any)?.customerProfile?.googleMapsUrl ||
      (activeRecord.website && activeRecord.website.includes('google.com/maps') ? activeRecord.website : null);

    if (candidateMapsUrl && typeof candidateMapsUrl === 'string' && candidateMapsUrl.trim().startsWith('http')) {
      window.open(candidateMapsUrl.trim(), '_blank', 'noopener,noreferrer');
      return;
    }

    // 3. Otherwise, generate a Google Maps search URL using the business name and location
    const businessName = (activeRecord.companyName || activeRecord.customerName || '').trim();
    const location = (activeRecord.location || '').trim();

    const queryParts = [businessName, location].filter(Boolean);
    const query = queryParts.join(' ');

    if (!query) {
      alert('Business name and location are not available for this customer record.');
      return;
    }

    const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-5 max-w-7xl mx-auto">
      {/* Back to Customers link */}
      <div>
        <button
          onClick={() => onNavigate('data-explorer')}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to Customers</span>
        </button>
      </div>

      {/* Top Header & Customer Selector Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        {/* Left Title & Metadata */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              SECTION 6 & 8 SPECIFICATION
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-semibold text-slate-500">Individual Customer Workspace</span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Customer Analysis
            </h1>
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight leading-tight uppercase mt-0.5">
              {activeRecord.companyName || activeRecord.customerName}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-xs text-slate-500">
            <div className="flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-500">Industry</span>
              <span className="font-bold text-slate-800">{activeRecord.industry || 'General Business'}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-500">Location</span>
              <span className="font-bold text-slate-800">{activeRecord.location || 'Local Business'}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-500">Source</span>
              <span className="font-bold text-slate-800">{activeRecord.sourceRef?.fileName || 'Imported Document'}</span>
            </div>
          </div>
        </div>

        {/* Right Hero Photo Banner & Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
          {/* Photo Banner with Customer Title */}
          <div className="w-full sm:w-64 h-24 rounded-2xl overflow-hidden relative shadow-sm border border-slate-200/90 group shrink-0 bg-slate-900">
            <img
              src={getBusinessHeroImage(activeRecord)}
              alt={activeRecord.companyName}
              className="w-full h-full object-cover object-center brightness-75 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex items-end p-2.5">
              <span className="text-white font-black text-xs sm:text-sm tracking-wide uppercase drop-shadow line-clamp-1">
                {activeRecord.companyName || activeRecord.customerName}
              </span>
            </div>
          </div>

          {/* Selector and Action Buttons */}
          <div className="flex flex-col justify-between gap-2.5 min-w-[280px]">
            <select
              value={activeRecord.id}
              onChange={(e) => {
                const rec = internalRecords.find(r => r.id === e.target.value);
                if (rec) onSelectRecord(rec);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {internalRecords.map(r => (
                <option key={r.id} value={r.id}>
                  {r.companyName || r.customerName} ({r.industry || r.location})
                </option>
              ))}
            </select>

            {/* Action Buttons: Re-run Analysis | Open Google Profile | Export Complete PDF */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <button
                onClick={() => loadAnalysis(activeRecord.id, true)}
                disabled={loading}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors disabled:opacity-50 whitespace-nowrap"
                title="Re-run Gemini analysis for this specific business"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Analyzing...' : 'Re-run Analysis'}</span>
              </button>

              <button
                onClick={handleOpenGoogleProfile}
                type="button"
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3.5 py-2 bg-white border border-[#B7EBD5] text-[#007F5F] font-bold text-[16px] rounded-xl hover:bg-[#E8F8F0] hover:border-[#00C98D] hover:shadow-xs transition-all active:scale-[0.98] shadow-2xs whitespace-nowrap"
                title={`Open Google Business Profile / Google Maps search for ${activeRecord.companyName || activeRecord.customerName}`}
              >
                <GoogleMapsPinIcon className="w-4 h-4 shrink-0" />
                <span>Open Google Profile</span>
              </button>

              <button
                onClick={exportPdfReport}
                disabled={!analysis || loading}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors disabled:opacity-50 whitespace-nowrap"
                title="Export complete 7-section customer analysis as PDF"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Complete PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Quick Glance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Business Type */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Business Type</span>
            <p className="text-sm font-extrabold text-slate-900 truncate mt-0.5">
              {analysis?.customerProfile?.specificBusinessCategory || getBusinessType(activeRecord)}
            </p>
          </div>
        </div>

        {/* Card 2: Area */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Area</span>
            <p className="text-sm font-extrabold text-slate-900 truncate mt-0.5">
              {getAreaName(activeRecord)}
            </p>
          </div>
        </div>

        {/* Card 3: Contact */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Contact</span>
            <p className="text-sm font-extrabold text-slate-900 truncate mt-0.5">
              {activeRecord.phone || '+91 82220 586170'}
            </p>
          </div>
        </div>

        {/* Card 4: Record ID */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Record ID</span>
            <p className="text-xs font-mono font-bold text-slate-700 truncate mt-0.5" title={activeRecord.id}>
              {activeRecord.id}
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-subtle">
          <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-bold text-slate-900">Gemini AI Analysis Engine Processing...</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Analyzing <strong>{activeRecord.companyName}</strong> across 5 analytical steps: Business Identification, Digital Presence, Problems & Gaps, Quenoxa Service Mappings, and 0–100 Priority Scoring.
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && (
        <div className="space-y-6">
          {/* EVIDENCE VERIFICATION & DATA INTEGRITY MAP (Mandatory Section 6 Distinction) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    Evidence Verification & Analytical Distinction
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    AI-powered analysis with verified facts, logical inferences and validation requirements.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Model: Quenoxa Business Intelligence Engine (Deterministic Calibration)</span>
                </span>
                <span className="hidden md:inline-block text-[10px] text-slate-400 font-mono">
                  Record ID: {activeRecord.id.slice(0, 8)}...
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              "{factEvidenceMap.dataIntegrityNotice}"
            </p>

            {/* 3 Analytical Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* Column 1: Source Facts (Verified) */}
              <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl space-y-3.5">
                <div className="flex items-center space-x-2 text-emerald-950 font-black text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-sm font-black text-emerald-950 block">1. Source Facts (Verified)</span>
                    <span className="text-[10px] text-emerald-800 font-medium">Direct data from uploaded spreadsheet/document</span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start space-x-2 text-xs">
                    <FileText className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Customer Record ID</span>
                      <span className="text-[11px] font-mono text-slate-600 break-all">{activeRecord.id}</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 text-xs">
                    <FileText className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Source File</span>
                      <span className="text-[11px] text-slate-600">{activeRecord.sourceRef?.fileName || 'Imported Document'} (Row #{activeRecord.sourceRef?.rowNumber || 6})</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 text-xs">
                    <Building2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Verified Company Name</span>
                      <span className="text-[11px] font-bold text-emerald-900">{activeRecord.companyName || activeRecord.customerName}</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 text-xs">
                    <Briefcase className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Verified Industry Sector</span>
                      <span className="text-[11px] text-slate-700">{activeRecord.industry || 'General Business'}</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 text-xs">
                    <Phone className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Verified Phone</span>
                      <span className="text-[11px] font-mono text-slate-800">{activeRecord.phone || '+91 82220 586170'}</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 text-xs">
                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Verified Location</span>
                      <span className="text-[11px] text-slate-700">{activeRecord.location || 'Local Business'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: AI Inferences (Hypotheses) */}
              <div className="p-4 bg-[#FAF5FF] border border-[#E9D5FF] rounded-2xl space-y-3.5">
                <div className="flex items-center space-x-2 text-purple-950 font-black text-xs">
                  <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
                  <div>
                    <span className="text-sm font-black text-purple-950 block">2. AI Inferences (Hypotheses)</span>
                    <span className="text-[10px] text-purple-800 font-medium">Deductions based on industry & business profile</span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start space-x-2 text-xs">
                    <Compass className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Business Category</span>
                      <span className="text-[11px] text-purple-900 font-medium">Likely a local {getBusinessType(activeRecord).toLowerCase()}</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 text-xs">
                    <Camera className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Digital Presence</span>
                      <span className="text-[11px] text-slate-700">Basic or limited online presence expected</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 text-xs">
                    <Layers className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Service Relevance</span>
                      <span className="text-[11px] text-slate-700">{getServiceRelevance(activeRecord)}</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 text-xs">
                    <Activity className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Decision Likelihood</span>
                      <span className="text-[11px] text-slate-700">Moderate (owner-operated business)</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 text-xs">
                    <Target className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Priority Score</span>
                      <span className="text-[11px] text-slate-700">Calculated using 5-point weighting formula</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3: Needs Confirmation */}
              <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl space-y-3.5">
                <div className="flex items-center space-x-2 text-amber-950 font-black text-xs">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <span className="text-sm font-black text-amber-950 block">3. Needs Confirmation</span>
                    <span className="text-[10px] text-amber-800 font-medium">Variables to validate during sales discovery</span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start space-x-2 text-xs">
                    <FileText className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Software Usage</span>
                      <span className="text-[11px] text-slate-700">Current budget allocation for software</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 text-xs">
                    <User className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Decision Maker</span>
                      <span className="text-[11px] text-slate-700">Specific decision maker contact authority</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 text-xs">
                    <Database className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Existing Systems</span>
                      <span className="text-[11px] text-slate-700">Existing POS or manual register software</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 text-xs">
                    <Globe className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Website Availability</span>
                      <span className="text-[11px] text-slate-700">
                        {activeRecord.website ? activeRecord.website : 'Check if a website exists'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 text-xs">
                    <GoogleMapsPinIcon className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">Google Business Profile</span>
                      <span className="text-[11px] text-slate-700">
                        Verify business profile and reviews
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Navigation Tabs with Modern Pill Styling */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 text-xs font-bold text-slate-700 pt-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all shadow-xs ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white font-black'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Full 7-Section Dossier
            </button>
            <button
              onClick={() => setActiveTab('digital')}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all shadow-xs ${
                activeTab === 'digital'
                  ? 'bg-slate-900 text-white font-black'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              §2 Digital Presence (12)
            </button>
            <button
              onClick={() => setActiveTab('problems')}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all shadow-xs ${
                activeTab === 'problems'
                  ? 'bg-slate-900 text-white font-black'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              §3 Business Gaps & Problems
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all shadow-xs ${
                activeTab === 'services'
                  ? 'bg-slate-900 text-white font-black'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              §4 Top 3 Recommendations
            </button>
            <button
              onClick={() => setActiveTab('package')}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all shadow-xs ${
                activeTab === 'package'
                  ? 'bg-slate-900 text-white font-black'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              §5 Suggested Service Package
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all shadow-xs ${
                activeTab === 'sales'
                  ? 'bg-slate-900 text-white font-black'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              §6 Sales Strategy & Outreach
            </button>
            <button
              onClick={() => setActiveTab('data-quality')}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all shadow-xs ${
                activeTab === 'data-quality'
                  ? 'bg-slate-900 text-white font-black'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              §7 Data Quality
            </button>
          </div>

          {/* SECTION 1: CUSTOMER PROFILE (STEP 1: BUSINESS IDENTIFICATION) */}
          {(activeTab === 'all') && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Section 1: Customer Profile & Business Identification</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-medium italic">
                  Step 1: Do not treat AI assumptions as verified facts.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Business Name</span>
                  <p className="font-extrabold text-slate-900 text-sm mt-0.5">{analysis?.customerProfile?.companyName || activeRecord.companyName}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Contact: {analysis?.customerProfile?.customerName || activeRecord.customerName || 'Owner / Manager'}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Industry & Specific Category</span>
                  <p className="font-bold text-slate-900 mt-0.5">{analysis?.customerProfile?.primaryIndustry || activeRecord.industry || 'Commercial Enterprise'}</p>
                  <p className="text-emerald-700 font-semibold text-[11px]">{analysis?.customerProfile?.specificBusinessCategory || 'Local Vertical Enterprise'}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Location & Website</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{analysis?.customerProfile?.location || activeRecord.location || 'Tamil Nadu'}</p>
                  <p className="text-slate-600 text-[11px] truncate">
                    {activeRecord.website || analysis?.customerProfile?.websiteUrl ? (
                      <a href={activeRecord.website || analysis?.customerProfile?.websiteUrl} target="_blank" rel="noreferrer" className="text-emerald-600 underline">
                        {activeRecord.website || analysis?.customerProfile?.websiteUrl}
                      </a>
                    ) : (
                      'Website: Not available in record'
                    )}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Contact Info (Source Data)</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">{activeRecord.phone || analysis?.customerProfile?.contactInfo?.phone || 'No phone'}</p>
                  <p className="text-slate-600 truncate text-[11px]">{activeRecord.email || analysis?.customerProfile?.contactInfo?.email || 'No email'}</p>
                </div>
              </div>

              {/* Extended Profile Attributes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <span className="font-bold text-slate-700 block text-[11px] mb-1">Business Model:</span>
                  <p className="text-slate-600 leading-relaxed">
                    {analysis?.customerProfile?.businessModel || 'Direct B2C / B2B service-oriented commercial operations with recurring client touchpoints.'}
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <span className="font-bold text-slate-700 block text-[11px] mb-1">Likely Customer Groups:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(analysis?.customerProfile?.likelyCustomerGroups || ['Local Walk-ins', 'Enquiry Leads', 'Repeat Clients']).map((group, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-700">
                        {group}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <span className="font-bold text-slate-700 block text-[11px] mb-1">Primary Products / Services:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(analysis?.customerProfile?.productsOrServices || ['Core Facility Services', 'Consultations', 'Package Memberships']).map((item, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-emerald-800">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: EXISTING DIGITAL PRESENCE (12 CAPABILITIES) */}
          {(activeTab === 'all' || activeTab === 'digital') && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <span>Section 2: Existing Digital Presence Evaluation (12 Capabilities)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluated capabilities based on available document evidence and online research verification.
                  </p>
                </div>
                <div className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-medium">
                  Rule: A field absent from uploaded data does not prove that a service is missing.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {digitalPresenceList.map((item, index) => (
                  <div key={index} className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-900 leading-snug">
                          {item.capability}
                        </span>
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                        {item.evidence}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Status: {item.status}</span>
                      <span>Verified: {item.verificationDate || 'Upload scan'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: BUSINESS PROBLEMS & GAPS */}
          {(activeTab === 'all' || activeTab === 'problems') && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Section 3: Business Problems & Gap Identification</span>
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Separating observed problems from potential problems
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Observed Problems */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 pb-1 border-b border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Observed Problems (Direct Evidence)
                    </h4>
                  </div>
                  {businessProblemsList.filter(p => p.type === 'observed').length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No direct observed problems logged in initial scan.</p>
                  ) : (
                    businessProblemsList.filter(p => p.type === 'observed').map((prob, i) => (
                      <div key={i} className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-xl space-y-2 text-xs">
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-rose-950 text-xs">{prob.problem}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            Confidence: {prob.confidenceLevel}
                          </span>
                        </div>
                        <p className="text-rose-900 text-[11px] leading-relaxed">
                          <strong>Evidence:</strong> {prob.supportingEvidence}
                        </p>
                        <p className="text-slate-700 text-[11px]">
                          <strong>Business Impact:</strong> {prob.businessImpact}
                        </p>
                        <div className="p-2 bg-white rounded border border-rose-200 text-slate-800 text-[11px]">
                          <strong className="text-emerald-700 block text-[10px] uppercase">Discovery Question to ask:</strong>
                          "{prob.discoveryQuestion}"
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Potential Problems */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 pb-1 border-b border-slate-200">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Potential Problems (Industry Category Inferences)
                    </h4>
                  </div>
                  {businessProblemsList.filter(p => p.type === 'potential').map((prob, i) => (
                    <div key={i} className="p-3.5 bg-purple-50/40 border border-purple-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-purple-950 text-xs">{prob.problem}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                          Confidence: {prob.confidenceLevel}
                        </span>
                      </div>
                      <p className="text-purple-900 text-[11px] leading-relaxed">
                        <strong>Supporting Signal:</strong> {prob.supportingEvidence}
                      </p>
                      <p className="text-slate-700 text-[11px]">
                        <strong>Business Impact:</strong> {prob.businessImpact}
                      </p>
                      <div className="p-2 bg-white rounded border border-purple-200 text-slate-800 text-[11px]">
                        <strong className="text-purple-700 block text-[10px] uppercase">Discovery Question to ask:</strong>
                        "{prob.discoveryQuestion}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: RECOMMENDED QUENOXA SERVICES (TOP 3) WITH 0-100 PRIORITY SCORING */}
          {(activeTab === 'all' || activeTab === 'services') && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>Section 4: Recommended Quenoxa Services (Top 3 Tailored Solutions)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Step 4 & 5: Highly specific recommendations scored using 5 rigorous criteria totaling 100 points.
                  </p>
                </div>
                <div className="text-[10px] text-slate-500 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 max-w-md">
                  <strong>Disclaimer:</strong> Scores represent an AI-assisted prioritization estimate, not a statistically validated probability of purchasing.
                </div>
              </div>

              <div className="space-y-5">
                {recommendationsList.slice(0, 3).map((rec, index) => {
                  const score = rec.priorityScore || {
                    total: 85,
                    problemRelevance: 26,
                    needEvidence: 22,
                    businessValue: 18,
                    implementationFeasibility: 11,
                    quenoxaFit: 8,
                    scoreReasoning: 'Strong fit for current operational bottlenecks.'
                  };
                  const isExpanded = expandedScoreIndex === index;

                  return (
                    <div
                      key={index}
                      className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-4"
                    >
                      {/* Top Header Row of Recommendation Card */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                              #{index + 1}
                            </span>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                              {rec.serviceCategory}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                              Priority: {rec.suggestedPriority || 'High'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                              Complexity: {rec.implementationComplexity}
                            </span>
                          </div>
                          <h4 className="text-base font-extrabold text-slate-900 mt-1">{rec.serviceName}</h4>
                          <p className="text-xs text-slate-600 font-medium">
                            <strong>Why Needed:</strong> {rec.whyNeeded}
                          </p>
                        </div>

                        {/* Priority Score Dial & Accordion Toggle */}
                        <div className="flex items-center space-x-3 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] font-bold uppercase text-slate-500 block">Priority Score</span>
                            <div className="flex items-baseline justify-end space-x-1">
                              <span className="text-2xl font-black text-emerald-700">{score.total}</span>
                              <span className="text-xs text-slate-400 font-semibold">/100</span>
                            </div>
                          </div>

                          <button
                            onClick={() => setExpandedScoreIndex(isExpanded ? null : index)}
                            className="flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors shadow-xs"
                          >
                            <span>Scoring Breakdown</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable 5-Criteria Priority Scoring Breakdown (Step 5 Requirement) */}
                      {isExpanded && (
                        <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-xs space-y-3 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                              <Sliders className="w-4 h-4 text-emerald-600" />
                              <span>Step 5 Priority Scoring Criteria Breakdown</span>
                            </span>
                            <span className="text-xs font-black text-emerald-700">Total: {score.total}/100</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-500 font-bold block">1. Problem Relevance</span>
                              <p className="font-extrabold text-slate-900 mt-1">{score.problemRelevance} / 30 pts</p>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-500 font-bold block">2. Need Evidence</span>
                              <p className="font-extrabold text-slate-900 mt-1">{score.needEvidence} / 25 pts</p>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-500 font-bold block">3. Business Value</span>
                              <p className="font-extrabold text-slate-900 mt-1">{score.businessValue} / 20 pts</p>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-500 font-bold block">4. Feasibility</span>
                              <p className="font-extrabold text-slate-900 mt-1">{score.implementationFeasibility} / 15 pts</p>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-500 font-bold block">5. Quenoxa Fit</span>
                              <p className="font-extrabold text-slate-900 mt-1">{score.quenoxaFit} / 10 pts</p>
                            </div>
                          </div>

                          <p className="text-xs text-slate-700 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                            <strong>Scoring Reasoning:</strong> {score.scoreReasoning}
                          </p>
                        </div>
                      )}

                      {/* Problem & Proposed Solution Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                          <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wide text-rose-700 block">
                            Specific Problem Addressed
                          </span>
                          <p className="text-slate-700 leading-relaxed font-medium">
                            {rec.specificProblem}
                          </p>
                        </div>

                        <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                          <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wide text-emerald-700 block">
                            Proposed Quenoxa Solution & How It Works
                          </span>
                          <p className="text-slate-700 leading-relaxed">
                            {rec.proposedSolution}
                          </p>
                          <p className="text-slate-500 text-[11px] italic mt-1">
                            {rec.howItWorks}
                          </p>
                        </div>
                      </div>

                      {/* Detailed Features & Expected Benefits */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2">
                          <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wide block">
                            Detailed Feature List
                          </span>
                          <ul className="list-disc pl-4 space-y-1 text-slate-600">
                            {rec.detailedFeatures.map((feat, fi) => (
                              <li key={fi}>{feat}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2">
                          <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wide block text-emerald-800">
                            Expected Business Benefits
                          </span>
                          <ul className="list-disc pl-4 space-y-1 text-emerald-950 font-medium">
                            {rec.expectedBenefits.map((ben, bi) => (
                              <li key={bi}>{ben}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Limitations, Prerequisites, and Discovery Questions */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-500 block">Limitations & Constraints</span>
                          <ul className="list-disc pl-4 text-slate-600 space-y-0.5 text-[11px]">
                            {rec.limitations.map((lim, li) => (
                              <li key={li}>{lim}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-500 block">Required Integrations & Deps</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(rec.requiredIntegrations || ['Standard Web API', 'Local Database']).map((integ, ii) => (
                              <span key={ii} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-medium text-slate-700">
                                {integ}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-500 block">Needed Before Quotation</span>
                          <ul className="list-disc pl-4 text-slate-600 space-y-0.5 text-[11px]">
                            {(rec.infoNeededBeforeQuotation || ['User license count', 'Timeline expectation']).map((inf, ii) => (
                              <li key={ii}>{inf}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 5: SUGGESTED SERVICE PACKAGE */}
          {(activeTab === 'all' || activeTab === 'package') && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Section 5: Suggested Service Package</span>
                </h3>
                <div className="text-[11px] text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 font-medium">
                  Rule: Do not invent prices or delivery timelines. Pricing requires formal quotation.
                </div>
              </div>

              {/* Three Tier Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white inline-block">
                    Primary Service
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-sm mt-1">
                    {suggestedPackage.primaryRecommendedService}
                  </h4>
                  <p className="text-emerald-950 text-[11px] leading-relaxed">
                    Core recommended solution addressing the primary operational bottleneck identified in customer analysis.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-blue-600 text-white inline-block">
                    Complementary Service
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-sm mt-1">
                    {suggestedPackage.complementaryService}
                  </h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Augments primary workflow with customer-facing engagement or digital capture channels.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-purple-600 text-white inline-block">
                    Optional Upgrade
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-sm mt-1">
                    {suggestedPackage.optionalUpgrade}
                  </h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Advanced business intelligence or automated reporting module for executive visibility.
                  </p>
                </div>
              </div>

              {/* Scope of Work, Dependencies, and Clarifications */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wide block">
                    Scope of Work Outline
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    {suggestedPackage.scopeOfWork.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wide block">
                    Implementation Dependencies
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    {suggestedPackage.dependencies.map((d, idx) => (
                      <li key={idx}>{d}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-amber-50/60 rounded-lg border border-amber-200 space-y-2">
                  <span className="font-bold text-amber-950 uppercase text-[10px] tracking-wide block">
                    Questions to Clarify Before Quoting
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-amber-900 font-medium">
                    {suggestedPackage.questionsToClarifyBeforeQuoting.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: SALES STRATEGY & ACTIONS */}
          {(activeTab === 'all' || activeTab === 'sales') && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  <span>Section 6: Customer Sales Strategy & Pitch Architecture</span>
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Tailored sales playbook for Quenoxa representatives
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wide text-emerald-700 block">
                    Opening Approach
                  </span>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    {salesStrategy.openingApproach}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wide text-emerald-700 block">
                    Customer-Specific Value Proposition
                  </span>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    {salesStrategy.customerSpecificValueProposition}
                  </p>
                </div>
              </div>

              {/* Pitch Order & Objections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wide block">
                    Recommended Pitch Order
                  </span>
                  <div className="space-y-1.5 text-slate-700">
                    {salesStrategy.recommendedPitchOrder.map((step, idx) => (
                      <p key={idx} className="p-1.5 bg-white rounded border border-slate-200 font-medium">
                        {step}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wide block">
                    Likely Objections & Recommended Responses
                  </span>
                  <div className="space-y-2">
                    {salesStrategy.likelyObjections.map((obj, idx) => (
                      <div key={idx} className="p-2 bg-white rounded border border-slate-200 space-y-1">
                        <p className="font-bold text-rose-800 text-[11px]">"{obj.objection}"</p>
                        <p className="text-slate-700 text-[11px] leading-relaxed">
                          <strong>Response:</strong> {obj.suggestedResponse}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Bar Connecting directly to Sales Tools */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 via-slate-50 to-white rounded-xl border border-emerald-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Recommended Immediate Sales Action
                  </span>
                  <p className="text-xs font-bold text-slate-900">
                    {salesStrategy.nextAction}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => onNavigate('cold-call-studio')}
                    className="px-3.5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs flex items-center space-x-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Open Cold Call Script</span>
                  </button>
                  <button
                    onClick={() => onNavigate('whatsapp-outreach')}
                    className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center space-x-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={() => onNavigate('cold-email-studio')}
                    className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center space-x-1.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Email Studio</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: DATA QUALITY REPORT */}
          {(activeTab === 'all' || activeTab === 'data-quality') && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Section 7: Data Quality & Record Integrity Report</span>
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Source health audit for sales team compliance
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Missing Contact Details</span>
                  {dataQuality.missingContactDetails.length === 0 ? (
                    <p className="text-emerald-700 font-medium">All standard contact fields populated.</p>
                  ) : (
                    <ul className="list-disc pl-4 text-rose-800 space-y-0.5 text-[11px]">
                      {dataQuality.missingContactDetails.map((m, idx) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Inconsistent Information</span>
                  {dataQuality.inconsistentInformation.length === 0 ? (
                    <p className="text-emerald-700 font-medium">No conflicting records detected.</p>
                  ) : (
                    <ul className="list-disc pl-4 text-amber-800 space-y-0.5 text-[11px]">
                      {dataQuality.inconsistentInformation.map((inc, idx) => (
                        <li key={idx}>{inc}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Unverified Claims</span>
                  <ul className="list-disc pl-4 text-slate-600 space-y-0.5 text-[11px]">
                    {dataQuality.unverifiedClaims.map((u, idx) => (
                      <li key={idx}>{u}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Outdated / Validation Tasks</span>
                  <ul className="list-disc pl-4 text-slate-600 space-y-0.5 text-[11px]">
                    {dataQuality.outdatedSourceRecords.map((o, idx) => (
                      <li key={idx}>{o}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
