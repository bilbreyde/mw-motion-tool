import { useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Step1_CustomerProfile } from './components/steps/Step1_CustomerProfile';
import { Step2_ReadinessGate } from './components/steps/Step2_ReadinessGate';
import { Step3_DeploymentModel } from './components/steps/Step3_DeploymentModel';
import { Step4_EngagementTriggers } from './components/steps/Step4_EngagementTriggers';
import { Step5_FirstArticle } from './components/steps/Step5_FirstArticle';
import { Step6_RoadmapOutput } from './components/steps/Step6_RoadmapOutput';
import { ProServicesRoute } from './components/ProServicesRoute';
import { useMotionState } from './hooks/useMotionState';

export default function App() {
  const {
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
  } = useMotionState();

  const { currentStep, customerProfile, readinessCheck, deploymentRecommendation, engagementTriggers, firstArticle, roadmapOutput } = state;

  const completedSteps = useMemo(() => {
    const completed = new Set<number>();
    if (
      customerProfile.customerName.trim() &&
      customerProfile.industry &&
      customerProfile.environmentType &&
      customerProfile.mdmPlatform &&
      customerProfile.deviceVolume &&
      customerProfile.deploymentTimeline &&
      customerProfile.primaryOs
    ) completed.add(1);

    if (readinessCheck.autopilotReady !== null && readinessCheck.intuneReady !== null) completed.add(2);
    if (deploymentRecommendation.imageType && deploymentRecommendation.provisioningModel) completed.add(3);
    if (
      engagementTriggers.dwSaAssigned !== null &&
      engagementTriggers.tscAlignmentScheduled !== null &&
      engagementTriggers.cloudServicesEngaged !== null
    ) completed.add(4);
    if (firstArticle.required !== null && firstArticle.testOrderNeeded !== null) completed.add(5);
    if (roadmapOutput.steps.length > 0) completed.add(6);

    return completed;
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleReadinessNext() {
    if (readinessCheck.autopilotReady && readinessCheck.intuneReady) {
      nextStep();
    }
  }

  function handleRouteToProServices() {
    updateReadinessCheck({ routedToProServices: true });
  }

  const isRoutedToProServices =
    readinessCheck.routedToProServices &&
    (!readinessCheck.autopilotReady || !readinessCheck.intuneReady);

  return (
    <div className="app-shell">
      <Sidebar
        currentStep={currentStep}
        completedSteps={completedSteps}
        blockedAtStep={isRoutedToProServices ? 2 : undefined}
        onStepClick={goToStep}
        onReset={reset}
      />

      <main className="main-content">
        {isRoutedToProServices ? (
          <ProServicesRoute
            profile={customerProfile}
            readiness={readinessCheck}
            onReset={reset}
          />
        ) : (
          <>
            {currentStep === 1 && (
              <Step1_CustomerProfile
                profile={customerProfile}
                onUpdate={updateCustomerProfile}
                onNext={nextStep}
              />
            )}
            {currentStep === 2 && (
              <Step2_ReadinessGate
                profile={customerProfile}
                readiness={readinessCheck}
                onUpdate={updateReadinessCheck}
                onNext={handleReadinessNext}
                onRouteToProServices={handleRouteToProServices}
              />
            )}
            {currentStep === 3 && (
              <Step3_DeploymentModel
                profile={customerProfile}
                readiness={readinessCheck}
                recommendation={deploymentRecommendation}
                onUpdate={updateDeploymentRecommendation}
                onNext={nextStep}
              />
            )}
            {currentStep === 4 && (
              <Step4_EngagementTriggers
                profile={customerProfile}
                triggers={engagementTriggers}
                onUpdate={updateEngagementTriggers}
                onNext={nextStep}
              />
            )}
            {currentStep === 5 && (
              <Step5_FirstArticle
                profile={customerProfile}
                readiness={readinessCheck}
                recommendation={deploymentRecommendation}
                triggers={engagementTriggers}
                firstArticle={firstArticle}
                onUpdate={updateFirstArticle}
                onNext={nextStep}
              />
            )}
            {currentStep === 6 && (
              <Step6_RoadmapOutput
                state={state}
                onUpdateRoadmap={updateRoadmap}
                onReset={reset}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
