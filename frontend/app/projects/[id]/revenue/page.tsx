'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
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

type RevenueCategory = 'service' | 'material' | 'other';

type RevenueRow = {
  id: string;
  scopeOfWork: string;
  category: RevenueCategory;
  unitType: string;
  quantity: number;
  unit: string;
  unitRate: number;
  notes: string;
};

type RevenueSettings = {
  vatPercent: number;
  taxPercent: number;
};

type RevenueData = {
  rows: RevenueRow[];
  settings: RevenueSettings;
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

const safeNumber = (value: number): number => (Number.isFinite(value) ? value : 0);

const DEFAULT_REVENUE_UNIT_TYPES = [
  'Lump Sum',
  'Length Based',
  'Quantity Based',
  'Site Based',
  'Man-Day',
  'Service Fee',
  'Supply Item',
];

const DEFAULT_REVENUE_UNITS = [
  'm',
  'km',
  'foot',
  'kg',
  'ton',
  'litre',
  'piece',
  'lot',
  'drum',
  'dozen',
  'set',
  'site',
  'day',
  'month',
];

const ADD_NEW_UNIT_TYPE_OPTION = '__add_new_unit_type__';
const ADD_NEW_UNIT_OPTION = '__add_new_unit__';

const mergeUniqueText = (baseTypes: string[], extraTypes: string[]): string[] => {
  const seen = new Set<string>();
  const merged: string[] = [];

  [...baseTypes, ...extraTypes].forEach((type) => {
    const normalized = type.trim();
    if (!normalized) {
      return;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push(normalized);
  });

  return merged;
};

const createRevenueRow = (
  scopeOfWork = '',
  category: RevenueCategory = 'service',
  unitType = 'Lump Sum',
  quantity = 1,
  unit = 'lot',
  unitRate = 0
): RevenueRow => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  scopeOfWork,
  category,
  unitType,
  quantity,
  unit,
  unitRate,
  notes: '',
});

const DEFAULT_REVENUE_DATA: RevenueData = {
  rows: [
    createRevenueRow('Fiber survey and route marking', 'service', 'Service Fee', 1, 'lot', 150000),
    createRevenueRow('Optical fiber cable supply', 'material', 'Length Based', 30000, 'm', 120),
    createRevenueRow('Civil restoration and handover documentation', 'other', 'Lump Sum', 1, 'lot', 85000),
  ],
  settings: {
    vatPercent: 10,
    taxPercent: 5,
  },
};

const getRevenueData = (inputParameters: Record<string, unknown>): RevenueData => {
  const raw = inputParameters.revenueData;
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_REVENUE_DATA;
  }

  const candidate = raw as Partial<RevenueData>;

  const rows = Array.isArray(candidate.rows) && candidate.rows.length
    ? candidate.rows.map((entry) => {
        const row = entry as Partial<RevenueRow>;
        const category = row.category === 'service' || row.category === 'material' || row.category === 'other'
          ? row.category
          : 'service';

        return {
          id: row.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          scopeOfWork: typeof row.scopeOfWork === 'string' ? row.scopeOfWork : '',
          category,
          unitType: typeof row.unitType === 'string' && row.unitType.trim() ? row.unitType.trim() : 'Lump Sum',
          quantity: typeof row.quantity === 'number' ? row.quantity : Number(row.quantity ?? 0),
          unit: typeof row.unit === 'string' ? row.unit : 'lot',
          unitRate: typeof row.unitRate === 'number' ? row.unitRate : Number(row.unitRate ?? 0),
          notes: typeof row.notes === 'string' ? row.notes : '',
        };
      })
    : DEFAULT_REVENUE_DATA.rows;

  const settingsRaw = candidate.settings ?? {};
  const settings: RevenueSettings = {
    vatPercent: Number((settingsRaw as Partial<RevenueSettings>).vatPercent ?? DEFAULT_REVENUE_DATA.settings.vatPercent),
    taxPercent: Number((settingsRaw as Partial<RevenueSettings>).taxPercent ?? DEFAULT_REVENUE_DATA.settings.taxPercent),
  };

  return {
    rows,
    settings,
  };
};

const calculateLineTotal = (row: RevenueRow): number => {
  return safeNumber(row.quantity) * safeNumber(row.unitRate);
};

export default function RevenueStepPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [revenueData, setRevenueData] = useState<RevenueData>(DEFAULT_REVENUE_DATA);
  const [unitTypeOptions, setUnitTypeOptions] = useState<string[]>(DEFAULT_REVENUE_UNIT_TYPES);
  const [unitOptions, setUnitOptions] = useState<string[]>(DEFAULT_REVENUE_UNITS);

  useEffect(() => {
    if (projectId) {
      void loadPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const workflowState = useMemo(() => getWorkflowState(project?.inputParameters ?? {}), [project?.inputParameters]);

  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    if (!revenueData.rows.length) {
      errors.rowsEmpty = 'At least one scope of work line is required';
    }

    revenueData.rows.forEach((row) => {
      if (!row.scopeOfWork.trim()) {
        errors[`row.${row.id}.scopeOfWork`] = 'Scope of work is required';
      }
      if (!row.unitType.trim()) {
        errors[`row.${row.id}.unitType`] = 'Unit type is required';
      }
      if (!row.unit.trim()) {
        errors[`row.${row.id}.unit`] = 'Unit is required';
      }
      if (!Number.isFinite(row.quantity) || row.quantity <= 0) {
        errors[`row.${row.id}.quantity`] = 'Quantity must be greater than 0';
      }
      if (!Number.isFinite(row.unitRate) || row.unitRate < 0) {
        errors[`row.${row.id}.unitRate`] = 'Rate cannot be negative';
      }
    });

    if (!Number.isFinite(revenueData.settings.vatPercent) || revenueData.settings.vatPercent < 0 || revenueData.settings.vatPercent > 100) {
      errors.settingsVat = 'VAT must be between 0 and 100';
    }
    if (!Number.isFinite(revenueData.settings.taxPercent) || revenueData.settings.taxPercent < 0 || revenueData.settings.taxPercent > 100) {
      errors.settingsTax = 'Tax must be between 0 and 100';
    }

    return errors;
  }, [revenueData]);

  const isStepValid = Object.keys(validationErrors).length === 0;

  const summary = useMemo(() => {
    const byCategory = revenueData.rows.reduce<Record<RevenueCategory, number>>((acc, row) => {
      const rowTotal = calculateLineTotal(row);
      acc[row.category] += rowTotal;
      return acc;
    }, {
      service: 0,
      material: 0,
      other: 0,
    });

    const grossTotal = byCategory.service + byCategory.material + byCategory.other;
    const vatAmount = grossTotal * (safeNumber(revenueData.settings.vatPercent) / 100);
    const taxAmount = grossTotal * (safeNumber(revenueData.settings.taxPercent) / 100);
    const totalDeductions = vatAmount + taxAmount;
    const netReceivable = grossTotal - totalDeductions;

    return {
      byCategory,
      grossTotal,
      vatAmount,
      taxAmount,
      totalDeductions,
      netReceivable,
    };
  }, [revenueData]);

  const loadPage = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to load project');
      }

      const projectData: Project = await response.json();
      const currentWorkflow = getWorkflowState(projectData.inputParameters ?? {});

      if (!isStepAccessible('revenue', currentWorkflow)) {
        toast.error('Complete Step 1 (Assumptions) before Step 2');
        router.push(`/projects/${projectId}/assumptions`);
        return;
      }

      setProject(projectData);
      const parsedRevenueData = getRevenueData(projectData.inputParameters ?? {});
      setRevenueData(parsedRevenueData);
      setUnitTypeOptions(
        mergeUniqueText(
          DEFAULT_REVENUE_UNIT_TYPES,
          parsedRevenueData.rows.map((row) => row.unitType)
        )
      );
      setUnitOptions(
        mergeUniqueText(
          DEFAULT_REVENUE_UNITS,
          parsedRevenueData.rows.map((row) => row.unit)
        )
      );
    } catch (error) {
      console.error('Error loading Revenue page:', error);
      toast.error('Failed to load Step 2 (Revenue)');
      router.push(`/projects/${projectId}`);
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (rowId: string, key: keyof RevenueRow, value: string) => {
    if (key === 'unitType' && value === ADD_NEW_UNIT_TYPE_OPTION) {
      const candidateRaw = window.prompt('Enter new Unit Type');
      const candidate = candidateRaw?.trim() ?? '';
      if (!candidate) {
        return;
      }

      const existing = unitTypeOptions.find((option) => option.toLowerCase() === candidate.toLowerCase());
      const finalValue = existing ?? candidate;

      if (!existing) {
        setUnitTypeOptions((prev) => [...prev, candidate]);
        toast.success('Unit type added');
      }

      setRevenueData((prev) => ({
        ...prev,
        rows: prev.rows.map((row) => (row.id === rowId ? { ...row, unitType: finalValue } : row)),
      }));
      return;
    }

    if (key === 'unit' && value === ADD_NEW_UNIT_OPTION) {
      const candidateRaw = window.prompt('Enter new Unit');
      const candidate = candidateRaw?.trim() ?? '';
      if (!candidate) {
        return;
      }

      const existing = unitOptions.find((option) => option.toLowerCase() === candidate.toLowerCase());
      const finalValue = existing ?? candidate;

      if (!existing) {
        setUnitOptions((prev) => [...prev, candidate]);
        toast.success('Unit added');
      }

      setRevenueData((prev) => ({
        ...prev,
        rows: prev.rows.map((row) => (row.id === rowId ? { ...row, unit: finalValue } : row)),
      }));
      return;
    }

    setRevenueData((prev) => ({
      ...prev,
      rows: prev.rows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        if (key === 'quantity' || key === 'unitRate') {
          return {
            ...row,
            [key]: parseNumberInput(value),
          };
        }

        if (key === 'category') {
          const nextCategory = value === 'service' || value === 'material' || value === 'other' ? value : 'service';
          return {
            ...row,
            category: nextCategory,
          };
        }

        return {
          ...row,
          [key]: value,
        };
      }),
    }));
  };

  const updateSettings = (key: keyof RevenueSettings, value: string) => {
    setRevenueData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: parseNumberInput(value),
      },
    }));
  };

  const addRow = () => {
    setRevenueData((prev) => ({
      ...prev,
      rows: [
        ...prev.rows,
        createRevenueRow('', 'service', unitTypeOptions[0] ?? 'Lump Sum', 1, unitOptions[0] ?? 'lot'),
      ],
    }));
  };

  const removeRow = (rowId: string) => {
    setRevenueData((prev) => ({
      ...prev,
      rows: prev.rows.filter((row) => row.id !== rowId),
    }));
  };

  const saveRevenue = async (completeStep: boolean) => {
    if (!project) {
      return;
    }

    setShowValidation(true);

    if (completeStep && !isStepValid) {
      toast.error('Fix all red fields before completing Step 2');
      return;
    }

    setSaving(true);
    try {
      const nextInputParameters = withUpdatedWorkflowState(
        {
          ...(project.inputParameters ?? {}),
          revenueData,
          revenueSummary: {
            byCategory: summary.byCategory,
            grossTotal: summary.grossTotal,
            vatPercent: safeNumber(revenueData.settings.vatPercent),
            vatAmount: summary.vatAmount,
            taxPercent: safeNumber(revenueData.settings.taxPercent),
            taxAmount: summary.taxAmount,
            totalDeductions: summary.totalDeductions,
            netReceivable: summary.netReceivable,
            totalRows: revenueData.rows.length,
          },
        },
        { revenue: completeStep ? true : isStepValid }
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
        throw new Error('Failed to save Step 2');
      }

      const updatedProject: Project = await response.json();
      setProject(updatedProject);

      if (completeStep) {
        toast.success('Step 2 completed. Proceeding to Step 3 (CapEx).');
        router.push(`/projects/${project.id}/capex`);
      } else {
        toast.success('Revenue draft saved');
      }
    } catch (error) {
      console.error('Error saving Revenue:', error);
      toast.error('Unable to save Step 2');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[35vh] gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading Step 2 (Revenue)...</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-4">
      <FeasibilityProgress projectId={project.id} currentStep="revenue" workflowState={workflowState} />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Step 2 · Revenue Model</h1>
          <p className="text-xs text-muted-foreground">Define dynamic scope-of-work lines for tender pricing and apply client tax/VAT deductions.</p>
        </div>
        <Link href={`/projects/${project.id}/assumptions`}>
          <Button variant="outline" size="sm">Back to Step 1</Button>
        </Link>
      </div>

      {showValidation && !isStepValid && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-3 text-xs text-destructive">
            {Object.keys(validationErrors).length} validation issue(s) found. Missing or invalid fields are outlined in red.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Deduction Settings</CardTitle>
          <CardDescription className="text-xs">Client-side deductions to compute net receivable value.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">VAT %</Label>
            <Input
              type="number"
              value={numberInputValue(revenueData.settings.vatPercent)}
              onChange={(event) => updateSettings('vatPercent', event.target.value)}
              className={cn('h-8 text-xs', showValidation && validationErrors.settingsVat && 'border-destructive focus-visible:ring-destructive')}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Tax %</Label>
            <Input
              type="number"
              value={numberInputValue(revenueData.settings.taxPercent)}
              onChange={(event) => updateSettings('taxPercent', event.target.value)}
              className={cn('h-8 text-xs', showValidation && validationErrors.settingsTax && 'border-destructive focus-visible:ring-destructive')}
            />
          </div>
          <div className="rounded-lg border p-2 bg-muted/30 text-xs">
            <div className="text-[11px] text-muted-foreground">Current Net Receivable</div>
            <div className="font-semibold">{summary.netReceivable.toLocaleString()}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Scope of Work Revenue Lines</CardTitle>
          <CardDescription className="text-xs">Add services/materials/other line items dynamically.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {revenueData.rows.map((row) => {
            const scopeError = validationErrors[`row.${row.id}.scopeOfWork`];
            const unitTypeError = validationErrors[`row.${row.id}.unitType`];
            const unitError = validationErrors[`row.${row.id}.unit`];
            const quantityError = validationErrors[`row.${row.id}.quantity`];
            const unitRateError = validationErrors[`row.${row.id}.unitRate`];
            const lineTotal = calculateLineTotal(row);

            return (
              <div key={row.id} className="rounded-lg border p-3 bg-background/70 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                  <div className="md:col-span-3 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Scope of Work</Label>
                    <Input
                      value={row.scopeOfWork}
                      onChange={(event) => updateRow(row.id, 'scopeOfWork', event.target.value)}
                      className={cn('h-8 text-xs', showValidation && scopeError && 'border-destructive focus-visible:ring-destructive')}
                      placeholder="e.g., Splicing and testing"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Type</Label>
                    <select
                      value={row.category}
                      onChange={(event) => updateRow(row.id, 'category', event.target.value)}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="service">Service</option>
                      <option value="material">Material</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Unit Type</Label>
                    <select
                      value={row.unitType}
                      onChange={(event) => updateRow(row.id, 'unitType', event.target.value)}
                      className={cn('w-full h-8 rounded-md border border-input bg-background px-2 text-xs', showValidation && unitTypeError && 'border-destructive')}
                    >
                      {!unitTypeOptions.includes(row.unitType) && row.unitType.trim() && (
                        <option value={row.unitType}>{row.unitType}</option>
                      )}
                      {unitTypeOptions.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                      <option value={ADD_NEW_UNIT_TYPE_OPTION}>+ Add new Unit Type</option>
                    </select>
                  </div>

                  <div className="md:col-span-1 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Qty</Label>
                    <Input
                      type="number"
                      value={numberInputValue(row.quantity)}
                      onChange={(event) => updateRow(row.id, 'quantity', event.target.value)}
                      className={cn('h-8 text-xs', showValidation && quantityError && 'border-destructive focus-visible:ring-destructive')}
                    />
                  </div>

                  <div className="md:col-span-1 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Unit</Label>
                    <select
                      value={row.unit}
                      onChange={(event) => updateRow(row.id, 'unit', event.target.value)}
                      className={cn('w-full h-8 rounded-md border border-input bg-background px-2 text-xs', showValidation && unitError && 'border-destructive')}
                    >
                      {!unitOptions.includes(row.unit) && row.unit.trim() && (
                        <option value={row.unit}>{row.unit}</option>
                      )}
                      {unitOptions.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                      <option value={ADD_NEW_UNIT_OPTION}>+ Add new Unit</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Unit Rate</Label>
                    <Input
                      type="number"
                      value={numberInputValue(row.unitRate)}
                      onChange={(event) => updateRow(row.id, 'unitRate', event.target.value)}
                      className={cn('h-8 text-xs', showValidation && unitRateError && 'border-destructive focus-visible:ring-destructive')}
                    />
                  </div>

                  <div className="md:col-span-1 flex justify-end pt-5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => removeRow(row.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center text-[11px] text-muted-foreground">
                  <div className="md:col-span-8">
                    <Input
                      value={row.notes}
                      onChange={(event) => updateRow(row.id, 'notes', event.target.value)}
                      className="h-7 text-[11px]"
                      placeholder="Notes / quotation assumptions"
                    />
                  </div>
                  <div className="md:col-span-4 text-right font-medium text-foreground">Line Total: {lineTotal.toLocaleString()}</div>
                </div>
              </div>
            );
          })}

          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4 mr-1" /> Add Dynamic Scope Row
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Revenue Summary</CardTitle>
          <CardDescription className="text-xs">Gross contract value, deductions, and net receivable.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
            <div className="rounded-lg border p-2 bg-muted/30">
              <div className="text-[11px] text-muted-foreground">Services</div>
              <div className="font-semibold">{summary.byCategory.service.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border p-2 bg-muted/30">
              <div className="text-[11px] text-muted-foreground">Materials</div>
              <div className="font-semibold">{summary.byCategory.material.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border p-2 bg-muted/30">
              <div className="text-[11px] text-muted-foreground">Other</div>
              <div className="font-semibold">{summary.byCategory.other.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border border-primary/40 p-2 bg-primary/10">
              <div className="text-[11px] text-primary/90">Gross Revenue</div>
              <div className="font-semibold text-primary">{summary.grossTotal.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border p-2 bg-muted/30">
              <div className="text-[11px] text-muted-foreground">VAT Deduction</div>
              <div className="font-semibold">{summary.vatAmount.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border p-2 bg-muted/30">
              <div className="text-[11px] text-muted-foreground">Tax Deduction</div>
              <div className="font-semibold">{summary.taxAmount.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border p-2 bg-muted/30">
              <div className="text-[11px] text-muted-foreground">Total Deductions</div>
              <div className="font-semibold">{summary.totalDeductions.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border border-emerald-500/40 p-2 bg-emerald-500/10">
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300">Net Receivable</div>
              <div className="font-semibold text-emerald-700 dark:text-emerald-300">{summary.netReceivable.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-between items-center gap-2 pt-1">
        <div className="text-xs text-muted-foreground">
          {isStepValid ? 'Step 2 validation passed.' : 'Step 2 has missing or invalid fields.'}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => saveRevenue(false)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Draft
          </Button>
          <Button onClick={() => saveRevenue(true)} disabled={saving}>
            Complete Step 2
          </Button>
        </div>
      </div>
    </div>
  );
}
