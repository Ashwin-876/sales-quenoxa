import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/environment.js';
import {
  ServiceCatalogItem,
  UploadedFileRecord,
  ExtractedRecord,
  CustomerAnalysis,
  ServiceRecommendation,
  ColdCallScript,
  WhatsAppMessage,
  ColdEmail,
  Lead,
  FollowUpTask,
  CallLog,
  TeamMember,
  DashboardMetrics,
  SystemSettings,
  IndustryCatalogueItem
} from '../../../shared/types.js';

// Ensure data and uploads directory exist
const dataDir = path.dirname(config.dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(config.uploadsDir)) {
  fs.mkdirSync(config.uploadsDir, { recursive: true });
}

export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initDatabase() {
  db.exec(`
    -- 1. TEAMS
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- 2. USERS
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'sales_rep',
      team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
      avatar_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- 3. UPLOADED_FILES
    CREATE TABLE IF NOT EXISTS uploaded_files (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      storage_path TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      extracted_record_count INTEGER DEFAULT 0,
      duplicate_count INTEGER DEFAULT 0,
      invalid_count INTEGER DEFAULT 0,
      missing_value_count INTEGER DEFAULT 0,
      sheet_names TEXT,
      selected_sheet TEXT,
      detected_headers TEXT,
      column_mappings TEXT,
      error_message TEXT,
      is_scanned INTEGER DEFAULT 0,
      ocr_applied INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- 4. SOURCE_DOCUMENTS
    CREATE TABLE IF NOT EXISTS source_documents (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL REFERENCES uploaded_files(id) ON DELETE CASCADE,
      document_title TEXT,
      raw_content TEXT,
      page_count INTEGER DEFAULT 1,
      metadata TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 5. EXTRACTED_RECORDS
    CREATE TABLE IF NOT EXISTS extracted_records (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL REFERENCES uploaded_files(id) ON DELETE CASCADE,
      customer_name TEXT NOT NULL,
      company_name TEXT,
      email TEXT,
      phone TEXT,
      industry TEXT,
      location TEXT,
      raw_fields TEXT NOT NULL,
      sheet_name TEXT,
      row_number INTEGER,
      page_number INTEGER,
      status TEXT DEFAULT 'raw',
      is_duplicate INTEGER DEFAULT 0,
      has_missing_values INTEGER DEFAULT 0,
      has_invalid_data INTEGER DEFAULT 0,
      missing_fields TEXT,
      invalid_fields TEXT,
      call_completed INTEGER DEFAULT 0,
      call_completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- 6. SERVICE_CATALOG
    CREATE TABLE IF NOT EXISTS service_catalog (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      target_customer TEXT NOT NULL,
      qualifying_requirements TEXT,
      expected_benefits TEXT,
      limitations TEXT,
      pricing_range TEXT,
      implementation_complexity TEXT NOT NULL DEFAULT 'Medium',
      delivery_requirements TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- 7. CUSTOMERS
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company_name TEXT,
      industry TEXT,
      location TEXT,
      business_size TEXT,
      website_url TEXT,
      identified_tech_stack TEXT,
      known_services TEXT,
      is_tech_evidenced INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- 8. CONTACTS
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      title TEXT,
      email TEXT,
      phone TEXT,
      clean_phone TEXT,
      is_primary INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 9. LEADS
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
      extracted_record_id TEXT REFERENCES extracted_records(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      company_name TEXT,
      email TEXT,
      phone TEXT,
      industry TEXT,
      location TEXT,
      lead_source TEXT DEFAULT 'Document Import',
      assigned_employee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      recommended_service TEXT,
      proposed_service TEXT,
      lead_status TEXT NOT NULL DEFAULT 'New Lead',
      pipeline_value REAL DEFAULT 0.00,
      follow_up_date TEXT,
      outcome TEXT DEFAULT 'Pending',
      rejection_reason TEXT,
      next_action TEXT,
      notes TEXT,
      call_completed INTEGER DEFAULT 0,
      call_completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- 10. CUSTOMER_ANALYSES
    CREATE TABLE IF NOT EXISTS customer_analyses (
      id TEXT PRIMARY KEY,
      record_id TEXT REFERENCES extracted_records(id) ON DELETE CASCADE,
      customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
      model_used TEXT NOT NULL,
      customer_profile TEXT NOT NULL,
      business_requirements TEXT NOT NULL,
      missing_information TEXT NOT NULL,
      business_gap_analysis TEXT NOT NULL,
      advantages_and_disadvantages TEXT NOT NULL,
      recommended_next_actions TEXT NOT NULL,
      fact_evidence_map TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 11. ANALYSIS_HISTORY
    CREATE TABLE IF NOT EXISTS analysis_history (
      id TEXT PRIMARY KEY,
      customer_analysis_id TEXT REFERENCES customer_analyses(id) ON DELETE CASCADE,
      version INTEGER NOT NULL DEFAULT 1,
      prompt_tokens INTEGER DEFAULT 0,
      completion_tokens INTEGER DEFAULT 0,
      model_version TEXT,
      diff_summary TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 12. SERVICE_RECOMMENDATIONS
    CREATE TABLE IF NOT EXISTS service_recommendations (
      id TEXT PRIMARY KEY,
      record_id TEXT REFERENCES extracted_records(id) ON DELETE CASCADE,
      customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
      service_id TEXT REFERENCES service_catalog(id) ON DELETE CASCADE,
      service_name TEXT NOT NULL,
      category TEXT NOT NULL,
      rank INTEGER NOT NULL,
      relevance_score REAL NOT NULL,
      suitability_explanation TEXT NOT NULL,
      supporting_evidence TEXT,
      missing_info_and_assumptions TEXT,
      comparison TEXT NOT NULL,
      likely_objections TEXT,
      suggested_next_action TEXT,
      acceptance_estimate TEXT,
      approval_status TEXT DEFAULT 'pending',
      manual_notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 13. COLD_CALL_SCRIPTS
    CREATE TABLE IF NOT EXISTS cold_call_scripts (
      id TEXT PRIMARY KEY,
      record_id TEXT REFERENCES extracted_records(id) ON DELETE CASCADE,
      customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
      service_id TEXT REFERENCES service_catalog(id) ON DELETE SET NULL,
      service_name TEXT NOT NULL,
      language TEXT NOT NULL,
      duration TEXT NOT NULL,
      sales_objective TEXT NOT NULL,
      greeting TEXT NOT NULL,
      caller_intro TEXT NOT NULL,
      reason_for_calling TEXT NOT NULL,
      personalized_opening TEXT NOT NULL,
      discovery_questions TEXT,
      service_pitch TEXT NOT NULL,
      benefits_value_prop TEXT,
      objection_handling TEXT,
      meeting_followup_request TEXT NOT NULL,
      closing_statement TEXT NOT NULL,
      raw_text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 14. OUTREACH_MESSAGES
    CREATE TABLE IF NOT EXISTS outreach_messages (
      id TEXT PRIMARY KEY,
      lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
      channel TEXT NOT NULL,
      recipient TEXT NOT NULL,
      subject TEXT,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 15. WHATSAPP_ACTIVITY
    CREATE TABLE IF NOT EXISTS whatsapp_activity (
      id TEXT PRIMARY KEY,
      lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
      customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      phone_number TEXT NOT NULL,
      template_type TEXT NOT NULL,
      language TEXT NOT NULL,
      message_content TEXT NOT NULL,
      click_to_chat_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      api_message_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      opened_at TEXT
    );

    -- 16. EMAIL_ACTIVITY
    CREATE TABLE IF NOT EXISTS email_activity (
      id TEXT PRIMARY KEY,
      lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
      customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      recipient_email TEXT NOT NULL,
      cc_email TEXT,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      template_type TEXT NOT NULL,
      tone TEXT NOT NULL,
      language TEXT NOT NULL,
      mailto_url TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      provider_message_id TEXT,
      delivery_details TEXT,
      sent_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 17. CALL_LOGS
    CREATE TABLE IF NOT EXISTS call_logs (
      id TEXT PRIMARY KEY,
      lead_id TEXT REFERENCES leads(id) ON DELETE CASCADE,
      customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      duration_seconds INTEGER DEFAULT 0,
      connected INTEGER NOT NULL DEFAULT 0,
      interested INTEGER NOT NULL DEFAULT 0,
      requirements_identified TEXT,
      services_discussed TEXT,
      objections_raised TEXT,
      customer_feedback TEXT,
      meeting_status TEXT DEFAULT 'none',
      callback_date TEXT,
      proposal_status TEXT DEFAULT 'not_requested',
      final_outcome TEXT NOT NULL DEFAULT 'Pending',
      notes TEXT,
      call_timestamp TEXT DEFAULT (datetime('now'))
    );

    -- 18. FOLLOW_UP_TASKS
    CREATE TABLE IF NOT EXISTS follow_up_tasks (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      task_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'upcoming',
      ai_suggested_message TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- 19. MEETINGS
    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 30,
      meeting_link TEXT,
      location TEXT,
      status TEXT DEFAULT 'scheduled',
      outcome_notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 20. PROPOSALS
    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      service_id TEXT REFERENCES service_catalog(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      value REAL NOT NULL DEFAULT 0.00,
      currency TEXT DEFAULT 'INR',
      sent_date TEXT,
      valid_until TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      document_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- 21. SALES_OUTCOMES
    CREATE TABLE IF NOT EXISTS sales_outcomes (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      proposal_id TEXT REFERENCES proposals(id) ON DELETE SET NULL,
      service_id TEXT REFERENCES service_catalog(id) ON DELETE SET NULL,
      outcome TEXT NOT NULL,
      contract_value REAL DEFAULT 0.00,
      decision_maker TEXT,
      rejection_reason TEXT,
      outcome_date TEXT DEFAULT (date('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 22. AUDIT_LOGS
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- SYSTEM_SETTINGS
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- 23. INDUSTRY_CATALOGUE (14 Industries A to N & Custom Mappings)
    CREATE TABLE IF NOT EXISTS industry_catalogue (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      industry_name TEXT NOT NULL,
      business_categories TEXT NOT NULL,
      common_problems TEXT NOT NULL,
      mapped_services TEXT NOT NULL,
      solution_descriptions TEXT NOT NULL,
      example_workflow TEXT,
      is_custom INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Safe schema migrations for leads, records, and analyses
  try { db.exec("ALTER TABLE leads ADD COLUMN website TEXT;"); } catch {}
  try { db.exec("ALTER TABLE leads ADD COLUMN digital_presence TEXT;"); } catch {}
  try { db.exec("ALTER TABLE leads ADD COLUMN analysis_status TEXT DEFAULT 'New';"); } catch {}
  try { db.exec("ALTER TABLE leads ADD COLUMN priority TEXT DEFAULT 'Medium';"); } catch {}
  try { db.exec("ALTER TABLE leads ADD COLUMN last_contacted_at TEXT;"); } catch {}
  try { db.exec("ALTER TABLE leads ADD COLUMN call_completed INTEGER DEFAULT 0;"); } catch {}
  try { db.exec("ALTER TABLE leads ADD COLUMN call_completed_at TEXT;"); } catch {}

  try { db.exec("ALTER TABLE extracted_records ADD COLUMN website TEXT;"); } catch {}
  try { db.exec("ALTER TABLE extracted_records ADD COLUMN digital_presence TEXT;"); } catch {}
  try { db.exec("ALTER TABLE extracted_records ADD COLUMN analysis_status TEXT DEFAULT 'New';"); } catch {}
  try { db.exec("ALTER TABLE extracted_records ADD COLUMN priority TEXT DEFAULT 'Medium';"); } catch {}
  try { db.exec("ALTER TABLE extracted_records ADD COLUMN last_contacted_at TEXT;"); } catch {}
  try { db.exec("ALTER TABLE extracted_records ADD COLUMN call_completed INTEGER DEFAULT 0;"); } catch {}
  try { db.exec("ALTER TABLE extracted_records ADD COLUMN call_completed_at TEXT;"); } catch {}
  try { db.exec("ALTER TABLE extracted_records ADD COLUMN crm_status TEXT DEFAULT 'pending';"); } catch {}
  try { db.exec("ALTER TABLE extracted_records ADD COLUMN rejection_reason TEXT;"); } catch {}
  try { db.exec("ALTER TABLE extracted_records ADD COLUMN accepted_at TEXT;"); } catch {}
  try { db.exec("ALTER TABLE extracted_records ADD COLUMN rejected_at TEXT;"); } catch {}
  try { db.exec("CREATE INDEX IF NOT EXISTS idx_extracted_records_crm_status ON extracted_records(crm_status);"); } catch {}

  // 24. REJECTED_LEADS_HISTORY (Audit-compliant customer rejection storage)
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS rejected_leads_history (
        id TEXT PRIMARY KEY,
        record_id TEXT NOT NULL,
        lead_id TEXT,
        customer_name TEXT NOT NULL,
        company_name TEXT,
        phone TEXT,
        email TEXT,
        industry TEXT,
        location TEXT,
        website TEXT,
        rejection_reason TEXT NOT NULL,
        rejection_date TEXT DEFAULT (datetime('now')),
        rejected_by TEXT DEFAULT 'Ashwin Kumar',
        raw_details TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_rejected_leads_history_record ON rejected_leads_history(record_id);
      CREATE INDEX IF NOT EXISTS idx_rejected_leads_history_date ON rejected_leads_history(rejection_date);
    `);
  } catch {}

  try { db.exec("ALTER TABLE customer_analyses ADD COLUMN digital_presence TEXT;"); } catch {}
  try { db.exec("ALTER TABLE customer_analyses ADD COLUMN business_problems TEXT;"); } catch {}
  try { db.exec("ALTER TABLE customer_analyses ADD COLUMN recommended_services TEXT;"); } catch {}
  try { db.exec("ALTER TABLE customer_analyses ADD COLUMN suggested_service_package TEXT;"); } catch {}
  try { db.exec("ALTER TABLE customer_analyses ADD COLUMN sales_strategy TEXT;"); } catch {}
  try { db.exec("ALTER TABLE customer_analyses ADD COLUMN data_quality TEXT;"); } catch {}

  // Performance indexes for service recommendations, analyses, and catalog
  try { db.exec("CREATE INDEX IF NOT EXISTS idx_service_recs_record_id ON service_recommendations(record_id);"); } catch {}
  try { db.exec("CREATE INDEX IF NOT EXISTS idx_service_recs_service_id ON service_recommendations(service_id);"); } catch {}
  try { db.exec("CREATE INDEX IF NOT EXISTS idx_customer_analyses_record_id ON customer_analyses(record_id);"); } catch {}
  try { db.exec("CREATE INDEX IF NOT EXISTS idx_service_catalog_active ON service_catalog(is_active);"); } catch {}

  // Seed default Services if empty
  seedDefaultServices();
  // Seed default Users & Teams if empty
  seedDefaultUsersAndTeams();
  // Seed default 14-Industry Catalogue if empty
  seedIndustryCatalogue();
  // Ensure real uploaded/extracted records are synced as live leads
  syncGivenDataOnly();
}

function seedDefaultServices() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM service_catalog').get() as { cnt: number };
  if (count.cnt > 0) {
    // Migrate any legacy USD pricing to Indian Rupee (INR) pricing
    db.exec(`
      UPDATE service_catalog SET pricing_range = '₹2,50,000 - ₹8,50,000' WHERE name = 'Custom AI & Machine Learning Solutions';
      UPDATE service_catalog SET pricing_range = '₹45,000 - ₹1,25,000' WHERE name = 'Modern Website Design & Lead Engine';
      UPDATE service_catalog SET pricing_range = '₹2,00,000 - ₹7,50,000' WHERE name = 'Enterprise Web Application Development';
      UPDATE service_catalog SET pricing_range = '₹3,00,000 - ₹10,00,000' WHERE name = 'Full-Stack Digital Transformation & Portals';
      UPDATE service_catalog SET pricing_range = '₹1,50,000 - ₹6,00,000' WHERE name = 'Custom Software & Process Automation';
      UPDATE service_catalog SET pricing_range = '₹50,000 - ₹2,00,000' WHERE name = 'Automated Business Workflows & RPA';
      UPDATE service_catalog SET pricing_range = '₹75,000 - ₹3,00,000' WHERE name = 'Data Analytics & Predictive Business Insights';
      UPDATE service_catalog SET pricing_range = '₹60,000 - ₹2,50,000' WHERE name = 'Executive Dashboards & Business Intelligence';
      UPDATE service_catalog SET pricing_range = '₹95,000 - ₹4,00,000' WHERE name = 'Cloud Infrastructure Migration & Modernization';
      UPDATE service_catalog SET pricing_range = '₹65,000 - ₹2,50,000' WHERE name = 'Cross-Platform Software & API Integration';
      UPDATE service_catalog SET pricing_range = '₹40,000 - ₹1,80,000 / month' WHERE name = 'Strategic Technology Architecture Consulting';
      UPDATE service_catalog SET pricing_range = '₹35,000 - ₹1,50,000' WHERE name = 'Enterprise Corporate Technology Training';
    `);
    return;
  }

  const initialServices: Omit<ServiceCatalogItem, 'createdAt' | 'updatedAt'>[] = [
    {
      id: uuidv4(),
      name: 'Custom AI & Machine Learning Solutions',
      category: 'AI and machine learning',
      description: 'End-to-end proprietary ML model fine-tuning, retrieval-augmented generation (RAG), and intelligent agent automation for business workflows.',
      targetCustomer: 'Mid-market to enterprise companies looking to automate document intelligence, predictive analytics, or customer service.',
      qualifyingRequirements: ['Available domain data or document repositories', 'Established operational bottleneck', 'Minimum budget commitment'],
      expectedBenefits: ['Up to 80% reduction in manual document handling', 'Instant 24/7 intelligent reasoning', 'Data-driven decision making'],
      limitations: ['Requires curated sample data for optimal accuracy', 'Cloud compute dependencies'],
      pricingRange: '₹2,50,000 - ₹8,50,000',
      implementationComplexity: 'High',
      deliveryRequirements: ['Customer domain expert access', 'API/cloud infrastructure access'],
      isActive: true,
    },
    {
      id: uuidv4(),
      name: 'Modern Website Design & Lead Engine',
      category: 'Website development',
      description: 'High-converting, lightning-fast corporate websites built on React/Next.js with embedded analytics, SEO architecture, and CRM webhooks.',
      targetCustomer: 'Companies with outdated or slow websites losing inbound customer leads.',
      qualifyingRequirements: ['Outdated web presence (>3 years old)', 'Lack of mobile optimization or slow load times'],
      expectedBenefits: ['3x higher conversion rate', 'Sub-second page load times', 'Rankings increase for regional search terms'],
      limitations: ['Requires client brand assets and copy approvals'],
      pricingRange: '₹45,000 - ₹1,25,000',
      implementationComplexity: 'Medium',
      deliveryRequirements: ['Logo and brand identity assets', 'Content guidelines'],
      isActive: true,
    },
    {
      id: uuidv4(),
      name: 'Enterprise Web Application Development',
      category: 'Web application development',
      description: 'Robust cloud-native SaaS and internal operational web apps with role-based security, reactive dashboards, and scalable PostgreSQL architectures.',
      targetCustomer: 'Growing businesses managing complex operations across spreadsheets or disparate legacy tools.',
      qualifyingRequirements: ['Multi-user workflow bottlenecks', 'Need for centralized customer/order tracking'],
      expectedBenefits: ['Single source of truth', 'Elimination of duplicate manual entries', 'Audit trail compliance'],
      limitations: ['Requires 4-8 weeks engineering sprint cycle'],
      pricingRange: '₹2,00,000 - ₹7,50,000',
      implementationComplexity: 'High',
      deliveryRequirements: ['Business process workflow map', 'Stakeholder interviews'],
      isActive: true,
    },
    {
      id: uuidv4(),
      name: 'Full-Stack Digital Transformation & Portals',
      category: 'Full-stack development',
      description: 'Complete client and vendor self-service portals with payment gateway integration, document generation, and backend ERP syncing.',
      targetCustomer: 'Logistics, healthcare, manufacturing, and financial services firms.',
      qualifyingRequirements: ['High customer inquiries on order/service status', 'Manual invoicing & document exchange'],
      expectedBenefits: ['60% reduction in support tickets', 'Instant client transparency', 'Accelerated payments'],
      limitations: ['Requires integration with existing billing/ERP system'],
      pricingRange: '₹3,00,000 - ₹10,00,000',
      implementationComplexity: 'Enterprise',
      deliveryRequirements: ['ERP API endpoints or database access'],
      isActive: true,
    },
    {
      id: uuidv4(),
      name: 'Custom Software & Process Automation',
      category: 'Custom software',
      description: 'Tailored desktop, server, or cloud software engineering designed to solve specific operational constraints impossible with off-the-shelf software.',
      targetCustomer: 'Companies with proprietary calculation formulas, unique manufacturing schedules, or specialized reporting needs.',
      qualifyingRequirements: ['Unsatisfied by off-the-shelf SaaS options', 'High cost of manual workarounds'],
      expectedBenefits: ['Exact operational fit', 'Zero recurring SaaS seat licensing inflation'],
      limitations: ['Requires thorough scoping phase'],
      pricingRange: '₹1,50,000 - ₹6,00,000',
      implementationComplexity: 'High',
      deliveryRequirements: ['Detailed specification and edge case review'],
      isActive: true,
    },
    {
      id: uuidv4(),
      name: 'Automated Business Workflows & RPA',
      category: 'Business automation',
      description: 'Zero-touch workflow automation interconnecting email, WhatsApp, spreadsheets, invoices, and accounting systems.',
      targetCustomer: 'Businesses with repetitive data-entry teams copying numbers between systems.',
      qualifyingRequirements: ['Repetitive tasks taking >10 hours/week', 'Digital input/output formats available'],
      expectedBenefits: ['99.9% elimination of data-entry typos', 'Instant customer notifications', 'Saves hundreds of payroll hours'],
      limitations: ['Third-party system APIs must remain stable'],
      pricingRange: '₹50,000 - ₹2,00,000',
      implementationComplexity: 'Medium',
      deliveryRequirements: ['System credentials and trigger definitions'],
      isActive: true,
    },
    {
      id: uuidv4(),
      name: 'Data Analytics & Predictive Business Insights',
      category: 'Data analytics',
      description: 'Consolidation of scattered sales, customer, and marketing data into actionable predictive metrics, churn warnings, and inventory forecasts.',
      targetCustomer: 'Retail, e-commerce, and B2B distributors struggling to forecast demand or spot margin erosion.',
      qualifyingRequirements: ['Historical transaction or interaction data (>6 months)'],
      expectedBenefits: ['Identification of highest margin customer segments', 'Proactive churn prevention', 'Inventory optimization'],
      limitations: ['Dependent on historical data cleanliness'],
      pricingRange: '₹75,000 - ₹3,00,000',
      implementationComplexity: 'Medium',
      deliveryRequirements: ['Access to historical transaction databases or CSV archives'],
      isActive: true,
    },
    {
      id: uuidv4(),
      name: 'Executive Dashboards & Business Intelligence',
      category: 'Dashboards and business intelligence',
      description: 'Real-time executive visual dashboards for CXOs with automated daily WhatsApp/email digest reports and KPI monitoring.',
      targetCustomer: 'Founders and executive directors who lack instant visibility into daily sales and operational health.',
      qualifyingRequirements: ['Multiple branch locations or remote sales teams', 'Need for consolidated live view'],
      expectedBenefits: ['Real-time pulse on revenue and cash flow', 'Early detection of regional underperformance'],
      limitations: ['Requires clear definition of target KPIs'],
      pricingRange: '₹60,000 - ₹2,50,000',
      implementationComplexity: 'Medium',
      deliveryRequirements: ['Executive KPI priority list'],
      isActive: true,
    },
    {
      id: uuidv4(),
      name: 'Cloud Infrastructure Migration & Modernization',
      category: 'Cloud solutions',
      description: 'Secure migration of on-premise servers and databases to AWS/GCP/Supabase with automated backups, load balancing, and auto-scaling.',
      targetCustomer: 'Companies running aging local server racks prone to crashes or physical security risks.',
      qualifyingRequirements: ['Local servers or unreliable shared hosting', 'Compliance and uptime demands'],
      expectedBenefits: ['99.99% uptime SLA', 'Disaster recovery and automated snapshots', 'Zero physical hardware maintenance'],
      limitations: ['Planned migration maintenance window required'],
      pricingRange: '₹95,000 - ₹4,00,000',
      implementationComplexity: 'High',
      deliveryRequirements: ['Server root access and network configuration permissions'],
      isActive: true,
    },
    {
      id: uuidv4(),
      name: 'Cross-Platform Software & API Integration',
      category: 'Software integration',
      description: 'Seamless integration connecting WhatsApp, CRM (Salesforce/HubSpot/Custom), ERP (SAP/Zoho/Tally), and payment gateways into unified pipelines.',
      targetCustomer: 'Businesses struggling with disconnected software silos.',
      qualifyingRequirements: ['Two or more incompatible software tools in active daily use'],
      expectedBenefits: ['Synchronized customer records', 'Instant notification triggers', 'Streamlined finance reconciliation'],
      limitations: ['Subject to third-party vendor API rate limits'],
      pricingRange: '₹65,000 - ₹2,50,000',
      implementationComplexity: 'Medium',
      deliveryRequirements: ['API keys and test sandbox environments'],
      isActive: true,
    },
    {
      id: uuidv4(),
      name: 'Strategic Technology Architecture Consulting',
      category: 'Technical consulting',
      description: 'Fractional CTO advisory, technical audits, security vulnerability reviews, and 3-year digital roadmap formulation.',
      targetCustomer: 'Growing companies planning major IT investments or facing technical stagnation.',
      qualifyingRequirements: ['Need for non-biased technical roadmap and vendor vetting'],
      expectedBenefits: ['Prevention of costly tech stack mistakes', 'Optimized vendor negotiations', 'Clear execution roadmap'],
      limitations: ['Advisory scope; implementation billed separately'],
      pricingRange: '₹40,000 - ₹1,80,000 / month',
      implementationComplexity: 'Low',
      deliveryRequirements: ['Executive stakeholder access and existing tech documentation'],
      isActive: true,
    },
    {
      id: uuidv4(),
      name: 'Enterprise Corporate Technology Training',
      category: 'Training and technology services',
      description: 'Hands-on practical training programs for enterprise staff in modern AI tools, business intelligence, full-stack technologies, and cybersecurity.',
      targetCustomer: 'Organizations adopting new software or wanting to upskill their internal workforce.',
      qualifyingRequirements: ['Team of 5+ technical or operations personnel'],
      expectedBenefits: ['Rapid technology adoption', 'Boosted employee productivity', 'Reduced external vendor dependency'],
      limitations: ['Requires committed staff training hours'],
      pricingRange: '₹35,000 - ₹1,50,000',
      implementationComplexity: 'Low',
      deliveryRequirements: ['Training schedule and attendee list'],
      isActive: true,
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO service_catalog (
      id, name, category, description, target_customer,
      qualifying_requirements, expected_benefits, limitations,
      pricing_range, implementation_complexity, delivery_requirements, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const s of initialServices) {
    stmt.run(
      s.id,
      s.name,
      s.category,
      s.description,
      s.targetCustomer,
      JSON.stringify(s.qualifyingRequirements),
      JSON.stringify(s.expectedBenefits),
      JSON.stringify(s.limitations),
      s.pricingRange || null,
      s.implementationComplexity,
      JSON.stringify(s.deliveryRequirements),
      s.isActive ? 1 : 0
    );
  }
}

function seedDefaultUsersAndTeams() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  if (count.cnt > 0) return;

  const teamId = uuidv4();
  db.prepare(`
    INSERT INTO teams (id, name, description)
    VALUES (?, ?, ?)
  `).run(teamId, 'Quenoxa Global Sales & Engineering', 'Primary revenue and technical delivery division');

  const defaultUsers = [
    {
      id: uuidv4(),
      email: 'ashwin@quenoxa.com',
      fullName: 'Ashwin Kumar',
      role: 'admin',
      teamId,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
    {
      id: uuidv4(),
      email: 'karthik.sales@quenoxa.com',
      fullName: 'Karthik Subramanian',
      role: 'sales_manager',
      teamId,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
    {
      id: uuidv4(),
      email: 'priya.n@quenoxa.com',
      fullName: 'Priya Narayanan',
      role: 'sales_rep',
      teamId,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
    {
      id: uuidv4(),
      email: 'suresh.ai@quenoxa.com',
      fullName: 'Suresh Varma',
      role: 'business_analyst',
      teamId,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO users (id, email, full_name, role, team_id, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const u of defaultUsers) {
    stmt.run(u.id, u.email, u.fullName, u.role, u.teamId, u.avatarUrl);
  }
}

function seedIndustryCatalogue() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM industry_catalogue').get() as { cnt: number };
  if (count.cnt > 0) return;

  const initialIndustries: Omit<IndustryCatalogueItem, 'createdAt' | 'updatedAt'>[] = [
    {
      id: uuidv4(),
      code: 'A',
      industryName: 'Food and beverage',
      businessCategories: ['Cafés', 'Restaurants', 'Bakeries', 'Juice shops', 'Catering services', 'Sweet shops'],
      commonProblems: [
        'Printed paper menus with slow updating and printing reprint costs',
        'High 20-30% food aggregator platform commissions eroding profit margins',
        'Untracked table reservations causing long wait times and customer walkouts',
        'Lack of recipe ingredient expiry and wastage tracking leading to margin loss',
        'Absence of customer return loyalty system to drive repeat weekly visits'
      ],
      mappedServices: [
        'Website development',
        'QR digital menu',
        'Online ordering',
        'Table reservations',
        'POS integration',
        'Inventory management',
        'Ingredient and expiry tracking',
        'Loyalty programmes',
        'Social media marketing',
        'Google Business Profile optimization',
        'Customer feedback systems'
      ],
      solutionDescriptions: [
        'Dynamic contactless QR digital menu with real-time price & stock updates',
        'Direct commission-free online ordering and delivery dispatch portal',
        'Automated table reservation management and peak-hour queue tracking',
        'POS-synced recipe-level ingredient decrement and expiry alert system',
        'WhatsApp-integrated digital stamp loyalty program with automated return vouchers'
      ],
      exampleWorkflow: 'For a café with a printed menu and no online ordering, recommend a QR menu first, then a website or ordering solution if justified.',
      isCustom: false
    },
    {
      id: uuidv4(),
      code: 'B',
      industryName: 'Fitness and wellness',
      businessCategories: ['Gyms', 'Yoga studios', 'Fitness centres', 'Sports academies', 'Salons and spas'],
      commonProblems: [
        'Walk-in visitor and trial session leads tracked on paper register resulting in unreached renewals',
        'Manual attendance and membership expiry management causing payment delays',
        'Lack of automated renewal reminders leading to high member churn',
        'Untracked personal trainer schedules and slot booking conflicts',
        'Absence of member workout and body transformation performance tracking'
      ],
      mappedServices: [
        'Membership management',
        'Attendance tracking',
        'Lead CRM',
        'Renewal reminders',
        'Class scheduling',
        'Online booking',
        'Website development',
        'Promotional campaigns',
        'Customer loyalty',
        'Performance dashboards'
      ],
      solutionDescriptions: [
        'Biometric/RFID synced cloud membership lifecycle and recurring subscription manager',
        'Automated multi-channel renewal reminder sequences via WhatsApp & SMS 7 days before expiry',
        'Mobile trainer class scheduler and slot booking application for members',
        'Lead capture CRM with automated follow-up cadences for gym walk-ins and trial sessions',
        'Member progress metrics and retention executive analytics dashboard'
      ],
      exampleWorkflow: 'For a gym with untracked enquiries, prioritize lead CRM and follow-up workflows.',
      isCustom: false
    },
    {
      id: uuidv4(),
      code: 'C',
      industryName: 'Retail and commerce',
      businessCategories: ['Supermarkets', 'Clothing stores', 'Electronics shops', 'Boutiques', 'Furniture stores', 'Jewellery shops', 'Wholesale distributors'],
      commonProblems: [
        'Lack of digital product visibility outside physical store footfall',
        'Barcode-billing mismatches and stockout blindspots across product lines',
        'Manual supplier purchase orders and unrecorded credit tracking',
        'Absence of repeat customer purchase incentive loops and points'
      ],
      mappedServices: [
        'E-commerce',
        'Digital product catalogues',
        'Inventory management',
        'Barcode integration',
        'Billing integration',
        'Customer CRM',
        'Loyalty systems',
        'Supplier management',
        'Sales dashboards'
      ],
      solutionDescriptions: [
        'Omnichannel e-commerce web storefront synced directly to store billing POS',
        'Interactive digital product catalogue with WhatsApp order cart checkout',
        'Multi-location barcode warehouse and inventory threshold alert system',
        'Supplier procurement portal with purchase order reconciliation and payment ledger',
        'Customer loyalty rewards engine tracking customer lifetime value (LTV)'
      ],
      exampleWorkflow: 'For a boutique or electronics store with retail footfall only, introduce digital WhatsApp catalog and POS-synced inventory before full e-commerce.',
      isCustom: false
    },
    {
      id: uuidv4(),
      code: 'D',
      industryName: 'Real estate and construction',
      businessCategories: ['Land promoters', 'Property agencies', 'Builders', 'Construction companies', 'Interior designers', 'Rental agencies'],
      commonProblems: [
        'High lead leakage from property portals and outdoor hoarding ads',
        'Unscheduled site visits leading to double bookings and missed prospective buyers',
        'Scattered broker commissions and property listings across WhatsApp chats',
        'Manual quotation preparation and delayed construction milestone invoicing'
      ],
      mappedServices: [
        'Property listing websites',
        'Project landing pages',
        'Lead CRM',
        'Site-visit booking',
        'Follow-up automation',
        'Property galleries',
        'Broker portals',
        'Quotation management',
        'Project tracking dashboards'
      ],
      solutionDescriptions: [
        'High-speed immersive property project landing pages with virtual walk-throughs',
        'Lead routing CRM with instant round-robin agent assignment and WhatsApp call alerts',
        'Automated site-visit scheduler with calendar sync and Google Maps directions',
        'Sub-broker referral tracking portal with commission transparency',
        'Construction milestone tracker and digital quotation generator'
      ],
      exampleWorkflow: 'For a land promoter or builder running ads, deploy dedicated project landing pages and instant site-visit lead CRM.',
      isCustom: false
    },
    {
      id: uuidv4(),
      code: 'E',
      industryName: 'Education',
      businessCategories: ['Schools', 'Colleges', 'Coaching centres', 'Training institutes', 'Online educators', 'Placement agencies'],
      commonProblems: [
        'Chaotic manual admission inquiry recording during seasonal admission rush',
        'Scattered student fee payment records and uncollected overdue dues',
        'Lack of centralized digital learning material delivery and test grading',
        'Manual paper attendance tracking and unnotified student absences',
        'Untracked campus placement interviews and recruiter relationships'
      ],
      mappedServices: [
        'Institutional websites',
        'Admission enquiry CRM',
        'Student management',
        'Learning management systems',
        'Online registration',
        'Attendance and fee tracking',
        'Certificate verification',
        'Notifications',
        'Placement tracking'
      ],
      solutionDescriptions: [
        'Accredited modern institutional web portal with student applicant registration',
        'Centralized Admission CRM tracking prospective student counseling pipeline',
        'LMS portal with lecture notes, video repository, assignment submission, and online quiz tests',
        'Automated fee collection gateway with instant fee receipts and SMS/WhatsApp payment links',
        'QR-coded verifiable tamper-proof digital certificates and student transcript portal'
      ],
      exampleWorkflow: 'For a coaching center or college, deploy admission enquiry CRM and fee payment automation first.',
      isCustom: false
    },
    {
      id: uuidv4(),
      code: 'F',
      industryName: 'Healthcare',
      businessCategories: ['Hospitals', 'Clinics', 'Dental practices', 'Diagnostic laboratories', 'Pharmacies'],
      commonProblems: [
        'Overcrowded waiting rooms due to phone-based appointment bookings',
        'High patient appointment no-shows without confirmation reminders',
        'Delayed laboratory report delivery to patients',
        'Manual medicine batch and expiry date tracking in pharmacies',
        'Data privacy compliance risks with unencrypted patient communication'
      ],
      mappedServices: [
        'Healthcare websites',
        'Appointment booking',
        'Enquiry management',
        'Appointment reminders',
        'Inventory and expiry tracking',
        'Authorized patient portals',
        'Laboratory workflow integration',
        'Administrative dashboards'
      ],
      solutionDescriptions: [
        'HIPAA/DISHA compliant patient self-scheduling portal with doctor calendar sync',
        'Automated WhatsApp appointment confirmations and 2-hour pre-visit reminders',
        'Secure patient portal for instant diagnostic report downloads and prescription access',
        'Pharmacy inventory system tracking medicine batches, reorder thresholds, and expiry alerts',
        'Doctor consultation and billing administrative dashboard with role-based access control'
      ],
      exampleWorkflow: 'Apply strict privacy and access controls. Prioritize automated appointment reminders and secure lab report delivery.',
      isCustom: false
    },
    {
      id: uuidv4(),
      code: 'G',
      industryName: 'Manufacturing and industrial',
      businessCategories: ['Factories', 'Textile mills', 'Engineering units', 'Packaging companies', 'Food processing businesses', 'Industrial suppliers'],
      commonProblems: [
        'Lack of visibility into real-time machine downtime and job card progress',
        'Material shortages stalling production lines due to manual purchase orders',
        'Paper-based quality inspection checklists prone to errors and compliance failures',
        'Unscheduled machine breakdowns resulting in costly emergency repairs'
      ],
      mappedServices: [
        'ERP modules',
        'Inventory management',
        'Production tracking',
        'Purchase management',
        'Quality management',
        'Maintenance scheduling',
        'Supplier management',
        'Workflow automation',
        'Production dashboards'
      ],
      solutionDescriptions: [
        'Modular cloud ERP linking raw material inventory to production work orders',
        'Real-time production floor tablet interface for job card completion and stage tracking',
        'Predictive preventative maintenance scheduler with equipment service logs',
        'Digital QC inspection workflows with photo evidence and non-conformance quarantine',
        'Supplier raw material procurement portal with vendor performance ratings'
      ],
      exampleWorkflow: 'For an engineering or textile unit, integrate raw material inventory tracking with floor job cards.',
      isCustom: false
    },
    {
      id: uuidv4(),
      code: 'H',
      industryName: 'Professional services',
      businessCategories: ['Accounting firms', 'Tax consultants', 'Lawyers', 'HR consultancies', 'Business consultants', 'Insurance agencies'],
      commonProblems: [
        'Scattered client tax documents received over unstructured WhatsApp and email threads',
        'Missed regulatory statutory filing deadlines due to untracked task lists',
        'Manual hourly timesheets and delayed client invoice generation',
        'Unorganized prospective client inquiries and slow proposal turnaround'
      ],
      mappedServices: [
        'Professional websites',
        'Client CRM',
        'Appointment booking',
        'Document collection',
        'Task and deadline tracking',
        'Client portals',
        'Recruitment workflows',
        'Reporting automation'
      ],
      solutionDescriptions: [
        'Branded authoritative corporate website establishing domain expertise and case results',
        'Secure client portal with organized folder document upload checklists and e-signature',
        'Statutory deadline and audit task tracker with automated escalation alerts',
        'Consultant time-tracking and automated milestone retainer billing integration',
        'Prospect consultation booking calendar with pre-call requirement intake questionnaire'
      ],
      exampleWorkflow: 'For an accounting or law firm, deploy secure client document collection portal and deadline tracking.',
      isCustom: false
    },
    {
      id: uuidv4(),
      code: 'I',
      industryName: 'Automotive and transportation',
      businessCategories: ['Car dealerships', 'Automobile workshops', 'Spare-parts dealers', 'Logistics companies', 'Travel agencies', 'Taxi operators'],
      commonProblems: [
        'Paper-based vehicle job cards with untracked mechanic labor hours',
        'Unnotified periodic vehicle service reminders resulting in customer defection to unorganized garages',
        'Spare-parts inventory mismatches and stockouts during active vehicle repairs',
        'Manual dispatch and untracked shipment delivery statuses'
      ],
      mappedServices: [
        'Vehicle catalogues',
        'Service booking',
        'Job cards',
        'Spare-parts inventory',
        'Shipment tracking',
        'Fleet dashboards',
        'Customer reminders',
        'Lead CRM'
      ],
      solutionDescriptions: [
        'Digital workshop management system with mobile tablet job card entry and photo inspections',
        'Automated periodic service & insurance renewal reminder engine via WhatsApp & SMS',
        'Real-time spare parts inventory catalog with minimum stock alerts and barcode lookup',
        'Vehicle consignment booking and live GPS route tracking portal for logistics',
        'Dealership new/used vehicle inventory showcase website with test drive booking forms'
      ],
      exampleWorkflow: 'For an automobile workshop, prioritize digital job cards and automated periodic service reminders.',
      isCustom: false
    },
    {
      id: uuidv4(),
      code: 'J',
      industryName: 'Agriculture',
      businessCategories: ['Farms', 'Nurseries', 'Dairy businesses', 'Poultry farms', 'Agricultural equipment dealers', 'Agricultural exporters'],
      commonProblems: [
        'Handwritten farm yield logs and unrecorded crop harvest batch dates',
        'Unmonitored cold storage and milk chilling tank temperatures',
        'Untracked farm machinery service cycles and costly harvest-time breakdowns',
        'Middleman exploitation due to lack of direct buyer price discovery'
      ],
      mappedServices: [
        'Farm records',
        'Inventory management',
        'Product catalogues',
        'Production dashboards',
        'Equipment service tracking',
        'Order management',
        'Supplier and buyer CRM',
        'IoT sensor integration where appropriate'
      ],
      solutionDescriptions: [
        'Farm crop & harvest batch recording application with yield cost analysis',
        'Dairy milk collection, fat testing, and farmer payout ledger management software',
        'Direct-to-buyer agri-produce digital catalogue with bulk quotation requests',
        'Tractor and farm equipment preventative maintenance and rental tracking',
        'Cold storage IoT temperature sensor integration with threshold WhatsApp alerts'
      ],
      exampleWorkflow: 'For a dairy or agri-equipment business, prioritize supplier/farmer payment ledgers and equipment service tracking.',
      isCustom: false
    },
    {
      id: uuidv4(),
      code: 'K',
      industryName: 'IT and technology',
      businessCategories: ['Software companies', 'SaaS businesses', 'AI companies', 'IT service providers', 'Cybersecurity firms', 'Data analytics firms'],
      commonProblems: [
        'Slow prototype MVP execution due to internal engineering bandwidth constraints',
        'Inability to scale cloud infrastructure without exponential hosting costs',
        'Lack of turnkey enterprise AI agents and LLM integrations in existing applications',
        'Complex legacy codebases lacking automated CI/CD deployment pipelines'
      ],
      mappedServices: [
        'Web applications',
        'Mobile applications',
        'MVP development',
        'AI assistants',
        'API integration',
        'Workflow automation',
        'Cloud deployment',
        'Data pipelines',
        'Business dashboards',
        'Technical support'
      ],
      solutionDescriptions: [
        'Rapid MVP development sprint delivering enterprise-grade SaaS prototypes in 4 weeks',
        'Custom AI assistant & RAG knowledge base engineering using Gemini/LLM APIs',
        'High-throughput REST/GraphQL API integration connecting distributed software ecosystems',
        'Cloud-native Kubernetes/Supabase architecture migration and auto-scaling optimization',
        'Real-time telemetry and executive data pipelines with interactive client dashboards'
      ],
      exampleWorkflow: 'For a tech company or startup, offer rapid MVP co-development and custom AI agent integrations.',
      isCustom: false
    },
    {
      id: uuidv4(),
      code: 'L',
      industryName: 'Hospitality and events',
      businessCategories: ['Hotels', 'Resorts', 'Lodges', 'Wedding planners', 'Event managers', 'Photography studios', 'Banquet halls'],
      commonProblems: [
        'High 18-25% OTA commission fees eroding profit margins on room bookings',
        'Double-booked banquet dates and unrecorded customer event special requests',
        'Slow quotation preparation for custom weddings and corporate packages',
        'Client photo delivery delays and physical USB drive logistics'
      ],
      mappedServices: [
        'Booking websites',
        'Reservation integrations',
        'Enquiry CRM',
        'Event registration',
        'Ticketing integration',
        'Client galleries',
        'Quotation workflows',
        'Guest communication'
      ],
      solutionDescriptions: [
        'Commission-free direct hotel/resort room booking engine with integrated payment gateway',
        'Banquet hall availability calendar and multi-tier quotation builder for event planners',
        'Automated guest pre-arrival registration and WhatsApp concierge messaging service',
        'High-speed cloud client photo proofing gallery with watermark and download controls',
        'Event attendee ticketing portal with QR-code entry check-in scanning'
      ],
      exampleWorkflow: 'For a resort or wedding planner, build direct commission-free booking website and quotation workflows.',
      isCustom: false
    },
    {
      id: uuidv4(),
      code: 'M',
      industryName: 'Local and home services',
      businessCategories: ['Electricians', 'Plumbers', 'AC service providers', 'Cleaning companies', 'Solar installers', 'Water suppliers', 'Repair centres'],
      commonProblems: [
        'Scattered technician dispatch via ad-hoc phone calls leading to missed appointments',
        'Untracked customer recurring service reminders (e.g. AC maintenance, water RO filter change)',
        'Delayed on-site customer invoice generation and uncollected cash payments',
        'Lack of local Google Maps search visibility for emergency services'
      ],
      mappedServices: [
        'Service websites',
        'Booking forms',
        'Technician scheduling',
        'Work-order management',
        'Recurring service reminders',
        'Customer CRM',
        'Quotations',
        'Job tracking'
      ],
      solutionDescriptions: [
        'Local service lead generation website with instant WhatsApp booking widget',
        'Technician dispatch and mobile job sheet app with customer signature and UPI collection',
        'Automated 3-month and 6-month recurring service maintenance reminder alerts',
        'Instant PDF quote and GST invoice generator sent directly to customer WhatsApp',
        'Google Business Profile local SEO optimization capturing emergency search intent'
      ],
      exampleWorkflow: 'For an AC service or solar installer, prioritize technician work-order scheduling and recurring maintenance reminders.',
      isCustom: false
    },
    {
      id: uuidv4(),
      code: 'N',
      industryName: 'NGOs and other organizations',
      businessCategories: ['NGOs', 'Apartment associations', 'Coworking spaces', 'Professional associations', 'Community organizations'],
      commonProblems: [
        'Unorganized manual donor contribution tracking and delayed 80G tax receipt issuance',
        'Uncollected apartment resident maintenance dues and untracked facility reservations',
        'Scattered volunteer lists and uncoordinated community outreach drives',
        'Lack of transparent impact reports discouraging recurring donor funding'
      ],
      mappedServices: [
        'Organization websites',
        'Membership portals',
        'Donation systems',
        'Volunteer management',
        'Facility booking',
        'Announcements',
        'Event registration',
        'Reporting dashboards'
      ],
      solutionDescriptions: [
        'Transparent NGO cause website with instant 80G digital donation receipts and recurring giving',
        'Apartment association resident management portal with maintenance billing and club booking',
        'Coworking desk, private cabin, and conference room hourly booking engine',
        'Volunteer registration and skill-based task coordination portal',
        'Public donor impact visual dashboard showcasing funded community projects'
      ],
      exampleWorkflow: 'For an apartment association or NGO, implement resident/donor membership portal with automated payment receipts.',
      isCustom: false
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO industry_catalogue (
      id, code, industry_name, business_categories, common_problems,
      mapped_services, solution_descriptions, example_workflow, is_custom
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const ind of initialIndustries) {
    stmt.run(
      ind.id,
      ind.code,
      ind.industryName,
      JSON.stringify(ind.businessCategories),
      JSON.stringify(ind.commonProblems),
      JSON.stringify(ind.mappedServices),
      JSON.stringify(ind.solutionDescriptions),
      ind.exampleWorkflow || null,
      ind.isCustom ? 1 : 0
    );
  }
}

// Complete Account Reset Function
export function resetAccountData() {
  db.transaction(() => {
    // Delete all transactional and customer data
    db.prepare('DELETE FROM sales_outcomes').run();
    db.prepare('DELETE FROM proposals').run();
    db.prepare('DELETE FROM meetings').run();
    db.prepare('DELETE FROM follow_up_tasks').run();
    db.prepare('DELETE FROM call_logs').run();
    db.prepare('DELETE FROM email_activity').run();
    db.prepare('DELETE FROM whatsapp_activity').run();
    db.prepare('DELETE FROM outreach_messages').run();
    db.prepare('DELETE FROM cold_call_scripts').run();
    db.prepare('DELETE FROM service_recommendations').run();
    db.prepare('DELETE FROM analysis_history').run();
    db.prepare('DELETE FROM customer_analyses').run();
    db.prepare('DELETE FROM leads').run();
    db.prepare('DELETE FROM contacts').run();
    db.prepare('DELETE FROM customers').run();
    db.prepare('DELETE FROM extracted_records').run();
    db.prepare('DELETE FROM source_documents').run();
    db.prepare('DELETE FROM uploaded_files').run();
    db.prepare('DELETE FROM audit_logs').run();
  })();

  // Also clean physical uploaded files in uploads directory
  try {
    if (fs.existsSync(config.uploadsDir)) {
      const files = fs.readdirSync(config.uploadsDir);
      for (const f of files) {
        if (f !== '.gitkeep') {
          fs.unlinkSync(path.join(config.uploadsDir, f));
        }
      }
    }
  } catch (err) {
    console.warn('Error clearing uploads directory:', err);
  }

  // Ensure default services, team, and industry catalogue exist
  seedDefaultServices();
  seedDefaultUsersAndTeams();
  // Seed default 14-Industry Catalogue if empty
  seedIndustryCatalogue();
  // Ensure real uploaded/extracted records are synced as live leads
  syncGivenDataOnly();
}

export function syncGivenDataOnly() {
  // 1. Remove synthetic loop leads and mock proposals
  db.prepare("DELETE FROM leads WHERE customer_name LIKE 'Client %' OR customer_name LIKE 'Prospect %' OR customer_name LIKE 'Past %'").run();
  db.prepare("DELETE FROM proposals WHERE title LIKE '%Contract Package' OR title LIKE '%Historical%'").run();

  // 2. Fetch all real extracted records
  const records = db.prepare('SELECT * FROM extracted_records').all() as any[];
  if (!records.length) return;

  // 3. Fetch all real customer analyses
  const analyses = db.prepare('SELECT record_id, recommended_services FROM customer_analyses').all() as any[];
  const analysisMap = new Map<string, any[]>();
  for (const a of analyses) {
    if (a.record_id && a.recommended_services) {
      try {
        const parsed = JSON.parse(a.recommended_services);
        if (Array.isArray(parsed) && parsed.length > 0) {
          analysisMap.set(a.record_id, parsed);
        }
      } catch {}
    }
  }

  // 4. Ensure each real extracted record has a corresponding lead in the CRM
  const insertLead = db.prepare(`
    INSERT INTO leads (
      id, extracted_record_id, customer_name, company_name, email, phone,
      industry, location, lead_source, lead_status, pipeline_value, recommended_service,
      website, digital_presence, analysis_status, priority, outcome, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const existingLeads = db.prepare('SELECT extracted_record_id FROM leads WHERE extracted_record_id IS NOT NULL').all() as { extracted_record_id: string }[];
  const existingSet = new Set(existingLeads.map(l => l.extracted_record_id));

  db.transaction(() => {
    for (const rec of records) {
      if (existingSet.has(rec.id)) continue;

      const recAnalyses = analysisMap.get(rec.id);
      const isAnalyzed = rec.status === 'analyzed' || !!recAnalyses;
      const topService = recAnalyses && recAnalyses[0] ? recAnalyses[0].serviceName : null;

      const leadId = uuidv4();
      const status = isAnalyzed ? 'Analyzed' : 'New Lead';
      const pipelineValue = isAnalyzed ? 120000 : 45000;
      const analysisStatus = isAnalyzed ? 'Analysed' : 'New';
      const priority = isAnalyzed ? 'High' : 'Medium';
      const dateStr = rec.created_at || new Date().toISOString().replace('T', ' ').slice(0, 19);

      insertLead.run(
        leadId,
        rec.id,
        rec.customer_name || 'Prospect Contact',
        rec.company_name || 'Prospect Business',
        rec.email || null,
        rec.phone || null,
        rec.industry || 'General Business',
        rec.location || 'Coimbatore',
        'Document Import',
        status,
        pipelineValue,
        topService,
        rec.website || null,
        rec.digital_presence || null,
        analysisStatus,
        priority,
        'Pending',
        dateStr,
        dateStr
      );
    }

    // 5. Sync real recommendations into service_recommendations table
    db.prepare('DELETE FROM service_recommendations').run();
    const insertRec = db.prepare(`
      INSERT INTO service_recommendations (
        id, record_id, service_id, service_name, category, rank, relevance_score, suitability_explanation, comparison, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '{}', datetime('now'))
    `);

    const catalog = db.prepare('SELECT id, name FROM service_catalog').all() as { id: string; name: string }[];
    const findServiceId = (sName: string): string => {
      const lower = sName.toLowerCase();
      const match = catalog.find(c => lower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(lower));
      if (match) return match.id;
      if (lower.includes('website') || lower.includes('menu')) return catalog.find(c => c.name.includes('Website'))?.id || catalog[1].id;
      if (lower.includes('app') || lower.includes('portal') || lower.includes('ordering')) return catalog.find(c => c.name.includes('Application'))?.id || catalog[2].id;
      if (lower.includes('workflow') || lower.includes('automation') || lower.includes('loyalty')) return catalog.find(c => c.name.includes('Automated'))?.id || catalog[5].id;
      if (lower.includes('ai') || lower.includes('machine')) return catalog[0].id;
      return catalog[0].id;
    };

    for (const [recordId, recList] of analysisMap.entries()) {
      recList.forEach((s, idx) => {
        insertRec.run(
          uuidv4(),
          recordId,
          findServiceId(s.serviceName),
          s.serviceName,
          s.serviceCategory || 'Tech Solution',
          idx + 1,
          s.priorityScore?.total || 88,
          s.whyNeeded || s.proposedSolution || 'Recommended based on business profile'
        );
      });
    }

    // 6. Seed real initial follow-up tasks if none exist
    const taskCount = (db.prepare('SELECT COUNT(*) as cnt FROM follow_up_tasks').get() as { cnt: number }).cnt;
    if (taskCount === 0) {
      const analyzedLeads = db.prepare("SELECT id, customer_name, company_name, recommended_service FROM leads WHERE lead_status = 'Analyzed' LIMIT 3").all() as any[];
      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const adminUser = db.prepare("SELECT id FROM users LIMIT 1").get() as { id: string } | undefined;
      const validUserId = adminUser?.id || null;

      const insertTask = db.prepare(`
        INSERT INTO follow_up_tasks (id, lead_id, user_id, task_type, title, description, due_date, priority, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'upcoming')
      `);

      if (analyzedLeads[0]) {
        insertTask.run(
          uuidv4(),
          analyzedLeads[0].id,
          validUserId,
          'call',
          `Follow up with ${analyzedLeads[0].company_name}`,
          `Call ${analyzedLeads[0].customer_name} regarding ${analyzedLeads[0].recommended_service || 'Digital Transformation'}`,
          todayStr,
          'high'
        );
      }
      if (analyzedLeads[1]) {
        insertTask.run(
          uuidv4(),
          analyzedLeads[1].id,
          validUserId,
          'proposal',
          `Send proposal to ${analyzedLeads[1].company_name}`,
          `Deliver formal proposal package for ${analyzedLeads[1].recommended_service || 'Modern Website & Automation'}`,
          todayStr,
          'high'
        );
      }
      if (analyzedLeads[2]) {
        insertTask.run(
          uuidv4(),
          analyzedLeads[2].id,
          validUserId,
          'email',
          `Prepare outreach email for ${analyzedLeads[2].company_name}`,
          `Schedule introductory email demo sequence`,
          tomorrowStr,
          'medium'
        );
      }
    }
  })();
}

// Initialize on module load
initDatabase();

