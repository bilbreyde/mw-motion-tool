import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are a Digital Workplace Sales Motion AI for Zones LLC. You guide sellers through customer profiling, readiness assessment, and solution recommendation for Digital Workplace services including MDM, Windows Autopilot, Clean Image provisioning, and TSC Provisioning.

CORE BUSINESS RULES — always enforce these:
1. TSC (Technical Solutions Consultant) engagement is REQUIRED before any device order is placed.
2. Clean Image is ALWAYS preferred over OEM Ready Image for quality, consistency, and auditability.
3. Windows Autopilot enrollment is REQUIRED for all modern provisioning workflows.
4. The seller's role is to identify opportunities and engage the right resources — not to manage execution.
5. First Article testing is REQUIRED before any production-scale deployment order is initiated.
6. If Autopilot OR Intune/MDM is NOT production-ready, route to Pro Services immediately — do not proceed with standard motion.
7. DW SA must be assigned before any scoping conversation begins.

ZONES SERVICE PORTFOLIO:
- TSC Provisioning: Zones' technical staging and configuration service — always required
- Clean Image: Zones-built, tested Windows image — preferred over OEM; includes Autopilot OOBE, app baseline, policy enforcement
- MDM Managed Services: Ongoing Intune/MDM management post-deployment
- Digital Workplace Pro Services: Remediation, migration, and readiness services for non-ready environments
- Cloud Services: Microsoft licensing, Azure, M365 optimization

When generating roadmaps:
- Assign clear ownership to each action: Seller, DW SA, TSC, Cloud Services, or Customer
- Phase actions as: Discovery, Pre-Sales Alignment, First Article, Production Scale, Ongoing
- SOW readiness requires: TSC alignment complete, first article passed, DW SA assigned, customer profile confirmed
- Always flag blockers explicitly with "REQUIRED" status
- Return valid JSON matching the schema exactly`;

function buildUserPrompt(body: Record<string, unknown>): string {
  const { action, customerProfile, readinessCheck, deploymentRecommendation, engagementTriggers, firstArticle } = body;

  const profileSummary = JSON.stringify(customerProfile, null, 2);

  if (action === 'recommend-deployment') {
    return `Based on this customer profile, recommend the optimal deployment model.

Customer Profile:
${profileSummary}

Readiness Status:
- Autopilot Ready: ${(readinessCheck as Record<string, unknown>)?.autopilotReady}
- Intune/MDM Ready: ${(readinessCheck as Record<string, unknown>)?.intuneReady}

Respond with JSON in this exact schema:
{
  "message": "Brief conversational explanation for the seller",
  "imageType": "clean-image" | "oem-ready",
  "provisioningModel": "pre-provisioning" | "user-driven" | "hybrid",
  "rationale": "Detailed rationale referencing customer specifics and Zones best practices"
}`;
  }

  if (action === 'first-article-guidance') {
    return `Determine first article requirements and validation criteria for this engagement.

Customer Profile:
${profileSummary}

Deployment Model Selected:
- Image Type: ${(deploymentRecommendation as Record<string, unknown>)?.imageType}
- Provisioning Model: ${(deploymentRecommendation as Record<string, unknown>)?.provisioningModel}

Engagement Status:
- DW SA Assigned: ${(engagementTriggers as Record<string, unknown>)?.dwSaAssigned}
- TSC Alignment Scheduled: ${(engagementTriggers as Record<string, unknown>)?.tscAlignmentScheduled}
- Cloud Services Engaged: ${(engagementTriggers as Record<string, unknown>)?.cloudServicesEngaged}

Respond with JSON in this exact schema:
{
  "message": "Brief conversational explanation for the seller",
  "validationCriteria": ["criterion 1", "criterion 2", "criterion 3"],
  "guidance": "Detailed guidance on the first article process, what to test, and pass/fail criteria"
}`;
  }

  if (action === 'generate-roadmap') {
    return `Generate a complete Digital Workplace deployment roadmap for this engagement.

Customer Profile:
${profileSummary}

Readiness:
- Autopilot Ready: ${(readinessCheck as Record<string, unknown>)?.autopilotReady}
- Intune/MDM Ready: ${(readinessCheck as Record<string, unknown>)?.intuneReady}

Deployment Model:
- Image Type: ${(deploymentRecommendation as Record<string, unknown>)?.imageType}
- Provisioning: ${(deploymentRecommendation as Record<string, unknown>)?.provisioningModel}

Engagement Status:
- DW SA Assigned: ${(engagementTriggers as Record<string, unknown>)?.dwSaAssigned}
- TSC Alignment: ${(engagementTriggers as Record<string, unknown>)?.tscAlignmentScheduled}
- Cloud Services: ${(engagementTriggers as Record<string, unknown>)?.cloudServicesEngaged}

First Article:
- Required: ${(firstArticle as Record<string, unknown>)?.required}
- Test Order Needed: ${(firstArticle as Record<string, unknown>)?.testOrderNeeded}
- Validation Criteria: ${JSON.stringify((firstArticle as Record<string, unknown>)?.validationCriteria)}

Respond with JSON in this exact schema:
{
  "message": "Executive summary of the engagement for the seller",
  "roadmap": {
    "steps": [
      {
        "id": "unique-id",
        "phase": "Discovery | Pre-Sales Alignment | First Article | Production Scale | Ongoing",
        "action": "Specific action description",
        "owner": "Seller | DW SA | TSC | Cloud Services | Customer",
        "timeline": "e.g. Week 1, Days 1-3, Month 2",
        "status": "required | recommended | complete",
        "sowRelevant": true | false
      }
    ],
    "sowReady": true | false,
    "sowReadinessScore": 0-100,
    "aiSummary": "2-3 sentence summary of SOW readiness and key next steps",
    "generatedAt": "${new Date().toISOString()}"
  }
}`;
  }

  return `Provide guidance for this Digital Workplace sales motion. Context: ${JSON.stringify(body)}`;
}

async function motionHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method === 'OPTIONS') {
    return {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
  }

  try {
    const body = await request.json() as Record<string, unknown>;

    const endpoint = process.env.AZURE_FOUNDRY_ENDPOINT;
    const apiKey = process.env.AZURE_FOUNDRY_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-5.4';

    if (!endpoint || !apiKey) {
      context.error('Missing AZURE_FOUNDRY_ENDPOINT or AZURE_FOUNDRY_KEY environment variables');
      return {
        status: 500,
        jsonBody: { error: 'AI service not configured. Check environment variables.' },
        headers: corsHeaders(),
      };
    }

    const client = new OpenAI({
      apiKey,
      baseURL: `${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment}`,
      defaultQuery: { 'api-version': '2024-08-01-preview' },
      defaultHeaders: { 'api-key': apiKey },
    });

    const userPrompt = buildUserPrompt(body);

    const completion = await client.chat.completions.create({
      model: deployment,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);

    return {
      status: 200,
      jsonBody: parsed,
      headers: corsHeaders(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    context.error('Motion handler error:', message);
    return {
      status: 500,
      jsonBody: { error: message },
      headers: corsHeaders(),
    };
  }
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };
}

app.http('motion', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'motion',
  handler: motionHandler,
});
