import React, { useState } from 'react';
import {
  FileText,
  Users,
  Sparkles,
  Award,
  PhoneCall,
  MessageSquare,
  Mail,
  CalendarCheck,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  Filter,
  Download,
  AlertCircle,
  Database,
  BarChart3
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
  Cell,
  Legend
} from 'recharts';
import { DashboardMetrics } from '../../../shared/types.js';
import { ViewKey } from '../components/layout/Sidebar';

const SHORT_SERVICE_NAMES: Record<string, string> = {
  'Custom AI & Machine Learning Solutions': 'Custom AI & ML',
  'Modern Website Design & Lead Engine': 'Modern Websites',
  'Enterprise Web Application Development': 'Web Applications',
  'Full-Stack Digital Transformation & Portals': 'Digital Portals',
  'Custom Software & Process Automation': 'Custom Software',
  'Automated Business Workflows & RPA': 'Automated RPA',
  'Data Analytics & Predictive Business Insights': 'Data Analytics',
  'Executive Dashboards & Business Intelligence': 'Executive BI',
  'Cloud Infrastructure Migration & Modernization': 'Cloud Migration',
  'Cross-Platform Software & API Integration': 'API Integration',
  'Strategic Technology Architecture Consulting': 'Tech Consulting',
  'Enterprise Corporate Technology Training': 'Corporate Training'
};

const CustomServiceTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl text-xs space-y-2 border border-slate-700 min-w-[240px]">
        <div>
          <p className="font-bold text-slate-100 text-xs leading-snug">{data.serviceName}</p>
          <span className="inline-block px-1.5 py-0.5 mt-1 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
            {data.category}
          </span>
        </div>
        <div className="border-t border-slate-800 pt-2 space-y-1.5 text-[11px]">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>Recommended:</span>
            </span>
            <span className="font-bold text-white">{data.recommendedCount}</span>
          </div>
          <div className="flex justify-between items-center text-emerald-300">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Proposals Sent:</span>
            </span>
            <span className="font-bold text-white">{data.proposedCount}</span>
          </div>
          <div className="flex justify-between items-center text-emerald-400">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Accepted Deals:</span>
            </span>
            <span className="font-bold text-white">{data.acceptedCount}</span>
          </div>
          <div className="flex justify-between items-center text-amber-300 pt-1.5 border-t border-slate-800 font-semibold">
            <span>Acceptance Win Rate:</span>
            <span className="text-sm font-extrabold text-amber-400">{data.acceptanceRate}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

interface DashboardViewProps {
  metrics: DashboardMetrics | null;
  loading: boolean;
  onNavigate: (view: ViewKey) => void;
  onSeedData: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  loading,
  onNavigate,
  onSeedData
}) => {
  const [dateFilter, setDateFilter] = useState('All Time');
  const [chartMode, setChartMode] = useState<'horizontal' | 'vertical' | 'rate'>('horizontal');

  if (loading || !metrics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-slate-500">Calculating real-time analytics...</p>
        </div>
      </div>
    );
  }

  // Check if system has any real records yet
  const hasData = metrics.totalUploadedDocuments > 0 || metrics.totalExtractedRecords > 0;

  const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Filter and Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sales & BI Command Center</h2>
          <p className="text-xs text-slate-500">
            Real metrics computed from active uploaded documents and recorded outreach outcomes.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 shadow-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent border-none text-xs focus:outline-none font-medium cursor-pointer"
            >
              <option value="All Time">All Time</option>
              <option value="This Quarter">This Quarter</option>
              <option value="This Month">This Month</option>
              <option value="This Week">This Week</option>
            </select>
          </div>

          <a
            href="/api/v1/reports/excel"
            download
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Report</span>
          </a>
        </div>
      </div>

      {/* Empty State Banner if 0 records */}
      {!hasData && (
        <div className="p-6 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-emerald-600 rounded-lg text-white shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-950">No Extracted Records Found Yet</h3>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                Production rule: Analytics strictly reflect recorded client documents and verified outcomes.
                Upload your first XLSX, CSV, or PDF, or seed pre-configured prospects to explore live charts and automated calling scripts.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={onSeedData}
              className="px-3.5 py-2 bg-white text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold hover:bg-emerald-100/50 transition-colors shadow-xs"
            >
              Load Sample Prospects
            </button>
            <button
              onClick={() => onNavigate('upload-documents')}
              className="px-3.5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
            >
              Upload Document
            </button>
          </div>
        </div>
      )}

      {/* Row 1: High Level Revenue & Acceptance KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Actual Acceptance Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-subtle hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Actual Acceptance Rate</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {metrics.actualAcceptanceRate}%
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              ({metrics.wonOpportunities} accepted / {metrics.wonOpportunities + metrics.lostOpportunities} closed)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Formula: Accepted / (Accepted + Rejected) × 100
          </p>
        </div>

        {/* Lead Conversion Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-subtle hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Lead Conversion Rate</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {metrics.leadConversionRate}%
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              of {metrics.qualifiedLeads} qualified leads
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Deals won from verified document import cohorts
          </p>
        </div>

        {/* Total Pipeline Value */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-subtle hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sales Pipeline Value</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              ${metrics.totalPipelineValue.toLocaleString()}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold">Active Value</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Cumulative potential of ongoing qualified deals
          </p>
        </div>

        {/* Follow-ups Due Today */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-subtle hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Follow-ups Due Today</span>
            <div className={`p-2 rounded-lg ${metrics.followUpsDueToday > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'}`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {metrics.followUpsDueToday}
            </span>
            <span className="text-[11px] text-amber-700 font-medium">Scheduled</span>
          </div>
          <button
            onClick={() => onNavigate('follow-up-tasks')}
            className="mt-1 text-[11px] text-emerald-700 font-semibold hover:underline flex items-center space-x-1"
          >
            <span>View task reminders</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Row 2: Secondary Funnel Metrics (12 metrics grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-semibold uppercase text-slate-400">Uploaded Docs</span>
          <p className="text-lg font-bold text-slate-900 mt-1">{metrics.totalUploadedDocuments}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-semibold uppercase text-slate-400">Extracted Records</span>
          <p className="text-lg font-bold text-slate-900 mt-1">{metrics.totalExtractedRecords}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-semibold uppercase text-slate-400">Analyzed Customers</span>
          <p className="text-lg font-bold text-slate-900 mt-1">{metrics.totalAnalyzedCustomers}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-semibold uppercase text-slate-400">Qualified Leads</span>
          <p className="text-lg font-bold text-slate-900 mt-1">{metrics.qualifiedLeads}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-semibold uppercase text-slate-400">Calls Completed</span>
          <p className="text-lg font-bold text-slate-900 mt-1">{metrics.callsCompleted}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-semibold uppercase text-slate-400">WhatsApp Outreaches</span>
          <p className="text-lg font-bold text-slate-900 mt-1">{metrics.whatsAppOutreachAttempts}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-semibold uppercase text-slate-400">Emails Prepared</span>
          <p className="text-lg font-bold text-slate-900 mt-1">{metrics.emailsPrepared}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-semibold uppercase text-slate-400">Emails Confirmed Sent</span>
          <p className="text-lg font-bold text-emerald-700 mt-1">{metrics.emailsSentConfirmed}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-semibold uppercase text-slate-400">Meetings Booked</span>
          <p className="text-lg font-bold text-slate-900 mt-1">{metrics.meetingsBooked}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-semibold uppercase text-slate-400">Proposals Sent</span>
          <p className="text-lg font-bold text-slate-900 mt-1">{metrics.proposalsSent}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-semibold uppercase text-emerald-600">Won Opportunities</span>
          <p className="text-lg font-bold text-emerald-700 mt-1">{metrics.wonOpportunities}</p>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-semibold uppercase text-rose-500">Lost Opportunities</span>
          <p className="text-lg font-bold text-rose-600 mt-1">{metrics.lostOpportunities}</p>
        </div>
      </div>

      {/* Row 3: Recharts Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Performance Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">Service Acceptance Performance</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                  Top 6 Solutions
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Comparison of recommended vs proposed vs accepted opportunities
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {/* Chart Mode Toggle */}
              <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-[11px] font-medium text-slate-600">
                <button
                  type="button"
                  onClick={() => setChartMode('horizontal')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    chartMode === 'horizontal'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                  title="Horizontal bars - best readability"
                >
                  Horizontal
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('vertical')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    chartMode === 'vertical'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                  title="Vertical columns"
                >
                  Columns
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('rate')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    chartMode === 'rate'
                      ? 'bg-white text-emerald-800 font-bold shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                  title="Win Rate %"
                >
                  Win Rate %
                </button>
              </div>

              <button
                onClick={() => onNavigate('service-catalog')}
                className="text-xs text-emerald-700 font-semibold hover:underline shrink-0 ml-1"
              >
                View Catalog
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            {metrics.servicePerformance.some(s => s.recommendedCount > 0 || s.proposedCount > 0 || s.acceptedCount > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === 'horizontal' ? (
                  <BarChart
                    layout="vertical"
                    data={[...metrics.servicePerformance]
                      .map(s => ({ ...s, shortName: SHORT_SERVICE_NAMES[s.serviceName] || s.serviceName }))
                      .sort((a, b) => (b.recommendedCount + b.proposedCount + b.acceptedCount) - (a.recommendedCount + a.proposedCount + a.acceptedCount))
                      .slice(0, 6)}
                    margin={{ top: 5, right: 25, left: 110, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis
                      type="category"
                      dataKey="shortName"
                      tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                      width={105}
                    />
                    <Tooltip content={<CustomServiceTooltip />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                    />
                    <Bar dataKey="recommendedCount" name="Recommended" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={8} />
                    <Bar dataKey="proposedCount" name="Proposals Sent" fill="#34d399" radius={[0, 4, 4, 0]} barSize={8} />
                    <Bar dataKey="acceptedCount" name="Accepted Deals" fill="#059669" radius={[0, 4, 4, 0]} barSize={8} />
                  </BarChart>
                ) : chartMode === 'vertical' ? (
                  <BarChart
                    data={[...metrics.servicePerformance]
                      .map(s => ({ ...s, shortName: SHORT_SERVICE_NAMES[s.serviceName] || s.serviceName }))
                      .sort((a, b) => (b.recommendedCount + b.proposedCount + b.acceptedCount) - (a.recommendedCount + a.proposedCount + a.acceptedCount))
                      .slice(0, 6)}
                    margin={{ top: 5, right: 15, left: -20, bottom: 35 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip content={<CustomServiceTooltip />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                    />
                    <Bar dataKey="recommendedCount" name="Recommended" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={12} />
                    <Bar dataKey="proposedCount" name="Proposals Sent" fill="#34d399" radius={[4, 4, 0, 0]} barSize={12} />
                    <Bar dataKey="acceptedCount" name="Accepted Deals" fill="#059669" radius={[4, 4, 0, 0]} barSize={12} />
                  </BarChart>
                ) : (
                  <BarChart
                    layout="vertical"
                    data={[...metrics.servicePerformance]
                      .map(s => ({ ...s, shortName: SHORT_SERVICE_NAMES[s.serviceName] || s.serviceName }))
                      .sort((a, b) => (b.recommendedCount + b.proposedCount + b.acceptedCount) - (a.recommendedCount + a.proposedCount + a.acceptedCount))
                      .slice(0, 6)}
                    margin={{ top: 5, right: 35, left: 110, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis
                      type="number"
                      unit="%"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="shortName"
                      tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
                      width={105}
                    />
                    <Tooltip content={<CustomServiceTooltip />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                    />
                    <Bar
                      dataKey="acceptanceRate"
                      name="Actual Win Rate %"
                      fill="#059669"
                      radius={[0, 4, 4, 0]}
                      barSize={12}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-2.5 shadow-xs">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">No Service Recommendation Activity Yet</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
                  As prospect documents are analyzed, this live chart tracks AI-recommended services against formal proposals and closed-won contracts across Quenoxa's 12 offerings.
                </p>
                <div className="mt-4 flex items-center space-x-3">
                  <button
                    onClick={onSeedData}
                    className="px-3.5 py-1.5 bg-white text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold hover:bg-emerald-50 transition-colors shadow-xs"
                  >
                    Load Sample Prospects
                  </button>
                  <button
                    onClick={() => onNavigate('upload-documents')}
                    className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
                  >
                    Upload Document
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lead Source Performance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Lead Source Attribution</h3>
            <p className="text-xs text-slate-500">Volume and win conversion by origin channel</p>
          </div>

          <div className="h-52 w-full">
            {metrics.leadSourcePerformance.some(l => l.leadsCount > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.leadSourcePerformance.filter(l => l.leadsCount > 0)}
                    dataKey="leadsCount"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {metrics.leadSourcePerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '6px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Awaiting lead acquisition data
              </div>
            )}
          </div>

          <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
            {metrics.leadSourcePerformance.slice(0, 3).map((item, i) => (
              <div key={item.source} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></span>
                  <span>{item.source}</span>
                </span>
                <span className="font-semibold text-slate-900">
                  {item.leadsCount} leads ({item.conversionRate}% won)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
