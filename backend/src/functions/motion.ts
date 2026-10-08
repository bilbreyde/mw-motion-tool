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
5. STEP 2 READINESS GATE — these are the official Zones Digital Workplace qualification criteria for Autopilot pre-provisioning. ALL EIGHT must be Yes to qualify for a standard provisioning motion:
   (1) Is the Autopilot deployment process documented and repeatable?
   (2) Is Intune production-ready?
   (3) Is Autopilot configured and tested?
   (4) Are enrollment profiles defined?
   (5) Are Group Tags defined?
   (6) Are required applications packaged and tested?
   (7) Has a first-article deployment been planned?
   (8) Has ownership been assigned for ongoing Intune management?
   If ANY of the eight is No, the engagement exits early and does not advance to deployment scoping. No exceptions — do not scope provisioning services until every gap is remediated.
6. The SA's role is to define the technical scope, validate the environment, and hand off to TSC for execution — not to manage deployment operations directly.

ZONES SERVICE PORTFOLIO:
- TSC Provisioning: Zones' technical staging and configuration service. Required for all Clean Image and Autopilot Pre-Provisioning engagements.
- Zones Clean Image: SA-specified, TSC-built Windows image. Includes Autopilot OOBE configuration, application baseline, policy application, and enrollment profile assignment.
- Digital Workplace Pro Services: Readiness engagements — Autopilot configuration, Intune environment builds, co-management workload migration, Hybrid Entra ID Join (HEID) configuration.
- Cloud Services: Microsoft licensing validation — Intune Plan 1 vs P2, Entra ID P1/P2, M365 SKU optimization.
- MDM Managed Services: Post-deployment Intune management.

TECHNICAL CONTEXT AWARENESS:
- Hybrid Entra ID Join (HEID) deployments require domain controller connectivity during the Autopilot technician phase (Pre-Provisioning). Always flag DC line-of-sight requirements when Hybrid Entra ID Join is the join type.
- Co-managed environments (MECM (SCCM) + Intune): confirm compliance and device configuration workloads are shifted to Intune before recommending Autopilot as the provisioning path.
- Pre-Provisioning (Technician Phase) is the preferred provisioningModel recommendation when Autopilot is configured and tested, applications are packaged and tested, and the order is being placed through Zones.
- Self-Deploying Autopilot profiles require TPM 2.0 and cannot be used with user-assigned profiles — confirm hardware compatibility.
- User-Driven Hybrid Entra ID Join requires the Intune Connector for Active Directory and a service account with domain join permissions configured in the Zones staging environment.

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

const PRO_SERVICES_SYSTEM_PROMPT = `You are a Digital Workplace Solution Architect (DW SA) AI for Zones LLC. You support Zones DW SAs scoping Autopilot/Intune Professional Services engagements. The user of this tool is always a Zones SA, speaking to you as a peer — use accurate Microsoft product names and configuration terminology.

ZONES AUTOPILOT/INTUNE LOE FRAMEWORK (Zones SA team) — follow it exactly:

Assessment only:
- Under 250 devices: 1 week
- 251-1000 devices: 40-60 hours
- 1001-5000 devices: 2 weeks

Greenfield / Migration (ADIM — Assess, Design, Implement, Migrate):
- Assessment + Design: up to 1000 devices = 2 weeks; larger = 3-4 weeks
- Medium complexity only: out-of-box configuration, no custom integrations or custom CSP profiles
- Custom integrations or custom CSP profiles escalate to high complexity — these are flagged for SA review and never estimated

HOW THE TOOL USES YOUR OUTPUT:
- The tool applies the fixed Assessment / Assessment + Design durations above itself. Do not re-estimate them.
- For Greenfield and Migration, you estimate the Implement (and, for Migration, Migrate) baseline hours for each of the ten configuration areas, as if the area were Not Started, at medium complexity.
- The tool then applies status reductions per area: Complete −80%, In Progress −40%, Not Started full LOE. Do NOT apply these reductions yourself — always return the full Not Started baseline.
- For Assessment only, return an empty areaLines array; your message, assumptions, and risks describe what the assessment will cover.

ESTIMATION FACTORS:
- Device count and OS landscape: each additional platform (macOS, iOS, Android, Linux) adds platform-specific enrollment, compliance, and configuration profiles.
- Migration: account for policy translation from the source MDM, re-enrollment / wipe-and-reload strategy, and coexistence during cutover.
- Multi-tenant: tenant-scoped configuration repeats per tenant — raise affected areas and say so in assumptions.
- Third-party application packaging: raises the appPackaging area materially.
- Co-management, hybrid join, or on-prem dependencies noted in environment notes raise identityJoin and networkVpn.
- Unvalidated fields: assume the conservative (higher) end and state the assumption explicitly.
- Keep each baseline range realistic for experienced Intune engineers; low and high should differ by no more than about 50%.

Return valid JSON matching the requested schema exactly.`;

const CONFIG_AREA_LABELS: [string, string][] = [
  ['intuneTenant', 'Intune tenant configuration'],
  ['autopilotProfiles', 'Autopilot profiles and deployment'],
  ['esp', 'Enrollment Status Pages (ESP)'],
  ['groupTags', 'Group Tags and device groups'],
  ['appPackaging', 'Application packaging and testing'],
  ['securityBaselines', 'Security baselines and compliance policies'],
  ['conditionalAccess', 'Conditional Access policies'],
  ['deviceCompliance', 'Device compliance policies'],
  ['networkVpn', 'Network and VPN configuration'],
  ['identityJoin', 'Identity and Entra ID / directory join configuration'],
];

// Mirrors the frontend rule: custom integrations or custom CSP profiles on a Greenfield /
// Migration engagement are high complexity and must not receive an AI LOE.
function isHighComplexity(proServices: Record<string, unknown> | undefined): boolean {
  if (!proServices) return false;
  const adim = proServices.engagementType === 'greenfield' || proServices.engagementType === 'migration';
  return adim && (proServices.customIntegrations === true || proServices.customCspProfiles === true);
}

function buildLoePrompt(body: Record<string, unknown>, modeNote: string, uvFields: string): string {
  const ps = (body.proServices ?? {}) as Record<string, unknown>;
  const status = (ps.configStatus ?? {}) as Record<string, unknown>;
  const uv = Array.isArray(body.unvalidatedFields) ? body.unvalidatedFields as string[] : [];
  const statusLines = CONFIG_AREA_LABELS
    .map(([key, label]) => {
      const flagged = uv.includes(`proServices.configStatus.${key}`);
      return `- ${key} (${label}): ${flagged ? 'UNVALIDATED (tool treats as not-started)' : status[key] ?? 'not answered'}`;
    })
    .join('\n');
  const adim = ps.engagementType === 'greenfield' || ps.engagementType === 'migration';

  return `As a DW SA, produce the LOE inputs for this Autopilot/Intune Professional Services engagement.

Engagement type: ${ps.engagementType}
Device count: ${ps.deviceCount}
Current MDM platform(s): ${JSON.stringify(ps.currentMdm)}
OS landscape: ${JSON.stringify(ps.osLandscape)}
Environment notes: ${ps.environmentNotes || '(none)'}
${modeNote}${uvFields}

Configuration status by area:
${statusLines}

Complexity indicators:
- Custom integrations required: ${ps.customIntegrations}
- Custom CSP profile requirements: ${ps.customCspProfiles}
- Multi-tenant requirements: ${ps.multiTenant}
- Third-party application packaging: ${ps.thirdPartyAppPackaging}

${adim
  ? `Return one areaLines entry for EACH of the ten area keys above (${CONFIG_AREA_LABELS.map(([k]) => k).join(', ')}), with full Not Started baseline hours for ${ps.engagementType === 'migration' ? 'Implement + Migrate' : 'Implement'}.`
  : 'This is an Assessment-only engagement: return "areaLines": [].'}

Respond with JSON in this exact schema:
{
  "message": "2-4 sentence SA-facing summary of the estimate basis and the main effort drivers",
  "areaLines": [
    { "area": "one of the ten area keys", "baseHoursLow": number, "baseHoursHigh": number, "rationale": "one short sentence on what drives this area's effort" }
  ],
  "assumptions": ["explicit scoping assumption", "..."],
  "risks": ["risk or item the SA must validate before pricing", "..."]
}`;
}

const READINESS_GATE_LABELS: [string, string][] = [
  ['autopilotProcessDocumented', 'Is the Autopilot deployment process documented and repeatable?'],
  ['intuneProductionReady', 'Is Intune production-ready?'],
  ['autopilotConfiguredTested', 'Is Autopilot configured and tested?'],
  ['enrollmentProfilesDefined', 'Are enrollment profiles defined?'],
  ['groupTagsDefined', 'Are Group Tags defined?'],
  ['applicationsPackagedTested', 'Are required applications packaged and tested?'],
  ['firstArticlePlanned', 'Has a first-article deployment been planned?'],
  ['ownershipAssigned', 'Has ownership been assigned for ongoing Intune management?'],
];

function formatReadinessGates(readinessCheck: Record<string, unknown> | undefined): string {
  if (!readinessCheck) return '- (no readiness data provided)';
  return READINESS_GATE_LABELS
    .map(([key, label]) => `- ${label} ${readinessCheck[key]}`)
    .join('\n');
}

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

  if (action === 'estimate-loe') {
    return buildLoePrompt(body, modeNote, uvFields);
  }

  if (action === 'recommend-deployment') {
    return `As a DW SA, recommend the optimal deployment model for this customer based on the technical discovery.

Customer Technical Profile:
${profileSummary}
${modeNote}${uvFields}

Readiness Status (Step 2 — 8-gate qualification):
${formatReadinessGates(readinessCheck as Record<string, unknown>)}
- Autopilot Profile Type: ${(readinessCheck as Record<string, unknown>)?.autopilotProfileType ?? 'not specified'}

Consider the Entra join type, co-management status, and Autopilot profile type in your recommendation.
Flag any technical risks or prerequisites that must be addressed before this deployment model can be executed.

Respond with JSON in this exact schema:
{
  "message": "Technical recommendation summary for the SA — include specific rationale referencing entraJoinType, coManagementStatus, and autopilotProfileType",
  "imageType": "clean-image" | "oem-ready",
  "provisioningModel": "pre-provisioning" | "user-driven",
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

Readiness Status (Step 2 — 8-gate qualification):
${formatReadinessGates(readinessCheck as Record<string, unknown>)}

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

Readiness Status (Step 2 — 8-gate qualification):
${formatReadinessGates(readinessCheck as Record<string, unknown>)}
- Autopilot Profile Type: ${(readinessCheck as Record<string, unknown>)?.autopilotProfileType ?? 'not specified'}

Deployment Model:
- Image Type: ${(deploymentRecommendation as Record<string, unknown>)?.imageType}
- Provisioning: ${(deploymentRecommendation as Record<string, unknown>)?.provisioningModel}

Engagement Status:
- Customer IT POC Confirmed: ${(engagementTriggers as Record<string, unknown>)?.customerItPocConfirmed}
- TSC Alignment: ${(engagementTriggers as Record<string, unknown>)?.tscAlignmentScheduled}
- Cloud Services: ${(engagementTriggers as Record<string, unknown>)?.cloudServicesEngaged}

First Article:
- Required: Always required — non-negotiable Zones Digital Workplace policy
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

    if (body.action === 'estimate-loe' && isHighComplexity(body.proServices as Record<string, unknown> | undefined)) {
      return {
        status: 422,
        jsonBody: { error: 'High complexity engagement (custom integrations or custom CSP profiles) — flagged for SA review; no LOE generated.' },
        headers: corsHeaders(),
      };
    }

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
        { role: 'system', content: body.action === 'estimate-loe' ? PRO_SERVICES_SYSTEM_PROMPT : SYSTEM_PROMPT },
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
