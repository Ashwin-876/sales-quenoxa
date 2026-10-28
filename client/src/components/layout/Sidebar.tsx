import React, { useEffect } from 'react';
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
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  Wand2
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
  | 'marketing-generator'
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
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  badgeCounts,
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse
}) => {
  // Prevent background scrolling and handle Escape key on mobile
  useEffect(() => {
    if (!isMobileOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onCloseMobile) {
        onCloseMobile();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileOpen, onCloseMobile]);

  // Section 1: MAIN MENU
  const mainMenuItems: { key: ViewKey; label: string; icon: React.FC<any>; badge?: number }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'upload-documents', label: 'Upload Documents', icon: UploadCloud, badge: badgeCounts?.unprocessedRecords ?? 0 },
    { key: 'data-explorer', label: 'Data Explorer', icon: TableProperties },
    { key: 'ai-analysis', label: 'AI Analysis', icon: Sparkles },
    { key: 'service-recommendations', label: 'Service Recommendations', icon: Award },
  ];

  // Section 2: SALES OUTREACH
  const outreachItems: { key: ViewKey; label: string; icon: React.FC<any> }[] = [
    { key: 'marketing-generator', label: 'AI Message Generator', icon: Wand2 },
    { key: 'cold-call-studio', label: 'Cold Call Studio', icon: PhoneCall },
    { key: 'whatsapp-outreach', label: 'WhatsApp Outreach', icon: MessageSquare },
    { key: 'cold-email-studio', label: 'Cold Email Studio', icon: Mail },
  ];

  // Section 3: CRM & EXECUTION
  const crmItems: { key: ViewKey; label: string; icon: React.FC<any>; badge?: number }[] = [
    { key: 'crm-leads', label: 'CRM & Leads', icon: Users2, badge: badgeCounts?.leads ?? 0 },
    { key: 'follow-up-tasks', label: 'Follow-up Tasks', icon: CalendarCheck2, badge: badgeCounts?.dueToday ?? 0 },
    { key: 'sales-pipeline', label: 'Sales Pipeline', icon: KanbanSquare },
    { key: 'reports-analytics', label: 'Reports & Analytics', icon: BarChart3 },
  ];

  // Section 4: GOVERNANCE & CONFIG
  const configItems: { key: ViewKey; label: string; icon: React.FC<any> }[] = [
    { key: 'service-catalog', label: 'Service Catalog', icon: BookOpenCheck },
    { key: 'team-management', label: 'Team Management', icon: UserCheck },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleItemClick = (key: ViewKey) => {
    onSelectView(key);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderNavItem = (
    item: { key: ViewKey; label: string; icon: React.FC<any>; badge?: number },
    collapsed: boolean = false
  ) => {
    const Icon = item.icon;
    const isActive = currentView === item.key;

    return (
      <button
        key={item.key}
        onClick={() => handleItemClick(item.key)}
        className={`w-full flex items-center ${
          collapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2.5'
        } rounded-xl text-xs font-medium transition-all group cursor-pointer ${
          isActive
            ? 'bg-[#0f4d3a] text-white font-semibold shadow-xs ring-1 ring-emerald-500/30'
            : 'text-emerald-100/70 hover:text-white hover:bg-emerald-900/30'
        }`}
        title={collapsed ? item.label : undefined}
      >
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} min-w-0`}>
          <Icon
            className={`w-4 h-4 shrink-0 transition-colors ${
              isActive ? 'text-emerald-300' : 'text-emerald-300/60 group-hover:text-emerald-200'
            }`}
          />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </div>
        {!collapsed && item.badge !== undefined && item.badge > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#04241b] text-emerald-300 border border-emerald-700/60 shrink-0">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  // Reusable Nav Content
  const renderNavSections = (collapsed: boolean = false) => (
    <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 relative z-10 custom-scrollbar">
      {/* 1. MAIN MENU */}
      <div>
        {!collapsed && (
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400/70">
            Main Menu
          </div>
        )}
        <div className="space-y-1">
          {mainMenuItems.map((item) => renderNavItem(item, collapsed))}
        </div>
      </div>

      {/* 2. SALES OUTREACH */}
      <div>
        {!collapsed && (
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400/70">
            Sales Outreach
          </div>
        )}
        <div className="space-y-1">
          {outreachItems.map((item) => renderNavItem(item, collapsed))}
        </div>
      </div>

      {/* 3. CRM & EXECUTION */}
      <div>
        {!collapsed && (
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400/70">
            CRM & Execution
          </div>
        )}
        <div className="space-y-1">
          {crmItems.map((item) => renderNavItem(item, collapsed))}
        </div>
      </div>

      {/* 4. GOVERNANCE & CONFIG */}
      <div>
        {!collapsed && (
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400/70">
            Governance & Config
          </div>
        )}
        <div className="space-y-1">
          {configItems.map((item) => renderNavItem(item, collapsed))}
        </div>
      </div>
    </nav>
  );

  // Reusable Profile Footer
  const renderProfileFooter = (collapsed: boolean = false) => (
    <div className="p-3 border-t border-emerald-900/40 bg-[#021812]/80 relative z-10 shrink-0">
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between px-2'} py-1`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-2.5'} min-w-0`}>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-600/50 shrink-0">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
              alt="Ashwin Kumar"
              className="w-full h-full object-cover"
            />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">Ashwin Kumar</p>
              <p className="text-[10px] text-emerald-300/70 truncate">Director / Admin</p>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={() => handleItemClick('settings')}
            className="text-emerald-400/70 hover:text-white p-1 rounded-md hover:bg-emerald-900/40 transition-colors ml-1 cursor-pointer"
            title="Log out or settings"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ============================================================== */}
      {/* 1. MOBILE SLIDE-OUT DRAWER WITH OVERLAY (SCREEN < LG)           */}
      {/* ============================================================== */}
      {/* Semi-transparent Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      {/* Slide-out Navigation Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[85%] max-w-[320px] bg-[#00251C] text-white flex flex-col h-full select-none shadow-2xl transition-transform duration-300 ease-in-out lg:hidden overflow-hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Background organic waves effect */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
          <svg
            viewBox="0 0 300 800"
            className="absolute -bottom-10 -right-20 w-[420px] h-[580px] stroke-emerald-400"
            fill="none"
            strokeWidth="1.2"
          >
            <path d="M50,800 C120,700 80,600 220,520 C320,460 260,340 300,200" opacity="0.4" />
            <path d="M80,800 C150,710 110,610 240,530 C340,470 280,350 320,220" opacity="0.5" />
            <path d="M110,800 C180,720 140,620 260,540 C360,480 300,360 340,240" opacity="0.6" />
            <path d="M140,800 C210,730 170,630 280,550 C380,490 320,370 360,260" opacity="0.7" />
            <path d="M170,800 C240,740 200,640 300,560 C400,500 340,380 380,280" opacity="0.8" />
          </svg>
        </div>

        {/* Mobile Drawer Header with Close Button */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-emerald-900/40 relative z-10 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-extrabold text-base shadow-sm">
              Q
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-white tracking-wider text-sm">QUENOXA</span>
              </div>
              <p className="text-[10px] text-emerald-300/70 font-normal leading-tight">Global Technologies</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/80 shadow-2xs">
              AI SALES
            </span>
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-emerald-300/80 hover:text-white hover:bg-emerald-900/40 transition-colors cursor-pointer"
              title="Close menu"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation items for Mobile */}
        {renderNavSections(false)}

        {/* User Profile for Mobile */}
        {renderProfileFooter(false)}
      </aside>

      {/* ============================================================== */}
      {/* 2. DESKTOP SIDEBAR (SCREEN >= LG)                              */}
      {/* ============================================================== */}
      <aside
        className={`hidden lg:flex flex-col h-screen select-none shrink-0 z-30 relative overflow-hidden bg-[#00251C] text-white border-r border-emerald-950/60 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-68'
        }`}
      >
        {/* Background organic waves effect */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
          <svg
            viewBox="0 0 300 800"
            className="absolute -bottom-10 -right-20 w-[420px] h-[580px] stroke-emerald-400"
            fill="none"
            strokeWidth="1.2"
          >
            <path d="M50,800 C120,700 80,600 220,520 C320,460 260,340 300,200" opacity="0.4" />
            <path d="M80,800 C150,710 110,610 240,530 C340,470 280,350 320,220" opacity="0.5" />
            <path d="M110,800 C180,720 140,620 260,540 C360,480 300,360 340,240" opacity="0.6" />
            <path d="M140,800 C210,730 170,630 280,550 C380,490 320,370 360,260" opacity="0.7" />
            <path d="M170,800 C240,740 200,640 300,560 C400,500 340,380 380,280" opacity="0.8" />
          </svg>
        </div>

        {/* Brand Header */}
        <div
          className={`h-16 px-4 flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          } border-b border-emerald-900/40 relative z-10 shrink-0`}
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-extrabold text-base shadow-sm shrink-0">
              Q
            </div>
            {!isCollapsed && (
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-white tracking-wider text-sm">QUENOXA</span>
                </div>
                <p className="text-[10px] text-emerald-300/70 font-normal leading-tight">Global Technologies</p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex items-center space-x-1.5">
              <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/80 shadow-2xs">
                AI SALES
              </span>
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="p-1 rounded-md text-emerald-400/60 hover:text-white hover:bg-emerald-900/40 transition-colors cursor-pointer"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {isCollapsed && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded-md text-emerald-400/60 hover:text-white hover:bg-emerald-900/40 transition-colors cursor-pointer ml-1"
              title="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        {renderNavSections(isCollapsed)}

        {/* User Profile Footer */}
        {renderProfileFooter(isCollapsed)}
      </aside>
    </>
  );
};
