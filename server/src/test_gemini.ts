import { GoogleGenAI } from '@google/genai';
import { config } from './config/environment.js';
import { db } from './db/database.js';

async function testFastAnalyze() {
  const apiKey = config.geminiApiKey;
  const model = 'gemini-2.5-flash';
  const ai = new GoogleGenAI({ apiKey });

  const recordRow = db.prepare('SELECT * FROM extracted_records LIMIT 1').get() as any;
  const catalogRows = db.prepare('SELECT * FROM service_catalog WHERE is_active = 1').all() as any[];

  const prompt = `Analyze this business prospect for Quenoxa Global Technologies:
TARGET PROSPECT DETAILS:
- Business Name: ${recordRow.company_name}
- Industry: ${recordRow.industry}
- Contact: ${recordRow.customer_name} | Phone: ${recordRow.phone} | Email: ${recordRow.email} | Location: ${recordRow.location}

SERVICES CATALOGUE:
${catalogRows.map((s: any) => `- ${s.name} (${s.category})`).join('\n')}

CONSTRAINTS FOR MAXIMUM SPEED & PRECISION:
1. Output valid JSON only.
2. Keep all descriptions, explanations, and evidence to concise 1-2 punchy sentences.
3. Include EXACTLY top 3 recommendedServices.
4. Include 12 standard digitalPresence items with brief evidence.
5. Include 3-4 businessProblems only.

JSON SCHEMA:
{
  "customerProfile": {
    "customerName": "${recordRow.customer_name}",
    "companyName": "${recordRow.company_name}",
    "primaryIndustry": "${recordRow.industry}",
    "specificBusinessCategory": string,
    "businessModel": string,
    "likelyCustomerGroups": [string],
    "productsOrServices": [string],
    "location": "${recordRow.location}",
    "websiteUrl": string,
    "businessDescription": string,
    "contactInfo": { "email": "${recordRow.email}", "phone": "${recordRow.phone}", "formattedPhone": "${recordRow.phone}", "additionalContacts": [] }
  },
  "digitalPresence": [
    {
      "capability": string,
      "status": "Confirmed available" | "Confirmed missing" | "Needs verification" | "Not applicable",
      "evidence": string,
      "verificationDate": string
    }
  ],
  "businessProblems": [
    {
      "problem": string,
      "type": "observed" | "potential",
      "supportingEvidence": string,
      "businessImpact": string,
      "confidenceLevel": "High" | "Medium" | "Low",
      "discoveryQuestion": string
    }
  ],
  "businessGapAnalysis": {
    "verifiedGaps": [string],
    "potentialGaps": [string],
    "unknownInformation": [string]
  },
  "recommendedServices": [
    {
      "id": string,
      "serviceName": string,
      "serviceCategory": string,
      "whyNeeded": string,
      "specificProblem": string,
      "proposedSolution": string,
      "detailedFeatures": [string],
      "howItWorks": string,
      "expectedBenefits": [string],
      "limitations": [string],
      "requiredIntegrations": [string],
      "implementationComplexity": "Low" | "Medium" | "High" | "Enterprise",
      "dependencies": [string],
      "suggestedPriority": "High" | "Medium" | "Low",
      "suggestedNextSalesAction": string,
      "discoveryQuestions": [string],
      "infoNeededBeforeQuotation": [string],
      "priorityScore": {
        "problemRelevance": number,
        "needEvidence": number,
        "businessValue": number,
        "implementationFeasibility": number,
        "quenoxaFit": number,
        "total": number,
        "scoreReasoning": string
      }
    }
  ],
  "suggestedServicePackage": {
    "primaryRecommendedService": string,
    "complementaryService": string,
    "optionalUpgrade": string,
    "scopeOfWork": [string],
    "dependencies": [string],
    "questionsToClarifyBeforeQuoting": [string]
  },
  "salesStrategy": {
    "openingApproach": string,
    "customerSpecificValueProposition": string,
    "discoveryQuestions": [string],
    "recommendedPitchOrder": [string],
    "likelyObjections": [ { "objection": string, "suggestedResponse": string } ],
    "nextAction": string
  },
  "dataQuality": {
    "missingContactDetails": [string],
    "inconsistentInformation": [string],
    "unverifiedClaims": [string],
    "outdatedSourceRecords": [string]
  },
  "factEvidenceMap": {
    "verifiedFacts": [string],
    "aiHypotheses": [string],
    "dataIntegrityNotice": string
  }
}`;

  console.log('Testing fast analyze with thinkingBudget: 0 and concise rules...');
  const t0 = Date.now();
  const res = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.1,
      thinkingConfig: {
        thinkingBudget: 0
      }
    }
  });
  const elapsed = Date.now() - t0;
  console.log(`Finished in ${elapsed}ms! Length: ${res.text?.length}`);
  const raw = res.text || '{}';
  try {
    const parsed = JSON.parse(raw);
    console.log('Success! Parsed services count:', parsed.recommendedServices?.length);
    console.log('Parsed digital presence items:', parsed.digitalPresence?.length);
  } catch (err: any) {
    console.error('JSON Parse error:', err.message);
    const posMatch = err.message.match(/position (\d+)/);
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      console.error('Context around error:');
      console.error(raw.slice(Math.max(0, pos - 150), Math.min(raw.length, pos + 150)));
    } else {
      console.error('Full response preview:', raw.slice(0, 1000));
    }
  }
}

testFastAnalyze();
