export type DiscoveryMode = 'live' | 'validation';

export type Industry =
  | 'healthcare'
  | 'financial-services'
  | 'education'
  | 'government'
  | 'manufacturing'
  | 'retail'
  | 'professional-services'
  | 'technology'
  | 'other';

export type EntraJoinType = 'azure-ad-join' | 'hybrid-aadj' | 'ad-ds-only';
export type CoManagementStatus = 'intune-only' | 'co-managed' | 'configmgr-only' | 'none';
export type AutopilotProfileType = 'user-driven-aadj' | 'user-driven-haadj' | 'pre-provisioning' | 'self-deploying';
export type MdmPlatform = 'intune' | 'jamf' | 'workspace-one' | 'none' | 'other';
export type DeviceVolume = '1-50' | '51-250' | '251-1000' | '1000+';
export type DeploymentTimeline = 'immediate' | '1-3months' | '3-6months' | '6months+';
export type PrimaryOs = 'windows' | 'mac' | 'ios' | 'android' | 'linux';
export type ImageType = 'clean-image' | 'oem-ready';
export type ProvisioningModel = 'pre-provisioning' | 'user-driven';
export type Owner = 'SA' | 'TSC' | 'Cloud Services' | 'Customer' | 'Account Team';
export type IntuneAutopilotOwner = 'internal-team' | 'partner' | 'both' | 'not-assigned';
export type DeploymentModelType = 'pilot' | 'refresh' | 'new-hire' | 'ongoing';
export type DeviceImportMethod = 'oem-direct' | 'reseller-csv' | 'partner-center' | 'manual-other';
export type EnrollmentHandledBy = 'oem' | 'zones';
export type ProvisioningTimeAcceptable = 'under-15-min' | '15-30-min' | '30-90-plus-min' | 'unvalidated';
export type ShipToLocation = 'home' | 'office' | 'distribution-center' | 'zones-tsc-hold' | 'international';

export interface CustomerProfile {
  customerName: string;
  opportunityNumber: string;
  saName: string;
  sellerName: string;
  industry: Industry | null;
  primaryOs: PrimaryOs[];
  entraJoinType: EntraJoinType | null;
  coManagementStatus: CoManagementStatus | null;
  mdmPlatform: MdmPlatform[];
  deviceVolume: DeviceVolume | null;
  deploymentTimeline: DeploymentTimeline | null;

  // Category 1 - Intune/Autopilot Ownership
  intuneAutopilotOwner: IntuneAutopilotOwner | null;

  // Category 7 - User Experience Expectations
  desiredFirstLoginExperience: string;
  immediateProductivityRequired: boolean | null;
  day1RequiredApps: string;
  acceptableDeploymentTime: ProvisioningTimeAcceptable | null;
  currentProcessIssues: string;

  // Category 8 - Scale & Operational Planning
  devicesPerMonthQuarter: string;
  deploymentModelType: DeploymentModelType[];
  multipleDeviceModels: boolean | null;
  firstArticleContact: string;
  pilotSuccessCriteria: string;
}

export interface ReadinessCheck {
  // Step 2 Readiness Gate — the 8 official go/no-go questions. ALL must be Yes to proceed;
  // any explicit No exits early to the summary/PDF screen (Steps 3–6 are not reachable).
  autopilotProcessDocumented: boolean | null;
  intuneProductionReady: boolean | null;
  autopilotConfiguredTested: boolean | null;
  enrollmentProfilesDefined: boolean | null;
  groupTagsDefined: boolean | null;
  applicationsPackagedTested: boolean | null;
  firstArticlePlanned: boolean | null;
  ownershipAssigned: boolean | null;

  // Category 2 - Autopilot Configuration (Readiness Gate detail)
  deploymentProfilesValidated: boolean | null;
  deviceGroupsConfigured: boolean | null;
  groupTagsRequired: boolean | null;
  espConfigured: boolean | null;
  // true = SA verified no enrollment restrictions or Conditional Access policies impact provisioning (clean/pass).
  // false = restrictions exist (triggers enrollmentRestrictionsDetail).
  enrollmentRestrictionsVerifiedClean: boolean | null;
  enrollmentRestrictionsDetail: string;

  autopilotProfileType: AutopilotProfileType | null;
  // true once the SA has chosen to exit early from a failed gate to the summary screen.
  routedToProServices: boolean;
}

export interface DeploymentRecommendation {
  imageType: ImageType | null;
  provisioningModel: ProvisioningModel | null;
  aiRationale: string;
  loading: boolean;

  // Category 3 - Application Readiness (pre-provisioning / install-time half)
  preProvisioningSoftwareList: string;
  // true = SA verified all application install times are acceptable (clean/pass).
  // false = one or more applications have lengthy install times (triggers appsWithLengthyInstallDetail).
  appsInstallTimesAcceptable: boolean | null;
  appsWithLengthyInstallDetail: string;
  // true = SA verified no applications require user credentials before installation (clean/pass).
  // false = one or more applications are credential-dependent (triggers appsDependOnUserCredsDetail).
  appsNoCredentialDependency: boolean | null;
  appsDependOnUserCredsDetail: string;

  // Category 4 - Device Configuration Requirements
  devicePoliciesRequired: string;
  windowsUpdatesRequiredPreProvisioning: boolean | null;
  vpnSecurityAgentsRequired: boolean | null;
  vpnSecurityAgentsDetail: string;
  hardwareModelsValidated: boolean | null;
}

export interface EngagementTriggers {
  customerItPocConfirmed: boolean | null;
  tscAlignmentScheduled: boolean | null;
  cloudServicesEngaged: boolean | null;

  // Category 5 - Ordering & Enrollment Process
  deviceImportMethod: DeviceImportMethod | null;
  enrollmentHandledBy: EnrollmentHandledBy | null;
  deviceAssociatedInfo: string;

  // Category 6 - Deployment Logistics
  shipToLocation: ShipToLocation[];
  adultSignatureRequired: boolean | null;
  assetTagsBiosCustomPackaging: boolean | null;
  assetTagsBiosCustomPackagingDetail: string;
}

export interface FirstArticle {
  required: boolean | null;
  validationCriteria: string[];
  aiGuidance: string;
  loading: boolean;
}

export interface RoadmapStep {
  id: string;
  phase: string;
  action: string;
  owner: Owner;
  timeline: string;
  status: 'required' | 'recommended' | 'complete';
  sowRelevant: boolean;
}

export interface RoadmapOutput {
  steps: RoadmapStep[];
  sowReady: boolean;
  sowReadinessScore: number;
  aiSummary: string;
  generatedAt: string;
  loading: boolean;
}

export interface MotionState {
  currentStep: number;
  discoveryMode: DiscoveryMode | null;
  unvalidatedFields: string[];
  customerProfile: CustomerProfile;
  readinessCheck: ReadinessCheck;
  deploymentRecommendation: DeploymentRecommendation;
  engagementTriggers: EngagementTriggers;
  firstArticle: FirstArticle;
  roadmapOutput: RoadmapOutput;
  sessionCode: string | null;
  lastSavedAt: string | null;
  // Set when the SA jumps back to an earlier step to edit an answer from Step 6.
  // nextStep() returns here instead of advancing, and roadmap regeneration is forced.
  editReturnStep: number | null;
}

export type SessionCompletionStatus = 'in-progress' | 'complete';

export interface SaveSessionResponse {
  sessionCode: string;
  updatedAt: string;
}

export interface LoadSessionResponse {
  sessionCode: string;
  state: MotionState;
  completionStatus: SessionCompletionStatus;
  updatedAt: string;
}

export interface AiMotionRequest {
  step: number;
  action: 'recommend-deployment' | 'first-article-guidance' | 'generate-roadmap';
  customerProfile: CustomerProfile;
  discoveryMode?: DiscoveryMode;
  unvalidatedFields?: string[];
  readinessCheck?: ReadinessCheck;
  deploymentRecommendation?: DeploymentRecommendation;
  engagementTriggers?: EngagementTriggers;
  firstArticle?: FirstArticle;
}

export interface AiMotionResponse {
  message: string;
  imageType?: ImageType;
  provisioningModel?: ProvisioningModel;
  rationale?: string;
  validationCriteria?: string[];
  guidance?: string;
  roadmap?: Omit<RoadmapOutput, 'loading'>;
  error?: string;
}

export const STEP_LABELS: Record<number, string> = {
  1: 'Technical Discovery',
  2: 'Readiness Gate',
  3: 'Deployment Model',
  4: 'Engagement Triggers',
  5: 'First Article',
  6: 'Roadmap Output',
};

export function isFieldAnswered(value: unknown, fieldKey: string, unvalidatedFields: string[]): boolean {
  if (Array.isArray(value)) return value.length > 0 || unvalidatedFields.includes(fieldKey);
  return value !== null && value !== undefined || unvalidatedFields.includes(fieldKey);
}
