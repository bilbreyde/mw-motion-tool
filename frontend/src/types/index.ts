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

export type EnvironmentType = 'cloud-only' | 'hybrid' | 'on-premise';
export type MdmPlatform = 'intune' | 'jamf' | 'workspace-one' | 'none' | 'other';
export type DeviceVolume = '1-50' | '51-250' | '251-1000' | '1000+';
export type DeploymentTimeline = 'immediate' | '1-3months' | '3-6months' | '6months+';
export type PrimaryOs = 'windows' | 'mac' | 'mixed';
export type ImageType = 'clean-image' | 'oem-ready';
export type ProvisioningModel = 'pre-provisioning' | 'user-driven' | 'hybrid';
export type Owner = 'Seller' | 'DW SA' | 'TSC' | 'Cloud Services' | 'Customer';

export interface CustomerProfile {
  customerName: string;
  industry: Industry | null;
  environmentType: EnvironmentType | null;
  mdmPlatform: MdmPlatform | null;
  deviceVolume: DeviceVolume | null;
  deploymentTimeline: DeploymentTimeline | null;
  primaryOs: PrimaryOs | null;
}

export interface ReadinessCheck {
  autopilotReady: boolean | null;
  intuneReady: boolean | null;
  routedToProServices: boolean;
}

export interface DeploymentRecommendation {
  imageType: ImageType | null;
  provisioningModel: ProvisioningModel | null;
  aiRationale: string;
  loading: boolean;
}

export interface EngagementTriggers {
  dwSaAssigned: boolean | null;
  tscAlignmentScheduled: boolean | null;
  cloudServicesEngaged: boolean | null;
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
  1: 'Customer Profile',
  2: 'Readiness Gate',
  3: 'Deployment Model',
  4: 'Engagement Triggers',
  5: 'First Article',
  6: 'Roadmap Output',
};
