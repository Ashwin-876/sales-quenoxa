import React, { useState } from 'react';
import {
  Search,
  Calendar,
  ChevronDown,
  Bell,
  UploadCloud,
  RotateCcw,
  Menu
} from 'lucide-react';
import { ViewKey } from './Sidebar';

interface HeaderProps {
  currentView: ViewKey;
  onNavigate: (view: ViewKey) => void;
  onOpenMobileNav?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
  onSeedData?: () => void;
  isSeeding?: boolean;
  onResetData?: () => void;
  isResetting?: boolean;
  dueTodayCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenMobileNav,
  onResetData,
  isResetting,
  dueTodayCount = 0
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('Oct 26, 2026');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const dateOptions = [
    'Oct 26, 2026',
    'Today',
    'This Week',
    'This Month',
    'Last 30 Days',
    'All Time'
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('data-explorer');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
      {/* ========================================================== */}
      {/* 1. MOBILE BRAND HEADER (VISIBLE ON MOBILE < LG)            */}
      {/* ========================================================== */}
      <div className="flex items-center space-x-2.5 lg:hidden">
        {/* Emerald Q Logo Badge */}
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-extrabold text-base shadow-sm shrink-0">
          Q
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-900 tracking-wider text-sm truncate">QUENOXA</span>
            <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs shrink-0">
              AI SALES
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-normal leading-tight truncate">Global Technologies</p>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 2. DESKTOP SEARCH BAR (VISIBLE ON DESKTOP >= LG)           */}
      {/* ========================================================== */}
      <form onSubmit={handleSearchSubmit} className="hidden lg:block relative w-80 xl:w-96">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search leads, documents, customers..."
          className="w-full pl-9 pr-4 py-2 bg-slate-100/70 border border-slate-200/70 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
      </form>

      {/* ========================================================== */}
      {/* 3. RIGHT CONTROLS (RESPONSIVE)                             */}
      {/* ========================================================== */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Date Selector Dropdown (Requirement 4) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs font-medium cursor-pointer"
            title="Select date range"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="hidden sm:inline font-semibold text-slate-800">{dateRange}</span>
            <span className="sm:hidden text-[11px] font-semibold text-slate-800">{dateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {showDatePicker && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 text-xs animate-in fade-in">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
                Filter Date Range
              </div>
              {dateOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setDateRange(opt);
                    setShowDatePicker(false);
                  }}
                  className={`w-full text-left px-3.5 py-1.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                    dateRange === opt ? 'font-bold text-emerald-700 bg-emerald-50/50' : 'text-slate-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Upload action (Desktop) */}
        <button
          onClick={() => onNavigate('upload-documents')}
          className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 transition-all shadow-2xs cursor-pointer"
          title="Upload new documents"
        >
          <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden xl:inline">Upload</span>
        </button>

        {/* Reset Account (Discreet) */}
        {onResetData && (
          <button
            onClick={onResetData}
            disabled={isResetting}
            className="hidden 2xl:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Reset demo data"
          >
            <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin text-rose-500' : ''}`} />
            <span>Reset</span>
          </button>
        )}

        {/* Notifications Bell */}
        <button
          onClick={() => onNavigate('follow-up-tasks')}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Notifications & follow-ups"
        >
          <Bell className="w-4 h-4 text-slate-600" />
          {dueTodayCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
          )}
        </button>

        {/* User Profile Avatar "AK" (Desktop) */}
        <button
          onClick={() => onNavigate('settings')}
          className="hidden sm:flex w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs items-center justify-center shadow-xs hover:ring-2 hover:ring-emerald-500/40 transition-all cursor-pointer"
          title="Ashwin Kumar (Settings)"
        >
          AK
        </button>

        {/* ========================================================== */}
        {/* 4. HAMBURGER MENU BUTTON ON MOBILE (REQUIREMENT 2 & 4)     */}
        {/* ========================================================== */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer lg:hidden"
          title="Open navigation menu"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5 text-slate-800" />
        </button>
      </div>
    </header>
  );
};
