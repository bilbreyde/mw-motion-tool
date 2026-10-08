import type {
  ConfigAreaKey, ConfigStatus, CustomerProfile, ProServicesState, PsDeviceCount, PsEngagementType,
} from '../../types';
import { isFieldAnswered } from '../../types';

export const PS_ENGAGEMENT_TYPES: { value: PsEngagementType; label: string; sublabel: string }[] = [
  { value: 'assessment', label: 'Assessment Only', sublabel: 'Evaluate the current Intune/Autopilot environment and deliver findings and recommendations' },
  { value: 'greenfield', label: 'Greenfield Implementation', sublabel: 'Net-new Intune/Autopilot build — Assess, Design, Implement' },
  { value: 'migration', label: 'Migration from Another MDM', sublabel: 'Move devices and configuration from an existing MDM to Intune — Assess, Design, Implement, Migrate' },
];

export const PS_DEVICE_COUNTS: { value: PsDeviceCount; label: string }[] = [
  { value: 'under-250', label: 'Under 250 devices' },
  { value: '251-1000', label: '251 – 1,000 devices' },
  { value: '1001-5000', label: '1,001 – 5,000 devices' },
  { value: '5000+', label: '5,000+ devices' },
];

export const CONFIG_STATUS_OPTIONS: { value: ConfigStatus; label: string; variant: 'yes' | 'warn' | 'accent' }[] = [
  { value: 'complete', label: 'Complete', variant: 'yes' },
  { value: 'in-progress', label: 'In Progress', variant: 'warn' },
  { value: 'not-started', label: 'Not Started', variant: 'accent' },
];

export interface ConfigArea {
  key: ConfigAreaKey;
  label: string;
  // What the SA should look at when deciding the status.
  guidance: string;
  // Noun phrase used to build the "What Zones will deliver" requirements-table text.
  scope: string;
}

export const CONFIG_AREAS: ConfigArea[] = [
  {
    key: 'intuneTenant',
    label: 'Intune tenant configuration',
    guidance: 'MDM authority, license assignment, RBAC roles and scope tags, enrollment restrictions, tenant-wide settings.',
    scope: 'the Intune tenant baseline (MDM authority, licensing, RBAC roles and scope tags, enrollment restrictions)',
  },
  {
    key: 'autopilotProfiles',
    label: 'Autopilot profiles and deployment',
    guidance: 'Deployment profiles created and assigned, hardware hash import process, OOBE settings tested end to end.',
    scope: 'Windows Autopilot deployment profiles, hardware hash import process, and profile assignment',
  },
  {
    key: 'esp',
    label: 'Enrollment Status Pages (ESP)',
    guidance: 'ESP profiles defined, blocking apps selected, timeouts and error behavior agreed.',
    scope: 'Enrollment Status Page profiles (blocking apps, timeouts, and error handling)',
  },
  {
    key: 'groupTags',
    label: 'Group Tags and device groups',
    guidance: 'Group Tag taxonomy documented; Entra ID dynamic device groups built for profile and policy targeting.',
    scope: 'the Group Tag taxonomy and Entra ID dynamic device groups for profile and policy targeting',
  },
  {
    key: 'appPackaging',
    label: 'Application packaging and testing',
    guidance: 'Required apps packaged (Win32 / MSIX / Store), assigned in Intune, and validated during OOBE / ESP.',
    scope: 'application packaging (Win32 / MSIX / Store), Intune assignment, and install validation during OOBE / ESP',
  },
  {
    key: 'securityBaselines',
    label: 'Security baselines and compliance policies',
    guidance: 'Intune security baselines and endpoint security policies (BitLocker, Defender, firewall) deployed.',
    scope: 'Intune security baselines and endpoint security policies (BitLocker, Microsoft Defender, firewall)',
  },
  {
    key: 'conditionalAccess',
    label: 'Conditional Access policies',
    guidance: 'Entra ID Conditional Access policies requiring compliant / joined devices, with exclusions documented.',
    scope: 'Entra ID Conditional Access policies enforcing device compliance and app protection',
  },
  {
    key: 'deviceCompliance',
    label: 'Device compliance policies',
    guidance: 'Per-platform compliance policies, noncompliance actions, and grace periods defined.',
    scope: 'per-platform device compliance policies, noncompliance actions, and grace periods',
  },
  {
    key: 'networkVpn',
    label: 'Network and VPN configuration',
    guidance: 'Wi-Fi, VPN, certificate (SCEP / PKCS), and proxy profiles needed for device connectivity.',
    scope: 'Wi-Fi, VPN, certificate (SCEP / PKCS), and proxy profiles required for device connectivity',
  },
  {
    key: 'identityJoin',
    label: 'Identity and Entra ID / directory join configuration',
    guidance: 'Entra ID join or Hybrid Entra ID join configured; Intune Connector for AD in place if hybrid; device registration settings set.',
    scope: 'Entra ID / Hybrid Entra ID join configuration, Intune Connector for Active Directory (if hybrid), and device registration settings',
  },
];

export const configFieldKey = (area: ConfigAreaKey) => `proServices.configStatus.${area}`;

export function isAdim(type: PsEngagementType | null): boolean {
  return type === 'greenfield' || type === 'migration';
}

export function statusLabel(status: ConfigStatus | null, unvalidated: boolean): string {
  if (unvalidated) return 'Unvalidated';
  return CONFIG_STATUS_OPTIONS.find(o => o.value === status)?.label ?? '—';
}

// Requirements-table "What Zones will deliver" text. Deterministic so the SOW exhibit reads the
// same for the same answers; an unvalidated status is scoped as Not Started (worst case).
export function deliverableFor(area: ConfigArea, type: PsEngagementType | null, status: ConfigStatus | null, unvalidated: boolean): string {
  const effective: ConfigStatus = unvalidated || status === null ? 'not-started' : status;
  let text: string;

  if (type === 'assessment') {
    text = {
      'complete': `Assess existing ${area.scope} against Microsoft recommended practice; document findings and recommendations.`,
      'in-progress': `Assess in-flight ${area.scope}; document remaining gaps and recommendations to complete.`,
      'not-started': `Gather requirements and document a recommended design for ${area.scope}.`,
    }[effective];
  } else {
    text = {
      'complete': `Validate existing ${area.scope} against the target design; remediate gaps identified during assessment.`,
      'in-progress': `Complete design and implementation of ${area.scope}; validate and document as-built configuration.`,
      'not-started': `Design, implement, and validate ${area.scope}; document as-built configuration.`,
    }[effective];
    if (type === 'migration' && effective !== 'complete') {
      text += ' Includes translation of equivalent settings from the source MDM.';
    }
  }

  if (unvalidated) text += ' Status unvalidated — scope assumes full delivery until confirmed with customer.';
  return text;
}

// Labels for the unvalidated-items list on the output step.
export const PS_FIELD_LABELS: Record<string, string> = {
  'proServices.deviceCount': 'Device count',
  'proServices.currentMdm': 'Current MDM platform',
  'proServices.osLandscape': 'OS landscape',
  'proServices.customIntegrations': 'Custom integrations required',
  'proServices.customCspProfiles': 'Custom CSP profile requirements',
  'proServices.multiTenant': 'Multi-tenant requirements',
  'proServices.thirdPartyAppPackaging': 'Third-party application packaging',
  ...Object.fromEntries(CONFIG_AREAS.map(a => [configFieldKey(a.key), `Configuration status — ${a.label}`])),
};

export function psCompletedSteps(profile: CustomerProfile, ps: ProServicesState, uv: string[], loeBlocked: boolean): Set<number> {
  const answered = (val: unknown, key: string) => isFieldAnswered(val, key, uv);
  const completed = new Set<number>();

  if (isPsStep1Complete(profile, ps)) completed.add(1);
  if (
    answered(ps.deviceCount, 'proServices.deviceCount') &&
    answered(ps.currentMdm, 'proServices.currentMdm') &&
    answered(ps.osLandscape, 'proServices.osLandscape')
  ) completed.add(2);
  if (CONFIG_AREAS.every(a => answered(ps.configStatus[a.key], configFieldKey(a.key)))) completed.add(3);
  if (
    answered(ps.customIntegrations, 'proServices.customIntegrations') &&
    answered(ps.customCspProfiles, 'proServices.customCspProfiles') &&
    answered(ps.multiTenant, 'proServices.multiTenant') &&
    answered(ps.thirdPartyAppPackaging, 'proServices.thirdPartyAppPackaging')
  ) completed.add(4);
  if (ps.loe.generatedAt || loeBlocked) completed.add(5);

  return completed;
}

export function isPsStep1Complete(profile: CustomerProfile, ps: ProServicesState): boolean {
  return (
    profile.customerName.trim().length > 0 &&
    profile.opportunityNumber.trim().length > 0 &&
    profile.saName.trim().length > 0 &&
    profile.sellerName.trim().length > 0 &&
    ps.engagementType !== null
  );
}
