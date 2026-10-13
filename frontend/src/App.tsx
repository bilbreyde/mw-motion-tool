import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Sidebar } from './components/Sidebar';
import { SessionSavedModal } from './components/SessionSavedModal';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { DiscoveryModeSelector } from './components/DiscoveryModeSelector';
import { Step1_CustomerProfile } from './components/steps/Step1_CustomerProfile';
import { Step2_ReadinessGate, GATE_QUESTIONS } from './components/steps/Step2_ReadinessGate';
import { Step3_DeploymentModel } from './components/steps/Step3_DeploymentModel';
import { Step5_FirstArticle } from './components/steps/Step5_FirstArticle';
import { Step6_RoadmapOutput } from './components/steps/Step6_RoadmapOutput';
import { EarlyExitScreen } from './components/EarlyExitScreen';
import { PsStep1_EngagementType } from './components/proServices/PsStep1_EngagementType';
import { PsStep2_EnvironmentProfile } from './components/proServices/PsStep2_EnvironmentProfile';
import { PsStep3_ConfigStatus } from './components/proServices/PsStep3_ConfigStatus';
import { PsStep4_Complexity } from './components/proServices/PsStep4_Complexity';
import { PsStep5_Outputs } from './components/proServices/PsStep5_Outputs';
import { psCompletedSteps } from './components/proServices/psConfig';
import { FaStep1_Profile } from './components/firstArticle/FaStep1_Profile';
import { FaStep2_Intake } from './components/firstArticle/FaStep2_Intake';
import { FaStep3_Output } from './components/firstArticle/FaStep3_Output';
import { useMotionState } from './hooks/useMotionState';
import { useTheme } from './hooks/useTheme';
import { isFieldAnswered, FA_STEP_LABELS, PS_STEP_LABELS, STEP_LABELS } from './types';
import { loeBlockers } from './utils/psLoe';
import { saveSession, loadSession } from './utils/sessionApi';

const READINESS_GATE_KEYS = GATE_QUESTIONS.map(g => g.key);

export default function App() {
  const {
    state,
    startSession,
    markUnvalidated,
    clearUnvalidated,
    goToStep,
    nextStep,
    updateCustomerProfile,
    updateReadinessCheck,
    updateDeploymentRecommendation,
    updateFirstArticle,
    updateRoadmap,
    updateProServices,
    updateLoe,
    updateFaIntake,
    reset,
    editStep,
    setSessionMeta,
    loadState,
  } = useMotionState();

  const {
    currentStep, motion, discoveryMode, unvalidatedFields,
    customerProfile, readinessCheck, deploymentRecommendation,
    engagementTriggers, firstArticle, roadmapOutput, proServices, faMotion,
    sessionCode, lastSavedAt,
  } = state;

  const uv = unvalidatedFields;
  const answered = (val: unknown, key: string) => isFieldAnswered(val, key, uv);

  const { theme, setTheme } = useTheme();

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedModalCode, setSavedModalCode] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);

  const mainContentRef = useRef<HTMLElement>(null);
  useEffect(() => {
    mainContentRef.current?.scrollTo({ top: 0 });
  }, [currentStep]);

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
    if (motion === 'pro-services') {
      return psCompletedSteps(customerProfile, proServices, uv, loeBlockers(proServices, uv).length > 0);
    }

    if (motion === 'first-article') {
      const completed = new Set<number>();
      if (
        customerProfile.customerName.trim() &&
        customerProfile.opportunityNumber.trim() &&
        customerProfile.saName.trim() &&
        customerProfile.sellerName.trim()
      ) completed.add(1);

      // Step 2 is complete when the intake has the minimum required fields answered
      // (use the same logic as faIntakeComplete but inline to avoid the import cycle)
      const fa = faMotion.intake;
      const faUv = (name: string) => uv.includes(`faIntake.${name}`);
      const faAnswered = (val: unknown, name: string) => val !== null && val !== undefined || faUv(name);
      if (
        fa.environmentOperational === true &&
        faAnswered(fa.registrationOwner, 'registrationOwner') &&
        (fa.hardwareModel.trim() || faUv('hardwareModel')) &&
        (fa.deviceSku.trim() || faUv('deviceSku')) &&
        (fa.deviceQuantity.trim() || faUv('deviceQuantity')) &&
        faAnswered(fa.zonesAuthorizationCompleted, 'zonesAuthorizationCompleted') &&
        faAnswered(fa.provisioningType, 'provisioningType') &&
        (fa.acceptanceDefinition.trim() || faUv('acceptanceDefinition')) &&
        faAnswered(fa.currentRuntime, 'currentRuntime') &&
        (fa.runtimeSources.length > 0 || faUv('runtimeSources')) &&
        (fa.testerContact.trim() || faUv('testerContact')) &&
        (fa.approverContact.trim() || faUv('approverContact')) &&
        faAnswered(fa.customerHasExistingInstructions, 'customerHasExistingInstructions')
      ) completed.add(2);

      // Step 3 is the FA Definition output — reachable once step 2 is complete
      if (completed.has(2)) completed.add(3);
      return completed;
    }

    // provisioning motion
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
      answered(deploymentRecommendation.appsInstallTimesAcceptable, 'deploymentRecommendation.appsInstallTimesAcceptable') &&
      answered(deploymentRecommendation.appsNoCredentialDependency, 'deploymentRecommendation.appsNoCredentialDependency') &&
      answered(deploymentRecommendation.windowsUpdatesRequiredPreProvisioning, 'deploymentRecommendation.windowsUpdatesRequiredPreProvisioning') &&
      answered(deploymentRecommendation.hardwareModelsValidated, 'deploymentRecommendation.hardwareModelsValidated')
    ) completed.add(3);

    if (firstArticle.required !== null) completed.add(4);
    if (roadmapOutput.steps.length > 0) completed.add(5);

    return completed;
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleReadinessNext() {
    const gatesOk = READINESS_GATE_KEYS.every(k => readinessCheck[k] === true || uv.includes(`readinessCheck.${k}`));
    if (gatesOk) nextStep();
  }

  function handleEarlyExit() {
    updateReadinessCheck({ routedToProServices: true });
  }

  // Any explicit (validated) No on a Step 2 gate blocks Steps 3–6. Provisioning motion only.
  const gateFailed = motion === 'provisioning' && READINESS_GATE_KEYS.some(k => readinessCheck[k] === false && !uv.includes(`readinessCheck.${k}`));
  const isEarlyExit = readinessCheck.routedToProServices && gateFailed;

  function handleStepClick(step: number) {
    if (gateFailed && step > 2) return;
    if (isEarlyExit) updateReadinessCheck({ routedToProServices: false });
    goToStep(step);
  }

  // Printed documents carry the session ID, which only exists once the session is saved.
  // `force` re-saves an already-saved session so the stored copy matches what is printed.
  const pendingSaveRef = useRef<Promise<string | null> | null>(null);
  function saveSessionForPrint(force: boolean): Promise<string | null> {
    if (sessionCode && !force) return Promise.resolve(sessionCode);
    if (!pendingSaveRef.current) {
      pendingSaveRef.current = (async () => {
        try {
          const result = await saveSession(state, sessionCode);
          // Commit synchronously so the DOM already shows the ID when window.print() runs.
          flushSync(() => setSessionMeta({ sessionCode: result.sessionCode, lastSavedAt: result.updatedAt }));
          return result.sessionCode;
        } catch {
          return sessionCode;
        } finally {
          pendingSaveRef.current = null;
        }
      })();
    }
    return pendingSaveRef.current;
  }

  if (!discoveryMode) {
    return (
      <>
        <ThemeSwitcher theme={theme} onChange={setTheme} />
        <DiscoveryModeSelector
          onSelect={startSession}
          onResumeSession={handleResumeSession}
          resuming={resuming}
          resumeError={resumeError}
        />
      </>
    );
  }

  const psStepProps = {
    ps: proServices,
    discoveryMode,
    unvalidatedFields: uv,
    onUpdate: updateProServices,
    onMarkUnvalidated: markUnvalidated,
    onClearUnvalidated: clearUnvalidated,
    onNext: nextStep,
  };

  return (
    <div className="app-shell">
      <ThemeSwitcher theme={theme} onChange={setTheme} />
      <Sidebar
        motion={motion}
        stepLabels={motion === 'pro-services' ? PS_STEP_LABELS : motion === 'first-article' ? FA_STEP_LABELS : STEP_LABELS}
        currentStep={currentStep}
        completedSteps={completedSteps}
        discoveryMode={discoveryMode}
        blockedAtStep={gateFailed ? 2 : undefined}
        onStepClick={handleStepClick}
        onReset={reset}
        sessionCode={sessionCode}
        lastSavedAt={lastSavedAt}
        saving={saving}
        saveError={saveError}
        onSaveSession={handleSaveSession}
      />

      <main className="main-content" ref={mainContentRef}>
        {motion === 'pro-services' ? (
          <>
            {currentStep === 1 && (
              <PsStep1_EngagementType
                profile={customerProfile}
                onUpdateProfile={updateCustomerProfile}
                {...psStepProps}
              />
            )}
            {currentStep === 2 && <PsStep2_EnvironmentProfile {...psStepProps} />}
            {currentStep === 3 && <PsStep3_ConfigStatus {...psStepProps} />}
            {currentStep === 4 && <PsStep4_Complexity {...psStepProps} />}
            {currentStep === 5 && (
              <PsStep5_Outputs
                state={state}
                onEnsureSession={() => saveSessionForPrint(false)}
                onUpdateLoe={updateLoe}
                onReset={reset}
                onEditStep={editStep}
              />
            )}
          </>
        ) : motion === 'first-article' ? (
          <>
            {currentStep === 1 && (
              <FaStep1_Profile
                profile={customerProfile}
                discoveryMode={discoveryMode}
                onUpdate={updateCustomerProfile}
                onNext={nextStep}
              />
            )}
            {currentStep === 2 && (
              <FaStep2_Intake
                intake={faMotion.intake}
                discoveryMode={discoveryMode}
                unvalidatedFields={uv}
                onUpdate={updateFaIntake}
                onMarkUnvalidated={markUnvalidated}
                onClearUnvalidated={clearUnvalidated}
                onNext={nextStep}
              />
            )}
            {currentStep === 3 && (
              <FaStep3_Output
                state={state}
                onEnsureSession={() => saveSessionForPrint(false)}
                onReset={reset}
                onEditStep={editStep}
              />
            )}
          </>
        ) : isEarlyExit ? (
          <EarlyExitScreen
            state={state}
            onSaveForPrint={() => saveSessionForPrint(true)}
            onBackToStep2={() => updateReadinessCheck({ routedToProServices: false })}
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
                onEarlyExit={handleEarlyExit}
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
            {currentStep === 5 && (
              <Step6_RoadmapOutput
                state={state}
                onEnsureSession={() => saveSessionForPrint(false)}
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
