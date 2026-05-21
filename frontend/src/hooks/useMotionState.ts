import { useState, useCallback } from 'react';
import type { MotionState, CustomerProfile, ReadinessCheck, DeploymentRecommendation, EngagementTriggers, FirstArticle } from '../types';

const initialState: MotionState = {
  currentStep: 1,
  customerProfile: {
    customerName: '',
    industry: null,
    environmentType: null,
    mdmPlatform: null,
    deviceVolume: null,
    deploymentTimeline: null,
    primaryOs: null,
  },
  readinessCheck: {
    autopilotReady: null,
    intuneReady: null,
    routedToProServices: false,
  },
  deploymentRecommendation: {
    imageType: null,
    provisioningModel: null,
    aiRationale: '',
    loading: false,
  },
  engagementTriggers: {
    dwSaAssigned: null,
    tscAlignmentScheduled: null,
    cloudServicesEngaged: null,
  },
  firstArticle: {
    required: null,
    testOrderNeeded: null,
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
};

export function useMotionState() {
  const [state, setState] = useState<MotionState>(initialState);

  const goToStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: Math.min(prev.currentStep + 1, 6) }));
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

  return {
    state,
    goToStep,
    nextStep,
    updateCustomerProfile,
    updateReadinessCheck,
    updateDeploymentRecommendation,
    updateEngagementTriggers,
    updateFirstArticle,
    updateRoadmap,
    reset,
  };
}
