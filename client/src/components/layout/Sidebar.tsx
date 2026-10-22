import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  TableProperties,
  Sparkles,
  Award,
  PhoneCall,
  MessageSquare,
  Mail,
  Users2,
  CalendarCheck2,
  KanbanSquare,
  BarChart3,
  BookOpenCheck,
  UserCheck,
  Settings,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export type ViewKey =
  | 'dashboard'
  | 'upload-documents'
  | 'data-explorer'
  | 'ai-analysis'
  | 'service-recommendations'
  | 'cold-call-studio'
  | 'whatsapp-outreach'
  | 'cold-email-studio'
  | 'crm-leads'
  | 'follow-up-tasks'
  | 'sales-pipeline'
  | 'reports-analytics'
  | 'service-catalog'
  | 'team-management'
  | 'settings';

interface SidebarProps {
  currentView: ViewKey;
  onSelectView: (view: ViewKey) => void;
  badgeCounts?: {
    dueToday?: number;
    leads?: number;
    unprocessedRecords?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  badgeCounts
}) => {
  const navItems: { key: ViewKey; label: string; icon: React.FC<any>; badge?: number; badgeColor?: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'upload-documents', label: 'Upload Documents', icon: UploadCloud, badge: badgeCounts?.unprocessedRecords },
    { key: 'data-explorer', label: 'Data Explorer', icon: TableProperties },
    { key: 'ai-analysis', label: 'AI Analysis', icon: Sparkles },
    { key: 'service-recommendations', label: 'Service Recommendations', icon: Award },
    { key: 'cold-call-studio', label: 'Cold Call Studio', icon: PhoneCall },
    { key: 'whatsapp-outreach', label: 'WhatsApp Outreach', icon: MessageSquare },
    { key: 'cold-email-studio', label: 'Cold Email Studio', icon: Mail },
    { key: 'crm-leads', label: 'CRM & Leads', icon: Users2, badge: badgeCounts?.leads },
    { key: 'follow-up-tasks', label: 'Follow-up Tasks', icon: CalendarCheck2, badge: badgeCounts?.dueToday, badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' },
    { key: 'sales-pipeline', label: 'Sales Pipeline', icon: KanbanSquare },
    { key: 'reports-analytics', label: 'Reports & Analytics', icon: BarChart3 },
    { key: 'service-catalog', label: 'Service Catalog', icon: BookOpenCheck },
    { key: 'team-management', label: 'Team Management', icon: UserCheck },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-screen select-none shrink-0 z-30">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            Q
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-base">QUENOXA</span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                AI SALES
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Global Technologies</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <div className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Workflows
        </div>
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelectView(item.key)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-emerald-50/90 text-emerald-800 font-semibold border border-emerald-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold border ${item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Sales Outreach
        </div>
        {navItems.slice(5, 8).map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelectView(item.key)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-emerald-50/90 text-emerald-800 font-semibold border border-emerald-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}

        <div className="px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          CRM & Execution
        </div>
        {navItems.slice(8, 12).map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelectView(item.key)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-emerald-50/90 text-emerald-800 font-semibold border border-emerald-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold border ${item.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Governance & Config
        </div>
        {navItems.slice(12).map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelectView(item.key)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-emerald-50/90 text-emerald-800 font-semibold border border-emerald-200/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* User profile footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60">
        <div className="flex items-center space-x-3 px-2 py-1.5">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
            alt="Ashwin Kumar"
            className="w-8 h-8 rounded-full object-cover border border-slate-200"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">Ashwin Kumar</p>
            <div className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <p className="text-[10px] text-slate-500 truncate">Director / Admin</p>
            </div>
          </div>
          <button
            onClick={() => onSelectView('settings')}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
            title="Settings"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
