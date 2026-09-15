import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { MotionState } from '../types';
import {
  INDUSTRIES, OS_OPTIONS, ENTRA_JOIN_TYPES, CO_MGMT_OPTIONS, MDM_PLATFORMS,
  DEVICE_VOLUMES, TIMELINES, INTUNE_AUTOPILOT_OWNERS, DEPLOYMENT_MODEL_TYPES,
} from './steps/Step1_CustomerProfile';
import { AUTOPILOT_PROFILES } from './steps/Step2_ReadinessGate';
import { IMAGE_OPTIONS, PROVISIONING_OPTIONS } from './steps/Step3_DeploymentModel';
import { DEVICE_IMPORT_METHODS, ENROLLMENT_HANDLERS, SHIP_TO_LOCATIONS } from './steps/Step4_EngagementTriggers';

interface Props {
  state: MotionState;
}

interface Option<T extends string> {
  value: T;
  label: string;
}

function labelFor<T extends string>(options: Option<T>[], value: T | null): string {
  if (value === null) return '—';
  return options.find(o => o.value === value)?.label ?? value;
}

function labelForMany<T extends string>(options: Option<T>[], values: T[]): string {
  if (values.length === 0) return '—';
  return values.map(v => options.find(o => o.value === v)?.label ?? v).join(', ');
}

function boolText(v: boolean | null): string {
  return v === null ? '—' : v ? 'Yes' : 'No';
}

function textOrDash(v: string): string {
  return v.trim() ? v : '—';
}

function GateRow({ label, value, flagged }: { label: string; value: boolean | null; flagged: boolean }) {
  const tone = flagged ? '' : value === true ? 'checklist-pass' : value === false ? 'checklist-fail' : 'checklist-unset';
  const text = flagged ? 'UNVALIDATED' : value === true ? 'PASS' : value === false ? 'FAIL' : 'NOT ANSWERED';
  return (
    <tr>
      <td className="checklist-q">{label}</td>
      <td className={`checklist-a ${tone}`}>{text}</td>
    </tr>
  );
}

function Row({ label, value, flagged }: { label: string; value: ReactNode; flagged: boolean }) {
  return (
    <tr>
      <td className="checklist-q">{label}</td>
      <td className="checklist-a">
        {value}
        {flagged && <div className="checklist-flag">CONFIRM BEFORE ORDERING</div>}
      </td>
    </tr>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="checklist-section">
      <div className="checklist-section-title">{title}</div>
      <table className="checklist-table">
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function ChecklistPrintView({ state }: Props) {
  const { customerProfile: p, readinessCheck: r, deploymentRecommendation: d, engagementTriggers: e, firstArticle: f, roadmapOutput: rm, discoveryMode, unvalidatedFields } = state;
  const uv = (key: string) => unvalidatedFields.includes(key);

  const gateFields: [string, boolean | null, string][] = [
    ['1. Is Microsoft Intune currently deployed and managing production devices?', r.intuneDeployedProduction, 'readinessCheck.intuneDeployedProduction'],
    ['2. Is Windows Autopilot configured and tested in production?', r.autopilotConfiguredTestedProd, 'readinessCheck.autopilotConfiguredTestedProd'],
    ['3. Have devices been successfully deployed using Autopilot before?', r.autopilotDeployedBefore, 'readinessCheck.autopilotDeployedBefore'],
    ['4. Is the Autopilot deployment process documented and repeatable?', r.autopilotProcessDocumented, 'readinessCheck.autopilotProcessDocumented'],
    ['5. Is Intune production-ready?', r.intuneProductionReady, 'readinessCheck.intuneProductionReady'],
    ['6. Is Autopilot configured and tested?', r.autopilotConfiguredTested, 'readinessCheck.autopilotConfiguredTested'],
    ['7. Are enrollment profiles defined?', r.enrollmentProfilesDefined, 'readinessCheck.enrollmentProfilesDefined'],
    ['8. Are Group Tags defined?', r.groupTagsDefined, 'readinessCheck.groupTagsDefined'],
    ['9. Are required applications packaged and tested?', r.applicationsPackagedTested, 'readinessCheck.applicationsPackagedTested'],
    ['10. Has a first-article deployment been planned?', r.firstArticlePlanned, 'readinessCheck.firstArticlePlanned'],
    ['11. Has ownership been assigned for ongoing Intune management?', r.ownershipAssigned, 'readinessCheck.ownershipAssigned'],
  ];
  const gatesPassed = gateFields.every(([, v, k]) => v === true || uv(k));

  const content = (
    <div id="checklist-print-root">
      <div className="checklist-doc">
        <div className="checklist-header">
          <div className="checklist-brand">Zones Digital Workplace</div>
          <h1>Validation Criteria Checklist</h1>
        </div>

        <div className="checklist-meta-grid">
          <div className="checklist-meta-item">
            <div className="meta-label">Customer</div>
            <div className="meta-value">{textOrDash(p.customerName)}</div>
          </div>
          <div className="checklist-meta-item">
            <div className="meta-label">Opportunity #</div>
            <div className="meta-value">{textOrDash(p.opportunityNumber)}</div>
          </div>
          <div className="checklist-meta-item">
            <div className="meta-label">Date</div>
            <div className="meta-value">{new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}</div>
          </div>
          <div className="checklist-meta-item">
            <div className="meta-label">SA Name</div>
            <div className="meta-value">{textOrDash(p.saName)}</div>
          </div>
          <div className="checklist-meta-item">
            <div className="meta-label">Seller Name</div>
            <div className="meta-value">{textOrDash(p.sellerName)}</div>
          </div>
          <div className="checklist-meta-item">
            <div className="meta-label">Discovery Mode</div>
            <div className="meta-value">{discoveryMode === 'validation' ? 'Validation' : 'Live'}</div>
          </div>
        </div>

        {unvalidatedFields.length > 0 && (
          <div className="checklist-callout">
            {unvalidatedFields.length} item{unvalidatedFields.length > 1 ? 's' : ''} flagged unvalidated below — confirm with customer IT team before any device order.
          </div>
        )}

        <Section title="Step 2 — Readiness Gate (Go / No-Go)">
          {gateFields.map(([label, value, key]) => (
            <GateRow key={key} label={label} value={value} flagged={uv(key)} />
          ))}
          <tr>
            <td className="checklist-q"><strong>Overall Gate Result</strong></td>
            <td className={`checklist-a ${gatesPassed ? 'checklist-pass' : 'checklist-fail'}`}>
              <strong>{gatesPassed ? 'PASS' : 'FAIL — ROUTE TO PRO SERVICES'}</strong>
            </td>
          </tr>
        </Section>

        <Section title="Current Environment">
          <Row label="Industry Vertical" value={labelFor(INDUSTRIES, p.industry)} flagged={uv('customerProfile.industry')} />
          <Row label="Primary OS Platform" value={labelForMany(OS_OPTIONS, p.primaryOs)} flagged={uv('customerProfile.primaryOs')} />
          <Row label="Entra ID / Directory Join Type" value={labelFor(ENTRA_JOIN_TYPES, p.entraJoinType)} flagged={uv('customerProfile.entraJoinType')} />
          <Row label="Co-management / ConfigMgr Status" value={labelFor(CO_MGMT_OPTIONS, p.coManagementStatus)} flagged={uv('customerProfile.coManagementStatus')} />
          <Row label="MDM Platform(s)" value={labelForMany(MDM_PLATFORMS, p.mdmPlatform)} flagged={uv('customerProfile.mdmPlatform')} />
          <Row label="Total Devices / Year (In Scope)" value={labelFor(DEVICE_VOLUMES, p.deviceVolume)} flagged={uv('customerProfile.deviceVolume')} />
          <Row label="Target Deployment Timeline" value={labelFor(TIMELINES, p.deploymentTimeline)} flagged={uv('customerProfile.deploymentTimeline')} />
          <Row label="Intune/Autopilot environment owner" value={labelFor(INTUNE_AUTOPILOT_OWNERS, p.intuneAutopilotOwner)} flagged={uv('customerProfile.intuneAutopilotOwner')} />
        </Section>

        <Section title="Autopilot Configuration">
          <Row label="Autopilot deployment profile type" value={labelFor(AUTOPILOT_PROFILES, r.autopilotProfileType)} flagged={false} />
          <Row label="Deployment profiles created and validated?" value={boolText(r.deploymentProfilesValidated)} flagged={uv('readinessCheck.deploymentProfilesValidated')} />
          <Row label="Device groups / dynamic assignments configured?" value={boolText(r.deviceGroupsConfigured)} flagged={uv('readinessCheck.deviceGroupsConfigured')} />
          <Row label="Group Tags required for deployment?" value={boolText(r.groupTagsRequired)} flagged={uv('readinessCheck.groupTagsRequired')} />
          <Row label="Enrollment Status Page (ESP) configured?" value={boolText(r.espConfigured)} flagged={uv('readinessCheck.espConfigured')} />
          <Row label="Verified no enrollment restrictions / Conditional Access impact?" value={boolText(r.enrollmentRestrictionsVerifiedClean)} flagged={uv('readinessCheck.enrollmentRestrictionsVerifiedClean')} />
          {r.enrollmentRestrictionsVerifiedClean === false && (
            <Row label="Enrollment restriction detail" value={textOrDash(r.enrollmentRestrictionsDetail)} flagged={false} />
          )}
        </Section>

        <Section title="Deployment Model">
          <Row label="Image type" value={labelFor(IMAGE_OPTIONS, d.imageType)} flagged={false} />
          <Row label="Provisioning model" value={labelFor(PROVISIONING_OPTIONS, d.provisioningModel)} flagged={false} />
        </Section>

        <Section title="Application Readiness">
          <Row label="Pre-provisioning software list" value={textOrDash(d.preProvisioningSoftwareList)} flagged={uv('deploymentRecommendation.preProvisioningSoftwareList')} />
          <Row label="Verified all application install times acceptable?" value={boolText(d.appsInstallTimesAcceptable)} flagged={uv('deploymentRecommendation.appsInstallTimesAcceptable')} />
          {d.appsInstallTimesAcceptable === false && (
            <Row label="Lengthy-install application detail" value={textOrDash(d.appsWithLengthyInstallDetail)} flagged={false} />
          )}
          <Row label="Verified no credential-dependent applications?" value={boolText(d.appsNoCredentialDependency)} flagged={uv('deploymentRecommendation.appsNoCredentialDependency')} />
          {d.appsNoCredentialDependency === false && (
            <Row label="Credential-dependent application detail" value={textOrDash(d.appsDependOnUserCredsDetail)} flagged={false} />
          )}
        </Section>

        <Section title="Device Configuration">
          <Row label="Device policies required before shipment" value={textOrDash(d.devicePoliciesRequired)} flagged={uv('deploymentRecommendation.devicePoliciesRequired')} />
          <Row label="Windows updates required during pre-provisioning?" value={boolText(d.windowsUpdatesRequiredPreProvisioning)} flagged={uv('deploymentRecommendation.windowsUpdatesRequiredPreProvisioning')} />
          <Row label="VPN / security agents / EDR required before shipment?" value={boolText(d.vpnSecurityAgentsRequired)} flagged={uv('deploymentRecommendation.vpnSecurityAgentsRequired')} />
          {d.vpnSecurityAgentsRequired === true && (
            <Row label="VPN / security agent detail" value={textOrDash(d.vpnSecurityAgentsDetail)} flagged={false} />
          )}
          <Row label="Hardware models validated against Intune config?" value={boolText(d.hardwareModelsValidated)} flagged={uv('deploymentRecommendation.hardwareModelsValidated')} />
        </Section>

        <Section title="Engagement Prerequisites">
          <Row label="Customer IT stakeholder confirmed?" value={boolText(e.customerItPocConfirmed)} flagged={uv('engagementTriggers.customerItPocConfirmed')} />
          <Row label="TSC alignment call scheduled / complete?" value={boolText(e.tscAlignmentScheduled)} flagged={uv('engagementTriggers.tscAlignmentScheduled')} />
          <Row label="Cloud Services licensing review engaged?" value={boolText(e.cloudServicesEngaged)} flagged={uv('engagementTriggers.cloudServicesEngaged')} />
        </Section>

        <Section title="Ordering & Enrollment">
          <Row label="Device import method into Autopilot" value={labelFor(DEVICE_IMPORT_METHODS, e.deviceImportMethod)} flagged={uv('engagementTriggers.deviceImportMethod')} />
          <Row label="Enrollment handled by" value={labelFor(ENROLLMENT_HANDLERS, e.enrollmentHandledBy)} flagged={uv('engagementTriggers.enrollmentHandledBy')} />
          <Row label="Device-associated info (Group Tag, PO, Order ID)" value={textOrDash(e.deviceAssociatedInfo)} flagged={uv('engagementTriggers.deviceAssociatedInfo')} />
        </Section>

        <Section title="Deployment Logistics">
          <Row label="Ship-to location(s)" value={labelForMany(SHIP_TO_LOCATIONS, e.shipToLocation)} flagged={uv('engagementTriggers.shipToLocation')} />
          <Row label="Adult signature required?" value={boolText(e.adultSignatureRequired)} flagged={uv('engagementTriggers.adultSignatureRequired')} />
          <Row label="Asset tags / BIOS / custom packaging required?" value={boolText(e.assetTagsBiosCustomPackaging)} flagged={uv('engagementTriggers.assetTagsBiosCustomPackaging')} />
          {e.assetTagsBiosCustomPackaging === true && (
            <Row label="Asset tag / BIOS / packaging detail" value={textOrDash(e.assetTagsBiosCustomPackagingDetail)} flagged={false} />
          )}
          <Row label="Regional / international requirements?" value={boolText(e.regionalInternationalRequirements)} flagged={uv('engagementTriggers.regionalInternationalRequirements')} />
          {e.regionalInternationalRequirements === true && (
            <Row label="Regional / international detail" value={textOrDash(e.regionalInternationalRequirementsDetail)} flagged={false} />
          )}
        </Section>

        <Section title="User Experience">
          <Row label="Desired first-login experience" value={textOrDash(p.desiredFirstLoginExperience)} flagged={uv('customerProfile.desiredFirstLoginExperience')} />
          <Row label="Immediate productivity required?" value={boolText(p.immediateProductivityRequired)} flagged={uv('customerProfile.immediateProductivityRequired')} />
          <Row label="Day-one required applications" value={textOrDash(p.day1RequiredApps)} flagged={uv('customerProfile.day1RequiredApps')} />
          <Row label="Acceptable deployment time" value={textOrDash(p.acceptableDeploymentTime)} flagged={uv('customerProfile.acceptableDeploymentTime')} />
          <Row label="Current process issues" value={textOrDash(p.currentProcessIssues)} flagged={uv('customerProfile.currentProcessIssues')} />
        </Section>

        <Section title="Scale & Planning">
          <Row label="Devices per month/quarter" value={textOrDash(p.devicesPerMonthQuarter)} flagged={uv('customerProfile.devicesPerMonthQuarter')} />
          <Row label="Deployment model type" value={labelForMany(DEPLOYMENT_MODEL_TYPES, p.deploymentModelType)} flagged={uv('customerProfile.deploymentModelType')} />
          <Row label="Multiple device models involved?" value={boolText(p.multipleDeviceModels)} flagged={uv('customerProfile.multipleDeviceModels')} />
          <Row label="First-article contact" value={textOrDash(p.firstArticleContact)} flagged={uv('customerProfile.firstArticleContact')} />
          <Row label="Pilot success criteria" value={textOrDash(p.pilotSuccessCriteria)} flagged={uv('customerProfile.pilotSuccessCriteria')} />
        </Section>

        <Section title="First Article">
          <Row label="First article required?" value="Always required — non-negotiable" flagged={false} />
          {f.validationCriteria.length > 0 && (
            <Row label="SA-defined validation criteria" value={f.validationCriteria.join('; ')} flagged={false} />
          )}
        </Section>

        {rm.steps.length > 0 && (
          <div className="checklist-section">
            <div className="checklist-section-title">Roadmap Timeline</div>
            <table className="checklist-table">
              <tbody>
                {rm.steps.map(step => (
                  <tr key={step.id}>
                    <td className="checklist-q">{step.phase} — {step.action}</td>
                    <td className="checklist-a">{step.owner} · {step.timeline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="checklist-footer">
          Zones Digital Workplace — Validation Criteria Checklist — Generated {new Date().toLocaleString('en-US')} — For TSC / CSP handoff use only
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
