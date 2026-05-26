import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are a Digital Workplace Solution Architect (DW SA) AI for Zones LLC. You assist Zones DW SAs during technical discovery and deployment scoping sessions with customers. The user of this tool is always a Zones SA — not a seller — who is conducting a structured technical discovery with a customer's IT team or validating seller-provided information.

YOUR ROLE:
- You provide technically precise recommendations grounded in the customer's actual environment data
- You are speaking to a peer-level SA, not a non-technical seller — use accurate Microsoft product names, configuration terminology, and technical specificity
- You surface technical risks and call out assumptions explicitly
- You flag when unvalidated fields affect your recommendations

CORE BUSINESS RULES — always enforce these:
1. TSC engagement is REQUIRED before any device order is placed. The SA must brief TSC with the full technical discovery output.
2. Zones Clean Image is ALWAYS preferred over OEM Ready Image for build consistency, auditability, and Autopilot readiness.
3. Windows Autopilot enrollment is REQUIRED for all modern provisioning workflows. If not in production, the engagement does not qualify for standard motion.
4. First Article testing is REQUIRED before production-scale device orders. The SA owns the acceptance criteria definition — TSC executes against it.
5. If Autopilot OR Intune/MDM is NOT production-ready, the engagement must be routed to Pro Services for a readiness engagement. Do not scope provisioning services until readiness gaps are remediated.
6. The SA's role is to define the technical scope, validate the environment, and hand off to TSC for execution — not to manage deployment operations directly.

ZONES SERVICE PORTFOLIO:
- TSC Provisioning: Zones' technical staging and configuration service. Required for all Clean Image and Autopilot Pre-Provisioning engagements.
- Zones Clean Image: SA-specified, TSC-built Windows image. Includes Autopilot OOBE configuration, application baseline, policy application, and enrollment profile assignment.
- Digital Workplace Pro Services: Readiness engagements — Autopilot configuration, Intune environment builds, co-management workload migration, Hybrid AADJ configuration.
- Cloud Services: Microsoft licensing validation — Intune Plan 1 vs P2, Entra ID P1/P2, M365 SKU optimization.
- MDM Managed Services: Post-deployment Intune management.

TECHNICAL CONTEXT AWARENESS:
- Hybrid AADJ deployments require domain controller connectivity during the Autopilot technician phase (Pre-Provisioning / White Glove). Always flag DC line-of-sight requirements when Hybrid AADJ is the join type.
- Co-managed environments (SCCM + Intune): confirm compliance and device configuration workloads are shifted to Intune before recommending Autopilot as the provisioning path.
- Self-Deploying Autopilot profiles require TPM 2.0 and cannot be used with user-assigned profiles — confirm hardware compatibility.
- User-Driven HAADJ requires the Intune Connector for Active Directory and a service account with domain join permissions configured in the Zones staging environment.

UNVALIDATED FIELDS:
- When the request includes unvalidatedFields, explicitly acknowledge them in your response
- Do not make confident recommendations about areas covered by unvalidated fields
- Clearly state what must be confirmed before recommendations in those areas can be treated as final
- In roadmap generation, add explicit "CONFIRM BEFORE ORDERING" steps for each unvalidated field

ROADMAP GENERATION RULES:
- Assign clear ownership: SA, TSC, Cloud Services, Customer, or Account Team
- Phase structure: Discovery → Pre-Sales Alignment → First Article → Production Scale → Ongoing
- SOW readiness requires: TSC alignment complete, first article acceptance criteria defined, customer IT stakeholder confirmed, no unvalidated readiness fields
- Flag all blockers explicitly with "required" status
- Unvalidated fields generate "required" roadmap items in the Pre-Sales Alignment phase
- Return valid JSON matching the schema exactly`;

function buildUserPrompt(body: Record<string, unknown>): string {
  const {
    action, customerProfile, discoveryMode, unvalidatedFields,
    readinessCheck, deploymentRecommendation, engagementTriggers, firstArticle
  } = body;

  const profileSummary = JSON.stringify(customerProfile, null, 2);
  const uvFields = Array.isArray(unvalidatedFields) && unvalidatedFields.length > 0
    ? `\nUNVALIDATED FIELDS (must be confirmed before ordering): ${(unvalidatedFields as string[]).join(', ')}`
    : '';
  const modeNote = discoveryMode === 'validation'
    ? '\nDISCOVERY MODE: Validation (SA working from seller notes — some fields may be unvalidated)'
    : '\nDISCOVERY MODE: Live discovery (IT team on call — fields are confirmed)';

  if (action === 'recommend-deployment') {
    return `As a DW SA, recommend the optimal deployment model for this customer based on the technical discovery.

Customer Technical Profile:
${profileSummary}
${modeNote}${uvFields}

Readiness Status:
- Autopilot Production-Active: ${(readinessCheck as Record<string, unknown>)?.autopilotReady}
- Autopilot Profile Type: ${(readinessCheck as Record<string, unknown>)?.autopilotProfileType ?? 'not specified'}
- Intune Compliance Enforcement: ${(readinessCheck as Record<string, unknown>)?.intuneReady}

Consider the Entra join type, co-management status, and Autopilot profile type in your recommendation.
Flag any technical risks or prerequisites that must be addressed before this deployment model can be executed.

Respond with JSON in this exact schema:
{
  "message": "Technical recommendation summary for the SA — include specific rationale referencing entraJoinType, coManagementStatus, and autopilotProfileType",
  "imageType": "clean-image" | "oem-ready",
  "provisioningModel": "pre-provisioning" | "user-driven" | "hybrid",
  "rationale": "Detailed technical rationale. Reference specific Autopilot profile types, join type implications, co-management workload requirements, and any DC connectivity or hardware prerequisites."
}`;
  }

  if (action === 'first-article-guidance') {
    return `As a DW SA, define first article requirements and acceptance criteria for this engagement.

Customer Technical Profile:
${profileSummary}
${modeNote}${uvFields}

Deployment Model Selected:
- Image Type: ${(deploymentRecommendation as Record<string, unknown>)?.imageType}
- Provisioning Model: ${(deploymentRecommendation as Record<string, unknown>)?.provisioningModel}
- Autopilot Profile: ${(readinessCheck as Record<string, unknown>)?.autopilotProfileType ?? 'not specified'}
- Entra Join Type: ${(customerProfile as Record<string, unknown>)?.entraJoinType}

Engagement Status:
- Customer IT POC Confirmed: ${(engagementTriggers as Record<string, unknown>)?.customerItPocConfirmed}
- TSC Alignment Scheduled: ${(engagementTriggers as Record<string, unknown>)?.tscAlignmentScheduled}
- Cloud Services Engaged: ${(engagementTriggers as Record<string, unknown>)?.cloudServicesEngaged}

Generate technically specific validation criteria that the SA can hand to TSC as a written acceptance checklist.
Include criteria specific to the Autopilot profile type and Entra join type.

Respond with JSON in this exact schema:
{
  "message": "SA-facing guidance on the first article process and what the SA is responsible for defining",
  "validationCriteria": ["technically specific criterion 1", "criterion 2", "criterion 3"],
  "guidance": "Detailed SA guidance: what to specify to TSC, what to validate personally, what constitutes pass/fail for this specific deployment model and join type"
}`;
  }

  if (action === 'generate-roadmap') {
    return `As a DW SA, generate a complete Digital Workplace deployment roadmap for this engagement.

Customer Technical Profile:
${profileSummary}
${modeNote}${uvFields}

Readiness:
- Autopilot Production-Active: ${(readinessCheck as Record<string, unknown>)?.autopilotReady}
- Autopilot Profile Type: ${(readinessCheck as Record<string, unknown>)?.autopilotProfileType ?? 'not specified'}
- Intune Compliance: ${(readinessCheck as Record<string, unknown>)?.intuneReady}

Deployment Model:
- Image Type: ${(deploymentRecommendation as Record<string, unknown>)?.imageType}
- Provisioning: ${(deploymentRecommendation as Record<string, unknown>)?.provisioningModel}

Engagement Status:
- Customer IT POC Confirmed: ${(engagementTriggers as Record<string, unknown>)?.customerItPocConfirmed}
- TSC Alignment: ${(engagementTriggers as Record<string, unknown>)?.tscAlignmentScheduled}
- Cloud Services: ${(engagementTriggers as Record<string, unknown>)?.cloudServicesEngaged}

First Article:
- Required: ${(firstArticle as Record<string, unknown>)?.required}
- Test Order Needed: ${(firstArticle as Record<string, unknown>)?.testOrderNeeded}
- Validation Criteria: ${JSON.stringify((firstArticle as Record<string, unknown>)?.validationCriteria)}

${Array.isArray(unvalidatedFields) && unvalidatedFields.length > 0
  ? `IMPORTANT: Generate required roadmap steps in Pre-Sales Alignment phase for each unvalidated field: ${(unvalidatedFields as string[]).join(', ')}. These steps must have status "required", owner "SA", and action text starting with "CONFIRM BEFORE ORDERING:".`
  : ''}

Owner values must be exactly one of: "SA", "TSC", "Cloud Services", "Customer", "Account Team"

Respond with JSON in this exact schema:
{
  "message": "Executive technical summary for the SA — 2-3 sentences on engagement readiness and key risks",
  "roadmap": {
    "steps": [
      {
        "id": "unique-id",
        "phase": "Discovery | Pre-Sales Alignment | First Article | Production Scale | Ongoing",
        "action": "Specific action with technically precise description",
        "owner": "SA | TSC | Cloud Services | Customer | Account Team",
        "timeline": "e.g. Week 1, Days 1-3, Month 2",
        "status": "required | recommended | complete",
        "sowRelevant": true | false
      }
    ],
    "sowReady": true | false,
    "sowReadinessScore": 0-100,
    "aiSummary": "2-3 sentence SA-facing SOW readiness assessment with specific next steps",
    "generatedAt": "${new Date().toISOString()}"
  }
}`;
  }

  return `Provide SA-level technical guidance for this Digital Workplace engagement. Context: ${JSON.stringify(body)}`;
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

    const completion = await client.chat.completions.create({
      model: deployment,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(body) },
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
