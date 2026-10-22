import React from 'react';
import {
  UploadCloud,
  Bell,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { ViewKey } from './Sidebar';

interface HeaderProps {
  currentView: ViewKey;
  onNavigate: (view: ViewKey) => void;
  onSeedData?: () => void;
  isSeeding?: boolean;
  onResetData?: () => void;
  isResetting?: boolean;
  dueTodayCount?: number;
}

const VIEW_TITLES: Record<ViewKey, { title: string; subtitle: string }> = {
  dashboard: { title: 'Executive Overview', subtitle: 'Live business intelligence, acceptance metrics, and pipeline health' },
  'upload-documents': { title: 'Upload & Process Documents', subtitle: 'Extract tabular and unstructured data from spreadsheets, PDFs, and images' },
  'data-explorer': { title: 'Interactive Data Explorer', subtitle: 'Search, validate, and execute targeted sales actions on imported records' },
  'ai-analysis': { title: 'Gemini AI Business Analysis', subtitle: 'Deep operational profile, requirement gap analysis, and sales discovery' },
  'service-recommendations': { title: 'Service Recommendations Engine', subtitle: 'Needs-to-catalog matching, evidence mapping, and acceptance estimates' },
  'cold-call-studio': { title: 'AI Cold Call Studio', subtitle: 'Generate high-impact calling scripts in Thanglish, English, or Tamil with objection handling' },
  'whatsapp-outreach': { title: 'Direct WhatsApp Outreach', subtitle: 'Personalized click-to-chat messaging with verified international number encoding' },
  'cold-email-studio': { title: 'Cold Email Studio', subtitle: 'Multi-tone structured enterprise cold email generation and mailto execution' },
  'crm-leads': { title: 'CRM & Lead Management', subtitle: 'Track customer lifecycles, assign owners, and manage outreach logs' },
  'follow-up-tasks': { title: 'Follow-up Management', subtitle: 'Scheduled phone callbacks, proposal checks, and AI-suggested messages' },
  'sales-pipeline': { title: 'Visual Sales Pipeline', subtitle: '12-stage kanban workflow from raw import to closed-won agreements' },
  'reports-analytics': { title: 'Reports & Sales Analytics', subtitle: 'Calibrated acceptance rates, lead conversions, and Excel/PDF reporting' },
  'service-catalog': { title: 'Service Catalog Management', subtitle: 'Configure active solution offerings, qualifying criteria, and pricing ranges' },
  'team-management': { title: 'Team Performance', subtitle: 'Monitor sales representatives, closed quotas, and conversion efficiencies' },
  settings: { title: 'Platform Settings & Governance', subtitle: 'Gemini model keys, Supabase credentials, and audit security logs' },
};

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onSeedData,
  isSeeding,
  onResetData,
  isResetting,
  dueTodayCount = 0
}) => {
  const currentInfo = VIEW_TITLES[currentView] || { title: 'Quenoxa Platform', subtitle: 'Enterprise AI Automation' };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-20 shrink-0">
      {/* Title & Context */}
      <div>
        <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <span>{currentInfo.title}</span>
        </h1>
        <p className="text-xs text-slate-500 font-normal">{currentInfo.subtitle}</p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Gemini Active Model Badge */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span className="font-semibold text-slate-900">Gemini 1.5/2.5 Flash</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        </div>

        {/* Reset Account Clean Slate Button */}
        {onResetData && (
          <button
            onClick={onResetData}
            disabled={isResetting}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 transition-all shadow-xs disabled:opacity-50"
            title="Wipe all customer records, documents and outreach to reset to brand-new account"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-rose-600 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Resetting...' : 'Reset Account'}</span>
          </button>
        )}

        {/* Upload Document Quick Button */}
        <button
          onClick={() => onNavigate('upload-documents')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-xs"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload Document</span>
        </button>

        {/* Notifications / Tasks Due */}
        <button
          onClick={() => onNavigate('follow-up-tasks')}
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Tasks due today"
        >
          <Bell className="w-4 h-4" />
          {dueTodayCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
          )}
        </button>
      </div>
    </header>
  );
};
