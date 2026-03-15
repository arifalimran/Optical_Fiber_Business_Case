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

type Frequency = 'daily' | 'weekly' | 'monthly' | 'one-time';

type OpexRow = {
  id: string;
  item: string;
  quantity: number;
  unitRate: number;
  frequency: Frequency;
  durationMonths: number;
  escalationPercent: number;
  owner: string;
  notes: string;
};

type OpexData = {
  workforce: OpexRow[];
  operations: OpexRow[];
  logisticsFuel: OpexRow[];
  overheads: OpexRow[];
  maintenanceRisk: OpexRow[];
};

type SectionKey = keyof OpexData;

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

const safeNumber = (value: number): number => (Number.isFinite(value) ? value : 0);

const durationUnitLabel = (frequency: Frequency): string => {
  if (frequency === 'daily') return 'Days';
  if (frequency === 'weekly') return 'Weeks';
  if (frequency === 'monthly') return 'Months';
  return 'Once';
};

const createRow = (
  item = '',
  frequency: Frequency = 'monthly',
  quantity = 1,
  unitRate = 0,
  durationMonths = 3
): OpexRow => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  item,
  quantity,
  unitRate,
  frequency,
  durationMonths,
  escalationPercent: 0,
  owner: '',
  notes: '',
});

const DEFAULT_OPEX_DATA: OpexData = {
  workforce: [
    createRow('Site Supervisor', 'monthly', 1, 40000, 3),
    createRow('Operator/Technician', 'monthly', 2, 30000, 3),
    createRow('Labour Team', 'daily', 10, 1000, 3),
    createRow('Account/Admin Support', 'monthly', 1, 25000, 3),
  ],
  operations: [
    createRow('Warehouse Rental', 'monthly', 1, 10000, 3),
    createRow('Site Office Rental', 'monthly', 1, 15000, 3),
    createRow('Communication (Mobile/Data)', 'monthly', 1, 5000, 3),
    createRow('Consultant Fees', 'monthly', 1, 30000, 3),
  ],
  logisticsFuel: [
    createRow('Truck Rental', 'daily', 1, 5000, 3),
    createRow('Diesel/Fuel', 'daily', 1, 2000, 3),
    createRow('Mini-transport Support', 'daily', 1, 2500, 3),
    createRow('Generator & Fuel', 'daily', 1, 1000, 3),
  ],
  overheads: [
    createRow('Head Office Allocation', 'monthly', 1, 25000, 3),
    createRow('Office Stationery & Supplies', 'monthly', 1, 5000, 3),
    createRow('Regulatory/Compliance Follow-up', 'monthly', 1, 4000, 3),
    createRow('Staff Allowances/DA', 'monthly', 1, 6000, 3),
  ],
  maintenanceRisk: [
    createRow('Equipment Repair Reserve', 'monthly', 1, 3000, 3),
    createRow('Miscellaneous Risk Reserve', 'monthly', 1, 20000, 3),
    createRow('Performance Incentive Pool', 'one-time', 1, 30000, 1),
    createRow('Safety Incident Buffer', 'one-time', 1, 10000, 1),
  ],
};

const SECTION_META: Record<SectionKey, { title: string; description: string }> = {
  workforce: {
    title: 'Workforce Costs',
    description: 'Manpower and staffing costs.',
  },
  operations: {
    title: 'Operations & Office Costs',
    description: 'Site operations and office costs.',
  },
  logisticsFuel: {
    title: 'Logistics & Fuel',
    description: 'Transport, fuel, and movement costs.',
  },
  overheads: {
    title: 'Overheads',
    description: 'Admin and support overhead costs.',
  },
  maintenanceRisk: {
    title: 'Maintenance & Risk Reserves',
    description: 'Contingency and reliability reserves.',
  },
};

const frequencyRateLabel = (frequency: Frequency): string => {
  if (frequency === 'daily') return 'Daily Rate';
  if (frequency === 'weekly') return 'Weekly Rate';
  if (frequency === 'monthly') return 'Monthly Rate';
  return 'One-time Amount';
};

const getFrequencyUnits = (frequency: Frequency, unitValue: number): number => {
  const safeUnitValue = Math.max(0, safeNumber(unitValue));

  if (frequency === 'one-time') {
    return 1;
  }

  return safeUnitValue;
};

const getMonthEquivalent = (frequency: Frequency, unitValue: number): number => {
  const safeUnitValue = Math.max(0, safeNumber(unitValue));

  if (frequency === 'one-time') {
    return 0;
  }

  if (frequency === 'daily') {
    return safeUnitValue / 30;
  }

  if (frequency === 'weekly') {
    return safeUnitValue / 4;
  }

  return safeUnitValue;
};

const calculateOpexRowTotal = (row: OpexRow): number => {
  const normalizedQuantity = safeNumber(row.quantity);
  const unitRate = safeNumber(row.unitRate);
  const cycles = getFrequencyUnits(row.frequency, safeNumber(row.durationMonths));
  const monthEquivalent = getMonthEquivalent(row.frequency, safeNumber(row.durationMonths));
  const escalationFactor = 1 + (safeNumber(row.escalationPercent) / 100) * Math.max(0, monthEquivalent / 12);
  return normalizedQuantity * unitRate * cycles * escalationFactor;
};

const getOpexData = (inputParameters: Record<string, unknown>): OpexData => {
  const raw = inputParameters.opexData;
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_OPEX_DATA;
  }

  const candidate = raw as Partial<Record<SectionKey, unknown>>;

  const parseSection = (sectionKey: SectionKey): OpexRow[] => {
    const value = candidate[sectionKey];
    if (!Array.isArray(value) || value.length === 0) {
      return DEFAULT_OPEX_DATA[sectionKey];
    }

    return value.map((item) => {
      const row = item as Partial<OpexRow>;
      const frequency = row.frequency === 'daily' || row.frequency === 'weekly' || row.frequency === 'monthly' || row.frequency === 'one-time'
        ? row.frequency
        : 'monthly';

      return {
        id: row.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        item: typeof row.item === 'string' ? row.item : '',
        quantity: typeof row.quantity === 'number' ? row.quantity : Number(row.quantity ?? 0),
        unitRate: typeof row.unitRate === 'number' ? row.unitRate : Number(row.unitRate ?? 0),
        frequency,
        durationMonths: typeof row.durationMonths === 'number' ? row.durationMonths : Number(row.durationMonths ?? 1),
        escalationPercent: typeof row.escalationPercent === 'number' ? row.escalationPercent : Number(row.escalationPercent ?? 0),
        owner: typeof row.owner === 'string' ? row.owner : '',
        notes: typeof row.notes === 'string' ? row.notes : '',
      };
    });
  };

  return {
    workforce: parseSection('workforce'),
    operations: parseSection('operations'),
    logisticsFuel: parseSection('logisticsFuel'),
    overheads: parseSection('overheads'),
    maintenanceRisk: parseSection('maintenanceRisk'),
  };
};

export default function OpexStepPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [opexData, setOpexData] = useState<OpexData>(DEFAULT_OPEX_DATA);
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    workforce: true,
    operations: false,
    logisticsFuel: false,
    overheads: false,
    maintenanceRisk: false,
  });
  useEffect(() => {
    if (projectId) {
      void loadPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const workflowState = useMemo(() => {
    return getWorkflowState(project?.inputParameters ?? {});
  }, [project?.inputParameters]);

  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    (Object.keys(opexData) as SectionKey[]).forEach((sectionKey) => {
      const rows = opexData[sectionKey];
      if (!rows.length) {
        errors[`${sectionKey}.empty`] = 'At least one row is required';
      }

      rows.forEach((row) => {
        if (!row.item.trim()) {
          errors[`${sectionKey}.${row.id}.item`] = 'Item is required';
        }
        if (!Number.isFinite(row.quantity) || row.quantity <= 0) {
          errors[`${sectionKey}.${row.id}.quantity`] = 'Quantity must be > 0';
        }
        if (!Number.isFinite(row.unitRate) || row.unitRate < 0) {
          errors[`${sectionKey}.${row.id}.unitRate`] = 'Rate cannot be negative';
        }
        if (!Number.isFinite(row.durationMonths) || row.durationMonths < 1 || row.durationMonths > 365) {
          errors[`${sectionKey}.${row.id}.durationMonths`] = 'Unit should be between 1 and 365';
        }
        if (!Number.isFinite(row.escalationPercent) || row.escalationPercent < -100 || row.escalationPercent > 100) {
          errors[`${sectionKey}.${row.id}.escalationPercent`] = 'Escalation should be between -100 and 100';
        }
      });
    });

    return errors;
  }, [opexData]);

  const isStepValid = Object.keys(validationErrors).length === 0;

  const totals = useMemo(() => {
    const bySection = (Object.keys(opexData) as SectionKey[]).reduce<Record<SectionKey, number>>((acc, sectionKey) => {
      const sectionTotal = opexData[sectionKey].reduce((sum, row) => {
        return sum + calculateOpexRowTotal(row);
      }, 0);
      acc[sectionKey] = sectionTotal;
      return acc;
    }, {
      workforce: 0,
      operations: 0,
      logisticsFuel: 0,
      overheads: 0,
      maintenanceRisk: 0,
    });

    const total = Object.values(bySection).reduce((sum, value) => sum + value, 0);
    const monthlyEquivalent = total / Math.max(1, Math.round((project?.inputParameters?.project_duration_months as number) || 3));

    return { bySection, total, monthlyEquivalent };
  }, [opexData, project?.inputParameters]);

  const loadPage = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to load project');
      }

      const projectData: Project = await response.json();
      const currentWorkflow = getWorkflowState(projectData.inputParameters ?? {});

      if (!isStepAccessible('opex', currentWorkflow)) {
        toast.error('Complete Step 3 (CapEx) before Step 4');
        router.push(`/projects/${projectId}/capex`);
        return;
      }

      setProject(projectData);
      setOpexData(getOpexData(projectData.inputParameters ?? {}));
    } catch (error) {
      console.error('Error loading OpEx page:', error);
      toast.error('Failed to load Step 4 (OpEx)');
      router.push(`/projects/${projectId}`);
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (sectionKey: SectionKey, rowId: string, key: keyof OpexRow, value: string) => {
    setOpexData((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        if (key === 'quantity' || key === 'unitRate' || key === 'durationMonths' || key === 'escalationPercent') {
          return {
            ...row,
            [key]: parseNumberInput(value),
          };
        }

        if (key === 'frequency') {
          const normalized = value === 'daily' || value === 'weekly' || value === 'monthly' || value === 'one-time' ? value : 'monthly';
          return {
            ...row,
            frequency: normalized,
            durationMonths: normalized === 'one-time' ? 1 : row.durationMonths,
          };
        }

        return {
          ...row,
          [key]: value,
        };
      }),
    }));
  };

  const addRow = (sectionKey: SectionKey) => {
    setOpexData((prev) => ({
      ...prev,
      [sectionKey]: [...prev[sectionKey], createRow()],
    }));
  };

  const removeRow = (sectionKey: SectionKey, rowId: string) => {
    setOpexData((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter((row) => row.id !== rowId),
    }));
  };

  const saveOpex = async (completeStep: boolean) => {
    if (!project) {
      return;
    }

    setShowValidation(true);

    if (completeStep && !isStepValid) {
      toast.error('Fix all red fields before completing Step 4');
      return;
    }

    setSaving(true);
    try {
      const nextInputParameters = withUpdatedWorkflowState(
        {
          ...(project.inputParameters ?? {}),
          opexData,
          opexSummary: {
            bySection: totals.bySection,
            total: totals.total,
            monthlyEquivalent: totals.monthlyEquivalent,
          },
        },
        { opex: completeStep ? true : isStepValid }
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
        throw new Error('Failed to save OpEx data');
      }

      const updatedProject: Project = await response.json();
      setProject(updatedProject);

      if (completeStep) {
        toast.success('Step 4 completed. Proceeding to Step 5 (Cashflow).');
        router.push(`/projects/${project.id}/cashflow`);
      } else {
        toast.success('OpEx saved as draft');
      }
    } catch (error) {
      console.error('Error saving OpEx:', error);
      toast.error('Unable to save Step 4');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[35vh] gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading Step 4 (OpEx)...</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-4">
      <FeasibilityProgress projectId={project.id} currentStep="opex" workflowState={workflowState} />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Step 4 · OpEx Matrix</h1>
          <p className="text-xs text-muted-foreground">Define recurring operating costs with frequency, duration, and escalation for realistic projections.</p>
        </div>
        <Link href={`/projects/${project.id}/capex`}>
          <Button variant="outline" size="sm">Back to Step 3</Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Operational Summary</CardTitle>
          <CardDescription className="text-xs">Live estimate from Step 4 rows</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
            {(Object.keys(SECTION_META) as SectionKey[]).map((sectionKey) => (
              <div key={sectionKey} className="rounded-lg border p-2 bg-muted/30">
                <div className="text-[11px] text-muted-foreground">{SECTION_META[sectionKey].title}</div>
                <div className="font-semibold">{totals.bySection[sectionKey].toLocaleString()}</div>
              </div>
            ))}
            <div className="rounded-lg border border-primary/40 p-2 bg-primary/10">
              <div className="text-[11px] text-primary/90">Total OpEx</div>
              <div className="font-semibold text-primary">{totals.total.toLocaleString()}</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Monthly Equivalent: {totals.monthlyEquivalent.toLocaleString()}</div>
        </CardContent>
      </Card>

      {showValidation && !isStepValid && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-3 text-xs text-destructive">
            {Object.keys(validationErrors).length} validation issue(s) found. Missing or invalid fields are outlined in red.
          </CardContent>
        </Card>
      )}

      {(Object.keys(opexData) as SectionKey[]).map((sectionKey) => {
        const rows = opexData[sectionKey];
        const sectionOpen = openSections[sectionKey];

        return (
          <Card key={sectionKey} className="overflow-hidden">
            <CardHeader className="py-3">
              <button
                type="button"
                className="w-full flex items-center justify-between text-left"
                onClick={() => setOpenSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }))}
              >
                <div>
                  <CardTitle className="text-sm">{SECTION_META[sectionKey].title}</CardTitle>
                  <CardDescription className="text-xs line-clamp-1">{SECTION_META[sectionKey].description}</CardDescription>
                </div>
                {sectionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </CardHeader>

            {sectionOpen && (
              <CardContent className="space-y-3">
                {rows.map((row) => {
                  const itemError = validationErrors[`${sectionKey}.${row.id}.item`];
                  const quantityError = validationErrors[`${sectionKey}.${row.id}.quantity`];
                  const rateError = validationErrors[`${sectionKey}.${row.id}.unitRate`];
                  const durationError = validationErrors[`${sectionKey}.${row.id}.durationMonths`];
                  const escalationError = validationErrors[`${sectionKey}.${row.id}.escalationPercent`];
                  const rowTotal = calculateOpexRowTotal(row);

                  return (
                    <div key={row.id} className="rounded-lg border p-3.5 bg-background/70 space-y-3">
                      <div className="grid grid-cols-1 md:[grid-template-columns:repeat(16,minmax(0,1fr))] gap-3 items-start">
                        <div className="md:col-span-4 space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Cost Item</Label>
                          <Input
                            value={row.item}
                            onChange={(event) => updateRow(sectionKey, row.id, 'item', event.target.value)}
                            className={cn('h-8 text-xs', showValidation && itemError && 'border-destructive focus-visible:ring-destructive')}
                            placeholder="Enter line item"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Qty</Label>
                          <Input
                            type="number"
                            value={numberInputValue(row.quantity)}
                            onChange={(event) => updateRow(sectionKey, row.id, 'quantity', event.target.value)}
                            className={cn('h-8 text-xs', showValidation && quantityError && 'border-destructive focus-visible:ring-destructive')}
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Frequency</Label>
                          <select
                            value={row.frequency}
                            onChange={(event) => updateRow(sectionKey, row.id, 'frequency', event.target.value)}
                            className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="one-time">One-time</option>
                          </select>
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Rate</Label>
                          <Input
                            type="number"
                            value={numberInputValue(row.unitRate)}
                            onChange={(event) => updateRow(sectionKey, row.id, 'unitRate', event.target.value)}
                            className={cn('h-8 text-xs', showValidation && rateError && 'border-destructive focus-visible:ring-destructive')}
                            placeholder={frequencyRateLabel(row.frequency)}
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Unit ({durationUnitLabel(row.frequency)})</Label>
                          <Input
                            type="number"
                            value={row.frequency === 'one-time' ? '1' : numberInputValue(row.durationMonths)}
                            onChange={(event) => updateRow(sectionKey, row.id, 'durationMonths', event.target.value)}
                            className={cn('h-8 text-xs', showValidation && durationError && 'border-destructive focus-visible:ring-destructive')}
                            disabled={row.frequency === 'one-time'}
                            placeholder={durationUnitLabel(row.frequency)}
                          />
                        </div>

                        <div className="md:col-span-1 space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Esc%</Label>
                          <Input
                            type="number"
                            value={numberInputValue(row.escalationPercent)}
                            onChange={(event) => updateRow(sectionKey, row.id, 'escalationPercent', event.target.value)}
                            className={cn('h-8 text-xs', showValidation && escalationError && 'border-destructive focus-visible:ring-destructive')}
                          />
                        </div>

                        <div className="md:col-span-1 flex justify-end pt-5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => removeRow(sectionKey, row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center text-[11px] text-muted-foreground">
                        <div className="md:col-span-6">
                          <Input
                            value={row.notes}
                            onChange={(event) => updateRow(sectionKey, row.id, 'notes', event.target.value)}
                            className="h-7 text-[11px]"
                            placeholder="Comments / assumptions"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <Input
                            value={row.owner}
                            onChange={(event) => updateRow(sectionKey, row.id, 'owner', event.target.value)}
                            className="h-7 text-[11px]"
                            placeholder="Owner"
                          />
                        </div>
                        <div className="md:col-span-3 text-right">
                          <div className="font-medium text-foreground">Line Total: {rowTotal.toLocaleString()}</div>
                          <div className="text-[10px] text-muted-foreground">
                            Formula: Qty × Rate × FrequencyUnit × Escalation
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <Button type="button" variant="outline" size="sm" onClick={() => addRow(sectionKey)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Dynamic Row
                </Button>
              </CardContent>
            )}
          </Card>
        );
      })}

      <div className="flex flex-wrap justify-between items-center gap-2 pt-1">
        <div className="text-xs text-muted-foreground">
          {isStepValid ? 'Step 4 validation passed.' : 'Step 4 has missing or invalid fields.'}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => saveOpex(false)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Draft
          </Button>
          <Button onClick={() => saveOpex(true)} disabled={saving}>
            Complete Step 4
          </Button>
        </div>
      </div>
    </div>
  );
}
