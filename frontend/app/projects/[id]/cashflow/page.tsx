'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { FeasibilityProgress } from '@/components/projects/FeasibilityProgress';
import {
  areAllStepsCompleted,
  getWorkflowState,
  isStepAccessible,
  withUpdatedWorkflowState,
} from '@/lib/workflow/feasibilitySteps';

type Project = {
  id: string;
  projectName: string;
  templateCode: string;
  inputParameters: Record<string, unknown>;
  status: string;
};

type InflowRow = {
  id: string;
  label: string;
  percent: number;
  dueMonth: number;
  delayDays: number;
};

type OutflowRow = {
  id: string;
  label: string;
  amount: number;
  dueMonth: number;
};

type FinancingRow = {
  id: string;
  label: string;
  amount: number;
  startMonth: number;
  annualRate: number;
};

type CashflowSettings = {
  estimatedContractValue: number;
  durationMonths: number;
  retentionPercent: number;
  retentionReleaseMonth: number;
  defaultPaymentDelayDays: number;
  workingCapitalBuffer: number;
};

type CashflowData = {
  settings: CashflowSettings;
  inflows: InflowRow[];
  outflows: OutflowRow[];
  financing: FinancingRow[];
};

const parseNumberInput = (value: string): number => {
  if (value.trim() === '') {
    return Number.NaN;
  }
  return Number(value);
};

const numberInputValue = (value: number): string => {
  if (!Number.isFinite(value) || value === 0) {
    return '';
  }
  return `${value}`;
};

const createInflow = (label = '', percent = 0, dueMonth = 0, delayDays = 30): InflowRow => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  label,
  percent,
  dueMonth,
  delayDays,
});

const createOutflow = (label = '', amount = 0, dueMonth = 0): OutflowRow => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  label,
  amount,
  dueMonth,
});

const createFinancing = (label = '', amount = 0, startMonth = 0, annualRate = 14): FinancingRow => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  label,
  amount,
  startMonth,
  annualRate,
});

const DEFAULT_CASHFLOW: CashflowData = {
  settings: {
    estimatedContractValue: 10000000,
    durationMonths: 3,
    retentionPercent: 10,
    retentionReleaseMonth: 6,
    defaultPaymentDelayDays: 30,
    workingCapitalBuffer: 250000,
  },
  inflows: [
    createInflow('Client Advance', 20, 0, 0),
    createInflow('Milestone 1 - 40% completion', 35, 1, 30),
    createInflow('Milestone 2 - 80% completion', 35, 2, 30),
    createInflow('Final + Retention Release', 10, 3, 60),
  ],
  outflows: [
    createOutflow('Permit & Documentation', 50000, 0),
    createOutflow('Site Readiness & Mobilization', 90000, 0),
    createOutflow('Compliance / QA / Testing', 25000, 2),
  ],
  financing: [
    createFinancing('Working Capital Facility', 1000000, 0, 14),
  ],
};

const parseCashflowData = (inputParameters: Record<string, unknown>): CashflowData => {
  const raw = inputParameters.cashflowData;
  if (!raw || typeof raw !== 'object') {
    const capexTotal = Number((inputParameters.capexSummary as { total?: unknown } | undefined)?.total ?? 0);
    const opexTotal = Number((inputParameters.opexSummary as { total?: unknown } | undefined)?.total ?? 0);
    const grossRevenue = Number((inputParameters.revenueSummary as { grossTotal?: unknown } | undefined)?.grossTotal ?? inputParameters.estimated_revenue ?? 0);
    const netReceivable = Number((inputParameters.revenueSummary as { netReceivable?: unknown } | undefined)?.netReceivable ?? 0);

    return {
      ...DEFAULT_CASHFLOW,
      settings: {
        ...DEFAULT_CASHFLOW.settings,
        estimatedContractValue: netReceivable > 0
          ? netReceivable
          : grossRevenue > 0
            ? grossRevenue
            : DEFAULT_CASHFLOW.settings.estimatedContractValue,
        durationMonths: Math.max(1, Number(inputParameters.project_duration_months ?? DEFAULT_CASHFLOW.settings.durationMonths)),
        workingCapitalBuffer: Math.max(200000, Math.round((capexTotal + opexTotal) * 0.05)),
      },
    };
  }

  const candidate = raw as Partial<CashflowData>;

  const settingsRaw = candidate.settings ?? {};
  const settings: CashflowSettings = {
    estimatedContractValue: Number((settingsRaw as Partial<CashflowSettings>).estimatedContractValue ?? DEFAULT_CASHFLOW.settings.estimatedContractValue),
    durationMonths: Number((settingsRaw as Partial<CashflowSettings>).durationMonths ?? DEFAULT_CASHFLOW.settings.durationMonths),
    retentionPercent: Number((settingsRaw as Partial<CashflowSettings>).retentionPercent ?? DEFAULT_CASHFLOW.settings.retentionPercent),
    retentionReleaseMonth: Number((settingsRaw as Partial<CashflowSettings>).retentionReleaseMonth ?? DEFAULT_CASHFLOW.settings.retentionReleaseMonth),
    defaultPaymentDelayDays: Number((settingsRaw as Partial<CashflowSettings>).defaultPaymentDelayDays ?? DEFAULT_CASHFLOW.settings.defaultPaymentDelayDays),
    workingCapitalBuffer: Number((settingsRaw as Partial<CashflowSettings>).workingCapitalBuffer ?? DEFAULT_CASHFLOW.settings.workingCapitalBuffer),
  };

  const inflows = Array.isArray(candidate.inflows) && candidate.inflows.length
    ? candidate.inflows.map((row) => ({
        id: row.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        label: row.label || '',
        percent: Number(row.percent ?? 0),
        dueMonth: Number(row.dueMonth ?? 0),
        delayDays: Number(row.delayDays ?? 0),
      }))
    : DEFAULT_CASHFLOW.inflows;

  const outflows = Array.isArray(candidate.outflows) && candidate.outflows.length
    ? candidate.outflows.map((row) => ({
        id: row.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        label: row.label || '',
        amount: Number(row.amount ?? 0),
        dueMonth: Number(row.dueMonth ?? 0),
      }))
    : DEFAULT_CASHFLOW.outflows;

  const financing = Array.isArray(candidate.financing) && candidate.financing.length
    ? candidate.financing.map((row) => ({
        id: row.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        label: row.label || '',
        amount: Number(row.amount ?? 0),
        startMonth: Number(row.startMonth ?? 0),
        annualRate: Number(row.annualRate ?? 0),
      }))
    : DEFAULT_CASHFLOW.financing;

  return {
    settings,
    inflows,
    outflows,
    financing,
  };
};

export default function CashflowStepPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [cashflowData, setCashflowData] = useState<CashflowData>(DEFAULT_CASHFLOW);
  const [openSections, setOpenSections] = useState({
    settings: true,
    inflows: false,
    outflows: false,
    financing: false,
    matrix: true,
  });

  useEffect(() => {
    if (projectId) {
      void loadPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const workflowState = useMemo(() => getWorkflowState(project?.inputParameters ?? {}), [project?.inputParameters]);

  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    if (!Number.isFinite(cashflowData.settings.estimatedContractValue) || cashflowData.settings.estimatedContractValue <= 0) {
      errors.settingsContractValue = 'Estimated contract value must be greater than 0';
    }
    if (!Number.isFinite(cashflowData.settings.durationMonths) || cashflowData.settings.durationMonths < 1 || cashflowData.settings.durationMonths > 60) {
      errors.settingsDuration = 'Duration must be between 1 and 60 months';
    }
    if (!Number.isFinite(cashflowData.settings.retentionPercent) || cashflowData.settings.retentionPercent < 0 || cashflowData.settings.retentionPercent > 40) {
      errors.settingsRetention = 'Retention should be between 0 and 40%';
    }
    if (!Number.isFinite(cashflowData.settings.retentionReleaseMonth) || cashflowData.settings.retentionReleaseMonth < 0 || cashflowData.settings.retentionReleaseMonth > 60) {
      errors.settingsRetentionMonth = 'Retention release month must be 0-60';
    }

    const inflowPercentTotal = cashflowData.inflows.reduce((sum, row) => sum + row.percent, 0);
    if (Math.abs(inflowPercentTotal - 100) > 0.01) {
      errors.inflowPercentTotal = `Inflow percentages must total 100%. Current: ${inflowPercentTotal.toFixed(2)}%`;
    }

    cashflowData.inflows.forEach((row) => {
      if (!row.label.trim()) {
        errors[`inflow.${row.id}.label`] = 'Label is required';
      }
      if (!Number.isFinite(row.percent) || row.percent <= 0 || row.percent > 100) {
        errors[`inflow.${row.id}.percent`] = 'Percent must be between 0 and 100';
      }
      if (!Number.isFinite(row.dueMonth) || row.dueMonth < 0 || row.dueMonth > 60) {
        errors[`inflow.${row.id}.dueMonth`] = 'Due month must be 0-60';
      }
      if (!Number.isFinite(row.delayDays) || row.delayDays < 0 || row.delayDays > 180) {
        errors[`inflow.${row.id}.delayDays`] = 'Delay days must be 0-180';
      }
    });

    cashflowData.outflows.forEach((row) => {
      if (!row.label.trim()) {
        errors[`outflow.${row.id}.label`] = 'Label is required';
      }
      if (!Number.isFinite(row.amount) || row.amount < 0) {
        errors[`outflow.${row.id}.amount`] = 'Amount cannot be negative';
      }
      if (!Number.isFinite(row.dueMonth) || row.dueMonth < 0 || row.dueMonth > 60) {
        errors[`outflow.${row.id}.dueMonth`] = 'Due month must be 0-60';
      }
    });

    cashflowData.financing.forEach((row) => {
      if (!row.label.trim()) {
        errors[`financing.${row.id}.label`] = 'Label is required';
      }
      if (!Number.isFinite(row.amount) || row.amount < 0) {
        errors[`financing.${row.id}.amount`] = 'Amount cannot be negative';
      }
      if (!Number.isFinite(row.startMonth) || row.startMonth < 0 || row.startMonth > 60) {
        errors[`financing.${row.id}.startMonth`] = 'Start month must be 0-60';
      }
      if (!Number.isFinite(row.annualRate) || row.annualRate < 0 || row.annualRate > 50) {
        errors[`financing.${row.id}.annualRate`] = 'Annual rate must be between 0 and 50';
      }
    });

    return errors;
  }, [cashflowData]);

  const isStepValid = Object.keys(validationErrors).length === 0;

  const matrix = useMemo(() => {
    const capexTotal = Number((project?.inputParameters?.capexSummary as { total?: unknown } | undefined)?.total ?? 0);
    const opexTotal = Number((project?.inputParameters?.opexSummary as { total?: unknown } | undefined)?.total ?? 0);
    const months = Math.max(cashflowData.settings.durationMonths, cashflowData.settings.retentionReleaseMonth, 1) + 1;

    const inflowByMonth = Array.from({ length: months }, () => 0);
    const outflowByMonth = Array.from({ length: months }, () => 0);

    const contractValue = cashflowData.settings.estimatedContractValue;
    cashflowData.inflows.forEach((row) => {
      const month = Math.min(months - 1, Math.max(0, row.dueMonth + Math.round(row.delayDays / 30)));
      inflowByMonth[month] += contractValue * (row.percent / 100);
    });

    const monthlyOpex = opexTotal / Math.max(1, cashflowData.settings.durationMonths);
    outflowByMonth[0] += capexTotal;
    for (let month = 0; month < Math.max(1, cashflowData.settings.durationMonths); month += 1) {
      outflowByMonth[month] += monthlyOpex;
    }

    cashflowData.outflows.forEach((row) => {
      const month = Math.min(months - 1, Math.max(0, row.dueMonth));
      outflowByMonth[month] += row.amount;
    });

    cashflowData.financing.forEach((row) => {
      const startMonth = Math.min(months - 1, Math.max(0, row.startMonth));
      inflowByMonth[startMonth] += row.amount;
      const monthlyInterest = row.amount * (row.annualRate / 100) / 12;
      for (let month = startMonth; month < months; month += 1) {
        outflowByMonth[month] += monthlyInterest;
      }
    });

    let cumulative = -cashflowData.settings.workingCapitalBuffer;
    let peakDeficit = 0;

    const rows = Array.from({ length: months }, (_, month) => {
      const net = inflowByMonth[month] - outflowByMonth[month];
      cumulative += net;
      peakDeficit = Math.min(peakDeficit, cumulative);

      return {
        month,
        inflow: inflowByMonth[month],
        outflow: outflowByMonth[month],
        net,
        cumulative,
      };
    });

    const breakEvenMonth = rows.find((row) => row.cumulative >= 0)?.month ?? null;

    return {
      rows,
      peakDeficit: Math.abs(peakDeficit),
      breakEvenMonth,
      endingCash: rows[rows.length - 1]?.cumulative ?? 0,
    };
  }, [cashflowData, project?.inputParameters]);

  const loadPage = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to load project');
      }

      const projectData: Project = await response.json();
      const currentWorkflow = getWorkflowState(projectData.inputParameters ?? {});

      if (!isStepAccessible('cashflow', currentWorkflow)) {
        toast.error('Complete Step 4 (OpEx) before Step 5');
        router.push(`/projects/${projectId}/opex`);
        return;
      }

      setProject(projectData);
      setCashflowData(parseCashflowData(projectData.inputParameters ?? {}));
    } catch (error) {
      console.error('Error loading Cashflow page:', error);
      toast.error('Failed to load Step 5 (Cashflow)');
      router.push(`/projects/${projectId}`);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (key: keyof CashflowSettings, value: string) => {
    setCashflowData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: parseNumberInput(value),
      },
    }));
  };

  const updateInflow = (rowId: string, key: keyof InflowRow, value: string) => {
    setCashflowData((prev) => ({
      ...prev,
      inflows: prev.inflows.map((row) => {
        if (row.id !== rowId) return row;
        if (key === 'label') return { ...row, label: value };
        return { ...row, [key]: parseNumberInput(value) };
      }),
    }));
  };

  const updateOutflow = (rowId: string, key: keyof OutflowRow, value: string) => {
    setCashflowData((prev) => ({
      ...prev,
      outflows: prev.outflows.map((row) => {
        if (row.id !== rowId) return row;
        if (key === 'label') return { ...row, label: value };
        return { ...row, [key]: parseNumberInput(value) };
      }),
    }));
  };

  const updateFinancing = (rowId: string, key: keyof FinancingRow, value: string) => {
    setCashflowData((prev) => ({
      ...prev,
      financing: prev.financing.map((row) => {
        if (row.id !== rowId) return row;
        if (key === 'label') return { ...row, label: value };
        return { ...row, [key]: parseNumberInput(value) };
      }),
    }));
  };

  const saveCashflow = async (completeStep: boolean) => {
    if (!project) return;

    setShowValidation(true);

    if (completeStep && !isStepValid) {
      toast.error('Fix all validation errors before completing Step 5');
      return;
    }

    setSaving(true);
    try {
      const nextInputParameters = withUpdatedWorkflowState(
        {
          ...(project.inputParameters ?? {}),
          cashflowData,
          cashflowSummary: {
            peakDeficit: matrix.peakDeficit,
            breakEvenMonth: matrix.breakEvenMonth,
            endingCash: matrix.endingCash,
          },
        },
        { cashflow: completeStep ? true : isStepValid }
      );

      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputParameters: nextInputParameters,
          status: project.status === 'APPROVED' ? 'APPROVED' : 'DRAFT',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save Step 5');
      }

      const updatedProject: Project = await response.json();
      setProject(updatedProject);

      if (completeStep) {
        toast.success('Step 5 completed. Final decision calculation is now enabled.');
        router.push(`/projects/${project.id}`);
      } else {
        toast.success('Cashflow draft saved');
      }
    } catch (error) {
      console.error('Error saving cashflow data:', error);
      toast.error('Unable to save Step 5');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[35vh] gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading Step 5 (Cashflow)...</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const finalReady = areAllStepsCompleted(workflowState);

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-4">
      <FeasibilityProgress projectId={project.id} currentStep="cashflow" workflowState={workflowState} />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Step 5 · Cashflow Matrix</h1>
          <p className="text-xs text-muted-foreground">Model inflows, outflows, financing timing, and cumulative cash to avoid liquidity surprises.</p>
        </div>
        <Link href={`/projects/${project.id}/opex`}>
          <Button variant="outline" size="sm">Back to Step 4</Button>
        </Link>
      </div>

      {showValidation && !isStepValid && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-3 text-xs text-destructive">
            {Object.keys(validationErrors).length} issue(s) found. Invalid fields are outlined in red.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="py-3">
          <button type="button" className="w-full flex items-center justify-between" onClick={() => setOpenSections((prev) => ({ ...prev, settings: !prev.settings }))}>
            <div className="text-left">
              <CardTitle className="text-sm">Cashflow Settings</CardTitle>
              <CardDescription className="text-xs">Contract value, duration, payment and retention assumptions.</CardDescription>
            </div>
            {openSections.settings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </CardHeader>
        {openSections.settings && (
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Estimated Contract Value</Label>
              <Input
                type="number"
                value={numberInputValue(cashflowData.settings.estimatedContractValue)}
                onChange={(event) => updateSettings('estimatedContractValue', event.target.value)}
                className={cn('h-8 text-xs', showValidation && validationErrors.settingsContractValue && 'border-destructive focus-visible:ring-destructive')}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Duration (Months)</Label>
              <Input
                type="number"
                value={numberInputValue(cashflowData.settings.durationMonths)}
                onChange={(event) => updateSettings('durationMonths', event.target.value)}
                className={cn('h-8 text-xs', showValidation && validationErrors.settingsDuration && 'border-destructive focus-visible:ring-destructive')}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Default Payment Delay (Days)</Label>
              <Input
                type="number"
                value={numberInputValue(cashflowData.settings.defaultPaymentDelayDays)}
                onChange={(event) => updateSettings('defaultPaymentDelayDays', event.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Retention %</Label>
              <Input
                type="number"
                value={numberInputValue(cashflowData.settings.retentionPercent)}
                onChange={(event) => updateSettings('retentionPercent', event.target.value)}
                className={cn('h-8 text-xs', showValidation && validationErrors.settingsRetention && 'border-destructive focus-visible:ring-destructive')}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Retention Release Month</Label>
              <Input
                type="number"
                value={numberInputValue(cashflowData.settings.retentionReleaseMonth)}
                onChange={(event) => updateSettings('retentionReleaseMonth', event.target.value)}
                className={cn('h-8 text-xs', showValidation && validationErrors.settingsRetentionMonth && 'border-destructive focus-visible:ring-destructive')}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Working Capital Buffer</Label>
              <Input
                type="number"
                value={numberInputValue(cashflowData.settings.workingCapitalBuffer)}
                onChange={(event) => updateSettings('workingCapitalBuffer', event.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="py-3">
          <button type="button" className="w-full flex items-center justify-between" onClick={() => setOpenSections((prev) => ({ ...prev, inflows: !prev.inflows }))}>
            <div className="text-left">
              <CardTitle className="text-sm">Inflow Milestones</CardTitle>
              <CardDescription className="text-xs">Percent-based receivable schedule from client.</CardDescription>
            </div>
            {openSections.inflows ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </CardHeader>
        {openSections.inflows && (
          <CardContent className="space-y-2.5">
            {cashflowData.inflows.map((row) => (
              <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end rounded-lg border p-2 bg-background/70">
                <div className="md:col-span-4 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Milestone</Label>
                  <Input
                    value={row.label}
                    onChange={(event) => updateInflow(row.id, 'label', event.target.value)}
                    className={cn('h-8 text-xs', showValidation && validationErrors[`inflow.${row.id}.label`] && 'border-destructive focus-visible:ring-destructive')}
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Percent</Label>
                  <Input
                    type="number"
                    value={numberInputValue(row.percent)}
                    onChange={(event) => updateInflow(row.id, 'percent', event.target.value)}
                    className={cn('h-8 text-xs', showValidation && validationErrors[`inflow.${row.id}.percent`] && 'border-destructive focus-visible:ring-destructive')}
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Due Month</Label>
                  <Input
                    type="number"
                    value={numberInputValue(row.dueMonth)}
                    onChange={(event) => updateInflow(row.id, 'dueMonth', event.target.value)}
                    className={cn('h-8 text-xs', showValidation && validationErrors[`inflow.${row.id}.dueMonth`] && 'border-destructive focus-visible:ring-destructive')}
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Delay (Days)</Label>
                  <Input
                    type="number"
                    value={numberInputValue(row.delayDays)}
                    onChange={(event) => updateInflow(row.id, 'delayDays', event.target.value)}
                    className={cn('h-8 text-xs', showValidation && validationErrors[`inflow.${row.id}.delayDays`] && 'border-destructive focus-visible:ring-destructive')}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCashflowData((prev) => ({ ...prev, inflows: prev.inflows.filter((item) => item.id !== row.id) }))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setCashflowData((prev) => ({ ...prev, inflows: [...prev.inflows, createInflow()] }))}>
                <Plus className="h-4 w-4 mr-1" /> Add Dynamic Inflow
              </Button>
              <div className={cn('text-xs', validationErrors.inflowPercentTotal ? 'text-destructive' : 'text-muted-foreground')}>
                Total Inflow %: {cashflowData.inflows.reduce((sum, row) => sum + row.percent, 0).toFixed(2)}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="py-3">
          <button type="button" className="w-full flex items-center justify-between" onClick={() => setOpenSections((prev) => ({ ...prev, outflows: !prev.outflows }))}>
            <div className="text-left">
              <CardTitle className="text-sm">Additional Outflows</CardTitle>
              <CardDescription className="text-xs">Specific month-based outflow events beyond CapEx/OpEx base model.</CardDescription>
            </div>
            {openSections.outflows ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </CardHeader>
        {openSections.outflows && (
          <CardContent className="space-y-2.5">
            {cashflowData.outflows.map((row) => (
              <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end rounded-lg border p-2 bg-background/70">
                <div className="md:col-span-6 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Outflow Item</Label>
                  <Input
                    value={row.label}
                    onChange={(event) => updateOutflow(row.id, 'label', event.target.value)}
                    className={cn('h-8 text-xs', showValidation && validationErrors[`outflow.${row.id}.label`] && 'border-destructive focus-visible:ring-destructive')}
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Amount</Label>
                  <Input
                    type="number"
                    value={numberInputValue(row.amount)}
                    onChange={(event) => updateOutflow(row.id, 'amount', event.target.value)}
                    className={cn('h-8 text-xs', showValidation && validationErrors[`outflow.${row.id}.amount`] && 'border-destructive focus-visible:ring-destructive')}
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Month</Label>
                  <Input
                    type="number"
                    value={numberInputValue(row.dueMonth)}
                    onChange={(event) => updateOutflow(row.id, 'dueMonth', event.target.value)}
                    className={cn('h-8 text-xs', showValidation && validationErrors[`outflow.${row.id}.dueMonth`] && 'border-destructive focus-visible:ring-destructive')}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCashflowData((prev) => ({ ...prev, outflows: prev.outflows.filter((item) => item.id !== row.id) }))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setCashflowData((prev) => ({ ...prev, outflows: [...prev.outflows, createOutflow()] }))}>
              <Plus className="h-4 w-4 mr-1" /> Add Dynamic Outflow
            </Button>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="py-3">
          <button type="button" className="w-full flex items-center justify-between" onClick={() => setOpenSections((prev) => ({ ...prev, financing: !prev.financing }))}>
            <div className="text-left">
              <CardTitle className="text-sm">Financing Lines</CardTitle>
              <CardDescription className="text-xs">Optional facilities/loans and interest burden timeline.</CardDescription>
            </div>
            {openSections.financing ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </CardHeader>
        {openSections.financing && (
          <CardContent className="space-y-2.5">
            {cashflowData.financing.map((row) => (
              <div key={row.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end rounded-lg border p-2 bg-background/70">
                <div className="md:col-span-5 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Financing Item</Label>
                  <Input
                    value={row.label}
                    onChange={(event) => updateFinancing(row.id, 'label', event.target.value)}
                    className={cn('h-8 text-xs', showValidation && validationErrors[`financing.${row.id}.label`] && 'border-destructive focus-visible:ring-destructive')}
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Amount</Label>
                  <Input
                    type="number"
                    value={numberInputValue(row.amount)}
                    onChange={(event) => updateFinancing(row.id, 'amount', event.target.value)}
                    className={cn('h-8 text-xs', showValidation && validationErrors[`financing.${row.id}.amount`] && 'border-destructive focus-visible:ring-destructive')}
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Start Month</Label>
                  <Input
                    type="number"
                    value={numberInputValue(row.startMonth)}
                    onChange={(event) => updateFinancing(row.id, 'startMonth', event.target.value)}
                    className={cn('h-8 text-xs', showValidation && validationErrors[`financing.${row.id}.startMonth`] && 'border-destructive focus-visible:ring-destructive')}
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Annual %</Label>
                  <Input
                    type="number"
                    value={numberInputValue(row.annualRate)}
                    onChange={(event) => updateFinancing(row.id, 'annualRate', event.target.value)}
                    className={cn('h-8 text-xs', showValidation && validationErrors[`financing.${row.id}.annualRate`] && 'border-destructive focus-visible:ring-destructive')}
                  />
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCashflowData((prev) => ({ ...prev, financing: prev.financing.filter((item) => item.id !== row.id) }))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setCashflowData((prev) => ({ ...prev, financing: [...prev.financing, createFinancing()] }))}>
              <Plus className="h-4 w-4 mr-1" /> Add Dynamic Financing
            </Button>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="py-3">
          <button type="button" className="w-full flex items-center justify-between" onClick={() => setOpenSections((prev) => ({ ...prev, matrix: !prev.matrix }))}>
            <div className="text-left">
              <CardTitle className="text-sm">Cashflow Matrix Preview</CardTitle>
              <CardDescription className="text-xs">Month-wise inflow/outflow/net/cumulative cash trend.</CardDescription>
            </div>
            {openSections.matrix ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </CardHeader>
        {openSections.matrix && (
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg border p-2 bg-muted/30">
                <div className="text-muted-foreground text-[11px]">Peak Deficit</div>
                <div className="font-semibold">{matrix.peakDeficit.toLocaleString()}</div>
              </div>
              <div className="rounded-lg border p-2 bg-muted/30">
                <div className="text-muted-foreground text-[11px]">Break-even Month</div>
                <div className="font-semibold">{matrix.breakEvenMonth === null ? 'Not reached' : matrix.breakEvenMonth}</div>
              </div>
              <div className="rounded-lg border p-2 bg-muted/30">
                <div className="text-muted-foreground text-[11px]">Ending Cash</div>
                <div className="font-semibold">{matrix.endingCash.toLocaleString()}</div>
              </div>
            </div>

            <div className="rounded-lg border overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-2 py-1.5">Month</th>
                    <th className="text-right px-2 py-1.5">Inflow</th>
                    <th className="text-right px-2 py-1.5">Outflow</th>
                    <th className="text-right px-2 py-1.5">Net</th>
                    <th className="text-right px-2 py-1.5">Cumulative</th>
                  </tr>
                </thead>
                <tbody>
                  {matrix.rows.map((row) => (
                    <tr key={row.month} className="border-t">
                      <td className="px-2 py-1.5">M{row.month}</td>
                      <td className="px-2 py-1.5 text-right">{row.inflow.toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-right">{row.outflow.toLocaleString()}</td>
                      <td className={cn('px-2 py-1.5 text-right font-medium', row.net < 0 ? 'text-destructive' : 'text-emerald-600')}>{row.net.toLocaleString()}</td>
                      <td className={cn('px-2 py-1.5 text-right font-medium', row.cumulative < 0 ? 'text-destructive' : 'text-emerald-600')}>{row.cumulative.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="flex flex-wrap justify-between items-center gap-2 pt-1">
        <div className="text-xs text-muted-foreground">
          {finalReady ? 'All steps completed. Decision calculation can now run.' : 'Complete all five steps to enable decision calculation.'}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => saveCashflow(false)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Draft
          </Button>
          <Button onClick={() => saveCashflow(true)} disabled={saving}>
            Complete Step 5
          </Button>
          <Link href={`/projects/${project.id}`}>
            <Button variant="outline" disabled={!finalReady}>Go to Decision</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
