import { db } from '../db/database.js';
import { DashboardMetrics } from '../../../shared/types.js';

export class AnalyticsService {
  /**
   * Calculate live production dashboard metrics strictly from recorded database transactions.
   * If there are no records, return 0s (empty state), never invented numbers!
   */
  public static getDashboardMetrics(filters?: {
    startDate?: string;
    endDate?: string;
    serviceCategory?: string;
    teamMemberId?: string;
  }): DashboardMetrics {
    // 1. Files
    const fileCount = (db.prepare('SELECT COUNT(*) as cnt FROM uploaded_files').get() as { cnt: number }).cnt;

    // 2. Extracted Records
    const recordCount = (db.prepare('SELECT COUNT(*) as cnt FROM extracted_records').get() as { cnt: number }).cnt;

    // 3. Analyzed Customers
    const analyzedCount = (db.prepare('SELECT COUNT(DISTINCT record_id) as cnt FROM customer_analyses').get() as { cnt: number }).cnt;

    // 4. Leads & Pipeline
    const leads = db.prepare('SELECT * FROM leads').all() as any[];
    const qualifiedLeads = leads.filter(l => l.lead_status !== 'Not Qualified').length;
    const interestedCustomers = leads.filter(l => l.lead_status === 'Interested' || l.outcome === 'Interested').length;
    const wonOpportunities = leads.filter(l => l.lead_status === 'Won' || l.outcome === 'Accepted').length;
    const lostOpportunities = leads.filter(l => l.lead_status === 'Lost' || l.outcome === 'Rejected').length;

    let totalPipelineValue = 0;
    for (const lead of leads) {
      if (lead.pipeline_value && lead.lead_status !== 'Lost' && lead.lead_status !== 'Not Qualified') {
        totalPipelineValue += Number(lead.pipeline_value);
      }
    }

    // 5. Recommendations
    const recCount = (db.prepare('SELECT COUNT(*) as cnt FROM service_recommendations').get() as { cnt: number }).cnt;

    // 6. Calls Completed
    const callsCompleted = (db.prepare('SELECT COUNT(*) as cnt FROM call_logs').get() as { cnt: number }).cnt;

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

    // 11. Proposals & Rigorous Actual Acceptance Rate
    // Accepted proposals / Proposals with a recorded final accepted or rejected outcome * 100
    // Exclude pending, draft, cancelled, unknown outcomes!
    const allProposals = db.prepare('SELECT * FROM proposals').all() as any[];
    const proposalsSent = allProposals.filter(p => p.status !== 'draft').length;
    const acceptedProposals = allProposals.filter(p => p.status === 'accepted').length;
    const rejectedProposals = allProposals.filter(p => p.status === 'rejected').length;

    const recordedFinalOutcomes = acceptedProposals + rejectedProposals;
    const actualAcceptanceRate = recordedFinalOutcomes > 0
      ? Math.round((acceptedProposals / recordedFinalOutcomes) * 100 * 10) / 10
      : 0;

    // Lead conversion rate: Won leads / Total qualified leads * 100
    const leadConversionRate = qualifiedLeads > 0
      ? Math.round((wonOpportunities / qualifiedLeads) * 100 * 10) / 10
      : 0;

    // 12. Service-wise Performance
    const services = db.prepare('SELECT id, name, category FROM service_catalog WHERE is_active = 1').all() as any[];
    const servicePerformance = services.map(s => {
      const recs = (db.prepare('SELECT COUNT(*) as cnt FROM service_recommendations WHERE service_id = ?').get(s.id) as { cnt: number }).cnt;
      const proposed = (db.prepare('SELECT COUNT(*) as cnt FROM proposals WHERE service_id = ?').get(s.id) as { cnt: number }).cnt;
      const accepted = (db.prepare("SELECT COUNT(*) as cnt FROM proposals WHERE service_id = ? AND status = 'accepted'").get(s.id) as { cnt: number }).cnt;
      const rejected = (db.prepare("SELECT COUNT(*) as cnt FROM proposals WHERE service_id = ? AND status = 'rejected'").get(s.id) as { cnt: number }).cnt;
      const totalDecided = accepted + rejected;
      const rate = totalDecided > 0 ? Math.round((accepted / totalDecided) * 100) : 0;

      return {
        serviceName: s.name,
        category: s.category,
        recommendedCount: recs,
        proposedCount: proposed,
        acceptedCount: accepted,
        acceptanceRate: rate
      };
    });

    // 13. Lead Source Performance
    const leadSources = ['Document Import', 'Website Inbound', 'Cold Outreach', 'Referral', 'Partner'];
    const leadSourcePerformance = leadSources.map(source => {
      const srcLeads = leads.filter(l => (l.lead_source || 'Document Import').toLowerCase() === source.toLowerCase());
      const won = srcLeads.filter(l => l.lead_status === 'Won' || l.outcome === 'Accepted').length;
      return {
        source,
        leadsCount: srcLeads.length,
        wonCount: won,
        conversionRate: srcLeads.length > 0 ? Math.round((won / srcLeads.length) * 100) : 0
      };
    });

    // 14. Recent Activity Log
    const recentActivity = (db.prepare(`
      SELECT id, action, entity_type, details, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT 10
    `).all() as any[]).map(a => ({
      id: a.id,
      type: 'analysis' as const,
      title: a.action,
      description: `${a.entity_type} - ${a.details || ''}`,
      timestamp: a.created_at,
      user: 'Ashwin Kumar'
    }));

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
      recentActivity
    };
  }
}
