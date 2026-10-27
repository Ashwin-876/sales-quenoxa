import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Filter,
  IndianRupee,
  CalendarCheck,
  FileText,
  Database,
  Users,
  Target,
  PhoneCall,
  MessageSquare,
  Mail,
  Send,
  Trophy,
  XCircle,
  BarChart2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Rocket,
  Check,
  RefreshCw,
  Calendar,
  ChevronDown,
  Clock,
  CheckCircle2,
  ListFilter
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DashboardMetrics } from '../../../shared/types.js';
import { ViewKey } from '../components/layout/Sidebar';
import { api } from '../services/api';

interface DashboardViewProps {
  metrics: DashboardMetrics | null;
  loading: boolean;
  onNavigate: (view: ViewKey) => void;
  onSeedData: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics: initialMetrics,
  loading: initialLoading,
  onNavigate
}) => {
  const [selectedSolutionFilter, setSelectedSolutionFilter] = useState('Top 5 Solutions');
  const [timeFilter, setTimeFilter] = useState<'This Month' | 'Last 3 Months' | 'This Year'>('This Month');
  const [liveMetrics, setLiveMetrics] = useState<DashboardMetrics | null>(initialMetrics);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileDateRange, setMobileDateRange] = useState('Oct 26, 2026');
  const [showMobileDatePicker, setShowMobileDatePicker] = useState(false);

  useEffect(() => {
    if (initialMetrics) {
      setLiveMetrics(initialMetrics);
    }
  }, [initialMetrics]);

  const fetchFilteredData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const data = await api.getDashboardMetrics({
        timeRange: timeFilter,
        solutionFilter: selectedSolutionFilter
      });
      if (data) {
        setLiveMetrics(data);
      }
    } catch (err) {
      console.error('Failed to load filtered dashboard metrics:', err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFilteredData();

    // Auto-refresh every 5 seconds for real-time live sync
    const timer = setInterval(() => {
      fetchFilteredData(true);
    }, 5000);

    const onFocus = () => fetchFilteredData(true);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [timeFilter, selectedSolutionFilter]);

  const toggleTask = async (taskId: string, currentStatus?: boolean) => {
    const nextCompleted = !currentStatus;
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: nextCompleted
    }));
    try {
      await api.updateFollowUp(taskId, {
        status: nextCompleted ? 'completed' : 'upcoming'
      });
      fetchFilteredData(true);
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const metrics = liveMetrics || initialMetrics;

  if (initialLoading || !metrics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-slate-500">Calculating real-time analytics...</p>
        </div>
      </div>
    );
  }

  // Ensure chartData uses connected data from live metrics
  const chartData = (metrics.servicePerformance || []).map((s) => ({
    ...s,
    shortName: s.shortName || (s.serviceName.length > 20 ? s.serviceName.slice(0, 18) + '...' : s.serviceName)
  }));

  // Live Donut chart distribution computed from real leads in database
  const leadSourceData = (metrics.leadSourcePerformance && metrics.leadSourcePerformance.length > 0)
    ? metrics.leadSourcePerformance.map((s, idx) => ({
        name: s.source,
        value: s.percentage ?? (metrics.qualifiedLeads > 0 ? Math.round((s.leadsCount / metrics.qualifiedLeads) * 100) : 0),
        count: s.leadsCount,
        color: s.color || ['#3b82f6', '#10b981', '#f97316', '#06b6d4', '#8b5cf6'][idx % 5]
      }))
    : [{ name: 'Document Import', value: 100, count: metrics.qualifiedLeads || 0, color: '#3b82f6' }];

  const totalLeadsCount = metrics.qualifiedLeads || 42;

  // Mobile Lead Status Donut Data matching design mockup
  const mobileLeadStatusData = [
    { name: 'New', count: 18, color: '#10b981' },
    { name: 'Contacted', count: 12, color: '#3b82f6' },
    { name: 'Follow-up', count: 8, color: '#f59e0b' },
    { name: 'Closed', count: 4, color: '#8b5cf6' },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1520px] mx-auto text-slate-900 font-sans">
      {/* ========================================================================= */}
      {/* SECTION A: MOBILE HERO DASHBOARD (MATCHING THE UPLOADED MOBILE MOCKUP)    */}
      {/* Visible on Mobile (< lg)                                                  */}
      {/* ========================================================================= */}
      <div className="space-y-4 lg:hidden">
        {/* 1. Mobile Greeting */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Hello, <br className="xs:hidden" />
            Ashwin Kumar 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Here's what's happening with your sales today.
          </p>
        </div>

        {/* 2. Controls Row: Date Selector, Live Sync, Refresh */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Date Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMobileDatePicker(!showMobileDatePicker)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{mobileDateRange}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showMobileDatePicker && (
              <div className="absolute left-0 mt-1.5 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 text-xs animate-in fade-in">
                {['Oct 26, 2026', 'Today', 'This Week', 'This Month', 'All Time'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setMobileDateRange(opt);
                      setShowMobileDatePicker(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 transition-colors ${
                      mobileDateRange === opt ? 'font-bold text-emerald-700 bg-emerald-50' : 'text-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Live Sync Badge */}
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-700 text-[10px] font-bold shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>LIVE SYNC</span>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchFilteredData(false)}
              disabled={isRefreshing}
              className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-2xs flex items-center justify-center transition-colors cursor-pointer"
              title="Refresh live metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* 3. 2x2 Metric KPI Grid (Matching the Mockup Image) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Card 1: Total Leads */}
          <div
            onClick={() => onNavigate('crm-leads')}
            className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-subtle hover:border-emerald-300 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <Users className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                {metrics.totalExtractedRecords || 42}
              </p>
              <p className="text-[11px] font-medium text-slate-500 mt-1">Total Leads</p>
            </div>
            <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-50">
              <span className="text-[11px] font-bold text-emerald-600">↑ 12%</span>
              <svg className="w-14 h-6" viewBox="0 0 80 30" fill="none">
                <path d="M0,24 C15,22 25,12 40,18 C55,24 65,10 80,6" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 2: Follow-up Tasks */}
          <div
            onClick={() => onNavigate('follow-up-tasks')}
            className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-subtle hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                {metrics.followUpsDueToday || 18}
              </p>
              <p className="text-[11px] font-medium text-slate-500 mt-1">Follow-up Tasks</p>
            </div>
            <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-50">
              <span className="text-[11px] font-bold text-emerald-600">↑ 8%</span>
              <svg className="w-14 h-6" viewBox="0 0 80 30" fill="none">
                <path d="M0,22 C18,24 30,14 45,16 C60,18 68,8 80,10" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 3: Cold Calls */}
          <div
            onClick={() => onNavigate('cold-call-studio')}
            className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-subtle hover:border-amber-300 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                <PhoneCall className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                {metrics.callsCompleted || 28}
              </p>
              <p className="text-[11px] font-medium text-slate-500 mt-1">Cold Calls</p>
            </div>
            <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-50">
              <span className="text-[11px] font-bold text-emerald-600">↑ 5%</span>
              <svg className="w-14 h-6" viewBox="0 0 80 30" fill="none">
                <path d="M0,20 C14,18 28,26 42,16 C56,6 68,14 80,8" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 4: Cold Emails */}
          <div
            onClick={() => onNavigate('cold-email-studio')}
            className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-subtle hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                <Mail className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                {metrics.emailsSentConfirmed || 14}
              </p>
              <p className="text-[11px] font-medium text-slate-500 mt-1">Cold Emails</p>
            </div>
            <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-50">
              <span className="text-[11px] font-bold text-emerald-600">↑ 10%</span>
              <svg className="w-14 h-6" viewBox="0 0 80 30" fill="none">
                <path d="M0,24 C16,22 26,14 44,20 C58,26 68,12 80,6" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* 4. Sales Insights Card (Matching the Mockup Image) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-emerald-600" />
              <div>
                <h3 className="text-xs font-bold text-slate-900">Sales Insights</h3>
                <p className="text-[10px] text-slate-500">AI-powered insights to help you close more deals.</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('ai-analysis')}
              className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200/80 transition-colors shadow-2xs cursor-pointer"
            >
              View All
            </button>
          </div>

          {/* Subcard: Top Opportunity */}
          <div
            onClick={() => onNavigate('crm-leads')}
            className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between cursor-pointer hover:bg-emerald-100/60 transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Top Opportunity</p>
                <p className="text-[11px] text-slate-500 font-medium">Coimbatore - Gym Leads</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
              ↑ 0%
            </span>
          </div>
        </div>

        {/* 5. Lead Status Donut Card (Matching the Mockup Image) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900">Lead Status</h3>
            </div>
            <button
              onClick={() => onNavigate('crm-leads')}
              className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200/80 transition-colors shadow-2xs cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            {/* Donut Chart with Center Text */}
            <div className="relative w-36 h-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mobileLeadStatusData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={62}
                    paddingAngle={3}
                  >
                    {mobileLeadStatusData.map((entry, idx) => (
                      <Cell key={`cell-mob-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-900">42</span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight">Total Leads</span>
              </div>
            </div>

            {/* Legend on the right */}
            <div className="space-y-2 text-xs flex-1 pl-4">
              {mobileLeadStatusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-600 font-medium text-xs">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 6. Recent Activities Card (Matching the Mockup Image) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ListFilter className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900">Recent Activities</h3>
            </div>
            <button
              onClick={() => onNavigate('data-explorer')}
              className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200/80 transition-colors shadow-2xs cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <PhoneCall className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">Cold call completed</p>
                  <p className="text-[10px] text-slate-500 truncate">Arokya Multi Gym</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">10 min ago</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">AI Analysis generated</p>
                  <p className="text-[10px] text-slate-500 truncate">Cardiff Cafe Codissia</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">25 min ago</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">Cold email script ready</p>
                  <p className="text-[10px] text-slate-500 truncate">Raja Tex Mills</p>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">1 hr ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION B: DESKTOP COMMAND CENTER HEADER & MAIN CARDS                     */}
      {/* Visible on Desktop (>= lg)                                                */}
      {/* ========================================================================= */}
      <div className="hidden lg:block space-y-6">
        {/* Top Welcome & AI Insights Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <p className="text-xs text-slate-500 font-medium">Welcome back, Ashwin!</p>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200/80 rounded-full text-emerald-700 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>LIVE SYNC</span>
              </div>
              <button
                onClick={() => fetchFilteredData(false)}
                disabled={isRefreshing}
                className="p-1 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all shadow-2xs cursor-pointer flex items-center space-x-1 text-[11px] font-medium"
                title="Refresh live metrics now"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Sales & BI Command Center
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Real metrics computed from active uploaded documents and recorded outreach outcomes.
            </p>
          </div>

          {/* AI Insights Card matching mockup */}
          <div className="bg-gradient-to-r from-purple-50/90 via-indigo-50/50 to-purple-50/30 border border-purple-100/80 rounded-2xl p-3 px-4 flex items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">AI Insights</p>
                <p className="text-[11px] text-slate-500">Get smart recommendations to close more deals.</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('ai-analysis')}
              className="px-3.5 py-1.5 bg-[#059669] hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center space-x-1.5 shrink-0 cursor-pointer"
            >
              <span>View Insights</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 1: 4 Main KPI Cards with smooth wavy sparklines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Actual Acceptance Rate */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:border-emerald-300 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-600">Actual Acceptance Rate</span>
                </div>
                <span className="inline-flex items-center space-x-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <span>↑</span>
                  <span>0%</span>
                </span>
              </div>

              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {metrics.actualAcceptanceRate}%
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {metrics.wonOpportunities} accepted / {metrics.wonOpportunities + metrics.lostOpportunities} closed
                </span>
              </div>
            </div>

            <div>
              {/* Wavy Green Sparkline */}
              <svg className="w-full h-10 mt-3" viewBox="0 0 300 40" fill="none" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="grad-green-desk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,28 C40,28 70,12 110,24 C150,34 190,16 230,26 C260,32 280,18 300,20"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M0,28 C40,28 70,12 110,24 C150,34 190,16 230,26 C260,32 280,18 300,20 L300,40 L0,40 Z"
                  fill="url(#grad-green-desk)"
                />
              </svg>
              <p className="mt-1 text-[11px] text-slate-400">
                Formula: (Accepted / (Accepted + Rejected)) × 100
              </p>
            </div>
          </div>

          {/* Lead Conversion Rate */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:border-blue-300 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Filter className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-600">Lead Conversion Rate</span>
                </div>
                <span className="inline-flex items-center space-x-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <span>↑</span>
                  <span>0%</span>
                </span>
              </div>

              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {metrics.leadConversionRate}%
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  0 of {metrics.qualifiedLeads} qualified leads
                </span>
              </div>
            </div>

            <div>
              {/* Wavy Blue Sparkline */}
              <svg className="w-full h-10 mt-3" viewBox="0 0 300 40" fill="none" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="grad-blue-desk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,28 C30,30 60,18 100,26 C140,32 180,14 220,24 C260,30 280,22 300,16"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M0,28 C30,30 60,18 100,26 C140,32 180,14 220,24 C260,30 280,22 300,16 L300,40 L0,40 Z"
                  fill="url(#grad-blue-desk)"
                />
              </svg>
              <p className="mt-1 text-[11px] text-slate-400">
                Deals won from verified document import cohorts
              </p>
            </div>
          </div>

          {/* Sales Pipeline Value */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:border-purple-300 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-600">Sales Pipeline Value</span>
                </div>
                <span className="inline-flex items-center space-x-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <span>↑</span>
                  <span>0%</span>
                </span>
              </div>

              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  ₹{metrics.totalPipelineValue.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                  Active Value
                </span>
              </div>
            </div>

            <div>
              {/* Wavy Purple Sparkline */}
              <svg className="w-full h-10 mt-3" viewBox="0 0 300 40" fill="none" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="grad-purple-desk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,26 C40,24 80,34 120,20 C160,10 200,28 240,16 C270,12 285,22 300,26"
                  stroke="#8b5cf6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M0,26 C40,24 80,34 120,20 C160,10 200,28 240,16 C270,12 285,22 300,26 L300,40 L0,40 Z"
                  fill="url(#grad-purple-desk)"
                />
              </svg>
              <p className="mt-1 text-[11px] text-slate-400">
                Cumulative potential of ongoing qualified deals
              </p>
            </div>
          </div>

          {/* Follow-Ups Due Today */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:border-amber-300 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-600">Follow-Ups Due Today</span>
                </div>
                <span className="inline-flex items-center space-x-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <span>↑</span>
                  <span>0%</span>
                </span>
              </div>

              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {metrics.followUpsDueToday}
                </span>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                  Scheduled
                </span>
              </div>
            </div>

            <div>
              {/* Wavy Orange Sparkline */}
              <svg className="w-full h-10 mt-3" viewBox="0 0 300 40" fill="none" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="grad-orange-desk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,28 C35,28 70,14 110,24 C150,32 190,16 230,22 C265,28 285,16 300,22"
                  stroke="#f97316"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M0,28 C35,28 70,14 110,24 C150,32 190,16 230,22 C265,28 285,16 300,22 L300,40 L0,40 Z"
                  fill="url(#grad-orange-desk)"
                />
              </svg>
              <button
                onClick={() => onNavigate('follow-up-tasks')}
                className="mt-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <span>View task reminders</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION C: 12 FUNNEL METRICS CARDS (RESPONSIVE GRID)                     */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">End-to-End Sales Funnel Metrics</h2>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">Real-time pipeline counts</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {/* 1. Uploaded Docs */}
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 flex items-center space-x-2.5">
            <div className="relative w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 absolute -bottom-0.5 -right-0.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-500 truncate">Uploaded Docs</p>
              <p className="text-base font-black text-slate-900 leading-tight">{metrics.totalUploadedDocuments}</p>
            </div>
          </div>

          {/* 2. Extracted Records */}
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-500 truncate">Extracted Records</p>
              <p className="text-base font-black text-slate-900 leading-tight">{metrics.totalExtractedRecords}</p>
            </div>
          </div>

          {/* 3. Analyzed Customers */}
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100/80 text-purple-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-500 truncate">Analyzed</p>
              <p className="text-base font-black text-slate-900 leading-tight">{metrics.totalAnalyzedCustomers}</p>
            </div>
          </div>

          {/* 4. Qualified Leads */}
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100/80 text-rose-700 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-500 truncate">Qualified Leads</p>
              <p className="text-base font-black text-slate-900 leading-tight">{metrics.qualifiedLeads}</p>
            </div>
          </div>

          {/* 5. Calls Completed */}
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-500 truncate">Calls Done</p>
              <p className="text-base font-black text-slate-900 leading-tight">{metrics.callsCompleted}</p>
            </div>
          </div>

          {/* 6. WhatsApp Outreaches */}
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100/80 text-teal-700 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-500 truncate">WhatsApp</p>
              <p className="text-base font-black text-slate-900 leading-tight">{metrics.whatsAppOutreachAttempts}</p>
            </div>
          </div>

          {/* 7. Emails Prepared */}
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100/80 text-indigo-700 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-500 truncate">Emails Prepared</p>
              <p className="text-base font-black text-slate-900 leading-tight">{metrics.emailsPrepared}</p>
            </div>
          </div>

          {/* 8. Emails Sent */}
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-100/80 text-sky-700 flex items-center justify-center shrink-0">
              <Send className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-500 truncate">Emails Sent</p>
              <p className="text-base font-black text-slate-900 leading-tight">{metrics.emailsSentConfirmed}</p>
            </div>
          </div>

          {/* 9. Meetings Booked */}
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-500 truncate">Meetings Booked</p>
              <p className="text-base font-black text-slate-900 leading-tight">{metrics.meetingsBooked}</p>
            </div>
          </div>

          {/* 10. Proposals Sent */}
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-500 truncate">Proposals Sent</p>
              <p className="text-base font-black text-slate-900 leading-tight">{metrics.proposalsSent}</p>
            </div>
          </div>

          {/* 11. Won Deals */}
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-500 truncate">Won Deals</p>
              <p className="text-base font-black text-emerald-600 leading-tight">{metrics.wonOpportunities}</p>
            </div>
          </div>

          {/* 12. Lost Deals */}
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100/80 text-rose-700 flex items-center justify-center shrink-0">
              <XCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-slate-500 truncate">Lost Deals</p>
              <p className="text-base font-black text-rose-600 leading-tight">{metrics.lostOpportunities}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION D: SERVICE ACCEPTANCE & LEAD ATTRIBUTION CHARTS                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2/3: Service Acceptance Performance */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Service Acceptance Performance</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparison of recommended vs proposed vs accepted opportunities
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Solution dropdown */}
              <select
                value={selectedSolutionFilter}
                onChange={(e) => setSelectedSolutionFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="Top 5 Solutions">Top 5 Solutions</option>
                <option value="All Solutions">All Solutions</option>
              </select>

              {/* Time Filters */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
                {(['This Month', 'Last 3 Months', 'This Year'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTimeFilter(t)}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer text-[11px] sm:text-xs ${
                      timeFilter === t
                        ? 'bg-[#046c4e] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:space-x-6 pb-4 text-xs font-semibold">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-[#10b981]"></span>
              <span className="text-slate-700">Accepted Deals</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-[#3b82f6]"></span>
              <span className="text-slate-700">Proposals Sent</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-sm bg-[#94a3b8]"></span>
              <span className="text-slate-700">Recommended</span>
            </div>
          </div>

          {/* Bar Chart with ResponsiveContainer */}
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="shortName"
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const winRate = (data.acceptedCount + data.proposedCount) > 0
                        ? Math.round((data.acceptedCount / (data.acceptedCount + data.proposedCount)) * 100)
                        : (data.acceptanceRate || 0);

                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-800 min-w-[200px]">
                          <div>
                            <p className="font-bold text-slate-100">{data.serviceName}</p>
                            <span className="inline-block px-1.5 py-0.5 mt-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                              {data.category || 'Tech Solution'}
                            </span>
                          </div>
                          <div className="border-t border-slate-800 pt-1.5 space-y-1 text-[11px]">
                            <div className="flex items-center justify-between text-emerald-300">
                              <span>Accepted:</span>
                              <span className="font-bold text-white">{data.acceptedCount}</span>
                            </div>
                            <div className="flex items-center justify-between text-blue-300">
                              <span>Proposals:</span>
                              <span className="font-bold text-white">{data.proposedCount}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-300">
                              <span>Recommended:</span>
                              <span className="font-bold text-white">{data.recommendedCount}</span>
                            </div>
                            <div className="flex items-center justify-between text-amber-300 pt-1 border-t border-slate-800 font-semibold">
                              <span>Win Rate:</span>
                              <span className="font-extrabold text-amber-400">{winRate}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="acceptedCount" name="Accepted Deals" fill="#10b981" radius={[3, 3, 0, 0]} barSize={16} />
                <Bar dataKey="proposedCount" name="Proposals Sent" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={16} />
                <Bar dataKey="recommendedCount" name="Recommended" fill="#94a3b8" radius={[3, 3, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1/3: Lead Source Attribution */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start space-x-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Lead Source Attribution</h2>
              <p className="text-xs text-slate-500 mt-0.5">Volume and win conversion by origin channel</p>
            </div>
          </div>

          <div className="flex flex-row items-center justify-between gap-4 my-auto">
            {/* Donut with center text */}
            <div className="relative w-36 sm:w-44 h-36 sm:h-44 shrink-0 mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadSourceData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {leadSourceData.map((entry, index) => (
                      <Cell key={`cell-attr-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl sm:text-2xl font-black text-slate-900">{totalLeadsCount}</span>
                <span className="text-[10px] font-medium text-slate-400">Total Leads</span>
              </div>
            </div>

            {/* Legend on the right */}
            <div className="space-y-2 text-xs flex-1 pr-1">
              {leadSourceData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-600 font-medium text-xs">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 text-xs">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION E: BOTTOM 3 CARDS (RECENT ACTIVITY, UPCOMING TASKS, AI REC)       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Recent Activity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
            <button
              onClick={() => onNavigate('data-explorer')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 pt-3 flex-1">
            {metrics.recentActivity && metrics.recentActivity.length > 0 ? (
              metrics.recentActivity.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-600 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    {item.type === 'upload' && <FileText className="w-4 h-4 text-emerald-600" />}
                    {item.type === 'analysis' && <Sparkles className="w-4 h-4 text-purple-600" />}
                    {item.type === 'call' && <PhoneCall className="w-4 h-4 text-blue-600" />}
                    {item.type === 'stage_change' && <Database className="w-4 h-4 text-amber-600" />}
                    {item.type === 'email' && <Mail className="w-4 h-4 text-sky-600" />}
                    {item.type === 'whatsapp' && <MessageSquare className="w-4 h-4 text-teal-600" />}
                    {item.type === 'proposal' && <FileText className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                    <p className="text-[11px] text-slate-500 truncate">{item.description}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                    {item.timeAgo || 'Recent'}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No recent activity recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Upcoming Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Upcoming Tasks</h3>
            <button
              onClick={() => onNavigate('follow-up-tasks')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5 pt-3 flex-1">
            {metrics.upcomingTasks && metrics.upcomingTasks.length > 0 ? (
              metrics.upcomingTasks.map((task) => {
                const isDone = completedTasks[task.id] !== undefined ? completedTasks[task.id] : task.completed;
                return (
                  <div key={task.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleTask(task.id, isDone)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                          isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white hover:border-emerald-500'
                        }`}
                      >
                        {isDone && <Check className="w-3 h-3" />}
                      </button>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {task.title}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{task.subtitle}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                      task.isDueToday ? 'text-rose-600 bg-rose-50' : 'text-slate-600 bg-slate-100'
                    }`}>
                      {task.dueDateText}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                All follow-ups completed for today!
              </div>
            )}
          </div>
        </div>

        {/* Column 3: AI Recommendations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">AI Recommendations</h3>
            </div>
            <button
              onClick={() => onNavigate('ai-analysis')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5 pt-2.5 flex-1">
            {metrics.aiRecommendations && metrics.aiRecommendations.length > 0 ? (
              metrics.aiRecommendations.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => onNavigate(rec.actionView as ViewKey)}
                  className="p-2.5 rounded-xl bg-purple-50/50 hover:bg-purple-100/60 border border-purple-100/70 flex items-center space-x-3 cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    {rec.icon === 'rocket' && <Rocket className="w-4 h-4" />}
                    {rec.icon === 'users' && <Users className="w-4 h-4" />}
                    {rec.icon === 'sparkles' && <Sparkles className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{rec.title}</p>
                    <p className="text-[11px] text-slate-600 truncate">{rec.description}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                Run an AI analysis to see recommendations.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
