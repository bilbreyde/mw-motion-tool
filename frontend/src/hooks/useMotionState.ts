import { useState, useCallback } from 'react';
import type { MotionState, DiscoveryMode, CustomerProfile, ReadinessCheck, DeploymentRecommendation, EngagementTriggers, FirstArticle } from '../types';

const initialState: MotionState = {
  currentStep: 1,
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
    acceptableDeploymentTime: '',
    currentProcessIssues: '',
    devicesPerMonthQuarter: '',
    deploymentModelType: [],
    multipleDeviceModels: null,
    firstArticleContact: '',
    pilotSuccessCriteria: '',
  },
  readinessCheck: {
    intuneDeployedProduction: null,
    autopilotConfiguredTestedProd: null,
    autopilotDeployedBefore: null,
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
    regionalInternationalRequirements: null,
    regionalInternationalRequirementsDetail: '',
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
  sessionCode: null,
  lastSavedAt: null,
  editReturnStep: null,
};

export function useMotionState() {
  const [state, setState] = useState<MotionState>(initialState);

  const setDiscoveryMode = useCallback((mode: DiscoveryMode) => {
    setState(prev => ({ ...prev, discoveryMode: mode }));
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
          // Force Step 6 to regenerate the roadmap against the edited answers.
          roadmapOutput: { ...prev.roadmapOutput, steps: [], aiSummary: '', loading: false },
        };
      }
      return { ...prev, currentStep: Math.min(prev.currentStep + 1, 6) };
    });
  }, []);

  const editStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step, editReturnStep: 6 }));
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

  const reset = useCallback(() => setState(initialState), []);

  const setSessionMeta = useCallback((updates: { sessionCode?: string | null; lastSavedAt?: string | null }) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const loadState = useCallback((loaded: MotionState, sessionCode: string, updatedAt: string) => {
    setState({
      ...loaded,
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
    setDiscoveryMode,
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
    reset,
    setSessionMeta,
    loadState,
  };
}
