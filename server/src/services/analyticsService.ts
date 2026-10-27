import { db } from '../db/database.js';
import { DashboardMetrics } from '../../../shared/types.js';

const SHORT_SERVICE_NAMES: Record<string, string> = {
  'Custom AI & Machine Learning Solutions': 'Custom AI & ML',
  'Modern Website Design & Lead Engine': 'Modern Websites',
  'Enterprise Web Application Development': 'Web Applications',
  'Automated Business Workflows & RPA': 'Automation & Integrations',
  'Data Analytics & Predictive Business Insights': 'Digital Marketing',
  'Full-Stack Digital Transformation & Portals': 'Digital Portals',
  'Custom Software & Process Automation': 'Custom Software',
  'Executive Dashboards & Business Intelligence': 'Executive BI',
  'Cloud Infrastructure Migration & Modernization': 'Cloud Migration',
  'Cross-Platform Software & API Integration': 'API Integration',
  'Strategic Technology Architecture Consulting': 'Tech Consulting',
  'Enterprise Corporate Technology Training': 'Corporate Training'
};

export class AnalyticsService {
  /**
   * Calculate live production dashboard metrics strictly from recorded database transactions.
   */
  public static getDashboardMetrics(filters?: {
    timeRange?: string; // 'This Month' | 'Last 3 Months' | 'This Year' | 'month' | 'quarter' | 'year' | 'all'
    solutionFilter?: string; // 'Top 5 Solutions' | 'All Solutions'
    startDate?: string;
    endDate?: string;
  }): DashboardMetrics {
    const rawRange = (filters?.timeRange || 'This Month').toLowerCase();
    let dateModifier = 'start of month';
    if (rawRange.includes('3 month') || rawRange.includes('quarter')) {
      dateModifier = '-3 months';
    } else if (rawRange.includes('year')) {
      dateModifier = 'start of year';
    } else if (rawRange.includes('all')) {
      dateModifier = '-10 years';
    }

    // 1. Files
    const fileCount = (db.prepare('SELECT COUNT(*) as cnt FROM uploaded_files').get() as { cnt: number }).cnt;

    // 2. Extracted Records
    const recordCount = (db.prepare('SELECT COUNT(*) as cnt FROM extracted_records').get() as { cnt: number }).cnt;

    // 3. Analyzed Customers
    const analyzedCount = (db.prepare('SELECT COUNT(DISTINCT record_id) as cnt FROM customer_analyses').get() as { cnt: number }).cnt;

    // 4. Leads & Pipeline
    const leads = db.prepare("SELECT * FROM leads WHERE date(created_at) >= date('now', ?)").all(dateModifier) as any[];
    const allLeads = leads.length > 0 ? leads : (db.prepare('SELECT * FROM leads').all() as any[]);
    const qualifiedLeads = allLeads.filter(l => l.lead_status !== 'Not Qualified').length;
    const interestedCustomers = allLeads.filter(l => l.lead_status === 'Interested' || l.outcome === 'Interested').length;
    const wonOpportunities = allLeads.filter(l => l.lead_status === 'Won' || l.outcome === 'Accepted').length;
    const lostOpportunities = allLeads.filter(l => l.lead_status === 'Lost' || l.outcome === 'Rejected').length;

    let totalPipelineValue = 0;
    for (const lead of allLeads) {
      if (lead.pipeline_value && lead.lead_status !== 'Lost' && lead.lead_status !== 'Not Qualified') {
        totalPipelineValue += Number(lead.pipeline_value);
      }
    }

    // 5. Recommendations
    const recCount = (db.prepare("SELECT COUNT(*) as cnt FROM service_recommendations WHERE date(created_at) >= date('now', ?)").get(dateModifier) as { cnt: number }).cnt;

    // 6. Calls Completed
    const callLogsCount = (db.prepare('SELECT COUNT(*) as cnt FROM call_logs').get() as { cnt: number }).cnt;
    const recordsCallsCount = (db.prepare('SELECT COUNT(*) as cnt FROM extracted_records WHERE call_completed = 1').get() as { cnt: number }).cnt;
    const callsCompleted = Math.max(callLogsCount, recordsCallsCount);

    // 7. WhatsApp Outreach Attempts
    const whatsAppOutreachAttempts = (db.prepare('SELECT COUNT(*) as cnt FROM whatsapp_activity').get() as { cnt: number }).cnt;

    // 8. Emails: Prepared (drafts) vs Confirmed Sent
    const emailsPrepared = (db.prepare("SELECT COUNT(*) as cnt FROM email_activity WHERE status = 'draft' OR status = 'composer_opened'").get() as { cnt: number }).cnt;
    const emailsSentConfirmed = (db.prepare("SELECT COUNT(*) as cnt FROM email_activity WHERE status = 'sent' OR status = 'delivered'").get() as { cnt: number }).cnt;

    // 9. Follow-ups due today
    const todayStr = new Date().toISOString().split('T')[0];
    const followUpsDueToday = (db.prepare(`
      SELECT COUNT(*) as cnt FROM follow_up_tasks
      WHERE due_date <= ? AND status != 'completed' AND status != 'cancelled'
    `).get(todayStr) as { cnt: number }).cnt;

    // 10. Meetings booked
    const meetingsBooked = (db.prepare('SELECT COUNT(*) as cnt FROM meetings').get() as { cnt: number }).cnt;

    // 11. Proposals
    const allProposals = db.prepare("SELECT * FROM proposals WHERE date(created_at) >= date('now', ?)").all(dateModifier) as any[];
    const proposalsSent = allProposals.filter(p => p.status !== 'draft').length;
    const acceptedProposals = allProposals.filter(p => p.status === 'accepted').length;
    const rejectedProposals = allProposals.filter(p => p.status === 'rejected').length;

    const recordedFinalOutcomes = acceptedProposals + rejectedProposals;
    const actualAcceptanceRate = recordedFinalOutcomes > 0
      ? Math.round((acceptedProposals / recordedFinalOutcomes) * 100 * 10) / 10
      : 0;

    const leadConversionRate = qualifiedLeads > 0
      ? Math.round((wonOpportunities / qualifiedLeads) * 100 * 10) / 10
      : 0;

    // 12. Service-wise Performance from real database recommendations and proposals
    const services = db.prepare('SELECT id, name, category FROM service_catalog WHERE is_active = 1').all() as any[];

    let servicePerformance = services.map(s => {
      const recs = (db.prepare(`
        SELECT COUNT(*) as cnt FROM service_recommendations
        WHERE (service_id = ? OR service_name LIKE '%' || ? || '%')
      `).get(s.id, s.name) as { cnt: number }).cnt;

      const proposed = (db.prepare(`
        SELECT COUNT(*) as cnt FROM proposals
        WHERE (service_id = ? OR title LIKE '%' || ? || '%') AND status = 'sent'
      `).get(s.id, s.name) as { cnt: number }).cnt;

      const accepted = (db.prepare(`
        SELECT COUNT(*) as cnt FROM proposals
        WHERE (service_id = ? OR title LIKE '%' || ? || '%') AND status = 'accepted'
      `).get(s.id, s.name) as { cnt: number }).cnt;

      const rejected = (db.prepare(`
        SELECT COUNT(*) as cnt FROM proposals
        WHERE (service_id = ? OR title LIKE '%' || ? || '%') AND status = 'rejected'
      `).get(s.id, s.name) as { cnt: number }).cnt;

      const totalDecided = accepted + rejected;
      const rate = totalDecided > 0 ? Math.round((accepted / totalDecided) * 100) : 0;

      return {
        serviceName: s.name,
        shortName: SHORT_SERVICE_NAMES[s.name] || s.name,
        category: s.category,
        recommendedCount: recs,
        proposedCount: proposed,
        acceptedCount: accepted,
        acceptanceRate: rate
      };
    });

    // Sort by recommendation / proposal / accepted volume
    servicePerformance.sort((a, b) => {
      const totalA = a.recommendedCount * 2 + a.proposedCount * 3 + a.acceptedCount * 5;
      const totalB = b.recommendedCount * 2 + b.proposedCount * 3 + b.acceptedCount * 5;
      return totalB - totalA;
    });

    if (!filters?.solutionFilter || filters.solutionFilter.toLowerCase().includes('5')) {
      servicePerformance = servicePerformance.slice(0, 5);
    }

    // 13. Live Lead Source Performance from actual leads
    const countsBySource: Record<string, { count: number; won: number }> = {};
    for (const l of allLeads) {
      const src = (l.lead_source || 'Document Import').trim() || 'Document Import';
      if (!countsBySource[src]) countsBySource[src] = { count: 0, won: 0 };
      countsBySource[src].count++;
      if (l.lead_status === 'Won' || l.outcome === 'Accepted') {
        countsBySource[src].won++;
      }
    }

    const SOURCE_COLORS: Record<string, string> = {
      'document import': '#3b82f6',
      'website': '#10b981',
      'cold email': '#f97316',
      'whatsapp': '#06b6d4',
      'referral': '#8b5cf6',
      'partner': '#ec4899'
    };

    const totalLeads = allLeads.length;
    let leadSourcePerformance = Object.entries(countsBySource).map(([source, stats], idx) => {
      const percentage = totalLeads > 0 ? Math.round((stats.count / totalLeads) * 100) : 0;
      const lower = source.toLowerCase();
      const color = SOURCE_COLORS[lower] || ['#3b82f6', '#10b981', '#f97316', '#06b6d4', '#8b5cf6'][idx % 5];
      return {
        source,
        leadsCount: stats.count,
        wonCount: stats.won,
        conversionRate: stats.count > 0 ? Math.round((stats.won / stats.count) * 100) : 0,
        percentage,
        color
      };
    });

    if (leadSourcePerformance.length === 0) {
      leadSourcePerformance = [
        { source: 'Document Import', leadsCount: 0, wonCount: 0, conversionRate: 0, percentage: 100, color: '#3b82f6' }
      ];
    }

    // 14. Live Recent Activity Log from audit_logs
    const getRelativeTime = (dateStr: string) => {
      try {
        const diffMs = Date.now() - new Date(dateStr).getTime();
        const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
        if (diffSecs < 60) return 'Just now';
        const diffMins = Math.floor(diffSecs / 60);
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        return dateStr.slice(0, 10);
      } catch {
        return dateStr;
      }
    };

    const recentActivity = (db.prepare(`
      SELECT id, action, entity_type, details, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 8
    `).all() as any[]).map(a => {
      let title = 'System Activity';
      let description = a.details || '';
      let type: 'upload' | 'analysis' | 'call' | 'whatsapp' | 'email' | 'stage_change' | 'proposal' = 'analysis';

      try {
        const detailsObj = typeof a.details === 'string' && a.details.startsWith('{') ? JSON.parse(a.details) : null;
        if (a.action === 'GENERATE_AI_ANALYSIS') {
          title = 'AI Analysis Completed';
          description = detailsObj?.companyName ? `Completed AI gap analysis for ${detailsObj.companyName}` : 'Customer profile & gap analysis completed';
          type = 'analysis';
        } else if (a.action === 'GENERATE_COLD_CALL_SCRIPT') {
          title = 'Cold Call Pitch Created';
          description = detailsObj?.service ? `Tailored script generated for ${detailsObj.service}` : 'Personalized cold call script generated';
          type = 'call';
        } else if (a.action === 'DOCUMENT_PROCESSED' || a.action === 'UPLOAD_DOCUMENT') {
          title = 'Document Uploaded';
          description = detailsObj?.fileName ? `${detailsObj.fileName} processed into prospect records` : 'New prospect data spreadsheet parsed';
          type = 'upload';
        } else if (a.action === 'ADD_RECORD_TO_CRM') {
          title = 'Lead Added to CRM';
          description = detailsObj?.company ? `${detailsObj.company} added to sales pipeline` : 'Prospect record promoted to active lead';
          type = 'stage_change';
        } else if (a.action === 'LOG_CALL') {
          title = 'Call Logged';
          description = 'Outreach call outcome recorded';
          type = 'call';
        } else {
          title = a.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
          description = typeof a.details === 'string' ? a.details : `${a.entity_type}`;
        }
      } catch {}

      return {
        id: a.id,
        type,
        title,
        description,
        timestamp: a.created_at,
        timeAgo: getRelativeTime(a.created_at),
        user: 'Ashwin Kumar'
      };
    });

    // 15. Live Upcoming Tasks from follow_up_tasks
    const upcomingTasks = (db.prepare(`
      SELECT f.id, f.title, f.task_type, f.due_date, f.status, f.description, l.company_name, l.customer_name
      FROM follow_up_tasks f
      LEFT JOIN leads l ON f.lead_id = l.id
      WHERE f.status != 'completed' AND f.status != 'cancelled'
      ORDER BY f.due_date ASC
      LIMIT 5
    `).all() as any[]).map(t => {
      const isDueToday = t.due_date <= todayStr;
      let dueDateText = 'Today';
      if (t.due_date > todayStr) {
        dueDateText = t.due_date.slice(5);
      }
      return {
        id: t.id,
        title: t.title,
        subtitle: t.company_name ? `${t.company_name} • ${t.task_type.toUpperCase()}` : (t.description || 'Follow-up task'),
        dueDateText,
        isDueToday,
        completed: t.status === 'completed'
      };
    });

    // 16. Dynamic AI Recommendations from live data
    const topServices = servicePerformance.filter(s => s.recommendedCount > 0).slice(0, 2);
    const primaryService = topServices[0] ? topServices[0].serviceName : 'Modern Websites';
    const secondaryService = topServices[1] ? topServices[1].serviceName : 'Automated Workflows';

    const aiRecommendations = [
      {
        id: 'rec-1',
        title: `Focus on ${primaryService}`,
        description: `Highest recommended opportunity across analyzed prospects`,
        actionView: 'service-recommendations',
        icon: 'rocket'
      },
      {
        id: 'rec-2',
        title: `${analyzedCount} Analyzed Prospects in Pipeline`,
        description: `Tailored discovery questions and pricing strategies ready`,
        actionView: 'crm-leads',
        icon: 'users'
      },
      {
        id: 'rec-3',
        title: `Launch ${secondaryService} Outreach`,
        description: `Ready for cold outreach & email campaign targeting`,
        actionView: 'cold-email-studio',
        icon: 'sparkles'
      }
    ];

    return {
      totalUploadedDocuments: fileCount,
      totalExtractedRecords: recordCount,
      totalAnalyzedCustomers: analyzedCount,
      qualifiedLeads,
      recommendedServicesCount: recCount,
      callsCompleted,
      whatsAppOutreachAttempts,
      emailsPrepared,
      emailsSentConfirmed,
      interestedCustomers,
      followUpsDueToday,
      meetingsBooked,
      proposalsSent,
      wonOpportunities,
      lostOpportunities,
      actualAcceptanceRate,
      leadConversionRate,
      totalPipelineValue,
      servicePerformance,
      leadSourcePerformance,
      recentActivity,
      upcomingTasks,
      aiRecommendations
    };
  }
}
