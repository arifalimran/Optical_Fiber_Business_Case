'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
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

type CapexRow = {
  id: string;
  item: string;
  quantity: number;
  unit: string;
  unitRate: number;
  taxPercent: number;
  vendor: string;
  notes: string;
};

type CapexData = {
  mobilizationPermits: CapexRow[];
  equipmentTools: CapexRow[];
  civilInfra: CapexRow[];
  complianceContingency: CapexRow[];
};

type SectionKey = keyof CapexData;

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

const createRow = (item = '', unit = 'pcs', quantity = 1, unitRate = 0): CapexRow => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  item,
  quantity,
  unit,
  unitRate,
  taxPercent: 0,
  vendor: '',
  notes: '',
});

const DEFAULT_CAPEX_DATA: CapexData = {
  mobilizationPermits: [
    createRow('Mobilization & Site Setup', 'lot', 1, 7000),
    createRow('Authority Permissions', 'lot', 1, 40000),
    createRow('Documentation & Design', 'lot', 1, 15000),
    createRow('Insurance (One-time)', 'lot', 1, 20000),
  ],
  equipmentTools: [
    createRow('HDD Machine Advance/Setup', 'machine', 1, 120000),
    createRow('OTDR Testing Toolkit', 'set', 1, 20000),
    createRow('Safety PPE Package', 'set', 1, 50000),
    createRow('Site Office Furniture/IT', 'lot', 1, 30000),
  ],
  civilInfra: [
    createRow('Bridge/Culvert Temporary Works', 'lot', 1, 30000),
    createRow('Initial Logistics Transport', 'lot', 1, 30000),
    createRow('Warehouse Setup', 'lot', 1, 10000),
    createRow('Storage & Security Deposit', 'lot', 1, 12000),
  ],
  complianceContingency: [
    createRow('Quality Audit & Certification', 'lot', 1, 15000),
    createRow('Environmental & Safety Compliance', 'lot', 1, 10000),
    createRow('Contingency Reserve', '% of capex', 1, 50000),
    createRow('Client Onboarding/Coordination', 'lot', 1, 8000),
  ],
};

const SECTION_META: Record<SectionKey, { title: string; description: string }> = {
  mobilizationPermits: {
    title: 'Mobilization & Permits',
    description: 'Upfront mobilization, licenses, and project initiation costs.',
  },
  equipmentTools: {
    title: 'Equipment & Tools',
    description: 'One-time machinery, tooling, and setup materials.',
  },
  civilInfra: {
    title: 'Civil & Infrastructure Setup',
    description: 'Early-stage infra preparation and deployment readiness costs.',
  },
  complianceContingency: {
    title: 'Compliance & Contingency',
    description: 'Risk reserve, compliance, and quality assurance provisions.',
  },
};

const getCapexData = (inputParameters: Record<string, unknown>): CapexData => {
  const raw = inputParameters.capexData;
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_CAPEX_DATA;
  }

  const candidate = raw as Partial<Record<SectionKey, unknown>>;

  const parseSection = (sectionKey: SectionKey): CapexRow[] => {
    const sectionValue = candidate[sectionKey];
    if (!Array.isArray(sectionValue) || sectionValue.length === 0) {
      return DEFAULT_CAPEX_DATA[sectionKey];
    }

    return sectionValue.map((item) => {
      const row = item as Partial<CapexRow>;
      return {
        id: row.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        item: typeof row.item === 'string' ? row.item : '',
        quantity: typeof row.quantity === 'number' ? row.quantity : Number(row.quantity ?? 0),
        unit: typeof row.unit === 'string' ? row.unit : 'pcs',
        unitRate: typeof row.unitRate === 'number' ? row.unitRate : Number(row.unitRate ?? 0),
        taxPercent: typeof row.taxPercent === 'number' ? row.taxPercent : Number(row.taxPercent ?? 0),
        vendor: typeof row.vendor === 'string' ? row.vendor : '',
        notes: typeof row.notes === 'string' ? row.notes : '',
      };
    });
  };

  return {
    mobilizationPermits: parseSection('mobilizationPermits'),
    equipmentTools: parseSection('equipmentTools'),
    civilInfra: parseSection('civilInfra'),
    complianceContingency: parseSection('complianceContingency'),
  };
};

export default function CapexStepPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [capexData, setCapexData] = useState<CapexData>(DEFAULT_CAPEX_DATA);
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    mobilizationPermits: true,
    equipmentTools: false,
    civilInfra: false,
    complianceContingency: false,
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

    (Object.keys(capexData) as SectionKey[]).forEach((sectionKey) => {
      const rows = capexData[sectionKey];
      if (!rows.length) {
        errors[`${sectionKey}.empty`] = 'At least one row is required.';
      }

      rows.forEach((row) => {
        if (!row.item.trim()) {
          errors[`${sectionKey}.${row.id}.item`] = 'Item name is required';
        }
        if (!Number.isFinite(row.quantity) || row.quantity <= 0) {
          errors[`${sectionKey}.${row.id}.quantity`] = 'Quantity must be greater than 0';
        }
        if (!Number.isFinite(row.unitRate) || row.unitRate < 0) {
          errors[`${sectionKey}.${row.id}.unitRate`] = 'Unit rate cannot be negative';
        }
        if (!Number.isFinite(row.taxPercent) || row.taxPercent < 0 || row.taxPercent > 100) {
          errors[`${sectionKey}.${row.id}.taxPercent`] = 'Tax must be between 0 and 100';
        }
      });
    });

    return errors;
  }, [capexData]);

  const isStepValid = Object.keys(validationErrors).length === 0;

  const totals = useMemo(() => {
    const bySection = (Object.keys(capexData) as SectionKey[]).reduce<Record<SectionKey, number>>((acc, sectionKey) => {
      const sectionTotal = capexData[sectionKey].reduce((sum, row) => {
        const subtotal = row.quantity * row.unitRate;
        const taxAmount = subtotal * (row.taxPercent / 100);
        return sum + subtotal + taxAmount;
      }, 0);

      acc[sectionKey] = sectionTotal;
      return acc;
    }, {
      mobilizationPermits: 0,
      equipmentTools: 0,
      civilInfra: 0,
      complianceContingency: 0,
    });

    const grandTotal = Object.values(bySection).reduce((sum, value) => sum + value, 0);
    return { bySection, grandTotal };
  }, [capexData]);

  const loadPage = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to load project');
      }

      const projectData: Project = await response.json();
      const currentWorkflow = getWorkflowState(projectData.inputParameters ?? {});

      if (!isStepAccessible('capex', currentWorkflow)) {
        toast.error('Complete Step 1 (Assumptions) before Step 2');
        router.push(`/projects/${projectId}/assumptions`);
        return;
      }

      setProject(projectData);
      setCapexData(getCapexData(projectData.inputParameters ?? {}));
    } catch (error) {
      console.error('Error loading CapEx page:', error);
      toast.error('Failed to load Step 2 (CapEx)');
      router.push(`/projects/${projectId}`);
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (sectionKey: SectionKey, rowId: string, key: keyof CapexRow, value: string) => {
    setCapexData((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        if (key === 'quantity' || key === 'unitRate' || key === 'taxPercent') {
          return {
            ...row,
            [key]: parseNumberInput(value),
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
    setCapexData((prev) => ({
      ...prev,
      [sectionKey]: [...prev[sectionKey], createRow()],
    }));
  };

  const removeRow = (sectionKey: SectionKey, rowId: string) => {
    setCapexData((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter((row) => row.id !== rowId),
    }));
  };

  const saveCapex = async (completeStep: boolean) => {
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
          capexData,
          capexSummary: {
            bySection: totals.bySection,
            total: totals.grandTotal,
          },
        },
        { capex: completeStep ? true : isStepValid }
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
        throw new Error('Failed to save CapEx data');
      }

      const updatedProject: Project = await response.json();
      setProject(updatedProject);

      if (completeStep) {
        toast.success('Step 2 completed. Proceeding to Step 3 (OpEx).');
        router.push(`/projects/${project.id}/opex`);
      } else {
        toast.success('CapEx saved as draft');
      }
    } catch (error) {
      console.error('Error saving CapEx:', error);
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
          <span>Loading Step 2 (CapEx)...</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-4">
      <FeasibilityProgress projectId={project.id} currentStep="capex" workflowState={workflowState} />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Step 2 · CapEx Matrix</h1>
          <p className="text-xs text-muted-foreground">Capture all one-time and upfront investment costs with tax-inclusive totals.</p>
        </div>
        <Link href={`/projects/${project.id}/assumptions`}>
          <Button variant="outline" size="sm">Back to Step 1</Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Project: {project.projectName}</CardTitle>
          <CardDescription className="text-xs">Template: {project.templateCode}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            {(Object.keys(SECTION_META) as SectionKey[]).map((sectionKey) => (
              <div key={sectionKey} className="rounded-lg border p-2 bg-muted/30">
                <div className="text-[11px] text-muted-foreground">{SECTION_META[sectionKey].title}</div>
                <div className="font-semibold">{totals.bySection[sectionKey].toLocaleString()}</div>
              </div>
            ))}
            <div className="rounded-lg border border-primary/40 p-2 bg-primary/10">
              <div className="text-[11px] text-primary/90">Total CapEx</div>
              <div className="font-semibold text-primary">{totals.grandTotal.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showValidation && !isStepValid && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-3 text-xs text-destructive">
            {Object.keys(validationErrors).length} validation issue(s) found. Fields with issues are highlighted in red.
          </CardContent>
        </Card>
      )}

      {(Object.keys(capexData) as SectionKey[]).map((sectionKey) => {
        const sectionRows = capexData[sectionKey];
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
                  <CardDescription className="text-xs">{SECTION_META[sectionKey].description}</CardDescription>
                </div>
                {sectionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </CardHeader>

            {sectionOpen && (
              <CardContent className="space-y-3">
                {sectionRows.map((row) => {
                  const itemError = validationErrors[`${sectionKey}.${row.id}.item`];
                  const quantityError = validationErrors[`${sectionKey}.${row.id}.quantity`];
                  const rateError = validationErrors[`${sectionKey}.${row.id}.unitRate`];
                  const taxError = validationErrors[`${sectionKey}.${row.id}.taxPercent`];

                  const rowSubtotal = row.quantity * row.unitRate;
                  const rowTaxAmount = rowSubtotal * (row.taxPercent / 100);
                  const rowTotal = rowSubtotal + rowTaxAmount;

                  return (
                    <div key={row.id} className="rounded-lg border p-2.5 bg-background/70 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                        <div className="md:col-span-4 space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Cost Item</Label>
                          <Input
                            value={row.item}
                            onChange={(event) => updateRow(sectionKey, row.id, 'item', event.target.value)}
                            className={cn('h-8 text-xs', showValidation && itemError && 'border-destructive focus-visible:ring-destructive')}
                            placeholder="Enter line item"
                          />
                          {showValidation && itemError && <p className="text-[10px] text-destructive">{itemError}</p>}
                        </div>

                        <div className="md:col-span-1 space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Qty</Label>
                          <Input
                            type="number"
                            value={numberInputValue(row.quantity)}
                            onChange={(event) => updateRow(sectionKey, row.id, 'quantity', event.target.value)}
                            className={cn('h-8 text-xs', showValidation && quantityError && 'border-destructive focus-visible:ring-destructive')}
                          />
                        </div>

                        <div className="md:col-span-1 space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Unit</Label>
                          <Input
                            value={row.unit}
                            onChange={(event) => updateRow(sectionKey, row.id, 'unit', event.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Unit Rate</Label>
                          <Input
                            type="number"
                            value={numberInputValue(row.unitRate)}
                            onChange={(event) => updateRow(sectionKey, row.id, 'unitRate', event.target.value)}
                            className={cn('h-8 text-xs', showValidation && rateError && 'border-destructive focus-visible:ring-destructive')}
                          />
                        </div>

                        <div className="md:col-span-1 space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Tax %</Label>
                          <Input
                            type="number"
                            value={numberInputValue(row.taxPercent)}
                            onChange={(event) => updateRow(sectionKey, row.id, 'taxPercent', event.target.value)}
                            className={cn('h-8 text-xs', showValidation && taxError && 'border-destructive focus-visible:ring-destructive')}
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Vendor</Label>
                          <Input
                            value={row.vendor}
                            onChange={(event) => updateRow(sectionKey, row.id, 'vendor', event.target.value)}
                            className="h-8 text-xs"
                            placeholder="Optional"
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

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <Input
                          value={row.notes}
                          onChange={(event) => updateRow(sectionKey, row.id, 'notes', event.target.value)}
                          className="h-7 text-[11px] max-w-md"
                          placeholder="Notes / assumptions"
                        />
                        <div className="font-medium text-foreground">Line Total: {rowTotal.toLocaleString()}</div>
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
          {isStepValid ? 'Step 2 validation passed.' : 'Step 2 has missing or invalid fields.'}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => saveCapex(false)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Draft
          </Button>
          <Button onClick={() => saveCapex(true)} disabled={saving}>
            Complete Step 2
          </Button>
        </div>
      </div>
    </div>
  );
}
