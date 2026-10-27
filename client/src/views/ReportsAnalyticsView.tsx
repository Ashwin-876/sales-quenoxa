import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DashboardMetrics } from '../../../shared/types.js';

interface ReportsAnalyticsViewProps {
  metrics: DashboardMetrics | null;
}

export const ReportsAnalyticsView: React.FC<ReportsAnalyticsViewProps> = ({ metrics }) => {
  const [dateRange, setDateRange] = useState('Fiscal Year 2026');

  const exportPdfExecutiveSummary = () => {
    if (!metrics) return;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(5, 150, 105);
    doc.text('QUENOXA GLOBAL TECHNOLOGIES', 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('EXECUTIVE SALES ACCEPTANCE & PIPELINE PERFORMANCE REPORT', 14, 28);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleString()} | Period: ${dateRange}`, 14, 34);

    autoTable(doc, {
      startY: 40,
      head: [['Key Executive Sales Metric', 'Calibrated Value', 'Standard Calculation Protocol']],
      body: [
        ['Total Leads Ingested', metrics.totalExtractedRecords.toString(), 'All extracted customer records'],
        ['Qualified Opportunities', metrics.qualifiedLeads.toString(), 'Leads active across sales funnel'],
        ['Proposals Sent', metrics.proposalsSent.toString(), 'Formal commercial solution documents delivered'],
        ['Accepted Proposals (Won)', metrics.wonOpportunities.toString(), 'Customer accepted proposals'],
        ['Rejected Proposals (Lost)', metrics.lostOpportunities.toString(), 'Final rejected solution proposals'],
        ['Actual Acceptance Rate', `${metrics.actualAcceptanceRate}%`, 'Accepted / (Accepted + Rejected) * 100 (Excludes pending)'],
        ['Lead Conversion Rate', `${metrics.leadConversionRate}%`, 'Won / Qualified Leads * 100'],
        ['Active Sales Pipeline Value', `₹${metrics.totalPipelineValue.toLocaleString('en-IN')}`, 'Sum of active non-lost deals (INR)']
      ],
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] },
      styles: { fontSize: 8, cellPadding: 3 }
    });

    if (metrics.servicePerformance.length > 0) {
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Service Name', 'Category', 'Recommended', 'Proposed', 'Accepted', 'Win Rate']],
        body: metrics.servicePerformance.map(s => [
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

  if (!metrics) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading reports and analytics...</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Reports & Sales Performance Analytics</h2>
          <p className="text-xs text-slate-500">
            Unbiased acceptance formulas, service-wise win rates, and certified exports.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportPdfExecutiveSummary}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download PDF</span>
          </button>
          <a
            href="/api/v1/reports/excel"
            download
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Download Excel</span>
          </a>
        </div>
      </div>

      {/* Metric Definitions & Methodology Banner */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
        <div className="flex items-center space-x-2 text-slate-900 font-bold">
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <span>Statistically Calibrated Methodology (Section 17 Compliance)</span>
        </div>
        <p className="text-slate-600 leading-relaxed text-[11px]">
          <strong>Actual Acceptance Rate</strong> is calculated strictly as: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-emerald-800 font-mono">Accepted proposals / (Accepted + Rejected) × 100</code>.
          In accordance with strict production requirements, pending proposals and unfinalized negotiations are excluded from the denominator to prevent statistical dilution.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Total Leads</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{metrics.totalExtractedRecords}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Contacted</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{metrics.callsCompleted + metrics.whatsAppOutreachAttempts}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Interested</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{metrics.interestedCustomers}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400">Proposals Sent</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{metrics.proposalsSent}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-600">Accepted Deals</span>
          <p className="text-xl font-bold text-emerald-700 mt-1">{metrics.wonOpportunities}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-rose-500">Rejected Deals</span>
          <p className="text-xl font-bold text-rose-600 mt-1">{metrics.lostOpportunities}</p>
        </div>
      </div>

      {/* Service-Wise Acceptance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Service Offering Performance & Acceptance Rates</h3>
            <p className="text-xs text-slate-500">Breakdown of AI recommendations that converted into revenue agreements</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Service Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Recommended</th>
                <th className="py-3 px-4 text-center">Proposals Sent</th>
                <th className="py-3 px-4 text-center">Accepted Deals</th>
                <th className="py-3 px-4 text-right">Acceptance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.servicePerformance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No recommendations recorded yet.
                  </td>
                </tr>
              ) : (
                metrics.servicePerformance.map((item) => (
                  <tr key={item.serviceName} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{item.serviceName}</td>
                    <td className="py-3.5 px-4 text-slate-500">{item.category}</td>
                    <td className="py-3.5 px-4 text-center text-slate-700 font-medium">{item.recommendedCount}</td>
                    <td className="py-3.5 px-4 text-center text-slate-700 font-medium">{item.proposedCount}</td>
                    <td className="py-3.5 px-4 text-center text-emerald-700 font-bold">{item.acceptedCount}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {item.acceptanceRate}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
