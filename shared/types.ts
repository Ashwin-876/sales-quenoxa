// QUENOXA AI BUSINESS INTELLIGENCE & SALES AUTOMATION PLATFORM
// Shared Data Types and Contracts

export type PipelineStage =
  | 'New'
  | 'Research pending'
  | 'Analysed'
  | 'Analyzed'
  | 'Contact pending'
  | 'Contacted'
  | 'Interested'
  | 'Meeting scheduled'
  | 'Meeting Scheduled'
  | 'Proposal sent'
  | 'Proposal Sent'
  | 'Negotiation'
  | 'Won'
  | 'Lost'
  | 'Follow-up required'
  | 'Follow-up Required'
  // Legacy compatibility aliases
  | 'New Lead'
  | 'Qualified'
  | 'Not Qualified';

export type ServiceCategory =
  | 'AI and machine learning'
  | 'Website development'
  | 'Web application development'
  | 'Full-stack development'
  | 'Custom software'
  | 'Business automation'
  | 'Data analytics'
  | 'Dashboards and business intelligence'
  | 'Cloud solutions'
  | 'Software integration'
  | 'Technical consulting'
  | 'Training and technology services';

export interface ServiceCatalogItem {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  targetCustomer: string;
  qualifyingRequirements: string[];
  expectedBenefits: string[];
  limitations: string[];
  pricingRange?: string;
  implementationComplexity: 'Low' | 'Medium' | 'High' | 'Enterprise';
  deliveryRequirements: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadedFileRecord {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
  status: 'pending' | 'processing' | 'processed' | 'failed';
  extractedRecordCount: number;
  duplicateCount: number;
  invalidCount: number;
  missingValueCount: number;
  sheetNames?: string[];
  selectedSheet?: string;
  detectedHeaders?: string[];
  columnMappings?: Record<string, string>;
  errorMessage?: string;
  isScanned?: boolean;
  ocrApplied?: boolean;
}

export interface SourceReference {
  fileName: string;
  fileId: string;
  sheetName?: string;
  rowNumber?: number;
  pageNumber?: number;
}

export interface ExtractedRecord {
  id: string;
  fileId: string;
  customerName: string;
  companyName: string;
  contactPerson?: string;
  businessName?: string;
  email: string;
  phone: string;
  industry: string;
  location: string;
  website?: string;
  digitalPresence?: string[];
  analysisStatus?: 'New' | 'Research pending' | 'Analysed';
  recommendedService?: string;
  priority?: 'High' | 'Medium' | 'Low';
  lastContactedAt?: string;
  callCompleted?: boolean;
  callCompletedAt?: string;
  crmStatus?: 'pending' | 'accepted' | 'rejected' | 'in_crm';
  rejectionReason?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  followUpDate?: string;
  rawFields: Record<string, any>;
  sourceRef: SourceReference;
  status: 'raw' | 'analyzed' | 'in_crm' | 'archived';
  flags: {
    isDuplicate: boolean;
    hasMissingValues: boolean;
    hasInvalidData: boolean;
    missingFields: string[];
    invalidFields: string[];
  };
  createdAt: string;
}

// -----------------------------------------------------------------------------
// STEP 1 / SECTION 1: CUSTOMER PROFILE & BUSINESS IDENTIFICATION
// -----------------------------------------------------------------------------
export interface CustomerProfile {
  customerName: string;
  companyName: string;
  primaryIndustry: string;
  specificBusinessCategory: string;
  businessModel: string;
  likelyCustomerGroups: string[];
  productsOrServices: string[];
  location: string;
  websiteUrl?: string;
  businessDescription?: string;
  contactInfo: {
    email?: string;
    phone?: string;
    formattedPhone?: string;
    additionalContacts?: string[];
  };
  existingWebsiteAndSystems?: {
    websiteUrl?: string;
    identifiedTechStack: string[];
    knownServices: string[];
    isEvidenced: boolean;
  };
}

// -----------------------------------------------------------------------------
// STEP 2 / SECTION 2: DIGITAL PRESENCE ANALYSIS (12 CAPABILITIES)
// -----------------------------------------------------------------------------
export type DigitalPresenceCapabilityStatus =
  | 'Confirmed available'
  | 'Confirmed missing'
  | 'Needs verification'
  | 'Not applicable';

export interface DigitalPresenceItem {
  capability: string;
  status: DigitalPresenceCapabilityStatus;
  evidence: string;
  verificationDate?: string;
  sourceUrl?: string;
}

// -----------------------------------------------------------------------------
// STEP 3 / SECTION 3: BUSINESS PROBLEMS & GAPS
// -----------------------------------------------------------------------------
export interface BusinessProblemItem {
  problem: string;
  type: 'observed' | 'potential';
  supportingEvidence: string;
  businessImpact: string;
  confidenceLevel: 'High' | 'Medium' | 'Low';
  discoveryQuestion: string;
}

export interface BusinessGapAnalysisReport {
  verifiedGaps: string[];
  potentialGaps: string[];
  unknownInformation: string[];
  potentialImprovementOpportunities?: string[];
  operationalInefficiencies?: string[];
  possibleAutomationOpportunities?: string[];
  areasWhereMoreInfoIsRequired?: string[];
}

// -----------------------------------------------------------------------------
// STEP 5: SERVICE PRIORITY SCORING (0 - 100 POINTS EXACT MODEL)
// -----------------------------------------------------------------------------
export interface PriorityScoreBreakdown {
  total: number; // 0 to 100
  problemRelevance: number; // max 30 pts
  needEvidence: number; // max 25 pts
  businessValue: number; // max 20 pts
  implementationFeasibility: number; // max 15 pts
  quenoxaFit: number; // max 10 pts
  scoreReasoning: string;
}

// -----------------------------------------------------------------------------
// STEP 4 / SECTION 4: RECOMMENDED QUENOXA SERVICES (TOP 3)
// -----------------------------------------------------------------------------
export interface QuenoxaServiceRecommendation {
  id: string;
  serviceName: string;
  serviceCategory: string;
  whyNeeded: string;
  specificProblem: string;
  proposedSolution: string;
  detailedFeatures: string[];
  howItWorks: string;
  expectedBenefits: string[];
  limitations: string[];
  requiredIntegrations: string[];
  implementationComplexity: 'Low' | 'Medium' | 'High' | 'Enterprise';
  dependencies: string[];
  suggestedPriority: 'High' | 'Medium' | 'Low';
  suggestedNextSalesAction: string;
  discoveryQuestions: string[];
  infoNeededBeforeQuotation: string[];
  priorityScore: PriorityScoreBreakdown;
}

// -----------------------------------------------------------------------------
// SECTION 5: SUGGESTED SERVICE PACKAGE
// -----------------------------------------------------------------------------
export interface SuggestedServicePackage {
  primaryRecommendedService: string;
  complementaryService: string;
  optionalUpgrade: string;
  scopeOfWork: string[];
  dependencies: string[];
  questionsToClarifyBeforeQuoting: string[];
}

// -----------------------------------------------------------------------------
// SECTION 6: SALES STRATEGY
// -----------------------------------------------------------------------------
export interface CustomerSalesStrategy {
  openingApproach: string;
  customerSpecificValueProposition: string;
  discoveryQuestions: string[];
  recommendedPitchOrder: string[];
  likelyObjections: { objection: string; suggestedResponse: string }[];
  nextAction: string;
}

// -----------------------------------------------------------------------------
// SECTION 7: DATA QUALITY
// -----------------------------------------------------------------------------
export interface DataQualityReport {
  missingContactDetails: string[];
  inconsistentInformation: string[];
  unverifiedClaims: string[];
  outdatedSourceRecords: string[];
}

// -----------------------------------------------------------------------------
// SECTION 7 SPEC: INDUSTRY-SPECIFIC SERVICE CATALOGUE (14 INDUSTRIES A TO N)
// -----------------------------------------------------------------------------
export interface IndustryCatalogueItem {
  id: string;
  code: string; // 'A' through 'N'
  industryName: string;
  businessCategories: string[];
  commonProblems: string[];
  mappedServices: string[];
  solutionDescriptions: string[];
  exampleWorkflow?: string;
  isCustom?: boolean;
}

// Backward compatibility types for legacy view interfaces
export interface BusinessRequirements {
  knownNeeds: string[];
  possibleNeedsRequiringConfirmation: string[];
  businessObjectives: string[];
  currentChallenges: string[];
  existingWorkflows: string[];
  relevantTechnicalRequirements: string[];
}

export interface MissingInformation {
  missingCustomerFields: string[];
  missingBusinessRequirements: string[];
  unknownBudget: boolean;
  unknownProjectTimeline: boolean;
  unknownDecisionMaker: boolean;
  unknownExistingTechnology: boolean;
  questionsNeededToCompleteAssessment: string[];
}

export interface BusinessGapAnalysis {
  verifiedGaps: string[];
  potentialImprovementOpportunities: string[];
  operationalInefficiencies: string[];
  possibleAutomationOpportunities: string[];
  areasWhereMoreInfoIsRequired: string[];
  potentialGaps?: string[];
  unknownInformation?: string[];
}

export interface SolutionComparison {
  serviceId: string;
  serviceName: string;
  expectedBenefits: string[];
  limitations: string[];
  implementationComplexity: 'Low' | 'Medium' | 'High' | 'Enterprise';
  dependencies: string[];
  potentialRisks: string[];
  maintenanceRequirements: string[];
  possibleCosts?: string;
}

export interface RecommendedNextActions {
  bestServiceToDiscuss: string;
  informationToCollect: string[];
  appropriateSalesApproach: string;
  recommendedNextStep: string;
  questionsToAskCustomer: string[];
}

// -----------------------------------------------------------------------------
// COMPLETE 7-SECTION CUSTOMER ANALYSIS DOSSIER
// -----------------------------------------------------------------------------
export interface CustomerAnalysis {
  id: string;
  recordId: string;
  generatedAt: string;
  modelUsed: string;
  // Section 1: Customer Profile & Business Identification
  customerProfile: CustomerProfile;
  // Section 2: Existing Digital Presence (12 capabilities evaluated)
  digitalPresence: DigitalPresenceItem[];
  // Section 3: Business Problems & Gaps (Observed vs Potential)
  businessProblems: BusinessProblemItem[];
  businessGapAnalysis: BusinessGapAnalysisReport;
  // Section 4: Recommended Quenoxa Services (Top 3 with 0-100 score)
  recommendedServices: QuenoxaServiceRecommendation[];
  // Section 5: Suggested Service Package
  suggestedServicePackage: SuggestedServicePackage;
  // Section 6: Sales Strategy
  salesStrategy: CustomerSalesStrategy;
  // Section 7: Data Quality
  dataQuality: DataQualityReport;
  // Strict Analytical Rigor Evidence Map
  factEvidenceMap: {
    verifiedFacts: string[];
    aiHypotheses: string[];
    unconfirmedItems?: string[];
    dataIntegrityNotice: string;
  };
  // Backward compatibility fields
  businessRequirements?: BusinessRequirements;
  missingInformation?: MissingInformation;
  advantagesAndDisadvantages?: SolutionComparison[];
  recommendedNextActions?: RecommendedNextActions;
}

export interface ServiceRecommendation {
  id: string;
  recordId: string;
  serviceId: string;
  serviceName: string;
  category: ServiceCategory;
  rank: number;
  relevanceScore: number; // 0 to 100
  suitabilityExplanation: string;
  supportingEvidence: string[];
  missingInformationAndAssumptions: string[];
  comparison: {
    benefits: string[];
    limitations: string[];
    estimatedCostRange?: string;
    complexity: string;
    risks: string[];
  };
  likelyObjections: { objection: string; suggestedRebuttal: string }[];
  suggestedNextAction: string;
  acceptanceEstimate: AcceptanceLikelihood;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'adjusted';
  manualNotes?: string;
}

export interface AcceptanceLikelihood {
  preliminaryEstimate: number; // 0 - 100%
  confidenceLevel: 'Low' | 'Medium' | 'High';
  isPreliminary: boolean;
  statusLabel: string;
  supportingEvidence: string[];
  missingFactors: string[];
  mainReasonsForUncertainty: string[];
  recommendedActionsToImprove: string[];
  historicalCalibrationNote?: string;
}

export type SalesOutcomeStatus =
  | 'Pending'
  | 'Interested'
  | 'Meeting scheduled'
  | 'Proposal sent'
  | 'Accepted'
  | 'Rejected'
  | 'Cancelled';

export type ColdCallLanguage = 'thanglish' | 'english' | 'tamil';
export type ColdCallDuration = '30s' | '1m' | '3m';

export interface ColdCallScript {
  id: string;
  recordId: string;
  serviceName: string;
  targetPerson: string;
  companyName: string;
  language: ColdCallLanguage;
  duration: ColdCallDuration;
  salesObjective: string;
  greeting: string;
  callerIntroduction: string;
  reasonForCalling: string;
  personalizedOpening: string;
  discoveryQuestions: string[];
  customerSpecificServicePitch: string;
  benefitsAndValueProposition: string[];
  objectionHandling: Record<string, string>;
  meetingOrFollowUpRequest: string;
  closingStatement: string;
  rawText: string;
  generatedAt: string;
}

export type WhatsAppTemplateType =
  | 'first_introduction'
  | 'service_pitch'
  | 'meeting_request'
  | 'demo_invitation'
  | 'proposal_follow_up'
  | 'callback_follow_up'
  | 'post_meeting_follow_up'
  | 'objection_response';

export interface WhatsAppMessage {
  id: string;
  recordId?: string;
  customerId?: string;
  phoneNumber: string;
  cleanPhoneNumber: string;
  recipientName: string;
  companyName: string;
  serviceName: string;
  templateType: WhatsAppTemplateType;
  language: ColdCallLanguage;
  messageContent: string;
  clickToChatUrl: string;
  status: 'draft' | 'wa_opened' | 'sent' | 'delivered' | 'read' | 'opted_out';
  loggedAt?: string;
}

export type ColdEmailTemplateType =
  | 'initial_cold_email'
  | 'website_dev_offer'
  | 'ai_automation_pitch'
  | 'custom_software_proposal'
  | 'business_introduction'
  | 'meeting_request'
  | 'proposal_follow_up'
  | 'post_meeting_follow_up';

export type EmailTone = 'Professional & Direct' | 'Consultative & Helpful' | 'Urgent & Value-Driven' | 'Executive & Concise';

export interface ColdEmail {
  id: string;
  recordId?: string;
  customerId?: string;
  to: string;
  cc?: string;
  subject: string;
  body: string;
  greeting: string;
  introduction: string;
  problemOrOpportunity: string;
  recommendedService: string;
  benefits: string[];
  callToAction: string;
  closing: string;
  signature: string;
  tone: EmailTone;
  language: string;
  templateType: ColdEmailTemplateType;
  mailtoUrl: string;
  status: 'draft' | 'composer_opened' | 'sent' | 'delivered' | 'bounced' | 'replied';
  sentAt?: string;
  deliveryDetails?: string;
}

export interface Lead {
  id: string;
  recordId?: string;
  customerName: string; // Contact Person
  companyName: string; // Business Name
  contactPerson?: string;
  businessName?: string;
  email: string;
  phone: string;
  industry: string;
  location: string;
  website?: string;
  digitalPresence?: string[];
  analysisStatus?: 'New' | 'Research pending' | 'Analysed';
  priority?: 'High' | 'Medium' | 'Low';
  leadSource: string;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  recommendedService?: string;
  proposedService?: string;
  leadStatus: PipelineStage;
  pipelineValue: number;
  callHistoryCount: number;
  whatsAppHistoryCount: number;
  emailHistoryCount: number;
  lastContactedAt?: string;
  followUpDate?: string;
  outcome?: SalesOutcomeStatus;
  rejectionReason?: string;
  nextAction?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpTask {
  id: string;
  leadId: string;
  customerName: string;
  companyName: string;
  taskType: 'callback' | 'proposal_followup' | 'meeting_reminder' | 'demo_followup' | 'response_check';
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'due_today' | 'upcoming' | 'overdue' | 'completed' | 'cancelled';
  aiSuggestedMessage?: string;
  assignedTo?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CallLog {
  id: string;
  leadId: string;
  customerName: string;
  companyName: string;
  employeeName: string;
  timestamp: string;
  durationSeconds: number;
  connected: boolean;
  interested: boolean;
  requirementsIdentified: string[];
  servicesDiscussed: string[];
  objectionsRaised: string[];
  customerFeedback: string;
  meetingStatus: 'none' | 'booked' | 'declined' | 'rescheduled';
  callbackDate?: string;
  proposalStatus?: 'not_requested' | 'requested' | 'sent' | 'accepted' | 'rejected';
  finalOutcome: SalesOutcomeStatus;
  notes: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Sales Manager' | 'Sales Rep' | 'Business Analyst';
  avatar?: string;
  activeLeads: number;
  completedCalls: number;
  closedWonDeals: number;
  acceptanceRate: number; // calculated percentage
}

export interface DashboardMetrics {
  totalUploadedDocuments: number;
  totalExtractedRecords: number;
  totalAnalyzedCustomers: number;
  qualifiedLeads: number;
  recommendedServicesCount: number;
  callsCompleted: number;
  whatsAppOutreachAttempts: number;
  emailsPrepared: number;
  emailsSentConfirmed: number;
  interestedCustomers: number;
  followUpsDueToday: number;
  meetingsBooked: number;
  proposalsSent: number;
  wonOpportunities: number;
  lostOpportunities: number;
  actualAcceptanceRate: number; // Accepted proposals / Proposals with recorded final outcome * 100
  leadConversionRate: number; // Won leads / Total qualified leads * 100
  totalPipelineValue: number;
  servicePerformance: {
    serviceName: string;
    shortName?: string;
    category: string;
    recommendedCount: number;
    proposedCount: number;
    acceptedCount: number;
    acceptanceRate: number;
  }[];
  leadSourcePerformance: {
    source: string;
    leadsCount: number;
    wonCount: number;
    conversionRate: number;
    percentage?: number;
    color?: string;
  }[];
  recentActivity: {
    id: string;
    type: 'upload' | 'analysis' | 'call' | 'whatsapp' | 'email' | 'stage_change' | 'proposal';
    title: string;
    description: string;
    timestamp: string;
    timeAgo?: string;
    user: string;
  }[];
  upcomingTasks?: {
    id: string;
    title: string;
    subtitle: string;
    dueDateText: string;
    isDueToday: boolean;
    completed: boolean;
  }[];
  aiRecommendations?: {
    id: string;
    title: string;
    description: string;
    actionView: string;
    icon: string;
  }[];
}

export interface SystemSettings {
  geminiApiKeyConfigured: boolean;
  geminiModel: string;
  supabaseConfigured: boolean;
  supabaseUrl?: string;
  ocrEngineEnabled: boolean;
  whatsAppApiEnabled: boolean;
  smtpEmailEnabled: boolean;
  maxUploadSizeBytes: number;
  batchProcessingLimit: number;
}
