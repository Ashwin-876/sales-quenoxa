import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';
import { config } from '../config/environment.js';
import {
  MarketingCustomerProfile,
  ProviderSettings,
  MarketingRecommendedService,
  GeneratedMarketingOutputs,
  MarketingChannel,
  MarketingLanguage,
  MarketingTone
} from '../../../shared/types.js';

// Default Quenoxa Global Technologies configuration
export const DEFAULT_PROVIDER_SETTINGS: ProviderSettings = {
  companyName: 'QUENOXA GLOBAL TECHNOLOGIES',
  senderName: 'Ashwin',
  website: 'https://www.quenoxa.com',
  email: 'info@quenoxa.com',
  phone: '6369480281'
};

// 16 Standard Services of Quenoxa Global Technologies
export interface QuenoxaCatalogueItem {
  id: string;
  name: string;
  category: string;
  description: string;
  outcomes: string[];
  suitedIndustries: string[];
}

export const QUENOXA_SERVICE_CATALOGUE: QuenoxaCatalogueItem[] = [
  {
    id: 'srv-web-custom',
    name: 'Custom Website Development',
    category: 'Web & Digital Presence',
    description: 'High-speed, responsive, SEO-ready custom websites designed to convert visitors into qualified business inquiries.',
    outcomes: ['Stronger digital credibility', 'Modern user experience across all devices', 'Higher inbound lead generation'],
    suitedIndustries: ['Fitness and Gyms', 'Restaurants and Hotels', 'Retail and E-commerce', 'Educational Institutions', 'Healthcare and Clinics', 'Real Estate', 'Manufacturing', 'Professional Services']
  },
  {
    id: 'srv-web-ecom',
    name: 'E-commerce Website Development',
    category: 'Web & Digital Presence',
    description: 'Scalable online storefronts with secure payment gateway integration, product variants, and simplified checkout flows.',
    outcomes: ['Direct-to-consumer digital revenue', 'Automated transaction processing', '24/7 store availability'],
    suitedIndustries: ['Protein and Supplements', 'Retail and E-commerce', 'Manufacturing']
  },
  {
    id: 'srv-app-mobile',
    name: 'Mobile App Development',
    category: 'Software & Mobile',
    description: 'Native and cross-platform iOS & Android mobile applications built for customer engagement, ordering, or member access.',
    outcomes: ['Direct channel to customer pockets', 'Push notification engagement', 'Seamless offline and online accessibility'],
    suitedIndustries: ['Fitness and Gyms', 'Healthcare and Clinics', 'Restaurants and Hotels', 'Educational Institutions', 'Retail and E-commerce']
  },
  {
    id: 'srv-web-prompt',
    name: 'Prompt-Based Website and Application Development',
    category: 'Rapid Prototyping & AI',
    description: 'Ultra-fast, prompt-driven design and deployment of landing pages and customer web tools with rapid turnarounds.',
    outcomes: ['Faster time-to-market', 'Cost-effective campaign landing pages', 'Agile feature iteration'],
    suitedIndustries: ['Professional Services', 'Real Estate', 'Retail and E-commerce', 'IT and Software']
  },
  {
    id: 'srv-ai-ds',
    name: 'AI and Data Science Solutions',
    category: 'Artificial Intelligence',
    description: 'Custom AI logic, predictive intelligence, automated triage, and intelligent assistants tailored to your business operations.',
    outcomes: ['Intelligent customer interactions', 'Automated operational decisions', 'Actionable predictive insights'],
    suitedIndustries: ['Healthcare and Clinics', 'Manufacturing', 'Retail and E-commerce', 'IT and Software', 'Professional Services']
  },
  {
    id: 'srv-custom-software',
    name: 'Custom Software Development',
    category: 'Software & Mobile',
    description: 'Bespoke operational software built specifically to replace clumsy spreadsheets and eliminate operational friction.',
    outcomes: ['Streamlined internal operations', 'Zero recurring SaaS lock-in', 'Tailored to unique business workflows'],
    suitedIndustries: ['Manufacturing', 'Healthcare and Clinics', 'Educational Institutions', 'Logistics', 'Professional Services']
  },
  {
    id: 'srv-business-automation',
    name: 'Business Process Automation',
    category: 'Automation & Integration',
    description: 'End-to-end automated workflows linking invoices, WhatsApp notifications, lead capture, and internal approvals.',
    outcomes: ['Significant reduction in manual data entry', 'Elimination of administrative delay', 'Error-free repetitive operations'],
    suitedIndustries: ['Fitness and Gyms', 'Healthcare and Clinics', 'Educational Institutions', 'Real Estate', 'Manufacturing']
  },
  {
    id: 'srv-crm-erp',
    name: 'CRM and ERP Solutions',
    category: 'Enterprise Platforms',
    description: 'Unified customer relationship management and business resource management systems for sales, inventory, and finance.',
    outcomes: ['Centralized customer database', 'Transparent pipeline tracking', 'Systematic customer follow-ups'],
    suitedIndustries: ['Real Estate', 'Educational Institutions', 'Manufacturing', 'Protein and Supplements', 'Professional Services']
  },
  {
    id: 'srv-social-media',
    name: 'Social Media Management',
    category: 'Digital Marketing & Growth',
    description: 'Curated branded visual content, community moderation, and strategic posting to build organic community trust.',
    outcomes: ['Active brand presence', 'Customer brand familiarity', 'Organic audience engagement'],
    suitedIndustries: ['Fitness and Gyms', 'Restaurants and Hotels', 'Protein and Supplements', 'Retail and E-commerce', 'Healthcare and Clinics']
  },
  {
    id: 'srv-meta-ads',
    name: 'Meta Ads (Facebook and Instagram)',
    category: 'Digital Marketing & Growth',
    description: 'Hyper-targeted lead acquisition campaigns on Facebook and Instagram targeting verified local and regional demographics.',
    outcomes: ['Predictable daily inbound leads', 'Cost-effective local footfall', 'Rapid member/customer acquisition'],
    suitedIndustries: ['Fitness and Gyms', 'Protein and Supplements', 'Real Estate', 'Restaurants and Hotels', 'Educational Institutions']
  },
  {
    id: 'srv-google-ads',
    name: 'Google Ads',
    category: 'Digital Marketing & Growth',
    description: 'High-intent Google Search and Maps pay-per-click advertising capturing users actively looking for your products or services.',
    outcomes: ['Immediate visibility for high-intent searches', 'High conversion intent inquiries', 'Measurable cost per acquisition'],
    suitedIndustries: ['Healthcare and Clinics', 'Educational Institutions', 'Real Estate', 'Professional Services', 'Fitness and Gyms']
  },
  {
    id: 'srv-seo',
    name: 'SEO',
    category: 'Digital Marketing & Growth',
    description: 'Technical, on-page, and local search engine optimization ensuring your business appears at the top of Google search results.',
    outcomes: ['Long-term organic inbound traffic', 'Zero per-click advertising costs', 'Local community search dominance'],
    suitedIndustries: ['Healthcare and Clinics', 'Restaurants and Hotels', 'Professional Services', 'Real Estate', 'Retail and E-commerce']
  },
  {
    id: 'srv-gbp-optimization',
    name: 'Google Business Profile Optimization',
    category: 'Digital Marketing & Growth',
    description: 'Complete optimization of your Google Maps listing, review acquisition strategy, and local search ranking signals.',
    outcomes: ['Dominant local map pack visibility', 'Higher direct phone calls and driving directions', 'Enhanced customer trust via reviews'],
    suitedIndustries: ['Restaurants and Hotels', 'Fitness and Gyms', 'Healthcare and Clinics', 'Retail and E-commerce', 'Protein and Supplements']
  },
  {
    id: 'srv-branding',
    name: 'Branding and Graphic Design',
    category: 'Creative & Strategy',
    description: 'Premium identity kits, logos, brochures, product packaging, and corporate sales presentations that project authority.',
    outcomes: ['Standout visual brand identity', 'Professional sales brochures', 'Consistent customer-facing touchpoints'],
    suitedIndustries: ['Protein and Supplements', 'Restaurants and Hotels', 'Retail and E-commerce', 'Real Estate', 'Professional Services']
  },
  {
    id: 'srv-dashboards',
    name: 'Business Dashboards and Analytics',
    category: 'Data & Analytics',
    description: 'Real-time executive KPI visualizers tracking daily sales, inventory levels, marketing spend, and operational margins.',
    outcomes: ['Clear, real-time business visibility', 'Fact-based managerial decisions', 'Automated daily/weekly summary reports'],
    suitedIndustries: ['Retail and E-commerce', 'Manufacturing', 'Educational Institutions', 'Professional Services', 'Protein and Supplements']
  },
  {
    id: 'srv-api-integration',
    name: 'API and System Integration',
    category: 'Automation & Integration',
    description: 'Connecting third-party platforms (Tally, Zoho, payment gateways, WhatsApp Business API) to synchronize your data smoothly.',
    outcomes: ['Seamless two-way system synchronization', 'Elimination of duplicate software silos', 'Unified data pipeline'],
    suitedIndustries: ['IT and Software', 'Manufacturing', 'Retail and E-commerce', 'Healthcare and Clinics', 'Professional Services']
  }
];

export class MarketingGeneratorService {
  /**
   * Fetch current configured provider settings
   */
  public static getProviderSettings(): ProviderSettings {
    try {
      const row = db.prepare("SELECT value FROM system_settings WHERE key = 'provider_settings'").get() as { value: string } | undefined;
      if (row?.value) {
        return JSON.parse(row.value);
      }
    } catch {}
    return DEFAULT_PROVIDER_SETTINGS;
  }

  /**
   * Save configured provider settings
   */
  public static saveProviderSettings(settings: Partial<ProviderSettings>): ProviderSettings {
    const current = this.getProviderSettings();
    const updated: ProviderSettings = {
      companyName: settings.companyName?.trim() || current.companyName,
      senderName: settings.senderName?.trim() || current.senderName,
      website: settings.website?.trim() || current.website,
      email: settings.email?.trim() || current.email,
      phone: settings.phone?.trim() || current.phone
    };
    db.prepare(`
      INSERT OR REPLACE INTO system_settings (key, value)
      VALUES ('provider_settings', ?)
    `).run(JSON.stringify(updated));
    return updated;
  }

  /**
   * Determine greeting based on local time
   */
  public static getGreetingForTime(date?: Date, override?: string): { greeting: string; greetingType: 'Morning' | 'Afternoon' | 'Evening' } {
    if (override && override.trim()) {
      const lower = override.toLowerCase();
      const type = lower.includes('morning') ? 'Morning' : lower.includes('afternoon') ? 'Afternoon' : 'Evening';
      return { greeting: override.trim(), greetingType: type };
    }

    const now = date || new Date();
    const hours = now.getHours();

    if (hours >= 5 && hours < 12) {
      return { greeting: 'Good morning', greetingType: 'Morning' };
    } else if (hours >= 12 && hours < 17) {
      return { greeting: 'Good afternoon', greetingType: 'Afternoon' };
    } else {
      return { greeting: 'Good evening', greetingType: 'Evening' };
    }
  }

  /**
   * Analyze industry and select the best matching 3 to 4 Quenoxa services
   */
  public static selectRecommendedServices(industry: string, customIndustry?: string, requirements?: string): MarketingRecommendedService[] {
    const targetInd = (customIndustry || industry || '').toLowerCase();
    const reqText = (requirements || '').toLowerCase();

    // Map industry keywords to best matched services
    const recommendations: MarketingRecommendedService[] = [];

    if (targetInd.includes('gym') || targetInd.includes('fitness')) {
      recommendations.push(
        {
          name: 'Mobile App Development',
          benefit: 'Member management mobile app with automated membership renewals, QR check-in, and workout schedules.',
          reason: 'Eliminates front-desk chaos and drives member retention through mobile notifications.'
        },
        {
          name: 'Meta Ads (Facebook and Instagram)',
          benefit: 'Targeted local lead generation campaigns capturing fitness inquiries across Coimbatore & surrounding pincodes.',
          reason: 'Brings a consistent flow of motivated walking inquiries into your facility daily.'
        },
        {
          name: 'Custom Website Development',
          benefit: 'High-speed fitness club landing page showcasing training facilities, trainer profiles, and membership pricing.',
          reason: 'Establishes top-tier digital credibility and direct WhatsApp tour booking.'
        },
        {
          name: 'Google Business Profile Optimization',
          benefit: 'Local search and Google Maps optimization to rank #1 when prospective members search "gym near me".',
          reason: 'Captures high-intent local footfall without ongoing advertising costs.'
        }
      );
    } else if (targetInd.includes('protein') || targetInd.includes('supplement')) {
      recommendations.push(
        {
          name: 'E-commerce Website Development',
          benefit: 'Modern direct-to-consumer store with instant checkout, bundle deals, and regional payment gateway support.',
          reason: 'Enables round-the-clock product sales and expands your reach beyond your physical counter.'
        },
        {
          name: 'Business Dashboards and Analytics',
          benefit: 'Real-time inventory and order analytics tracking fast-moving SKUs, re-order alerts, and customer lifetime value.',
          reason: 'Prevents stockouts of high-demand supplements and streamlines distributor margins.'
        },
        {
          name: 'Meta Ads (Facebook and Instagram)',
          benefit: 'High-converting video and carousel ads targeting gym-goers, athletes, and fitness enthusiasts.',
          reason: 'Acquires repeat buyers and scales direct brand inquiries rapidly.'
        },
        {
          name: 'Business Process Automation',
          benefit: 'Automated WhatsApp dispatch notifications, tracking updates, and customer repurchase reminders.',
          reason: 'Drives repeat monthly re-orders effortlessly on autopilot.'
        }
      );
    } else if (targetInd.includes('restaurant') || targetInd.includes('hotel') || targetInd.includes('food') || targetInd.includes('cafe')) {
      recommendations.push(
        {
          name: 'Custom Website Development',
          benefit: 'Direct online ordering portal with digital menus and table reservation booking.',
          reason: 'Allows customers to order directly from you without paying 25-30% food aggregator commissions.'
        },
        {
          name: 'Google Business Profile Optimization',
          benefit: 'Optimized Google Maps listing with verified photos, dishes, and automated positive review collection.',
          reason: 'Drives high volumes of weekend diners and local food search inquiries.'
        },
        {
          name: 'Social Media Management',
          benefit: 'High-definition food photography, reel content, and weekly special promotion design.',
          reason: 'Builds an appetite-inducing local following that keeps your dining room filled.'
        },
        {
          name: 'Business Process Automation',
          benefit: 'WhatsApp-based instant table reservations, order confirmation, and digital feedback capture.',
          reason: 'Simplifies guest communication and collects direct customer contact details.'
        }
      );
    } else if (targetInd.includes('retail') || targetInd.includes('e-commerce') || targetInd.includes('store') || targetInd.includes('shop')) {
      recommendations.push(
        {
          name: 'E-commerce Website Development',
          benefit: 'Fast, secure storefront featuring smooth product browsing, search filters, and mobile-first checkout.',
          reason: 'Converts window shoppers into paying customers across Tamil Nadu and pan-India.'
        },
        {
          name: 'Business Process Automation',
          benefit: 'Automated order status notifications, inventory sync across outlets, and return handling.',
          reason: 'Saves hours of daily manual order coordination and WhatsApp message chasing.'
        },
        {
          name: 'Meta Ads (Facebook and Instagram)',
          benefit: 'Catalog sales ads and seasonal discount campaigns targeted at high-intent shoppers.',
          reason: 'Delivers measurable return on ad spend by putting best-sellers in front of buyers.'
        },
        {
          name: 'Business Dashboards and Analytics',
          benefit: 'Centralized sales analytics dashboard displaying daily turnover, top categories, and sales trends.',
          reason: 'Gives management immediate clarity on daily cashflow and inventory turnover.'
        }
      );
    } else if (targetInd.includes('education') || targetInd.includes('school') || targetInd.includes('college') || targetInd.includes('institution')) {
      recommendations.push(
        {
          name: 'Custom Website Development',
          benefit: 'Official institutional portal with online admission inquiry portals, course catalogs, and virtual campus showcase.',
          reason: 'Projects institutional prestige and accelerates seasonal admission enrollments.'
        },
        {
          name: 'CRM and ERP Solutions',
          benefit: 'Admissions and student inquiry CRM ensuring every prospective parent inquiry is tracked and nurtured.',
          reason: 'Prevents dropped admission inquiries and equips counseling teams with complete follow-up visibility.'
        },
        {
          name: 'Google Ads',
          benefit: 'High-intent search campaigns capturing students and parents searching for specialized courses and degrees.',
          reason: 'Maximizes enrollment for upcoming academic batches during peak decision windows.'
        },
        {
          name: 'Business Process Automation',
          benefit: 'Automated SMS & WhatsApp notifications for fee reminders, exam schedules, and circular distribution.',
          reason: 'Eliminates administrative bottlenecks and keeps parents reliably informed.'
        }
      );
    } else if (targetInd.includes('health') || targetInd.includes('clinic') || targetInd.includes('hospital') || targetInd.includes('doctor')) {
      recommendations.push(
        {
          name: 'Custom Website Development',
          benefit: 'Doctor specialization directory, treatment overview, and streamlined patient appointment booking engine.',
          reason: 'Provides patients with clear clinical trust and direct consultation scheduling.'
        },
        {
          name: 'Business Process Automation',
          benefit: 'WhatsApp-based appointment confirmations, schedule reminders, and digital prescription access.',
          reason: 'Reduces clinic no-shows and eliminates repetitive reception phone calls.'
        },
        {
          name: 'Google Business Profile Optimization',
          benefit: 'Local healthcare search dominance so patients find your clinic first when searching for specialists.',
          reason: 'Generates consistent local patient footfall and direct consultation calls.'
        },
        {
          name: 'SEO',
          benefit: 'Authoritative clinical content marketing ranking for common health queries and diagnostic services.',
          reason: 'Builds physician authority and attracts high-intent organic patient inquiries.'
        }
      );
    } else if (targetInd.includes('real estate') || targetInd.includes('property') || targetInd.includes('builder') || targetInd.includes('construction')) {
      recommendations.push(
        {
          name: 'Custom Website Development',
          benefit: 'Interactive project walkthroughs, floor plan showcases, and verified project brochure download gate.',
          reason: 'Pre-qualifies serious home buyers and collects direct lead information before site visits.'
        },
        {
          name: 'CRM and ERP Solutions',
          benefit: 'Lead management CRM tracking site visit appointments, channel partner bookings, and payment milestones.',
          reason: 'Prevents high-value property buyer leads from slipping through the cracks.'
        },
        {
          name: 'Meta Ads (Facebook and Instagram)',
          benefit: 'High-precision lead generation ads showcasing elevation renderings, pricing brackets, and location advantages.',
          reason: 'Consistently populates your sales desk with genuine property seeker site visits.'
        },
        {
          name: 'Google Ads',
          benefit: 'Search ads targeting NRI investors and local families searching for luxury flats and villa plots.',
          reason: 'Captures motivated buyers with ready capital during their purchase evaluation cycle.'
        }
      );
    } else if (targetInd.includes('manufacturing') || targetInd.includes('industrial') || targetInd.includes('engineering') || targetInd.includes('foundry')) {
      recommendations.push(
        {
          name: 'Custom Software Development',
          benefit: 'Shop-floor production tracking, job card dispatch, and raw material inventory monitoring systems.',
          reason: 'Replaces handwritten logs with real-time operational traceability.'
        },
        {
          name: 'Custom Website Development',
          benefit: 'Global B2B product showcase displaying technical specifications, certifications (ISO), and RFP inquiry forms.',
          reason: 'Wins international and domestic OEM contract inquiries by showcasing verified capability.'
        },
        {
          name: 'Business Process Automation',
          benefit: 'Automated quotation generation, purchase order workflows, and vendor invoice verification.',
          reason: 'Shortens sales quoting cycles from days to minutes.'
        },
        {
          name: 'Business Dashboards and Analytics',
          benefit: 'Machine utilization dashboards, scrap rate analytics, and on-time shipment tracking.',
          reason: 'Provides plant managers with instantaneous operational clarity to reduce downtime.'
        }
      );
    } else if (targetInd.includes('it') || targetInd.includes('software') || targetInd.includes('tech') || targetInd.includes('saas')) {
      recommendations.push(
        {
          name: 'Custom Software Development',
          benefit: 'Full-stack software engineering, dedicated development teams, and secure cloud microservices.',
          reason: 'Accelerates your product development roadmap with agile, production-grade code.'
        },
        {
          name: 'AI and Data Science Solutions',
          benefit: 'Custom LLM fine-tuning, retrieval-augmented generation (RAG), and intelligent backend workflows.',
          reason: 'Integrates cutting-edge AI capabilities into your software platform.'
        },
        {
          name: 'API and System Integration',
          benefit: 'Enterprise webhooks, authentication flows, and high-throughput third-party data synchronization.',
          reason: 'Ensures rock-solid interoperability across your modern tech stack.'
        },
        {
          name: 'Custom Website Development',
          benefit: 'High-converting SaaS product marketing site with interactive product previews and clear pricing tiers.',
          reason: 'Maximizes visitor sign-ups and demo request conversion rates.'
        }
      );
    } else {
      // Professional Services / General / Other fallback
      recommendations.push(
        {
          name: 'Custom Website Development',
          benefit: 'Modern, high-speed corporate website presenting your expertise, client case studies, and clear inquiry triggers.',
          reason: 'Establishes commanding industry authority and facilitates direct customer contact.'
        },
        {
          name: 'Business Process Automation',
          benefit: 'Automated customer onboarding, document collection, and reminder workflows via WhatsApp and Email.',
          reason: 'Eliminates repetitive back-and-forth communication and improves client turnaround time.'
        },
        {
          name: 'Google Business Profile Optimization',
          benefit: 'Complete local visibility optimization capturing clients actively seeking local professional assistance.',
          reason: 'Drives consistent local client inquiries without ongoing ad spend.'
        },
        {
          name: 'Business Dashboards and Analytics',
          benefit: 'Unified executive reports consolidating client billings, outstanding follow-ups, and project status.',
          reason: 'Maintains complete operational grip on your growing firm without manual coordination.'
        }
      );
    }

    // If user stated explicit requirements, adapt recommendations to match
    if (reqText) {
      if ((reqText.includes('app') || reqText.includes('mobile')) && !recommendations.some(r => r.name.includes('Mobile'))) {
        recommendations.unshift({
          name: 'Mobile App Development',
          benefit: 'Dedicated iOS & Android application designed around your specified customer requirements.',
          reason: 'Directly fulfills your stated requirement for mobile access.'
        });
      }
      if ((reqText.includes('ai') || reqText.includes('bot') || reqText.includes('automation')) && !recommendations.some(r => r.name.includes('AI') || r.name.includes('Automation'))) {
        recommendations.unshift({
          name: 'AI and Data Science Solutions',
          benefit: 'Automated intelligence and workflow engine designed specifically for your operational requirements.',
          reason: 'Directly aligns with your stated requirement for intelligent automation.'
        });
      }
      if ((reqText.includes('ecom') || reqText.includes('store') || reqText.includes('cart')) && !recommendations.some(r => r.name.includes('E-commerce'))) {
        recommendations.unshift({
          name: 'E-commerce Website Development',
          benefit: 'Seamless digital storefront tailored to your catalog and ordering requirements.',
          reason: 'Directly addresses your stated requirement for an online store.'
        });
      }
    }

    return recommendations.slice(0, 4);
  }

  /**
   * Rule-based intelligent fallback generator (ensures 100% reliable generation even when Gemini API key is missing)
   */
  public static generateRuleBasedOutputs(
    profile: MarketingCustomerProfile,
    provider: ProviderSettings,
    recommendedServices: MarketingRecommendedService[]
  ): GeneratedMarketingOutputs {
    const { greeting, greetingType } = this.getGreetingForTime(undefined, profile.greetingOverride);
    const cName = profile.customerName?.trim() || 'Business Leader';
    const compName = profile.companyName?.trim() || 'your company';
    const ind = profile.customIndustry?.trim() || profile.industry || 'your industry';
    const loc = profile.location?.trim() || 'your region';
    const desig = profile.designation?.trim() ? `, ${profile.designation}` : '';
    const lang = (profile.language || 'English').toLowerCase();
    const tone = profile.tone || 'Professional';

    const pName = provider.senderName || 'Ashwin';
    const pComp = provider.companyName || 'QUENOXA GLOBAL TECHNOLOGIES';
    const pWeb = provider.website || 'https://www.quenoxa.com';
    const pPhone = provider.phone || '6369480281';

    // Format service bullets
    const serviceBullets = recommendedServices.map((s, idx) => `${idx + 1}. *${s.name}*: ${s.benefit}`).join('\n');
    const serviceListCompact = recommendedServices.map(s => `• ${s.name} — ${s.benefit}`).join('\n');

    // Language handling: English, Tamil, and Thanglish
    if (lang.includes('tamil') || lang.includes('thanglish')) {
      const isPureTamil = lang === 'tamil';

      const introMsg = isPureTamil
        ? `வணக்கம் ${cName} அவர்களே,\n\nநான் ${pComp} நிறுவனத்திலிருந்து ${pName} பேசுகிறேன். ${loc}-ல் செயல்பட்டு வரும் உங்கள் ${compName} நிறுவனத்தின் வளர்ச்சிப் பணிகளை அறிந்தோம்.\n\n${ind} துறையில் இயங்கும் வணிகங்களுக்குத் தேவையான இணையவழித் தீர்வுகள், மொபைல் செயலிகள் மற்றும் வணிக தானியங்கு அமைப்புகளை வழங்கி வருகிறோம். உங்களின் வணிக நடவடிக்கைகளை அடுத்த கட்டத்திற்கு எளிதாக முன்னெடுத்துச் செல்ல நாங்கள் எவ்வாறு உதவ முடியும் என்பதை சுருக்கமாகக் கலந்துரையாட விரும்புகிறோம்.\n\nநன்றி,\n${pName} | ${pComp}\nதொடர்புக்கு: ${pPhone}`
        : `Vanakkam ${cName} sir/ma'am,\n\nNaan ${pComp}-la irundhu ${pName} connect panren. ${loc}-la irukura unga ${compName} growth track panni paathom.\n\n${ind} sector-ku thevaiyaana modern websites, customer applications, and business automation solutions naanga provide panrom. Unga business-la digital presence and customer reach increase panna nalla opportunities irukku.\n\nOru quick 5 mins discuss panna eppo convenient-a irukkum?\n\nRegards,\n${pName} | ${pComp}\nContact: ${pPhone}`;

      const pitchMsg = isPureTamil
        ? `அன்புள்ள ${cName} அவர்களே,\n\n${compName} நிறுவனத்தின் ${ind} வணிகச் செயல்பாடுகளை மேலும் எளிமையாக்கவும், வாடிக்கையாளர் தொடர்பை வலுப்படுத்தவும் ${pComp} வழங்கும் முக்கிய சேவைகள்:\n\n${serviceBullets}\n\nஇவை மூலம் உங்கள் நேரத்தையும், தேவையற்ற கூடுதல் பணிச் சுமைகளையும் மிச்சப்படுத்தி, சீரான வணிக வளர்ச்சியைப் பெற இயலும்.\n\nஇது குறித்து ஒரு சிறிய விளக்கம் பெற விரும்புகிறீர்களா?\n\nநன்றி,\n${pName}\n${pWeb}`
        : `Hi ${cName} sir/ma'am,\n\nUnga ${compName} business-ku helpful-a irukura key services from ${pComp}:\n\n${serviceBullets}\n\nIdhan moolama manual efforts kuranju, direct customer inquiries & daily operations romba smooth-a maintain panna mudiyum.\n\nIdha pathi detail-a oru 5 mins call-la share panlama?\n\nThanks,\n${pName}\n${pWeb}`;

      const brochureMsg = isPureTamil
        ? `வணக்கம் ${cName} அவர்களே,\n\n${pComp} நிறுவனத்தின் சேவைகள், முந்தைய திட்டங்கள் மற்றும் வாடிக்கையாளர் நன்மைகளைக் கொண்ட எங்களின் அதிகாரப்பூர்வ அறிமுகக் கையேட்டை (Brochure) தங்களின் பார்வைக்கு அனுப்பியுள்ளோம்.\n\nதங்கள் ஓய்வான நேரத்தில் இதைப் பார்வையிட்டு, தங்களின் மேலான கருத்துக்களைத் தெரிவிக்க வேண்டுகிறோம்.\n\nகையேட்டைப் பார்க்க: ${pWeb}\n\nநன்றி,\n${pName}`
        : `Hi ${cName} sir/ma'am,\n\n${pComp}-oda official company brochure and client work profile-ai unga review-kaga share panrom. Ungaloda ${compName}-ku thagundha modern tech solutions idhula detail-a irukku.\n\nFree time-la review panni unga thoughts sollunga:\nBrochure link: ${pWeb}\n\nRegards,\n${pName} | ${pPhone}`;

      const followupMsg = isPureTamil
        ? `வணக்கம் ${cName} அவர்களே,\n\nஎங்களின் முந்தைய செய்தி தங்களுக்குக் கிடைத்திருக்கும் என நம்புகிறேன். ${compName} நிறுவனத்தின் ${ind} செயல்பாடுகளுக்கான எங்களின் தொழில்நுட்பத் தீர்வுகள் குறித்து தங்களின் கருத்தை அறிய ஆவலாக உள்ளோம்.\n\nதங்களுக்கு சௌகரியமான ஒரு நாளில் ஒரு சிறிய தொலைபேசி அழைப்பு அல்லது இணைய சந்திப்பை மேற்கொள்ளலாமா?\n\nநன்றி,\n${pName}`
        : `Hi ${cName} sir/ma'am,\n\nHope you are having a productive week. Unga ${compName} business-kaga share panna digital solutions review panna mudinjidha?\n\nUnga convenient time-la oru quick phone call or meeting schedule panlama?\n\nBest regards,\n${pName} | ${pComp}`;

      const emailSubject = isPureTamil
        ? `${compName} நிறுவனத்திற்கான டிஜிட்டல் வளர்ச்சித் தீர்வுகள் — ${pComp}`
        : `Digital Growth & Automation for ${compName} — Quenoxa Global Technologies`;

      const emailBody = `Respected ${cName}${desig},\n\n${greeting}.\n\nI am ${pName} representing ${pComp}. We have been following the commendable work done by ${compName} in ${loc}.\n\nSpecializing in high-performance digital systems for the ${ind} industry, we help leading businesses streamline everyday operations, engage customers through modern channels, and build measurable market visibility.\n\nKey areas where we can support ${compName}:\n\n${serviceListCompact}\n\nWe would welcome an opportunity for a brief 10-minute introductory phone call or Google Meet at your convenience.\n\nYou may also review our enterprise credentials at ${pWeb}.\n\nWarm regards,\n\n${pName}\n${pComp}\nWebsite: ${pWeb}\nDirect: ${pPhone}\nEmail: ${provider.email}`;

      const shortWa = `Vanakkam ${cName} sir! ${pName} from ${pComp}. We help ${ind} businesses in ${loc} like ${compName} automate customer workflows & scale digital visibility. Would you be open for a brief 5-min intro call this week? View profile: ${pWeb}`;

      return {
        customerName: cName,
        companyName: compName,
        industry: ind,
        recommendedServices,
        detectedGreeting: greeting,
        greetingType,
        introductionMessage: introMsg,
        servicePitchMessage: pitchMsg,
        brochureSharingMessage: brochureMsg,
        followupMessage: followupMsg,
        emailSubject,
        emailBody,
        whatsappShortMessage: shortWa,
        industryServiceList: serviceListCompact,
        channel: profile.preferredChannel || 'WhatsApp',
        language: profile.language || 'English',
        tone: profile.tone || 'Professional',
        createdAt: new Date().toISOString()
      };
    }

    // Default: English with requested Tone
    let introGreeting = `${greeting}, ${cName}${desig}.`;
    if (tone === 'Short and Direct') {
      introGreeting = `${greeting} ${cName},`;
    } else if (tone === 'Friendly') {
      introGreeting = `Hello ${cName}! Hope you are having a great week.`;
    } else if (tone === 'Formal') {
      introGreeting = `Dear ${cName}${desig},\n\n${greeting}.`;
    }

    const introMsg = `${introGreeting}\n\nMy name is ${pName} reaching out from ${pComp}. We have been following the steady growth of ${compName} in ${loc}.\n\nWe specialize in engineering modern digital platforms, custom applications, and automated workflows specifically tailored for businesses in the ${ind} sector.\n\nOur objective in connecting is to explore practical ways we can support ${compName}'s online presence and day-to-day operations without unnecessary complexity.\n\nWould you be open to a brief 5-minute introductory conversation at a convenient time this week?\n\nBest regards,\n${pName}\n${pComp}\nContact: ${pPhone} | ${pWeb}`;

    const pitchMsg = `${greeting} ${cName},\n\nAs ${compName} continues to expand in the ${ind} space, maintaining seamless customer interactions while keeping administrative overhead low is essential.\n\nBased on the typical operational priorities of businesses like ${compName}, here are specific solutions from ${pComp} engineered to deliver clear outcomes:\n\n${serviceBullets}\n\nOur focus is always on practical outcomes: stronger digital credibility, smoother daily workflow coordination, and dependable inquiry capture without making unrealistic promises.\n\nWould you like me to share a brief 2-page implementation outline tailored for ${compName}?\n\nSincerely,\n${pName} | ${pComp}\n${pWeb}`;

    const brochureMsg = `${greeting} ${cName},\n\nThank you for your time. As requested, I am pleased to share our official ${pComp} Company Profile and Services Brochure.\n\nIt outlines our technical capabilities, client implementations across the ${ind} sector, and how our engineering team helps businesses like ${compName} deploy modern digital tools with confidence.\n\nYou can review our credentials online at: ${pWeb}\n\nPlease feel free to review it at your convenience. I would be happy to answer any questions you may have.\n\nRespectfully,\n${pName}\n${pComp} | Direct: ${pPhone}`;

    const followupMsg = `${greeting} ${cName},\n\nI hope you are having a productive week.\n\nI am following up on our earlier communication regarding tailored digital and automation capabilities for ${compName}.\n\nI understand your schedule may be demanding. When you have a brief moment, I would welcome the opportunity to connect for 5 to 10 minutes to understand your current technological priorities for the upcoming quarter.\n\nPlease let me know what day and time works best for your schedule.\n\nWarm regards,\n${pName}\n${pComp}\nPhone: ${pPhone}`;

    const emailSubject = tone === 'Short and Direct'
      ? `Digital solutions for ${compName} — Quenoxa`
      : `Exploring Digital Capabilities & Workflow Automation for ${compName}`;

    const emailBody = `Dear ${cName}${desig},\n\n${greeting}.\n\nMy name is ${pName}, and I am reaching out from ${pComp}. We have noted ${compName}'s reputable standing in ${loc}.\n\nWe work with forward-thinking enterprises in the ${ind} sector to engineer dependable digital systems that drive visibility and eliminate manual friction. Specifically for ${compName}, we see strong synergy across these areas:\n\n${serviceListCompact}\n\nRather than presenting generic pitches, we design every implementation around your specific business workflow, ensuring clear operational returns, faster customer turnaround, and enterprise-grade reliability.\n\nCould we schedule a brief 10-minute introductory phone call or virtual meeting this Thursday or Friday?\n\nThank you for your consideration, and I look forward to hearing your thoughts.\n\nWarm regards,\n\n${pName}\nSenior Solutions Specialist\n${pComp}\nWebsite: ${pWeb}\nDirect: ${pPhone}\nEmail: ${provider.email}`;

    const shortWa = tone === 'Short and Direct'
      ? `${greeting} ${cName}! ${pName} from ${pComp}. We build custom digital systems & automation for ${ind} companies like ${compName}. Open for a brief 5-min intro call this week? Profile: ${pWeb}`
      : `${greeting} ${cName}! This is ${pName} from ${pComp}. We noticed ${compName}'s work in ${loc} and have helped similar ${ind} businesses streamline customer booking & digital presence. Would you be open to a quick 5-min chat this week? Info: ${pWeb}`;

    return {
      customerName: cName,
      companyName: compName,
      industry: ind,
      recommendedServices,
      detectedGreeting: greeting,
      greetingType,
      introductionMessage: introMsg,
      servicePitchMessage: pitchMsg,
      brochureSharingMessage: brochureMsg,
      followupMessage: followupMsg,
      emailSubject,
      emailBody,
      whatsappShortMessage: shortWa,
      industryServiceList: serviceListCompact,
      channel: profile.preferredChannel || 'WhatsApp',
      language: profile.language || 'English',
      tone: profile.tone || 'Professional',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Main Generator Method: Tries Gemini AI first, falls back gracefully to rule-based engine
   */
  public static async generateMarketingOutputs(
    profile: MarketingCustomerProfile,
    customProvider?: Partial<ProviderSettings>
  ): Promise<GeneratedMarketingOutputs> {
    const provider = { ...this.getProviderSettings(), ...customProvider };
    const recommendedServices = this.selectRecommendedServices(profile.industry, profile.customIndustry, profile.requirements);
    const { greeting, greetingType } = this.getGreetingForTime(undefined, profile.greetingOverride);

    // Try Gemini if client configured
    try {
      const dbKeyRow = db.prepare("SELECT value FROM system_settings WHERE key = 'gemini_api_key'").get() as { value: string } | undefined;
      const apiKey = dbKeyRow?.value || config.geminiApiKey;

      if (apiKey && apiKey.trim() !== '' && apiKey !== 'YOUR_GEMINI_API_KEY') {
        const cleanKey = apiKey.trim().replace(/\.+$/, '');
        const ai = new GoogleGenAI({ apiKey: cleanKey });
        const model = config.geminiModel || 'gemini-2.5-flash';

        const prompt = `
You are the Lead Sales Strategist and Communications Director at ${provider.companyName}.
Generate a comprehensive set of personalized, professional marketing messages tailored specifically to the customer profile below.

### SENDER / SERVICE PROVIDER:
- Company Name: ${provider.companyName}
- Sender Name: ${provider.senderName}
- Website: ${provider.website}
- Phone: ${provider.phone}
- Email: ${provider.email}

### TARGET CUSTOMER PROFILE:
- Customer / Contact Person: ${profile.customerName || 'Business Owner'}
- Designation: ${profile.designation || 'Decision Maker'}
- Customer Company Name: ${profile.companyName}
- Industry: ${profile.customIndustry || profile.industry}
- Business Location: ${profile.location}
- Customer Website: ${profile.website || 'Not provided'}
- Specific Stated Requirements: ${profile.requirements || 'Looking for digital growth and workflow improvement'}
- Preferred Channel: ${profile.preferredChannel}
- Preferred Language: ${profile.language}
- Requested Tone: ${profile.tone}
- Time of Day Greeting: ${greeting} (${greetingType})

### RECOMMENDED SERVICES TO HIGHLIGHT:
${recommendedServices.map((s, idx) => `${idx + 1}. ${s.name}: ${s.benefit} (Why: ${s.reason})`).join('\n')}

### CRITICAL RULES:
1. NEVER confuse ${provider.companyName} (the service provider) with ${profile.companyName} (the customer).
2. NEVER invent facts, fake past interactions, or claim previous calls unless explicitly supplied in requirements.
3. NEVER make unrealistic revenue or 100% guarantee promises. Emphasize practical business outcomes: stronger online visibility, automated coordination, simpler operations, and dependable customer acquisition.
4. Adhere strictly to the requested tone (${profile.tone}) and language (${profile.language}). If Tamil/Thanglish is requested, formulate fluent, culturally natural phrasing.
5. Return strictly valid JSON matching this schema:
{
  "introductionMessage": "String",
  "servicePitchMessage": "String",
  "brochureSharingMessage": "String",
  "followupMessage": "String",
  "emailSubject": "String",
  "emailBody": "String",
  "whatsappShortMessage": "String",
  "industryServiceList": "String"
}
`;

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.35,
            responseMimeType: 'application/json'
          }
        });

        const rawText = response.text || '';
        if (rawText) {
          const parsed = JSON.parse(rawText);
          return {
            customerName: profile.customerName,
            companyName: profile.companyName,
            industry: profile.customIndustry || profile.industry,
            recommendedServices,
            detectedGreeting: greeting,
            greetingType,
            introductionMessage: parsed.introductionMessage || '',
            servicePitchMessage: parsed.servicePitchMessage || '',
            brochureSharingMessage: parsed.brochureSharingMessage || '',
            followupMessage: parsed.followupMessage || '',
            emailSubject: parsed.emailSubject || '',
            emailBody: parsed.emailBody || '',
            whatsappShortMessage: parsed.whatsappShortMessage || '',
            industryServiceList: parsed.industryServiceList || recommendedServices.map(s => `• ${s.name}: ${s.benefit}`).join('\n'),
            channel: profile.preferredChannel,
            language: profile.language,
            tone: profile.tone,
            createdAt: new Date().toISOString()
          };
        }
      }
    } catch (aiErr) {
      console.warn('[MarketingGeneratorService] AI generation failed or not configured, using rule-based fallback:', aiErr);
    }

    // High-fidelity rule-based fallback
    return this.generateRuleBasedOutputs(profile, provider, recommendedServices);
  }

  /**
   * Save a customer profile to SQLite
   */
  public static saveProfile(profile: MarketingCustomerProfile): MarketingCustomerProfile {
    const id = profile.id || `prof-${uuidv4()}`;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO marketing_profiles (
        id, customer_name, company_name, industry, custom_industry, designation,
        location, website, requirements, preferred_channel, message_type,
        language, tone, time_zone, greeting_override, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    stmt.run(
      id,
      profile.customerName,
      profile.companyName,
      profile.industry,
      profile.customIndustry || null,
      profile.designation || null,
      profile.location || 'Coimbatore',
      profile.website || null,
      profile.requirements || null,
      profile.preferredChannel || 'WhatsApp',
      profile.messageType || 'Introduction',
      profile.language || 'English',
      profile.tone || 'Professional',
      profile.timeZone || 'Asia/Kolkata',
      profile.greetingOverride || null
    );

    return { ...profile, id };
  }

  /**
   * List all saved profiles
   */
  public static getProfiles(): MarketingCustomerProfile[] {
    try {
      const rows = db.prepare('SELECT * FROM marketing_profiles ORDER BY updated_at DESC').all() as any[];
      return rows.map(r => ({
        id: r.id,
        customerName: r.customer_name,
        companyName: r.company_name,
        industry: r.industry,
        customIndustry: r.custom_industry,
        designation: r.designation,
        location: r.location,
        website: r.website,
        requirements: r.requirements,
        preferredChannel: r.preferred_channel as MarketingChannel,
        messageType: r.message_type as any,
        language: r.language as any,
        tone: r.tone as any,
        timeZone: r.time_zone,
        greetingOverride: r.greeting_override,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
    } catch {
      return [];
    }
  }

  /**
   * Delete a saved profile
   */
  public static deleteProfile(id: string): boolean {
    try {
      db.prepare('DELETE FROM marketing_profiles WHERE id = ?').run(id);
      db.prepare('DELETE FROM generated_marketing_messages WHERE profile_id = ?').run(id);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Save generated message outputs to history
   */
  public static logGeneratedOutput(outputs: GeneratedMarketingOutputs): void {
    try {
      const id = outputs.id || `msg-${uuidv4()}`;
      db.prepare(`
        INSERT INTO generated_marketing_messages (
          id, profile_id, customer_name, company_name, industry,
          recommended_services, detected_greeting, greeting_type,
          introduction_message, service_pitch_message, brochure_sharing_message,
          followup_message, email_subject, email_body, whatsapp_short_message,
          industry_service_list, channel, language, tone, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        id,
        outputs.profileId || null,
        outputs.customerName,
        outputs.companyName,
        outputs.industry,
        JSON.stringify(outputs.recommendedServices),
        outputs.detectedGreeting,
        outputs.greetingType,
        outputs.introductionMessage,
        outputs.servicePitchMessage,
        outputs.brochureSharingMessage,
        outputs.followupMessage,
        outputs.emailSubject,
        outputs.emailBody,
        outputs.whatsappShortMessage,
        outputs.industryServiceList,
        outputs.channel,
        outputs.language,
        outputs.tone
      );
    } catch (e) {
      console.warn('Failed to log generated output:', e);
    }
  }

  /**
   * Get recent generated message history
   */
  public static getMessageHistory(limit = 20): GeneratedMarketingOutputs[] {
    try {
      const rows = db.prepare('SELECT * FROM generated_marketing_messages ORDER BY created_at DESC LIMIT ?').all(limit) as any[];
      return rows.map(r => ({
        id: r.id,
        profileId: r.profile_id,
        customerName: r.customer_name,
        companyName: r.company_name,
        industry: r.industry,
        recommendedServices: r.recommended_services ? JSON.parse(r.recommended_services) : [],
        detectedGreeting: r.detected_greeting,
        greetingType: r.greeting_type,
        introductionMessage: r.introduction_message,
        servicePitchMessage: r.service_pitch_message,
        brochureSharingMessage: r.brochure_sharing_message,
        followupMessage: r.followup_message,
        emailSubject: r.email_subject,
        emailBody: r.email_body,
        whatsappShortMessage: r.whatsapp_short_message,
        industryServiceList: r.industry_service_list,
        channel: r.channel,
        language: r.language,
        tone: r.tone,
        createdAt: r.created_at
      }));
    } catch {
      return [];
    }
  }
}
