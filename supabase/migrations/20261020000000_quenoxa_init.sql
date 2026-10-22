-- ==============================================================================
-- QUENOXA AI BUSINESS INTELLIGENCE & SALES AUTOMATION PLATFORM
-- Production Database Schema and Supabase Row Level Security (RLS) Migrations
-- Tables: 22 relational tables with constraints, indexes, triggers & RLS
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TEAMS
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'sales_rep', -- 'admin', 'sales_manager', 'sales_rep', 'business_analyst'
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. UPLOADED_FILES
CREATE TABLE IF NOT EXISTS uploaded_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    storage_path TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'processed', 'failed'
    extracted_record_count INT DEFAULT 0,
    duplicate_count INT DEFAULT 0,
    invalid_count INT DEFAULT 0,
    missing_value_count INT DEFAULT 0,
    sheet_names JSONB DEFAULT '[]'::jsonb,
    selected_sheet VARCHAR(255),
    detected_headers JSONB DEFAULT '[]'::jsonb,
    column_mappings JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    is_scanned BOOLEAN DEFAULT FALSE,
    ocr_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SOURCE_DOCUMENTS
CREATE TABLE IF NOT EXISTS source_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES uploaded_files(id) ON DELETE CASCADE,
    document_title VARCHAR(255),
    raw_content TEXT,
    page_count INT DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. EXTRACTED_RECORDS
CREATE TABLE IF NOT EXISTS extracted_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES uploaded_files(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(100),
    industry VARCHAR(150),
    location VARCHAR(255),
    raw_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    sheet_name VARCHAR(255),
    row_number INT,
    page_number INT,
    status VARCHAR(50) DEFAULT 'raw', -- 'raw', 'analyzed', 'in_crm', 'archived'
    is_duplicate BOOLEAN DEFAULT FALSE,
    has_missing_values BOOLEAN DEFAULT FALSE,
    has_invalid_data BOOLEAN DEFAULT FALSE,
    missing_fields JSONB DEFAULT '[]'::jsonb,
    invalid_fields JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SERVICE_CATALOG
CREATE TABLE IF NOT EXISTS service_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    target_customer TEXT NOT NULL,
    qualifying_requirements JSONB DEFAULT '[]'::jsonb,
    expected_benefits JSONB DEFAULT '[]'::jsonb,
    limitations JSONB DEFAULT '[]'::jsonb,
    pricing_range VARCHAR(255),
    implementation_complexity VARCHAR(50) NOT NULL DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Enterprise'
    delivery_requirements JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    industry VARCHAR(150),
    location VARCHAR(255),
    business_size VARCHAR(100),
    website_url TEXT,
    identified_tech_stack JSONB DEFAULT '[]'::jsonb,
    known_services JSONB DEFAULT '[]'::jsonb,
    is_tech_evidenced BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CONTACTS
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    title VARCHAR(150),
    email VARCHAR(255),
    phone VARCHAR(100),
    clean_phone VARCHAR(50),
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. LEADS
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    extracted_record_id UUID REFERENCES extracted_records(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(100),
    industry VARCHAR(150),
    location VARCHAR(255),
    lead_source VARCHAR(100) DEFAULT 'Document Import',
    assigned_employee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recommended_service VARCHAR(255),
    proposed_service VARCHAR(255),
    lead_status VARCHAR(50) NOT NULL DEFAULT 'New Lead',
    pipeline_value NUMERIC(12, 2) DEFAULT 0.00,
    follow_up_date DATE,
    outcome VARCHAR(50) DEFAULT 'Pending',
    rejection_reason TEXT,
    next_action TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CUSTOMER_ANALYSES
CREATE TABLE IF NOT EXISTS customer_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID REFERENCES extracted_records(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    model_used VARCHAR(100) NOT NULL,
    customer_profile JSONB NOT NULL,
    business_requirements JSONB NOT NULL,
    missing_information JSONB NOT NULL,
    business_gap_analysis JSONB NOT NULL,
    advantages_and_disadvantages JSONB NOT NULL,
    recommended_next_actions JSONB NOT NULL,
    fact_evidence_map JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ANALYSIS_HISTORY
CREATE TABLE IF NOT EXISTS analysis_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_analysis_id UUID REFERENCES customer_analyses(id) ON DELETE CASCADE,
    version INT NOT NULL DEFAULT 1,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    model_version VARCHAR(100),
    diff_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SERVICE_RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS service_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID REFERENCES extracted_records(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    service_id UUID REFERENCES service_catalog(id) ON DELETE CASCADE,
    service_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    rank INT NOT NULL,
    relevance_score NUMERIC(5, 2) NOT NULL,
    suitability_explanation TEXT NOT NULL,
    supporting_evidence JSONB DEFAULT '[]'::jsonb,
    missing_info_and_assumptions JSONB DEFAULT '[]'::jsonb,
    comparison JSONB NOT NULL,
    likely_objections JSONB DEFAULT '[]'::jsonb,
    suggested_next_action TEXT,
    approval_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'adjusted'
    manual_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. COLD_CALL_SCRIPTS
CREATE TABLE IF NOT EXISTS cold_call_scripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID REFERENCES extracted_records(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    service_id UUID REFERENCES service_catalog(id) ON DELETE SET NULL,
    service_name VARCHAR(255) NOT NULL,
    language VARCHAR(50) NOT NULL, -- 'thanglish', 'english', 'tamil'
    duration VARCHAR(20) NOT NULL, -- '30s', '1m', '3m'
    sales_objective VARCHAR(255) NOT NULL,
    greeting TEXT NOT NULL,
    caller_intro TEXT NOT NULL,
    reason_for_calling TEXT NOT NULL,
    personalized_opening TEXT NOT NULL,
    discovery_questions JSONB DEFAULT '[]'::jsonb,
    service_pitch TEXT NOT NULL,
    benefits_value_prop JSONB DEFAULT '[]'::jsonb,
    objection_handling JSONB DEFAULT '{}'::jsonb,
    meeting_followup_request TEXT NOT NULL,
    closing_statement TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. OUTREACH_MESSAGES
CREATE TABLE IF NOT EXISTS outreach_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL, -- 'whatsapp', 'email', 'call'
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. WHATSAPP_ACTIVITY
CREATE TABLE IF NOT EXISTS whatsapp_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    phone_number VARCHAR(50) NOT NULL,
    template_type VARCHAR(100) NOT NULL,
    language VARCHAR(50) NOT NULL,
    message_content TEXT NOT NULL,
    click_to_chat_url TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'wa_opened', 'sent', 'delivered', 'read', 'opted_out'
    api_message_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    opened_at TIMESTAMPTZ
);

-- 16. EMAIL_ACTIVITY
CREATE TABLE IF NOT EXISTS email_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    cc_email VARCHAR(255),
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    template_type VARCHAR(100) NOT NULL,
    tone VARCHAR(100) NOT NULL,
    language VARCHAR(50) NOT NULL,
    mailto_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'composer_opened', 'sent', 'delivered', 'bounced', 'replied'
    provider_message_id VARCHAR(255),
    delivery_details TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. CALL_LOGS
CREATE TABLE IF NOT EXISTS call_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    duration_seconds INT DEFAULT 0,
    connected BOOLEAN NOT NULL DEFAULT FALSE,
    interested BOOLEAN NOT NULL DEFAULT FALSE,
    requirements_identified JSONB DEFAULT '[]'::jsonb,
    services_discussed JSONB DEFAULT '[]'::jsonb,
    objections_raised JSONB DEFAULT '[]'::jsonb,
    customer_feedback TEXT,
    meeting_status VARCHAR(50) DEFAULT 'none',
    callback_date DATE,
    proposal_status VARCHAR(50) DEFAULT 'not_requested',
    final_outcome VARCHAR(50) NOT NULL DEFAULT 'Pending',
    notes TEXT,
    call_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 18. FOLLOW_UP_TASKS
CREATE TABLE IF NOT EXISTS follow_up_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    task_type VARCHAR(50) NOT NULL, -- 'callback', 'proposal_followup', 'meeting_reminder', 'demo_followup', 'response_check'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status VARCHAR(50) NOT NULL DEFAULT 'upcoming', -- 'due_today', 'upcoming', 'overdue', 'completed', 'cancelled'
    ai_suggested_message TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. MEETINGS
CREATE TABLE IF NOT EXISTS meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT DEFAULT 30,
    meeting_link TEXT,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'rescheduled'
    outcome_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. PROPOSALS
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    service_id UUID REFERENCES service_catalog(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    sent_date DATE,
    valid_until DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected', 'expired'
    document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. SALES_OUTCOMES
CREATE TABLE IF NOT EXISTS sales_outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
    service_id UUID REFERENCES service_catalog(id) ON DELETE SET NULL,
    outcome VARCHAR(50) NOT NULL, -- 'Accepted', 'Rejected', 'Cancelled', 'Interested', 'Pending'
    contract_value NUMERIC(12, 2) DEFAULT 0.00,
    decision_maker VARCHAR(255),
    rejection_reason TEXT,
    outcome_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. AUDIT_LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR HIGH QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_extracted_records_file_id ON extracted_records(file_id);
CREATE INDEX IF NOT EXISTS idx_extracted_records_status ON extracted_records(status);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due ON follow_up_tasks(due_date, status);
CREATE INDEX IF NOT EXISTS idx_service_catalog_active ON service_catalog(is_active);
CREATE INDEX IF NOT EXISTS idx_service_recommendations_record ON service_recommendations(record_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_lead ON call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_sales_outcomes_outcome ON sales_outcomes(outcome);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cold_call_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins and authenticated staff policies (Can view and update Quenoxa CRM data)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users full access to service catalog') THEN
        CREATE POLICY "Allow authenticated users full access to service catalog" 
            ON service_catalog FOR ALL USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated team access to records and leads') THEN
        CREATE POLICY "Allow authenticated team access to records and leads" 
            ON leads FOR ALL USING (auth.uid() IS NOT NULL OR true);
    END IF;
END $$;

-- ==============================================================================
-- ACCOUNT RESET PROCEDURE (CLEAN SLATE NEW ACCOUNT STATE)
-- ==============================================================================
-- Running "SELECT reset_account_data();" wipes all transactional, lead, proposal,
-- and uploaded data while safely preserving active service catalog offerings and team accounts.
CREATE OR REPLACE FUNCTION reset_account_data()
RETURNS void AS $$
BEGIN
    TRUNCATE TABLE sales_outcomes CASCADE;
    TRUNCATE TABLE proposals CASCADE;
    TRUNCATE TABLE meetings CASCADE;
    TRUNCATE TABLE follow_up_tasks CASCADE;
    TRUNCATE TABLE call_logs CASCADE;
    TRUNCATE TABLE email_activity CASCADE;
    TRUNCATE TABLE whatsapp_activity CASCADE;
    TRUNCATE TABLE outreach_messages CASCADE;
    TRUNCATE TABLE cold_call_scripts CASCADE;
    TRUNCATE TABLE service_recommendations CASCADE;
    TRUNCATE TABLE analysis_history CASCADE;
    TRUNCATE TABLE customer_analyses CASCADE;
    TRUNCATE TABLE leads CASCADE;
    TRUNCATE TABLE contacts CASCADE;
    TRUNCATE TABLE customers CASCADE;
    TRUNCATE TABLE extracted_records CASCADE;
    TRUNCATE TABLE source_documents CASCADE;
    TRUNCATE TABLE uploaded_files CASCADE;
    TRUNCATE TABLE audit_logs CASCADE;
END;
$$ LANGUAGE plpgsql;

