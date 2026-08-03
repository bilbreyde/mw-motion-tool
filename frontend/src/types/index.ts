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
export type PrimaryOs = 'windows' | 'mac' | 'mixed';
export type ImageType = 'clean-image' | 'oem-ready';
export type ProvisioningModel = 'pre-provisioning' | 'user-driven' | 'hybrid';
export type Owner = 'SA' | 'TSC' | 'Cloud Services' | 'Customer' | 'Account Team';
export type IntuneAutopilotOwner = 'internal-team' | 'partner' | 'both' | 'not-assigned';
export type DeploymentModelType = 'pilot' | 'refresh' | 'new-hire' | 'ongoing';
export type ProvisioningPreference = 'standard' | 'pre-provisioned';
export type DeviceImportMethod = 'oem-direct' | 'reseller-csv' | 'partner-center' | 'manual-other';
export type EnrollmentHandledBy = 'oem' | 'zones';
export type ShipToLocation = 'home' | 'office' | 'distribution-center';

export interface CustomerProfile {
  customerName: string;
  opportunityNumber: string;
  saName: string;
  sellerName: string;
  industry: Industry | null;
  primaryOs: PrimaryOs | null;
  entraJoinType: EntraJoinType | null;
  coManagementStatus: CoManagementStatus | null;
  mdmPlatform: MdmPlatform[];
  deviceVolume: DeviceVolume | null;
  deploymentTimeline: DeploymentTimeline | null;

  // Category 1 - Current Environment Readiness
  intuneDeployedProduction: boolean | null;
  autopilotConfiguredTestedProd: boolean | null;
  autopilotDeployedBefore: boolean | null;
  autopilotProcessDocumented: boolean | null;
  intuneAutopilotOwner: IntuneAutopilotOwner | null;

  // Category 7 - User Experience Expectations
  desiredFirstLoginExperience: string;
  immediateProductivityRequired: boolean | null;
  day1RequiredApps: string;
  acceptableDeploymentTime: string;
  currentProcessIssues: string;

  // Category 8 - Scale & Operational Planning
  devicesPerMonthQuarter: string;
  deploymentModelType: DeploymentModelType | null;
  multipleDeviceModels: boolean | null;
  firstArticleContact: string;
  pilotSuccessCriteria: string;
}

export interface ReadinessCheck {
  // Step 2 Readiness Gate — the 7 official go/no-go questions. ALL must be Yes to proceed;
  // any explicit No stops the engagement and routes to Autopilot/Intune Pro Services, no exceptions.
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
  enrollmentRestrictionsExist: boolean | null;
  enrollmentRestrictionsDetail: string;
  provisioningPreference: ProvisioningPreference | null;

  autopilotProfileType: AutopilotProfileType | null;
  routedToProServices: boolean;
}

export interface DeploymentRecommendation {
  imageType: ImageType | null;
  provisioningModel: ProvisioningModel | null;
  aiRationale: string;
  loading: boolean;

  // Category 3 - Application Readiness (pre-provisioning / install-time half)
  preProvisioningSoftwareList: string;
  appsWithLengthyInstall: boolean | null;
  appsWithLengthyInstallDetail: string;
  appsDependOnUserCreds: boolean | null;

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
  autopilotRegistrationValidator: string;

  // Category 6 - Deployment Logistics
  shipToLocation: ShipToLocation | null;
  directToUserShipmentRequired: boolean | null;
  adultSignatureRequired: boolean | null;
  assetTagsBiosCustomPackaging: boolean | null;
  assetTagsBiosCustomPackagingDetail: string;
  regionalInternationalRequirements: boolean | null;
  regionalInternationalRequirementsDetail: string;
  holdToCompleteRequired: boolean | null;
}

export interface FirstArticle {
  required: boolean | null;
  testOrderNeeded: boolean | null;
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
