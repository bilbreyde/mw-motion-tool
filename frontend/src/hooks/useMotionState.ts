import { useState, useCallback } from 'react';
import type {
  MotionState, DiscoveryMode, SalesMotion, CustomerProfile, ReadinessCheck, DeploymentRecommendation,
  EngagementTriggers, FirstArticle, ProServicesState, PsLoeEstimate,
} from '../types';

// Questions removed from the tool; sessions saved earlier may still flag them as unvalidated.
const RETIRED_FIELD_KEYS = new Set([
  'readinessCheck.intuneDeployedProduction',
  'readinessCheck.autopilotConfiguredTestedProd',
  'readinessCheck.autopilotDeployedBefore',
  'engagementTriggers.regionalInternationalRequirements',
  'engagementTriggers.regionalInternationalRequirementsDetail',
]);

const initialLoe: PsLoeEstimate = {
  areaLines: [],
  summary: '',
  assumptions: [],
  risks: [],
  generatedAt: '',
  error: '',
  loading: false,
};

const initialProServices: ProServicesState = {
  engagementType: null,
  deviceCount: null,
  currentMdm: [],
  osLandscape: [],
  environmentNotes: '',
  configStatus: {
    intuneTenant: null,
    autopilotProfiles: null,
    esp: null,
    groupTags: null,
    appPackaging: null,
    securityBaselines: null,
    conditionalAccess: null,
    deviceCompliance: null,
    networkVpn: null,
    identityJoin: null,
  },
  customIntegrations: null,
  customIntegrationsDetail: '',
  customCspProfiles: null,
  customCspProfilesDetail: '',
  multiTenant: null,
  thirdPartyAppPackaging: null,
  loe: initialLoe,
};

function lastStepFor(motion: SalesMotion): number {
  if (motion === 'pro-services') return 5;
  if (motion === 'ordering') return 3;
  return 5; // provisioning
}

const initialState: MotionState = {
  currentStep: 1,
  motion: 'provisioning',
  discoveryMode: null,
  unvalidatedFields: [],
  customerProfile: {
    customerName: '',
    opportunityNumber: '',
    saName: '',
    sellerName: '',
    industry: null,
    primaryOs: [],
    entraJoinType: null,
    coManagementStatus: null,
    mdmPlatform: [],
    deviceVolume: null,
    deploymentTimeline: null,
    intuneAutopilotOwner: null,
    desiredFirstLoginExperience: '',
    immediateProductivityRequired: null,
    day1RequiredApps: '',
    acceptableDeploymentTime: null,
    currentProcessIssues: '',
    devicesPerMonthQuarter: '',
    deploymentModelType: [],
    multipleDeviceModels: null,
    firstArticleContact: '',
    pilotSuccessCriteria: '',
  },
  readinessCheck: {
    autopilotProcessDocumented: null,
    intuneProductionReady: null,
    autopilotConfiguredTested: null,
    enrollmentProfilesDefined: null,
    groupTagsDefined: null,
    applicationsPackagedTested: null,
    firstArticlePlanned: null,
    ownershipAssigned: null,
    deploymentProfilesValidated: null,
    deviceGroupsConfigured: null,
    groupTagsRequired: null,
    espConfigured: null,
    enrollmentRestrictionsVerifiedClean: null,
    enrollmentRestrictionsDetail: '',
    autopilotProfileType: null,
    routedToProServices: false,
  },
  deploymentRecommendation: {
    imageType: null,
    provisioningModel: null,
    aiRationale: '',
    loading: false,
    preProvisioningSoftwareList: '',
    appsInstallTimesAcceptable: null,
    appsWithLengthyInstallDetail: '',
    appsNoCredentialDependency: null,
    appsDependOnUserCredsDetail: '',
    devicePoliciesRequired: '',
    windowsUpdatesRequiredPreProvisioning: null,
    vpnSecurityAgentsRequired: null,
    vpnSecurityAgentsDetail: '',
    hardwareModelsValidated: null,
  },
  engagementTriggers: {
    customerItPocConfirmed: null,
    tscAlignmentScheduled: null,
    cloudServicesEngaged: null,
    deviceImportMethod: null,
    enrollmentHandledBy: null,
    deviceAssociatedInfo: '',
    shipToLocation: [],
    adultSignatureRequired: null,
    assetTagsBiosCustomPackaging: null,
    assetTagsBiosCustomPackagingDetail: '',
  },
  firstArticle: {
    required: null,
    validationCriteria: [],
    aiGuidance: '',
    loading: false,
  },
  roadmapOutput: {
    steps: [],
    sowReady: false,
    sowReadinessScore: 0,
    aiSummary: '',
    generatedAt: '',
    loading: false,
  },
  proServices: initialProServices,
  sessionCode: null,
  lastSavedAt: null,
  editReturnStep: null,
};

export function useMotionState() {
  const [state, setState] = useState<MotionState>(initialState);

  const startSession = useCallback((motion: SalesMotion, mode: DiscoveryMode) => {
    setState(prev => ({ ...prev, motion, discoveryMode: mode }));
  }, []);

  const markUnvalidated = useCallback((fieldKey: string) => {
    setState(prev => ({
      ...prev,
      unvalidatedFields: prev.unvalidatedFields.includes(fieldKey)
        ? prev.unvalidatedFields
        : [...prev.unvalidatedFields, fieldKey],
    }));
  }, []);

  const clearUnvalidated = useCallback((fieldKey: string) => {
    setState(prev => ({
      ...prev,
      unvalidatedFields: prev.unvalidatedFields.filter(f => f !== fieldKey),
    }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => {
      if (prev.editReturnStep !== null) {
        return {
          ...prev,
          currentStep: prev.editReturnStep,
          editReturnStep: null,
          // Force the output step to regenerate the roadmap / LOE against the edited answers.
          ...(prev.motion === 'pro-services'
            ? { proServices: { ...prev.proServices, loe: initialLoe } }
            : { roadmapOutput: { ...prev.roadmapOutput, steps: [], aiSummary: '', loading: false } }),
        };
      }
      return { ...prev, currentStep: Math.min(prev.currentStep + 1, lastStepFor(prev.motion)) };
    });
  }, []);

  const editStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step, editReturnStep: lastStepFor(prev.motion) }));
  }, []);

  const updateCustomerProfile = useCallback((updates: Partial<CustomerProfile>) => {
    setState(prev => ({
      ...prev,
      customerProfile: { ...prev.customerProfile, ...updates },
    }));
  }, []);

  const updateReadinessCheck = useCallback((updates: Partial<ReadinessCheck>) => {
    setState(prev => ({
      ...prev,
      readinessCheck: { ...prev.readinessCheck, ...updates },
    }));
  }, []);

  const updateDeploymentRecommendation = useCallback((updates: Partial<DeploymentRecommendation>) => {
    setState(prev => ({
      ...prev,
      deploymentRecommendation: { ...prev.deploymentRecommendation, ...updates },
    }));
  }, []);

  const updateEngagementTriggers = useCallback((updates: Partial<EngagementTriggers>) => {
    setState(prev => ({
      ...prev,
      engagementTriggers: { ...prev.engagementTriggers, ...updates },
    }));
  }, []);

  const updateFirstArticle = useCallback((updates: Partial<FirstArticle>) => {
    setState(prev => ({
      ...prev,
      firstArticle: { ...prev.firstArticle, ...updates },
    }));
  }, []);

  const updateRoadmap = useCallback((updates: Partial<MotionState['roadmapOutput']>) => {
    setState(prev => ({
      ...prev,
      roadmapOutput: { ...prev.roadmapOutput, ...updates },
    }));
  }, []);

  const updateProServices = useCallback((updates: Partial<ProServicesState>) => {
    setState(prev => ({
      ...prev,
      proServices: { ...prev.proServices, ...updates },
    }));
  }, []);

  const updateLoe = useCallback((updates: Partial<PsLoeEstimate>) => {
    setState(prev => ({
      ...prev,
      proServices: { ...prev.proServices, loe: { ...prev.proServices.loe, ...updates } },
    }));
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  const setSessionMeta = useCallback((updates: { sessionCode?: string | null; lastSavedAt?: string | null }) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const loadState = useCallback((loaded: MotionState, sessionCode: string, updatedAt: string) => {
    const ps = loaded.proServices;
    setState({
      ...loaded,
      motion: loaded.motion ?? 'provisioning',
      proServices: {
        ...initialProServices,
        ...ps,
        configStatus: { ...initialProServices.configStatus, ...ps?.configStatus },
        loe: { ...initialLoe, ...ps?.loe, loading: false },
      },
      unvalidatedFields: loaded.unvalidatedFields.filter(k => !RETIRED_FIELD_KEYS.has(k)),
      sessionCode,
      lastSavedAt: updatedAt,
      editReturnStep: null,
      deploymentRecommendation: { ...loaded.deploymentRecommendation, loading: false },
      firstArticle: { ...loaded.firstArticle, loading: false },
      roadmapOutput: { ...loaded.roadmapOutput, loading: false },
    });
  }, []);

  return {
    state,
    startSession,
    markUnvalidated,
    clearUnvalidated,
    goToStep,
    nextStep,
    editStep,
    updateCustomerProfile,
    updateReadinessCheck,
    updateDeploymentRecommendation,
    updateEngagementTriggers,
    updateFirstArticle,
    updateRoadmap,
    updateProServices,
    updateLoe,
    reset,
    setSessionMeta,
    loadState,
  };
}
