import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Sparkles,
  PhoneCall,
  Phone,
  MessageSquare,
  Mail,
  UserPlus,
  Eye,
  CheckSquare,
  Square,
  X,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Check,
  Clock,
  ArrowUpDown,
  Loader2,
  RefreshCw,
  Database,
  Building2,
  SlidersHorizontal
} from 'lucide-react';
import { ExtractedRecord } from '../../../shared/types.js';
import { api } from '../services/api';
import { ViewKey } from '../components/layout/Sidebar';

interface DataExplorerViewProps {
  onNavigate: (view: ViewKey) => void;
  onSelectRecordForAnalysis: (record: ExtractedRecord) => void;
  onSelectRecordForRecommendation: (record: ExtractedRecord) => void;
  onSelectRecordForColdCall: (record: ExtractedRecord) => void;
  onSelectRecordForWhatsApp: (record: ExtractedRecord) => void;
  onSelectRecordForEmail: (record: ExtractedRecord) => void;
  onSelectRecordForMarketingGenerator?: (record: ExtractedRecord) => void;
}

export const DataExplorerView: React.FC<DataExplorerViewProps> = ({
  onNavigate,
  onSelectRecordForAnalysis,
  onSelectRecordForRecommendation,
  onSelectRecordForColdCall,
  onSelectRecordForWhatsApp,
  onSelectRecordForEmail,
  onSelectRecordForMarketingGenerator
}) => {
  const [records, setRecords] = useState<ExtractedRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [crmCounts, setCrmCounts] = useState<{
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    inCrm: number;
  }>({ total: 0, pending: 0, accepted: 0, rejected: 0, inCrm: 0 });

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [duplicateFilter, setDuplicateFilter] = useState(false);
  const [missingFilter, setMissingFilter] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filters
  const [callStatusFilter, setCallStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [crmStatusFilter, setCrmStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'in_crm'>('all');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [inspectedRecord, setInspectedRecord] = useState<ExtractedRecord | null>(null);

  // Notifications
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Action states
  const [savingCallIds, setSavingCallIds] = useState<Set<string>>(new Set());
  const [acceptingIds, setAcceptingIds] = useState<Set<string>>(new Set());
  const [rejectModalRecord, setRejectModalRecord] = useState<ExtractedRecord | null>(null);
  const [selectedReasonCategory, setSelectedReasonCategory] = useState<string>('Not interested / No current requirement');
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Sorting & Pagination state
  const [sortField, setSortField] = useState<string>('default');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  const loadRecords = async (
    callStatusOverride?: 'all' | 'completed' | 'pending',
    crmStatusOverride?: 'all' | 'pending' | 'accepted' | 'rejected' | 'in_crm'
  ) => {
    setLoading(true);
    const activeCallFilter = callStatusOverride !== undefined ? callStatusOverride : callStatusFilter;
    const activeCrmFilter = crmStatusOverride !== undefined ? crmStatusOverride : crmStatusFilter;

    try {
      const data = await api.getRecords({
        search: search || undefined,
        duplicateOnly: duplicateFilter || undefined,
        missingOnly: missingFilter || undefined,
        callStatus: activeCallFilter !== 'all' ? activeCallFilter : undefined,
        crmStatus: activeCrmFilter !== 'all' ? activeCrmFilter : undefined,
      });

      setRecords(data.records);
      setTotalCount(data.totalCount);
      setCompletedCount(data.callsCompletedCount ?? 0);
      setPendingCount(data.callsPendingCount ?? (data.totalCount - (data.callsCompletedCount ?? 0)));

      if (data.crmCounts) {
        setCrmCounts(data.crmCounts);
      }
    } catch (err: any) {
      console.error('Failed to load records:', err);
      setActionErrorMsg(`Failed to load customer records: ${err.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [duplicateFilter, missingFilter, callStatusFilter, crmStatusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadRecords();
  };

  const handleCallStatusFilterChange = (status: 'all' | 'completed' | 'pending') => {
    setCallStatusFilter(status);
    setCurrentPage(1);
  };

  const handleCrmStatusFilterChange = (status: 'all' | 'pending' | 'accepted' | 'rejected' | 'in_crm') => {
    setCrmStatusFilter(status);
    setCurrentPage(1);
  };

  // Toggle call completion status with instant optimistic update & rollback
  const handleToggleCallStatus = async (recordId: string, currentStatus: boolean, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (savingCallIds.has(recordId)) return;

    const nextStatus = !currentStatus;
    const prevRecords = [...records];
    const prevCompleted = completedCount;
    const prevPending = pendingCount;

    setRecords(prev =>
      prev.map(r =>
        r.id === recordId
          ? {
              ...r,
              callCompleted: nextStatus,
              callCompletedAt: nextStatus ? new Date().toISOString() : undefined,
              lastContactedAt: nextStatus ? new Date().toISOString() : r.lastContactedAt,
            }
          : r
      )
    );

    if (nextStatus) {
      setCompletedCount(c => c + 1);
      setPendingCount(p => Math.max(0, p - 1));
    } else {
      setCompletedCount(c => Math.max(0, c - 1));
      setPendingCount(p => p + 1);
    }

    setSavingCallIds(prev => new Set(prev).add(recordId));
    setActionErrorMsg(null);

    try {
      await api.updateRecordCallStatus(recordId, nextStatus);
    } catch (err: any) {
      console.error('Failed to save call completion status:', err);
      setRecords(prevRecords);
      setCompletedCount(prevCompleted);
      setPendingCount(prevPending);
      setActionErrorMsg(`Failed to save call status for record. Reverted change. (${err?.message || 'Server error'})`);
      setTimeout(() => setActionErrorMsg(null), 6000);
    } finally {
      setSavingCallIds(prev => {
        const next = new Set(prev);
        next.delete(recordId);
        return next;
      });
    }
  };

  // Accept & Move to CRM
  const handleAcceptLead = async (record: ExtractedRecord) => {
    if (acceptingIds.has(record.id) || record.crmStatus === 'accepted' || record.crmStatus === 'in_crm' || record.status === 'in_crm') return;

    setAcceptingIds(prev => new Set(prev).add(record.id));
    setActionErrorMsg(null);

    try {
      await api.acceptRecord(record.id);
      setActionSuccessMsg('Lead successfully moved to CRM.');
      setTimeout(() => setActionSuccessMsg(null), 5000);

      // Optimistic local update
      setRecords(prev =>
        prev.map(r =>
          r.id === record.id
            ? {
                ...r,
                crmStatus: 'accepted',
                status: 'in_crm',
                acceptedAt: new Date().toISOString(),
                rejectionReason: undefined
              }
            : r
        )
      );

      // Refresh to update counts
      loadRecords();
    } catch (err: any) {
      console.error('Failed to accept lead:', err);
      setActionErrorMsg(`Failed to move lead to CRM: ${err?.message || 'Server error'}`);
      setTimeout(() => setActionErrorMsg(null), 6000);
    } finally {
      setAcceptingIds(prev => {
        const next = new Set(prev);
        next.delete(record.id);
        return next;
      });
    }
  };

  // Reject Lead Modal Handlers
  const handleOpenRejectModal = (record: ExtractedRecord) => {
    setRejectModalRecord(record);
    setSelectedReasonCategory('Not interested / No current requirement');
    setRejectionReasonInput('');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalRecord) return;
    setIsSubmittingReject(true);
    setActionErrorMsg(null);
    const targetId = rejectModalRecord.id;
    const finalReason = selectedReasonCategory === 'Other'
      ? (rejectionReasonInput.trim() || 'Other reason')
      : (rejectionReasonInput.trim() ? `${selectedReasonCategory}: ${rejectionReasonInput.trim()}` : selectedReasonCategory);

    try {
      const res = await api.rejectRecord(targetId, finalReason);

      // Requirement: Immediately remove the customer from the active lead list without requiring a page refresh
      if (crmStatusFilter !== 'rejected') {
        setRecords(prev => prev.filter(r => r.id !== targetId));
      } else {
        setRecords(prev =>
          prev.map(r =>
            r.id === targetId
              ? {
                  ...r,
                  crmStatus: 'rejected',
                  rejectionReason: finalReason,
                  rejectedAt: new Date().toISOString()
                }
              : r
          )
        );
      }

      // Requirement: Update the total lead count, pending count, and rejected count automatically
      if (res.counts) {
        setTotalCount(res.counts.total);
        setPendingCount(res.counts.callsPending);
        setCrmCounts({
          total: res.counts.total,
          pending: res.counts.pending,
          accepted: res.counts.accepted,
          rejected: res.counts.rejected,
          inCrm: res.counts.inCrm
        });
      } else {
        setTotalCount(prev => Math.max(0, prev - 1));
        setPendingCount(prev => Math.max(0, prev - 1));
        setCrmCounts(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          pending: Math.max(0, prev.pending - 1),
          rejected: prev.rejected + 1
        }));
      }

      // Requirement: Show a success message: "Customer rejected successfully."
      setActionSuccessMsg('Customer rejected successfully.');
      setTimeout(() => setActionSuccessMsg(null), 4000);

      setRejectModalRecord(null);
      setRejectionReasonInput('');
    } catch (err: any) {
      console.error('Failed to reject customer lead:', err);
      // Requirement: If the operation fails, display an error message and keep the customer in the active list.
      setActionErrorMsg(`Failed to reject customer: ${err?.message || 'Server error'}. Customer remains in active list.`);
      setTimeout(() => setActionErrorMsg(null), 6000);
      setRejectModalRecord(null);
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const handleRestoreLead = async (record: ExtractedRecord) => {
    try {
      const res = await api.restoreRecord(record.id);
      setActionSuccessMsg(res.message || 'Customer restored to active leads successfully.');
      setTimeout(() => setActionSuccessMsg(null), 4000);
      loadRecords();
    } catch (err: any) {
      setActionErrorMsg(`Failed to restore customer: ${err?.message || 'Server error'}`);
      setTimeout(() => setActionErrorMsg(null), 5000);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Sorted and Paginated Records
  const sortedRecords = useMemo(() => {
    const list = [...records];
    if (!sortField || sortField === 'default') return list;

    return list.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (sortField === 'callStatus') {
        valA = a.callCompleted ? 1 : 0;
        valB = b.callCompleted ? 1 : 0;
      } else if (sortField === 'crmStatus') {
        valA = (a.crmStatus || 'pending').toLowerCase();
        valB = (b.crmStatus || 'pending').toLowerCase();
      } else if (sortField === 'companyName') {
        valA = (a.companyName || a.businessName || '').toLowerCase();
        valB = (b.companyName || b.businessName || '').toLowerCase();
      } else if (sortField === 'customerName') {
        valA = (a.customerName || a.contactPerson || '').toLowerCase();
        valB = (b.customerName || b.contactPerson || '').toLowerCase();
      } else if (sortField === 'industry') {
        valA = (a.industry || '').toLowerCase();
        valB = (b.industry || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [records, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    if (pageSize >= 1000) return sortedRecords;
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedRecords.length && paginatedRecords.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedRecords.map(r => r.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBatchAddToCrm = async () => {
    if (selectedIds.size === 0) return;
    try {
      const res = await api.batchAddRecordsToCrm(Array.from(selectedIds));
      setActionSuccessMsg(`Successfully added ${res.addedCount} records to CRM Leads!`);
      setSelectedIds(new Set());
      setTimeout(() => setActionSuccessMsg(null), 4000);
      loadRecords();
    } catch (err: any) {
      alert(err?.message || 'Failed to batch add records');
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-5 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-white border border-emerald-200 shadow-xl text-slate-900 text-xs flex items-center space-x-3 max-w-sm animate-in slide-in-from-top-2 duration-200">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 font-semibold text-emerald-950">
            {actionSuccessMsg}
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{actionErrorMsg}</span>
          </div>
          <button onClick={() => setActionErrorMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Top Section: CALL STATUS and CRM STATUS Cards side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CALL STATUS Box */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            CALL STATUS
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleCallStatusFilterChange('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                callStatusFilter === 'all'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-1 ring-emerald-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Leads ({totalCount})
            </button>

            <button
              onClick={() => handleCallStatusFilterChange('completed')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                callStatusFilter === 'completed'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-1 ring-emerald-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
              <span>Calls Completed ({completedCount})</span>
            </button>

            <button
              onClick={() => handleCallStatusFilterChange('pending')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                callStatusFilter === 'pending'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-1 ring-emerald-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Calls Pending ({pendingCount})</span>
            </button>
          </div>
        </div>

        {/* CRM STATUS Box */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            CRM STATUS
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleCrmStatusFilterChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                crmStatusFilter === 'all'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-1 ring-emerald-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All ({crmCounts.total || totalCount})
            </button>

            <button
              onClick={() => handleCrmStatusFilterChange('pending')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                crmStatusFilter === 'pending'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-1 ring-emerald-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Pending ({crmCounts.pending})</span>
            </button>

            <button
              onClick={() => handleCrmStatusFilterChange('accepted')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                crmStatusFilter === 'accepted'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-1 ring-emerald-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Accepted ({crmCounts.accepted})</span>
            </button>

            <button
              onClick={() => handleCrmStatusFilterChange('rejected')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                crmStatusFilter === 'rejected'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-1 ring-emerald-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Rejected ({crmCounts.rejected})</span>
            </button>

            <button
              onClick={() => handleCrmStatusFilterChange('in_crm')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                crmStatusFilter === 'in_crm'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-500 ring-1 ring-emerald-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-teal-600" />
              <span>In CRM ({crmCounts.inCrm})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Search Bar + Filters + Record Counter */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search business name, industry, contact person..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-20 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-700 transition-colors shadow-2xs"
            >
              Search
            </button>
          </form>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                showAdvancedFilters || duplicateFilter || missingFilter
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
            <span className="text-xs text-slate-500 font-medium">
              Showing {sortedRecords.length} customer records
            </span>
          </div>
        </div>

        {/* Expandable Advanced Data Quality Filters */}
        {showAdvancedFilters && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 animate-in fade-in">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Data Health:</span>
              <button
                onClick={() => {
                  setDuplicateFilter(!duplicateFilter);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                  duplicateFilter
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Duplicates Only
              </button>
              <button
                onClick={() => {
                  setMissingFilter(!missingFilter);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${
                  missingFilter
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Missing Values Only
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <a
                href="/api/v1/reports/excel?type=records"
                download
                className="flex items-center space-x-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 hover:bg-slate-50"
              >
                <Download className="w-3 h-3" />
                <span>Excel</span>
              </a>
              <a
                href="/api/v1/reports/csv"
                download
                className="flex items-center space-x-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 hover:bg-slate-50"
              >
                <Download className="w-3 h-3" />
                <span>CSV</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Batch Selection Toolbar */}
      {selectedIds.size > 0 && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center space-x-2 text-emerald-900 font-semibold">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            <span>{selectedIds.size} record(s) selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBatchAddToCrm}
              className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-2xs flex items-center space-x-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Selected to CRM</span>
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* 3. Customer Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="table-container max-h-[680px] overflow-auto">
          <table className="w-full text-left text-xs table-sticky-header">
            <thead className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50/90">
              <tr>
                {/* 1. Checkbox */}
                <th className="py-3 px-3 w-10 text-center">
                  <button onClick={toggleSelectAll} className="p-0.5 text-slate-400 hover:text-slate-600" title="Select All on page">
                    {selectedIds.size === paginatedRecords.length && paginatedRecords.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>

                {/* 2. Call Status */}
                <th className="py-3 px-3 whitespace-nowrap">
                  <button
                    onClick={() => handleSort('callStatus')}
                    className="flex items-center space-x-1 font-bold text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    <span>Call Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>

                {/* 3. CRM Status */}
                <th className="py-3 px-3 whitespace-nowrap">
                  <button
                    onClick={() => handleSort('crmStatus')}
                    className="flex items-center space-x-1 font-bold text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    <span>CRM Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>

                {/* 4. Business Name */}
                <th className="py-3 px-3.5 whitespace-nowrap">
                  <button
                    onClick={() => handleSort('companyName')}
                    className="flex items-center space-x-1 font-bold text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    <span>Business Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>

                {/* 5. Industry */}
                <th className="py-3 px-3 whitespace-nowrap">
                  <button
                    onClick={() => handleSort('industry')}
                    className="flex items-center space-x-1 font-bold text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    <span>Industry</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>

                {/* 6. Contact Person */}
                <th className="py-3 px-3 whitespace-nowrap">
                  <button
                    onClick={() => handleSort('customerName')}
                    className="flex items-center space-x-1 font-bold text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    <span>Contact Person</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>

                {/* 7. Action */}
                <th className="py-3 px-4 text-right whitespace-nowrap sticky right-0 bg-slate-50/95 shadow-2xs font-bold text-slate-700">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                      <span>Loading customer lead records...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <p className="font-medium text-slate-600">No customer records found matching filters.</p>
                      <p className="text-slate-400 text-[11px]">Try adjusting your search or resetting filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => {
                  const isSelected = selectedIds.has(r.id);
                  const isCallDone = Boolean(r.callCompleted);
                  const isSavingCall = savingCallIds.has(r.id);
                  const isAccepting = acceptingIds.has(r.id);

                  // CRM Workflow Status
                  const crmStatus = r.crmStatus || (r.status === 'in_crm' ? 'in_crm' : 'pending');
                  const isAccepted = crmStatus === 'accepted';
                  const isRejected = crmStatus === 'rejected';
                  const isAlreadyInCrm = crmStatus === 'in_crm' || r.status === 'in_crm' || isAccepted;

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      {/* 1. Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => toggleSelectOne(r.id)}
                          className="p-0.5 text-slate-400 hover:text-slate-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* 2. Call Status Checkbox + Badge */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={(e) => handleToggleCallStatus(r.id, isCallDone, e)}
                            disabled={isSavingCall}
                            className={`group relative w-5 h-5 rounded flex items-center justify-center transition-all ${
                              isCallDone
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs ring-1 ring-emerald-500'
                                : 'bg-white border-2 border-slate-300 hover:border-emerald-500 text-transparent hover:text-emerald-500'
                            } ${isSavingCall ? 'opacity-60 cursor-wait' : 'cursor-pointer active:scale-95'}`}
                            title={
                              isCallDone
                                ? `Call completed on ${r.callCompletedAt ? new Date(r.callCompletedAt).toLocaleDateString() : 'earlier'} - click to mark pending`
                                : 'Click to mark phone call as completed'
                            }
                          >
                            {isSavingCall ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                            ) : isCallDone ? (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            ) : (
                              <Check className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                            )}
                          </button>

                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                              isCallDone
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isCallDone ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            />
                            {isCallDone ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                      </td>

                      {/* 3. CRM Status Badge */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {isAccepted ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                            <span>Accepted</span>
                          </span>
                        ) : isRejected ? (
                          <span
                            className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                            title={r.rejectionReason ? `Reason: ${r.rejectionReason}` : 'Rejected'}
                          >
                            <XCircle className="w-3 h-3 text-rose-500" />
                            <span>Rejected</span>
                          </span>
                        ) : isAlreadyInCrm ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                            <Database className="w-3 h-3 text-teal-600" />
                            <span>In CRM</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* 4. Business Name */}
                      <td className="py-3.5 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                        <span>{r.companyName || r.businessName || 'Unnamed Business'}</span>
                      </td>

                      {/* 5. Industry */}
                      <td className="py-3.5 px-3 text-slate-700 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                          {r.industry || 'General Business'}
                        </span>
                      </td>

                      {/* 6. Contact Person */}
                      <td className="py-3.5 px-3 text-slate-800 font-medium whitespace-nowrap">
                        {r.customerName || r.contactPerson || 'Decision Maker'}
                      </td>

                      {/* 7. Action Column */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap sticky right-0 bg-white/95 group-hover:bg-slate-50/95 shadow-2xs">
                        <div className="flex items-center justify-end space-x-2">
                          {/* 1. Analyse Customer Button */}
                          <button
                            onClick={() => {
                              onSelectRecordForAnalysis(r);
                              onNavigate('ai-analysis');
                            }}
                            className="px-3 py-1.5 bg-[#007F5F] hover:bg-[#00664B] text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-all transform active:scale-95"
                            title={`Open complete customer analysis workspace for ${r.companyName || r.customerName}`}
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                            <span>Analyse Customer</span>
                          </button>

                          {/* 2. Accept & Move to CRM Button */}
                          {isAlreadyInCrm ? (
                            <span
                              className="px-2.5 py-1.5 bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0] rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-default"
                              title="Lead already accepted and in CRM"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                              <span>In CRM</span>
                            </span>
                          ) : isRejected ? (
                            <button
                              disabled
                              className="px-2.5 py-1.5 bg-slate-50 text-slate-300 border border-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1 opacity-50 cursor-not-allowed"
                              title="Cannot accept a rejected lead."
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Accept</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAcceptLead(r)}
                              disabled={isAccepting}
                              className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-[#007F5F] border border-[#B7EBD5] hover:border-emerald-500 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all shadow-2xs active:scale-95 disabled:opacity-50"
                              title="Accept this lead and move it to CRM."
                            >
                              {isAccepting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                              <span>Accept</span>
                            </button>
                          )}

                          {/* 3. Reject / Rejected / Restore Button */}
                          {isRejected ? (
                            <div className="inline-flex items-center space-x-1.5">
                              <span
                                className="px-2.5 py-1.5 bg-[#FFE4E6] text-[#BE123C] border border-[#FECDD3] rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-default"
                                title={r.rejectionReason ? `Reason: ${r.rejectionReason}` : 'Customer rejected'}
                              >
                                <XCircle className="w-3.5 h-3.5 text-[#E11D48]" />
                                <span>Rejected</span>
                              </span>
                              <button
                                onClick={() => handleRestoreLead(r)}
                                className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer"
                                title="Restore customer back to active leads"
                              >
                                Restore
                              </button>
                            </div>
                          ) : isAlreadyInCrm ? (
                            <button
                              disabled
                              className="px-2.5 py-1.5 bg-slate-50 text-slate-300 border border-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1 opacity-50 cursor-not-allowed"
                              title="Lead is already accepted in CRM"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenRejectModal(r)}
                              disabled={isSubmittingReject && rejectModalRecord?.id === r.id}
                              className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-[#E11D48] border border-[#FECDD3] hover:border-rose-400 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                              title="Reject this customer lead."
                            >
                              <XCircle className="w-3.5 h-3.5 text-[#E11D48]" />
                              <span>Reject</span>
                            </button>
                          )}

                          {/* Quick Communication Icons */}
                          <button
                            onClick={() => {
                              onSelectRecordForColdCall(r);
                              onNavigate('cold-call-studio');
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 text-emerald-700 transition-colors"
                            title="Cold Call Studio"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              onSelectRecordForWhatsApp(r);
                              onNavigate('whatsapp-outreach');
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 text-emerald-700 transition-colors"
                            title="WhatsApp Outreach"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              onSelectRecordForEmail(r);
                              onNavigate('cold-email-studio');
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 text-emerald-700 transition-colors"
                            title="Cold Email Studio"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (onSelectRecordForMarketingGenerator) {
                                onSelectRecordForMarketingGenerator(r);
                              }
                              onNavigate('marketing-generator');
                            }}
                            className="p-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors"
                            title="Generate Profile Marketing Messages (AI / Rules)"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setInspectedRecord(r)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors"
                            title="View Customer Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls Bar */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <span>Showing</span>
            <span className="font-semibold text-slate-900">
              {sortedRecords.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>
            <span>to</span>
            <span className="font-semibold text-slate-900">
              {Math.min(currentPage * pageSize, sortedRecords.length)}
            </span>
            <span>of</span>
            <span className="font-semibold text-slate-900">{sortedRecords.length}</span>
            <span>records</span>
            {records.length !== totalCount && (
              <span className="text-slate-400 text-[11px]">(filtered from {totalCount} total)</span>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={1000}>All</option>
              </select>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 py-1 text-xs font-semibold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Confirmation Dialog Modal */}
      {rejectModalRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Confirm Customer Rejection
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {rejectModalRecord.companyName || rejectModalRecord.customerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isSubmittingReject) setRejectModalRecord(null);
                }}
                disabled={isSubmittingReject}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div className="p-3 bg-rose-50/60 border border-rose-200/70 rounded-xl text-xs text-rose-800 leading-relaxed">
                <p className="font-semibold mb-0.5">Immediate Removal Notice:</p>
                <p className="text-[11px] text-rose-700">
                  This customer will be <strong>immediately removed</strong> from your active lead list and pending call workflows. Their details, rejection timestamp, and reason will be archived in the <strong>Rejected Leads History</strong>.
                </p>
              </div>

              {/* Customer details mini summary */}
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Contact</span>
                  <span className="font-semibold text-slate-800 block truncate">{rejectModalRecord.customerName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Phone</span>
                  <span className="font-mono text-slate-700 block truncate">{rejectModalRecord.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Industry</span>
                  <span className="text-slate-700 block truncate">{rejectModalRecord.industry || 'General Business'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Location</span>
                  <span className="text-slate-700 block truncate">{rejectModalRecord.location || 'Local'}</span>
                </div>
              </div>

              {/* Rejection Reason Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Rejection Reason:
                </label>
                <select
                  value={selectedReasonCategory}
                  onChange={(e) => setSelectedReasonCategory(e.target.value)}
                  disabled={isSubmittingReject}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer"
                >
                  <option value="Not interested / No current requirement">Not interested / No current requirement</option>
                  <option value="Budget or pricing mismatch">Budget or pricing mismatch</option>
                  <option value="Already working with another provider">Already working with another provider</option>
                  <option value="Invalid or unreachable contact details">Invalid or unreachable contact details</option>
                  <option value="Outside target service territory">Outside target service territory</option>
                  <option value="Timing mismatch / Revisit next quarter">Timing mismatch / Revisit next quarter</option>
                  <option value="Other">Other reason</option>
                </select>
              </div>

              {/* Detailed Reason Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Notes (Optional):
                </label>
                <textarea
                  rows={2}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Record specific customer feedback or objection details..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-slate-50/50"
                  disabled={isSubmittingReject}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectModalRecord(null)}
                disabled={isSubmittingReject}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isSubmittingReject}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingReject && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
                <span>{isSubmittingReject ? 'Rejecting...' : 'Confirm Rejection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer / Modal for Detailed Record Dossier */}
      {inspectedRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Customer Document Dossier</span>
                <h3 className="text-lg font-bold text-slate-900">{inspectedRecord.customerName}</h3>
                <p className="text-xs text-slate-500">{inspectedRecord.companyName}</p>
              </div>
              <button
                onClick={() => setInspectedRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5 text-xs">
              {/* Call Status & CRM Status Card in Drawer */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                    Call Completion
                  </span>
                  <span className="font-semibold text-slate-900 text-xs">
                    {inspectedRecord.callCompleted ? 'Call Completed' : 'Call Pending'}
                  </span>
                  {inspectedRecord.callCompletedAt && (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {new Date(inspectedRecord.callCompletedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                    CRM Acceptance
                  </span>
                  <span className="font-semibold text-slate-900 text-xs capitalize">
                    {inspectedRecord.crmStatus || 'Pending'}
                  </span>
                  {inspectedRecord.rejectionReason && (
                    <span className="text-[10px] text-rose-600 block mt-0.5 truncate">
                      Reason: {inspectedRecord.rejectionReason}
                    </span>
                  )}
                </div>
              </div>

              {/* Document Source Reference */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-semibold text-slate-700 block">Extracted Document Provenance</span>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Source Filename:</span>
                    <span className="font-medium text-slate-900">{inspectedRecord.sourceRef.fileName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Spreadsheet / Page:</span>
                    <span className="font-medium text-slate-900">
                      {inspectedRecord.sourceRef.sheetName || 'N/A'} (Row #{inspectedRecord.sourceRef.rowNumber || '1'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Verified Contact Information</h4>
                <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Direct Phone / WhatsApp:</span>
                    <span className="font-mono font-medium text-slate-900">{inspectedRecord.phone || 'None provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Corporate Email:</span>
                    <span className="font-medium text-slate-900 break-all">{inspectedRecord.email || 'None provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Industry Domain:</span>
                    <span className="font-medium text-slate-900">{inspectedRecord.industry}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Physical Location:</span>
                    <span className="font-medium text-slate-900">{inspectedRecord.location}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    onSelectRecordForAnalysis(inspectedRecord);
                    onNavigate('ai-analysis');
                  }}
                  className="px-2.5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 flex items-center justify-center space-x-1 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Analysis</span>
                </button>
                <button
                  onClick={() => {
                    if (onSelectRecordForMarketingGenerator) {
                      onSelectRecordForMarketingGenerator(inspectedRecord);
                    }
                    onNavigate('marketing-generator');
                  }}
                  className="px-2.5 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-1 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Messages</span>
                </button>
                <button
                  onClick={() => {
                    onSelectRecordForColdCall(inspectedRecord);
                    onNavigate('cold-call-studio');
                  }}
                  className="px-2.5 py-2 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-50 flex items-center justify-center space-x-1 shadow-2xs"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cold Call</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
