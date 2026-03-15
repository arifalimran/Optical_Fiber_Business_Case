'use client';

import Link from 'next/link';
import { CheckCircle2, CircleDashed, Lock, PlayCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  FEASIBILITY_STEP_ORDER,
  FeasibilityStep,
  FeasibilityWorkflowState,
  getRunningStep,
  getStepProgressPercent,
  isStepAccessible,
} from '@/lib/workflow/feasibilitySteps';

type Props = {
  projectId: string;
  currentStep: FeasibilityStep;
  workflowState: FeasibilityWorkflowState;
};

const STEP_META: Record<
  FeasibilityStep,
  {
    title: string;
    short: string;
    href: (projectId: string) => string;
  }
> = {
  assumptions: {
    title: 'Step 1 · Assumptions',
    short: 'Assumptions',
    href: (projectId) => `/projects/${projectId}/assumptions`,
  },
  revenue: {
    title: 'Step 2 · Revenue',
    short: 'Revenue',
    href: (projectId) => `/projects/${projectId}/revenue`,
  },
  capex: {
    title: 'Step 3 · CapEx',
    short: 'CapEx',
    href: (projectId) => `/projects/${projectId}/capex`,
  },
  opex: {
    title: 'Step 4 · OpEx',
    short: 'OpEx',
    href: (projectId) => `/projects/${projectId}/opex`,
  },
  cashflow: {
    title: 'Step 5 · Cashflow',
    short: 'Cashflow',
    href: (projectId) => `/projects/${projectId}/cashflow`,
  },
};

export function FeasibilityProgress({ projectId, currentStep, workflowState }: Props) {
  const runningStep = getRunningStep(workflowState);
  const progressPercent = getStepProgressPercent(workflowState);

  return (
    <div className="rounded-xl border border-border/80 bg-card/85 p-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">Feasibility Progress</div>
        <Badge variant="secondary" className="text-xs">
          {progressPercent}% Complete
        </Badge>
      </div>

      <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        {FEASIBILITY_STEP_ORDER.map((step) => {
          const done = workflowState[step];
          const accessible = isStepAccessible(step, workflowState);
          const running = !done && runningStep === step;
          const isActivePage = currentStep === step;

          return (
            <Link
              key={step}
              href={STEP_META[step].href(projectId)}
              onClick={(event) => {
                if (!accessible) {
                  event.preventDefault();
                }
              }}
              className={cn(
                'rounded-lg border p-2.5 text-xs transition-colors',
                done && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                running && 'border-primary/40 bg-primary/10 text-primary',
                !done && !running && accessible && 'border-border bg-background/70 text-muted-foreground',
                !accessible && 'border-border/60 bg-muted/40 text-muted-foreground/70 cursor-not-allowed',
                isActivePage && 'ring-1 ring-primary/40'
              )}
              aria-disabled={!accessible}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{STEP_META[step].short}</span>
                {done ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : running ? (
                  <PlayCircle className="h-3.5 w-3.5" />
                ) : accessible ? (
                  <CircleDashed className="h-3.5 w-3.5" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
              </div>
              <div className="mt-1 opacity-80">
                {done ? 'Completed' : running ? 'Running' : accessible ? 'Pending' : 'Locked'}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
