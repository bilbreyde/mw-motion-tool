import { useMemo, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { SessionSavedModal } from './components/SessionSavedModal';
import { DiscoveryModeSelector } from './components/DiscoveryModeSelector';
import { Step1_CustomerProfile } from './components/steps/Step1_CustomerProfile';
import { Step2_ReadinessGate } from './components/steps/Step2_ReadinessGate';
import { Step3_DeploymentModel } from './components/steps/Step3_DeploymentModel';
import { Step4_EngagementTriggers } from './components/steps/Step4_EngagementTriggers';
import { Step5_FirstArticle } from './components/steps/Step5_FirstArticle';
import { Step6_RoadmapOutput } from './components/steps/Step6_RoadmapOutput';
import { ProServicesRoute } from './components/ProServicesRoute';
import { useMotionState } from './hooks/useMotionState';
import { isFieldAnswered } from './types';
import type { ReadinessCheck } from './types';
import { saveSession, loadSession } from './utils/sessionApi';

const READINESS_GATE_KEYS: (keyof ReadinessCheck)[] = [
  'intuneProductionReady', 'autopilotConfiguredTested', 'enrollmentProfilesDefined',
  'groupTagsDefined', 'applicationsPackagedTested', 'firstArticlePlanned', 'ownershipAssigned',
];

export default function App() {
  const {
    state,
    setDiscoveryMode,
    markUnvalidated,
    clearUnvalidated,
    goToStep,
    nextStep,
    updateCustomerProfile,
    updateReadinessCheck,
    updateDeploymentRecommendation,
    updateEngagementTriggers,
    updateFirstArticle,
    updateRoadmap,
    reset,
    editStep,
    setSessionMeta,
    loadState,
  } = useMotionState();

  const {
    currentStep, discoveryMode, unvalidatedFields,
    customerProfile, readinessCheck, deploymentRecommendation,
    engagementTriggers, firstArticle, roadmapOutput,
    sessionCode, lastSavedAt,
  } = state;

  const uv = unvalidatedFields;
  const answered = (val: unknown, key: string) => isFieldAnswered(val, key, uv);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedModalCode, setSavedModalCode] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);

  async function handleSaveSession() {
    setSaving(true);
    setSaveError(null);
    try {
      const result = await saveSession(state, sessionCode);
      setSessionMeta({ sessionCode: result.sessionCode, lastSavedAt: result.updatedAt });
      setSavedModalCode(result.sessionCode);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save session');
    } finally {
      setSaving(false);
    }
  }

  async function handleResumeSession(code: string) {
    setResuming(true);
    setResumeError(null);
    try {
      const result = await loadSession(code);
      loadState(result.state, result.sessionCode, result.updatedAt);
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setResuming(false);
    }
  }

  const completedSteps = useMemo(() => {
    const completed = new Set<number>();

    if (
      customerProfile.customerName.trim() &&
      customerProfile.opportunityNumber.trim() &&
      customerProfile.saName.trim() &&
      customerProfile.sellerName.trim() &&
      answered(customerProfile.industry, 'customerProfile.industry') &&
      answered(customerProfile.primaryOs, 'customerProfile.primaryOs') &&
      answered(customerProfile.entraJoinType, 'customerProfile.entraJoinType') &&
      answered(customerProfile.coManagementStatus, 'customerProfile.coManagementStatus') &&
      answered(customerProfile.mdmPlatform, 'customerProfile.mdmPlatform') &&
      answered(customerProfile.deviceVolume, 'customerProfile.deviceVolume') &&
      answered(customerProfile.deploymentTimeline, 'customerProfile.deploymentTimeline') &&
      answered(customerProfile.intuneDeployedProduction, 'customerProfile.intuneDeployedProduction') &&
      answered(customerProfile.autopilotConfiguredTestedProd, 'customerProfile.autopilotConfiguredTestedProd') &&
      answered(customerProfile.autopilotDeployedBefore, 'customerProfile.autopilotDeployedBefore') &&
      answered(customerProfile.autopilotProcessDocumented, 'customerProfile.autopilotProcessDocumented') &&
      answered(customerProfile.intuneAutopilotOwner, 'customerProfile.intuneAutopilotOwner') &&
      answered(customerProfile.immediateProductivityRequired, 'customerProfile.immediateProductivityRequired') &&
      answered(customerProfile.deploymentModelType, 'customerProfile.deploymentModelType') &&
      answered(customerProfile.multipleDeviceModels, 'customerProfile.multipleDeviceModels')
    ) completed.add(1);

    const gatesAnswered = READINESS_GATE_KEYS.every(k => answered(readinessCheck[k], `readinessCheck.${k}`));
    const gatesFailed = READINESS_GATE_KEYS.some(k => readinessCheck[k] === false && !uv.includes(`readinessCheck.${k}`));
    if (gatesAnswered && !gatesFailed) completed.add(2);

    if (
      deploymentRecommendation.imageType &&
      deploymentRecommendation.provisioningModel &&
      answered(deploymentRecommendation.appsWithLengthyInstall, 'deploymentRecommendation.appsWithLengthyInstall') &&
      answered(deploymentRecommendation.appsDependOnUserCreds, 'deploymentRecommendation.appsDependOnUserCreds') &&
      answered(deploymentRecommendation.windowsUpdatesRequiredPreProvisioning, 'deploymentRecommendation.windowsUpdatesRequiredPreProvisioning') &&
      answered(deploymentRecommendation.hardwareModelsValidated, 'deploymentRecommendation.hardwareModelsValidated')
    ) completed.add(3);

    if (
      answered(engagementTriggers.customerItPocConfirmed, 'engagementTriggers.customerItPocConfirmed') &&
      answered(engagementTriggers.tscAlignmentScheduled, 'engagementTriggers.tscAlignmentScheduled') &&
      answered(engagementTriggers.cloudServicesEngaged, 'engagementTriggers.cloudServicesEngaged') &&
      answered(engagementTriggers.deviceImportMethod, 'engagementTriggers.deviceImportMethod') &&
      answered(engagementTriggers.enrollmentHandledBy, 'engagementTriggers.enrollmentHandledBy') &&
      answered(engagementTriggers.shipToLocation, 'engagementTriggers.shipToLocation') &&
      answered(engagementTriggers.directToUserShipmentRequired, 'engagementTriggers.directToUserShipmentRequired') &&
      answered(engagementTriggers.adultSignatureRequired, 'engagementTriggers.adultSignatureRequired') &&
      answered(engagementTriggers.assetTagsBiosCustomPackaging, 'engagementTriggers.assetTagsBiosCustomPackaging') &&
      answered(engagementTriggers.regionalInternationalRequirements, 'engagementTriggers.regionalInternationalRequirements') &&
      answered(engagementTriggers.holdToCompleteRequired, 'engagementTriggers.holdToCompleteRequired')
    ) completed.add(4);

    if (firstArticle.required !== null && firstArticle.testOrderNeeded !== null) completed.add(5);
    if (roadmapOutput.steps.length > 0) completed.add(6);

    return completed;
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleReadinessNext() {
    const gatesOk = READINESS_GATE_KEYS.every(k => readinessCheck[k] === true || uv.includes(`readinessCheck.${k}`));
    if (gatesOk) nextStep();
  }

  function handleRouteToProServices() {
    updateReadinessCheck({ routedToProServices: true });
  }

  const isRoutedToProServices =
    readinessCheck.routedToProServices &&
    READINESS_GATE_KEYS.some(k => readinessCheck[k] === false);

  if (!discoveryMode) {
    return (
      <DiscoveryModeSelector
        onSelect={setDiscoveryMode}
        onResumeSession={handleResumeSession}
        resuming={resuming}
        resumeError={resumeError}
      />
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        currentStep={currentStep}
        completedSteps={completedSteps}
        discoveryMode={discoveryMode}
        blockedAtStep={isRoutedToProServices ? 2 : undefined}
        onStepClick={goToStep}
        onReset={reset}
        sessionCode={sessionCode}
        lastSavedAt={lastSavedAt}
        saving={saving}
        saveError={saveError}
        onSaveSession={handleSaveSession}
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
                discoveryMode={discoveryMode}
                unvalidatedFields={uv}
                onUpdate={updateCustomerProfile}
                onMarkUnvalidated={markUnvalidated}
                onClearUnvalidated={clearUnvalidated}
                onNext={nextStep}
              />
            )}
            {currentStep === 2 && (
              <Step2_ReadinessGate
                profile={customerProfile}
                discoveryMode={discoveryMode}
                unvalidatedFields={uv}
                readiness={readinessCheck}
                onUpdate={updateReadinessCheck}
                onMarkUnvalidated={markUnvalidated}
                onClearUnvalidated={clearUnvalidated}
                onNext={handleReadinessNext}
                onRouteToProServices={handleRouteToProServices}
              />
            )}
            {currentStep === 3 && (
              <Step3_DeploymentModel
                profile={customerProfile}
                discoveryMode={discoveryMode}
                unvalidatedFields={uv}
                readiness={readinessCheck}
                recommendation={deploymentRecommendation}
                onUpdate={updateDeploymentRecommendation}
                onMarkUnvalidated={markUnvalidated}
                onClearUnvalidated={clearUnvalidated}
                onNext={nextStep}
              />
            )}
            {currentStep === 4 && (
              <Step4_EngagementTriggers
                profile={customerProfile}
                discoveryMode={discoveryMode}
                unvalidatedFields={uv}
                triggers={engagementTriggers}
                onUpdate={updateEngagementTriggers}
                onMarkUnvalidated={markUnvalidated}
                onClearUnvalidated={clearUnvalidated}
                onNext={nextStep}
              />
            )}
            {currentStep === 5 && (
              <Step5_FirstArticle
                profile={customerProfile}
                discoveryMode={discoveryMode}
                unvalidatedFields={uv}
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
                onEditStep={editStep}
              />
            )}
          </>
        )}
      </main>

      {savedModalCode && (
        <SessionSavedModal sessionCode={savedModalCode} onClose={() => setSavedModalCode(null)} />
      )}
    </div>
  );
}
