import React, { useState, useEffect } from 'react';
import { Sidebar, ViewKey } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './views/DashboardView';
import { UploadDocumentsView } from './views/UploadDocumentsView';
import { DataExplorerView } from './views/DataExplorerView';
import { AIAnalysisView } from './views/AIAnalysisView';
import { ServiceRecommendationsView } from './views/ServiceRecommendationsView';
import { ColdCallStudioView } from './views/ColdCallStudioView';
import { WhatsAppOutreachView } from './views/WhatsAppOutreachView';
import { ColdEmailStudioView } from './views/ColdEmailStudioView';
import { CRMLeadsView } from './views/CRMLeadsView';
import { SalesPipelineView } from './views/SalesPipelineView';
import { FollowUpTasksView } from './views/FollowUpTasksView';
import { ReportsAnalyticsView } from './views/ReportsAnalyticsView';
import { ServiceCatalogView } from './views/ServiceCatalogView';
import { TeamManagementView } from './views/TeamManagementView';
import { SettingsView } from './views/SettingsView';
import { ExtractedRecord, DashboardMetrics } from '../../shared/types.js';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewKey>('dashboard');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [records, setRecords] = useState<ExtractedRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ExtractedRecord | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const fetchDashboardMetrics = async () => {
    setMetricsLoading(true);
    try {
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchRecords = async () => {
    try {
      const data = await api.getRecords();
      setRecords(data.records);
      setSelectedRecord(prev => {
        if (!prev) return data.records[0] || null;
        const exists = data.records.some(r => r.id === prev.id);
        return exists ? prev : (data.records[0] || null);
      });
    } catch (err) {
      console.error('Failed to load records:', err);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
    fetchRecords();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [currentView]);

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await api.seedSampleData();
      await fetchDashboardMetrics();
      await fetchRecords();
    } catch (err: any) {
      alert(err?.message || 'Failed to seed sample data');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleResetAccountData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all account data? This will wipe all uploaded documents, prospects, AI analyses, calling scripts, outreach logs, and pipeline opportunities so you can start with a fresh new account.'
    );
    if (!confirmed) return;

    setIsResetting(true);
    try {
      await api.resetAccountData();
      setSelectedRecord(null);
      await fetchDashboardMetrics();
      await fetchRecords();
      alert('All account data has been completely reset. The workspace is now in a clean new account state.');
    } catch (err: any) {
      alert(err?.message || 'Failed to reset account data');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      {/* Sidebar Navigation (Responsive: Mobile Drawer + Collapsible Desktop) */}
      <Sidebar
        currentView={currentView}
        onSelectView={(v) => {
          setCurrentView(v);
          setIsMobileNavOpen(false);
        }}
        badgeCounts={{
          dueToday: metrics?.followUpsDueToday ?? 0,
          leads: metrics?.qualifiedLeads ?? 0,
          unprocessedRecords: metrics?.totalExtractedRecords ?? 0
        }}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Responsive Header */}
        <Header
          currentView={currentView}
          onNavigate={(v) => {
            setCurrentView(v);
            setIsMobileNavOpen(false);
          }}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={() => setIsSidebarCollapsed(prev => !prev)}
          onSeedData={handleSeedData}
          isSeeding={isSeeding}
          onResetData={handleResetAccountData}
          isResetting={isResetting}
          dueTodayCount={metrics?.followUpsDueToday || 0}
        />

        {/* Dynamic View Router */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {currentView === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              loading={metricsLoading}
              onNavigate={(v) => setCurrentView(v)}
              onSeedData={handleSeedData}
            />
          )}

          {currentView === 'upload-documents' && (
            <UploadDocumentsView
              onNavigate={(v) => {
                fetchRecords();
                setCurrentView(v);
              }}
              onRefreshMetrics={() => {
                fetchDashboardMetrics();
                fetchRecords();
              }}
            />
          )}

          {currentView === 'data-explorer' && (
            <DataExplorerView
              onNavigate={(v) => setCurrentView(v)}
              onSelectRecordForAnalysis={(rec) => {
                setSelectedRecord(rec);
                setCurrentView('ai-analysis');
              }}
              onSelectRecordForRecommendation={(rec) => {
                setSelectedRecord(rec);
                setCurrentView('service-recommendations');
              }}
              onSelectRecordForColdCall={(rec) => {
                setSelectedRecord(rec);
                setCurrentView('cold-call-studio');
              }}
              onSelectRecordForWhatsApp={(rec) => {
                setSelectedRecord(rec);
                setCurrentView('whatsapp-outreach');
              }}
              onSelectRecordForEmail={(rec) => {
                setSelectedRecord(rec);
                setCurrentView('cold-email-studio');
              }}
            />
          )}

          {currentView === 'ai-analysis' && (
            <AIAnalysisView
              selectedRecord={selectedRecord}
              records={records}
              onSelectRecord={(rec) => setSelectedRecord(rec)}
              onNavigate={(v) => setCurrentView(v)}
              onRefreshRecords={fetchRecords}
            />
          )}

          {currentView === 'service-recommendations' && (
            <ServiceRecommendationsView
              selectedRecord={selectedRecord}
              records={records}
              onSelectRecord={(rec) => setSelectedRecord(rec)}
              onNavigate={(v) => setCurrentView(v)}
              onRefreshRecords={fetchRecords}
            />
          )}

          {currentView === 'cold-call-studio' && (
            <ColdCallStudioView
              selectedRecord={selectedRecord}
              records={records}
              onSelectRecord={(rec) => setSelectedRecord(rec)}
              onNavigate={(v) => setCurrentView(v)}
              onRefreshRecords={fetchRecords}
            />
          )}

          {currentView === 'whatsapp-outreach' && (
            <WhatsAppOutreachView
              selectedRecord={selectedRecord}
              records={records}
              onSelectRecord={(rec) => setSelectedRecord(rec)}
              onNavigate={(v) => setCurrentView(v)}
              onRefreshRecords={fetchRecords}
            />
          )}

          {currentView === 'cold-email-studio' && (
            <ColdEmailStudioView
              selectedRecord={selectedRecord}
              records={records}
              onSelectRecord={(rec) => setSelectedRecord(rec)}
              onNavigate={(v) => setCurrentView(v)}
              onRefreshRecords={fetchRecords}
            />
          )}

          {currentView === 'crm-leads' && (
            <CRMLeadsView
              onNavigate={(v) => setCurrentView(v)}
              onRefreshMetrics={fetchDashboardMetrics}
              onSelectRecordForAnalysis={(rec) => {
                setSelectedRecord(rec);
                setCurrentView('ai-analysis');
              }}
            />
          )}

          {currentView === 'sales-pipeline' && (
            <SalesPipelineView
              onNavigate={(v) => setCurrentView(v)}
              onRefreshMetrics={fetchDashboardMetrics}
            />
          )}

          {currentView === 'follow-up-tasks' && (
            <FollowUpTasksView
              onNavigate={(v) => setCurrentView(v)}
              onRefreshMetrics={fetchDashboardMetrics}
            />
          )}

          {currentView === 'reports-analytics' && (
            <ReportsAnalyticsView metrics={metrics} />
          )}

          {currentView === 'service-catalog' && (
            <ServiceCatalogView />
          )}

          {currentView === 'team-management' && (
            <TeamManagementView />
          )}

          {currentView === 'settings' && (
            <SettingsView
              onRefreshMetrics={fetchDashboardMetrics}
              onSeedData={handleSeedData}
              isSeeding={isSeeding}
              onResetData={handleResetAccountData}
              isResetting={isResetting}
            />
          )}
        </main>
      </div>
    </div>
  );
};
