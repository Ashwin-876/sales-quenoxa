import {
  UploadedFileRecord,
  ExtractedRecord,
  CustomerAnalysis,
  ServiceCatalogItem,
  ServiceRecommendation,
  ColdCallScript,
  ColdCallLanguage,
  ColdCallDuration,
  WhatsAppMessage,
  WhatsAppTemplateType,
  ColdEmail,
  ColdEmailTemplateType,
  EmailTone,
  Lead,
  FollowUpTask,
  CallLog,
  TeamMember,
  DashboardMetrics,
  SystemSettings,
  IndustryCatalogueItem,
  MarketingCustomerProfile,
  ProviderSettings,
  GeneratedMarketingOutputs
} from '../../../shared/types.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')}/api/v1`
  : '/api/v1';

async function fetchWithTimeout<T>(url: string, options?: RequestInit, timeoutMs = 60000): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: options?.signal || controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const errorText = await res.text();
      let parsedError = errorText;
      try {
        const j = JSON.parse(errorText);
        parsedError = j.error || errorText;
      } catch {}
      throw new Error(parsedError || `Request failed with status ${res.status}`);
    }
    return res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Connection timed out. The server may be waking up from sleep; please try again in a moment.');
    }
    throw err;
  }
}

async function fetchJson<T>(url: string, options?: RequestInit, retries = 1): Promise<T> {
  try {
    return await fetchWithTimeout<T>(url, options, 60000);
  } catch (err: any) {
    if (retries > 0 && (err.name === 'AbortError' || err.message?.includes('network') || err.message?.includes('Failed to fetch'))) {
      // Small pause before retrying while container spins up
      await new Promise(r => setTimeout(r, 2000));
      return fetchJson<T>(url, options, retries - 1);
    }
    throw err;
  }
}

export const api = {
  // Auth & Team
  getCurrentUser: () => fetchJson<{ id: string; email: string; fullName: string; role: string; avatarUrl: string }>(`${API_BASE}/auth/me`),
  getTeamMembers: () => fetchJson<TeamMember[]>(`${API_BASE}/team`),
  createTeamMember: (data: Partial<TeamMember>) => fetchJson<TeamMember>(`${API_BASE}/team`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateTeamMember: (id: string, data: Partial<TeamMember>) => fetchJson<{ success: boolean }>(`${API_BASE}/team/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteTeamMember: (id: string) => fetchJson<{ success: boolean }>(`${API_BASE}/team/${id}`, {
    method: 'DELETE',
  }),

  // File Upload & Management
  uploadFiles: async (files: File[]) => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    return fetchJson<{ success: boolean; files: any[] }>(`${API_BASE}/files/upload`, {
      method: 'POST',
      body: formData,
    });
  },
  getFiles: () => fetchJson<UploadedFileRecord[]>(`${API_BASE}/files`),
  deleteFile: (id: string) => fetchJson<{ success: boolean }>(`${API_BASE}/files/${id}`, { method: 'DELETE' }),

  // Records
  getRecords: (params?: { fileId?: string; search?: string; status?: string; duplicateOnly?: boolean; missingOnly?: boolean; callStatus?: string; crmStatus?: string; limit?: number; offset?: number }) => {
    const sp = new URLSearchParams();
    if (params?.fileId) sp.set('fileId', params.fileId);
    if (params?.search) sp.set('search', params.search);
    if (params?.status) sp.set('status', params.status);
    if (params?.duplicateOnly) sp.set('duplicateOnly', 'true');
    if (params?.missingOnly) sp.set('missingOnly', 'true');
    if (params?.callStatus && params.callStatus !== 'all') sp.set('callStatus', params.callStatus);
    if (params?.crmStatus && params.crmStatus !== 'all') sp.set('crmStatus', params.crmStatus);
    if (params?.limit) sp.set('limit', String(params.limit));
    if (params?.offset) sp.set('offset', String(params.offset));
    return fetchJson<{
      records: ExtractedRecord[];
      totalCount: number;
      callsCompletedCount: number;
      callsPendingCount: number;
      crmCounts?: { total: number; pending: number; accepted: number; rejected: number; inCrm: number };
    }>(`${API_BASE}/records?${sp.toString()}`);
  },
  getRecordById: (id: string) => fetchJson<ExtractedRecord>(`${API_BASE}/records/${id}`),
  updateRecordCallStatus: (id: string, callCompleted: boolean) =>
    fetchJson<{ success: boolean; id: string; callCompleted: boolean; callCompletedAt: string | null }>(
      `${API_BASE}/records/${id}/call-status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callCompleted }),
      }
    ),
  acceptRecord: (id: string) =>
    fetchJson<{ success: boolean; message: string; leadId: string; crmStatus: string }>(
      `${API_BASE}/records/${id}/accept`,
      { method: 'POST' }
    ),
  rejectRecord: (id: string, reason?: string) =>
    fetchJson<{
      success: boolean;
      message: string;
      recordId: string;
      crmStatus: string;
      counts?: {
        total: number;
        pending: number;
        rejected: number;
        accepted: number;
        inCrm: number;
        callsPending: number;
      };
    }>(
      `${API_BASE}/records/${id}/reject`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || '' })
      }
    ),
  restoreRecord: (id: string) =>
    fetchJson<{
      success: boolean;
      message: string;
      recordId: string;
      counts?: {
        total: number;
        pending: number;
        rejected: number;
        accepted: number;
      };
    }>(
      `${API_BASE}/records/${id}/restore`,
      { method: 'POST' }
    ),
  getRejectedLeads: (search?: string) =>
    fetchJson<{
      items: Array<{
        id: string;
        record_id: string;
        lead_id?: string;
        customer_name: string;
        company_name?: string;
        phone?: string;
        email?: string;
        industry?: string;
        location?: string;
        website?: string;
        rejection_reason: string;
        rejection_date: string;
        rejected_by: string;
      }>;
      totalCount: number;
    }>(`${API_BASE}/rejected-leads${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  addRecordToCrm: (id: string, data?: { pipelineStage?: string; pipelineValue?: number; recommendedService?: string }) =>
    fetchJson<{ success: boolean; leadId: string }>(`${API_BASE}/records/${id}/to-crm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data || {})
    }),
  batchAddRecordsToCrm: (recordIds: string[], defaultStage?: string, defaultValue?: number) =>
    fetchJson<{ success: boolean; addedCount: number }>(`${API_BASE}/records/batch-to-crm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordIds, defaultStage, defaultValue })
    }),

  // AI Analysis & Recommendations
  getCustomerAnalysis: (recordId: string, forceFresh?: boolean) =>
    fetchJson<CustomerAnalysis>(`${API_BASE}/analysis/${recordId}${forceFresh ? '?forceFresh=true' : ''}`),
  getServiceRecommendations: (recordId: string, options?: { signal?: AbortSignal; forceFresh?: boolean }) => {
    const query = options?.forceFresh ? '?forceFresh=true' : '';
    return fetchJson<ServiceRecommendation[]>(`${API_BASE}/analysis/${recordId}/services${query}`, {
      signal: options?.signal
    });
  },
  updateRecommendationStatus: (id: string, status: string, notes?: string) =>
    fetchJson<{ success: boolean }>(`${API_BASE}/recommendations/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    }),

  // Cold Call Studio
  generateColdCallScript: (recordId: string, options: { serviceId?: string; language: ColdCallLanguage; duration: ColdCallDuration; salesObjective: string }) =>
    fetchJson<ColdCallScript>(`${API_BASE}/analysis/${recordId}/cold-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    }),

  // WhatsApp Outreach
  generateWhatsAppMessage: (recordId: string, options: { serviceId?: string; templateType: WhatsAppTemplateType; language: ColdCallLanguage }) =>
    fetchJson<WhatsAppMessage>(`${API_BASE}/analysis/${recordId}/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    }),
  logWhatsAppOpened: (data: { leadId?: string; phoneNumber: string; templateType: string; language: string; messageContent: string; clickToChatUrl: string }) =>
    fetchJson<{ success: boolean; activityId: string; status: string }>(`${API_BASE}/outreach/whatsapp-opened`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // Cold Email Studio
  generateColdEmail: (recordId: string, options: { serviceId?: string; templateType: ColdEmailTemplateType; tone: EmailTone; language: string }) =>
    fetchJson<ColdEmail>(`${API_BASE}/analysis/${recordId}/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    }),
  logEmailOutreach: (data: { leadId?: string; recipientEmail: string; ccEmail?: string; subject: string; body: string; templateType: string; tone: string; language: string; mailtoUrl?: string; isActualSend: boolean }) =>
    fetchJson<{ success: boolean; activityId: string; status: string }>(`${API_BASE}/outreach/email-send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // CRM & Leads
  getLeads: (params?: { stage?: string; search?: string; assignedTo?: string }) => {
    const sp = new URLSearchParams();
    if (params?.stage) sp.set('stage', params.stage);
    if (params?.search) sp.set('search', params.search);
    if (params?.assignedTo) sp.set('assignedTo', params.assignedTo);
    return fetchJson<Lead[]>(`${API_BASE}/leads?${sp.toString()}`);
  },
  updateLead: (id: string, data: Partial<Lead>) =>
    fetchJson<{ success: boolean }>(`${API_BASE}/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // Call Logs & Follow Ups
  logCall: (data: any) =>
    fetchJson<{ success: boolean; callLogId: string }>(`${API_BASE}/calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
  getCallLogs: () => fetchJson<CallLog[]>(`${API_BASE}/calls`),
  getFollowUps: (status?: string) => fetchJson<FollowUpTask[]>(`${API_BASE}/follow-ups${status ? `?status=${status}` : ''}`),
  updateFollowUp: (id: string, data: { status?: string; dueDate?: string }) =>
    fetchJson<{ success: boolean }>(`${API_BASE}/follow-ups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // Service Catalog
  getServices: () => fetchJson<ServiceCatalogItem[]>(`${API_BASE}/services`),
  createService: (service: Partial<ServiceCatalogItem>) =>
    fetchJson<{ success: boolean; id: string }>(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    }),
  updateService: (id: string, service: Partial<ServiceCatalogItem>) =>
    fetchJson<{ success: boolean }>(`${API_BASE}/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    }),
  deleteService: (id: string) => fetchJson<{ success: boolean }>(`${API_BASE}/services/${id}`, { method: 'DELETE' }),

  // Section 7: Industry-Specific Service Intelligence (14 Industries)
  getIndustries: (search?: string) =>
    fetchJson<IndustryCatalogueItem[]>(`${API_BASE}/industries${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createIndustry: (industry: Partial<IndustryCatalogueItem>) =>
    fetchJson<{ success: boolean; id: string }>(`${API_BASE}/industries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(industry)
    }),
  updateIndustry: (id: string, industry: Partial<IndustryCatalogueItem>) =>
    fetchJson<{ success: boolean }>(`${API_BASE}/industries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(industry)
    }),
  deleteIndustry: (id: string) =>
    fetchJson<{ success: boolean }>(`${API_BASE}/industries/${id}`, { method: 'DELETE' }),

  // Dashboard & Analytics
  getDashboardMetrics: (params?: { timeRange?: string; solutionFilter?: string }) => {
    const sp = new URLSearchParams();
    if (params?.timeRange) sp.set('timeRange', params.timeRange);
    if (params?.solutionFilter) sp.set('solutionFilter', params.solutionFilter);
    const q = sp.toString() ? `?${sp.toString()}` : '';
    return fetchJson<DashboardMetrics>(`${API_BASE}/analytics/dashboard${q}`);
  },

  // Settings
  getSettings: () => fetchJson<SystemSettings>(`${API_BASE}/settings`),
  updateSettings: (settings: any) =>
    fetchJson<{ success: boolean }>(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    }),

  // Seed sample
  seedSampleData: () => fetchJson<{ success: boolean; count: number }>(`${API_BASE}/seed-sample`, { method: 'POST' }),

  // Reset Account Data (Clean Slate / Brand-New Account)
  resetAccountData: () => fetchJson<{ success: boolean; message: string }>(`${API_BASE}/account/reset`, { method: 'POST' }),

  // AI-Powered Marketing Message Generator
  getMarketingServices: () => fetchJson<any[]>(`${API_BASE}/marketing-generator/services`),
  getMarketingProviderSettings: () => fetchJson<ProviderSettings>(`${API_BASE}/marketing-generator/provider-settings`),
  updateMarketingProviderSettings: (settings: Partial<ProviderSettings>) =>
    fetchJson<ProviderSettings>(`${API_BASE}/marketing-generator/provider-settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    }),
  generateMarketingMessages: (profile: MarketingCustomerProfile, provider?: Partial<ProviderSettings>) =>
    fetchJson<GeneratedMarketingOutputs>(`${API_BASE}/marketing-generator/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, provider })
    }),
  getMarketingProfiles: () => fetchJson<MarketingCustomerProfile[]>(`${API_BASE}/marketing-generator/profiles`),
  saveMarketingProfile: (profile: MarketingCustomerProfile) =>
    fetchJson<MarketingCustomerProfile>(`${API_BASE}/marketing-generator/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    }),
  deleteMarketingProfile: (id: string) =>
    fetchJson<{ success: boolean }>(`${API_BASE}/marketing-generator/profiles/${id}`, { method: 'DELETE' }),
  getMarketingHistory: () => fetchJson<GeneratedMarketingOutputs[]>(`${API_BASE}/marketing-generator/history`),
};
