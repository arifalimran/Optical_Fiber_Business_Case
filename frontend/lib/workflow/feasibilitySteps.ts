export type FeasibilityStep = 'assumptions' | 'revenue' | 'capex' | 'opex' | 'cashflow';

export type FeasibilityWorkflowState = Record<FeasibilityStep, boolean>;

export const FEASIBILITY_STEP_ORDER: FeasibilityStep[] = ['assumptions', 'revenue', 'capex', 'opex', 'cashflow'];

export const DEFAULT_WORKFLOW_STATE: FeasibilityWorkflowState = {
  assumptions: false,
  revenue: false,
  capex: false,
  opex: false,
  cashflow: false,
};

export const getWorkflowState = (inputParameters: unknown): FeasibilityWorkflowState => {
  if (!inputParameters || typeof inputParameters !== 'object') {
    return { ...DEFAULT_WORKFLOW_STATE };
  }

  const workflowRaw = (inputParameters as { workflowState?: unknown }).workflowState;
  if (!workflowRaw || typeof workflowRaw !== 'object') {
    return { ...DEFAULT_WORKFLOW_STATE };
  }

  const workflow = workflowRaw as Partial<Record<FeasibilityStep, unknown>>;

  return {
    assumptions: Boolean(workflow.assumptions),
    revenue: Boolean(workflow.revenue),
    capex: Boolean(workflow.capex),
    opex: Boolean(workflow.opex),
    cashflow: Boolean(workflow.cashflow),
  };
};

export const withUpdatedWorkflowState = (
  inputParameters: Record<string, unknown>,
  patch: Partial<FeasibilityWorkflowState>
): Record<string, unknown> => {
  const current = getWorkflowState(inputParameters);

  return {
    ...inputParameters,
    workflowState: {
      ...current,
      ...patch,
    },
  };
};

export const isStepAccessible = (
  targetStep: FeasibilityStep,
  workflowState: FeasibilityWorkflowState
): boolean => {
  const targetIndex = FEASIBILITY_STEP_ORDER.indexOf(targetStep);
  if (targetIndex <= 0) {
    return true;
  }

  return FEASIBILITY_STEP_ORDER.slice(0, targetIndex).every((step) => workflowState[step]);
};

export const areAllStepsCompleted = (workflowState: FeasibilityWorkflowState): boolean => {
  return FEASIBILITY_STEP_ORDER.every((step) => workflowState[step]);
};

export const getRunningStep = (workflowState: FeasibilityWorkflowState): FeasibilityStep | null => {
  return FEASIBILITY_STEP_ORDER.find((step) => !workflowState[step]) ?? null;
};

export const getStepProgressPercent = (workflowState: FeasibilityWorkflowState): number => {
  const completedCount = FEASIBILITY_STEP_ORDER.filter((step) => workflowState[step]).length;
  return Math.round((completedCount / FEASIBILITY_STEP_ORDER.length) * 100);
};
