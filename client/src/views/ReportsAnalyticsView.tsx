import React, { useState, useMemo } from 'react';
import {
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Trophy,
  Users,
  Send,
  PhoneCall,
  Search,
  ArrowUpRight,
  Calculator,
  Layers,
  Activity,
  Zap,
  Info
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DashboardMetrics } from '../../../shared/types.js';

interface ReportsAnalyticsViewProps {
  metrics: DashboardMetrics | null;
}

export const ReportsAnalyticsView: React.FC<ReportsAnalyticsViewProps> = ({ metrics }) => {
  const [dateRange, setDateRange] = useState<'Fiscal Year 2026' | 'Q4 2026' | 'This Month' | 'All Time'>('Fiscal Year 2026');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Fallback safe metric values
  const safeMetrics = useMemo(() => {
    return {
      totalExtractedRecords: metrics?.totalExtractedRecords ?? 0,
      qualifiedLeads: metrics?.qualifiedLeads ?? 0,
      contacted: (metrics?.callsCompleted ?? 0) + (metrics?.whatsAppOutreachAttempts ?? 0),
      interestedCustomers: metrics?.interestedCustomers ?? 0,
      proposalsSent: metrics?.proposalsSent ?? 0,
      wonOpportunities: metrics?.wonOpportunities ?? 0,
      lostOpportunities: metrics?.lostOpportunities ?? 0,
      actualAcceptanceRate: metrics?.actualAcceptanceRate ?? 0,
      leadConversionRate: metrics?.leadConversionRate ?? 0,
      totalPipelineValue: metrics?.totalPipelineValue ?? 0,
      servicePerformance: metrics?.servicePerformance ?? []
    };
  }, [metrics]);

  // Categories extracted dynamically
  const categories = useMemo(() => {
    const list = Array.from(new Set(safeMetrics.servicePerformance.map(s => s.category).filter(Boolean)));
    return ['All', ...list];
  }, [safeMetrics.servicePerformance]);

  // Filtered service performance list
  const filteredServices = useMemo(() => {
    return safeMetrics.servicePerformance.filter(s => {
      const matchesSearch = s.serviceName.toLowerCase().includes(searchFilter.toLowerCase()) ||
                            s.category.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [safeMetrics.servicePerformance, searchFilter, selectedCategory]);

  // Category badge styling helper
  const getCategoryBadgeClass = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('ai') || cat.includes('machine')) return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
    if (cat.includes('web') || cat.includes('website')) return 'bg-blue-50 text-blue-700 border-blue-200/60';
    if (cat.includes('app') || cat.includes('software')) return 'bg-purple-50 text-purple-700 border-purple-200/60';
    if (cat.includes('digital') || cat.includes('portal')) return 'bg-cyan-50 text-cyan-700 border-cyan-200/60';
    if (cat.includes('automation')) return 'bg-amber-50 text-amber-700 border-amber-200/60';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const exportPdfExecutiveSummary = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(5, 150, 105);
    doc.text('QUENOXA GLOBAL TECHNOLOGIES', 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('EXECUTIVE SALES ACCEPTANCE & PIPELINE PERFORMANCE REPORT', 14, 28);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleString()} | Period: ${dateRange} | Compliance: Section 17 Verified`, 14, 34);

    autoTable(doc, {
      startY: 40,
      head: [['Key Executive Sales Metric', 'Calibrated Value', 'Standard Calculation Protocol']],
      body: [
        ['Total Leads Ingested', safeMetrics.totalExtractedRecords.toString(), 'All verified extracted customer records'],
        ['Contacted Prospects', safeMetrics.contacted.toString(), 'Calls + WhatsApp outreach executed'],
        ['Interested Prospects', safeMetrics.interestedCustomers.toString(), 'Expressed solution requirement'],
        ['Proposals Sent', safeMetrics.proposalsSent.toString(), 'Formal commercial solution documents delivered'],
        ['Accepted Proposals (Won)', safeMetrics.wonOpportunities.toString(), 'Customer accepted proposals'],
        ['Rejected Proposals (Lost)', safeMetrics.lostOpportunities.toString(), 'Final rejected solution proposals'],
        ['Actual Acceptance Rate', `${safeMetrics.actualAcceptanceRate}%`, 'Accepted / (Accepted + Rejected) * 100 (Excludes pending)'],
        ['Lead Conversion Rate', `${safeMetrics.leadConversionRate}%`, 'Won / Qualified Leads * 100'],
        ['Active Sales Pipeline Value', `₹${safeMetrics.totalPipelineValue.toLocaleString('en-IN')}`, 'Sum of active non-lost deals (INR)']
      ],
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] },
      styles: { fontSize: 8, cellPadding: 3 }
    });

    if (safeMetrics.servicePerformance.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Service Name', 'Category', 'Recommended', 'Proposed', 'Accepted', 'Win Rate']],
        body: safeMetrics.servicePerformance.map(s => [
          s.serviceName,
          s.category,
          s.recommendedCount.toString(),
          s.proposedCount.toString(),
          s.acceptedCount.toString(),
          `${s.acceptanceRate}%`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 8, cellPadding: 2.5 }
      });
    }

    doc.save(`Quenoxa_Executive_Sales_Report_${Date.now()}.pdf`);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      {/* ========================================================================= */}
      {/* 1. HERO HEADER WITH EXECUTIVE BADGE & EXPORT ACTIONS                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Audit Telemetry</span>
            </span>
            <span className="text-xs text-slate-400 font-medium">• Section 17 Certified</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Reports & Sales Performance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Unbiased acceptance formulas, service-wise win conversion, and certified audit reporting.
          </p>
        </div>

        {/* Right side: Period selector & Certified Export CTA buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Pills */}
          <div className="bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 flex items-center space-x-1 text-xs">
            {(['Fiscal Year 2026', 'Q4 2026', 'This Month', 'All Time'] as const).map(p => (
              <button
                key={p}
                onClick={() => setDateRange(p)}
                className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                  dateRange === p
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Download PDF Button */}
          <button
            onClick={exportPdfExecutiveSummary}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-sm cursor-pointer active:scale-98"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download PDF</span>
          </button>

          {/* Download Excel Button */}
          <a
            href="/api/v1/reports/excel"
            download
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all cursor-pointer active:scale-98"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Download Excel</span>
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STATISTICALLY CALIBRATED METHODOLOGY EXECUTIVE CARD                    */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-5 sm:p-6 shadow-xl border border-slate-700/60">
        {/* Background glow decoration */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-40 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Explanation */}
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2 text-emerald-400">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-extrabold uppercase tracking-wider">
                Statistically Calibrated Methodology (Section 17 Compliance)
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white">Actual Acceptance Rate</strong> is calculated strictly from completed deal proposals.
              Pending proposals and ongoing negotiations are omitted from the denominator to avoid statistical dilution and ensure executive audit veracity.
            </p>
          </div>

          {/* Right: Live Interactive Formula Visualizer Box */}
          <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/80 rounded-xl p-3.5 sm:p-4 shrink-0 shadow-inner">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Standard Acceptance Protocol</span>
              <span className="text-emerald-400 font-mono font-bold">
                = {safeMetrics.actualAcceptanceRate}%
              </span>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono">
              <div className="flex flex-col items-center">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-md font-bold">
                  Accepted ({safeMetrics.wonOpportunities})
                </span>
                <div className="w-full h-px bg-slate-600 my-1"></div>
                <span className="text-slate-400 text-[11px]">
                  Accepted ({safeMetrics.wonOpportunities}) + Rejected ({safeMetrics.lostOpportunities})
                </span>
              </div>
              <span className="text-slate-400 font-sans font-bold text-sm">×</span>
              <span className="bg-slate-700 text-slate-200 px-2 py-1 rounded-md font-bold text-xs">
                100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. EXECUTIVE KPI CARDS (6-COLUMN ELEVATED DESIGN)                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Total Leads */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Leads</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {safeMetrics.totalExtractedRecords}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Ingested cohorts</p>
          </div>
        </div>

        {/* 2. Contacted */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Contacted</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {safeMetrics.contacted}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Calls & WhatsApp</p>
          </div>
        </div>

        {/* 3. Interested */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-cyan-300 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Interested</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {safeMetrics.interestedCustomers}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Qualified intent</p>
          </div>
        </div>

        {/* 4. Proposals Sent */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Proposals Sent</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Send className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {safeMetrics.proposalsSent}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Formally quoted</p>
          </div>
        </div>

        {/* 5. Accepted Deals (Won) */}
        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Accepted Deals</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Trophy className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
              {safeMetrics.wonOpportunities}
            </p>
            <p className="text-[10px] text-emerald-600/80 mt-1 font-semibold">Won agreements</p>
          </div>
        </div>

        {/* 6. Rejected Deals (Lost) */}
        <div className="bg-rose-50/40 p-4 rounded-2xl border border-rose-200/80 shadow-2xs hover:shadow-md hover:border-rose-300 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">Rejected Deals</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
              {safeMetrics.lostOpportunities}
            </p>
            <p className="text-[10px] text-rose-500/80 mt-1 font-medium">Closed without win</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. EXECUTIVE CONVERSION FUNNEL BAR                                        */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Pipeline Progression Funnel</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Overall Conversion: <strong className="text-slate-900">{safeMetrics.leadConversionRate}%</strong>
          </span>
        </div>

        {/* Horizontal Visual Step Funnel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">1. Leads Ingested</span>
            <p className="text-base font-black text-slate-900 mt-0.5">{safeMetrics.totalExtractedRecords}</p>
            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-slate-900 rounded-full w-full"></div>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">2. Outreach Executed</span>
            <p className="text-base font-black text-slate-900 mt-0.5">{safeMetrics.contacted}</p>
            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{
                  width: `${safeMetrics.totalExtractedRecords > 0 ? Math.min(100, Math.round((safeMetrics.contacted / safeMetrics.totalExtractedRecords) * 100)) : 0}%`
                }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">3. Formal Proposals</span>
            <p className="text-base font-black text-slate-900 mt-0.5">{safeMetrics.proposalsSent}</p>
            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{
                  width: `${safeMetrics.totalExtractedRecords > 0 ? Math.min(100, Math.round((safeMetrics.proposalsSent / safeMetrics.totalExtractedRecords) * 100)) : 0}%`
                }}
              ></div>
            </div>
          </div>

          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/60">
            <span className="text-[10px] font-semibold text-emerald-800 uppercase">4. Won Contracts</span>
            <p className="text-base font-black text-emerald-700 mt-0.5">{safeMetrics.wonOpportunities}</p>
            <div className="w-full h-1.5 bg-emerald-200 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all"
                style={{
                  width: `${safeMetrics.proposalsSent > 0 ? Math.min(100, Math.round((safeMetrics.wonOpportunities / safeMetrics.proposalsSent) * 100)) : 0}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. SERVICE OFFERING ACCEPTANCE RATES TABLE                                */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Table Top Controls & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Service Offering Performance & Acceptance Rates</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of AI recommendations converted into signed revenue agreements
            </p>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search service..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 w-36 sm:w-48 bg-slate-50/50"
              />
            </div>

            {/* Category Dropdown */}
            {categories.length > 1 && (
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-slate-50/50 text-slate-700 font-semibold cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-5">Service Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Recommended</th>
                <th className="py-3 px-4 text-center">Proposals Sent</th>
                <th className="py-3 px-4 text-center">Accepted Deals</th>
                <th className="py-3 px-5 text-right">Acceptance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Layers className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-1" />
                    <p className="font-semibold text-slate-600">No services match your filter</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try clearing your search query or changing category.</p>
                  </td>
                </tr>
              ) : (
                filteredServices.map(item => {
                  const rate = item.acceptanceRate ?? 0;
                  return (
                    <tr key={item.serviceName} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Service Name */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {item.serviceName}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadgeClass(item.category)}`}>
                          {item.category}
                        </span>
                      </td>

                      {/* Recommended Count */}
                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {item.recommendedCount ?? 0}
                        </span>
                      </td>

                      {/* Proposals Sent Count */}
                      <td className="py-4 px-4 text-center">
                        <span className="font-bold text-slate-700 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">
                          {item.proposedCount ?? 0}
                        </span>
                      </td>

                      {/* Accepted Deals Count */}
                      <td className="py-4 px-4 text-center">
                        <span className={`font-black px-2 py-0.5 rounded-md ${
                          item.acceptedCount > 0 ? 'bg-emerald-100 text-emerald-800 font-extrabold' : 'text-slate-400'
                        }`}>
                          {item.acceptedCount ?? 0}
                        </span>
                      </td>

                      {/* Acceptance Rate with Visual Bar */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end space-x-2.5">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden shrink-0 hidden sm:block">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                            ></div>
                          </div>
                          <span className={`font-black text-xs ${
                            rate > 0 ? 'text-emerald-700 font-black' : 'text-slate-400'
                          }`}>
                            {rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
