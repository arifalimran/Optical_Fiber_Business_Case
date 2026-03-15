'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save, Search, Trash2, Edit3, Lock, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FeasibilityProgress } from '@/components/projects/FeasibilityProgress';
import { getWorkflowState, withUpdatedWorkflowState } from '@/lib/workflow/feasibilitySteps';

interface Project {
  id: string;
  templateCode: string;
  projectName: string;
  clientName: string | null;
  location: string | null;
  description: string | null;
  inputParameters: Record<string, unknown>;
  status: string;
}

interface TemplateField {
  name: string;
  label?: string;
  type?: 'text' | 'number' | 'boolean' | 'select';
  required?: boolean;
  min?: number;
  max?: number;
  unit?: string;
  default?: unknown;
  options?: string[];
  conditional?: {
    field: string;
    value: unknown;
  };
}

interface Template {
  templateCode: string;
  templateName: string;
  inputSchema?: {
    fields?: TemplateField[];
  };
}

type StepDefinition = {
  id: string;
  title: string;
  subtitle: string;
  fieldNames: string[];
};

const OPTICAL_FIBER_FIELD_CONFIG: TemplateField[] = [
  { name: 'underground_length', label: 'Total Underground Length', type: 'number', required: true, min: 1, unit: 'meters', default: 30000 },
  { name: 'number_of_rings', label: 'Number of Rings', type: 'number', required: true, min: 1, max: 5, default: 2 },
  { name: 'number_of_links', label: 'Number of Links', type: 'number', required: true, min: 1, max: 50, default: 10 },
  { name: 'overhead_length', label: 'Overhead Cable Length', type: 'number', min: 0, unit: 'meters', default: 0 },

  { name: 'number_of_bridges', label: 'Number of Bridges', type: 'number', min: 0, max: 10, default: 0 },
  { name: 'number_of_culverts', label: 'Number of Culverts', type: 'number', min: 0, max: 20, default: 0 },
  { name: 'number_of_rivers', label: 'Number of Rivers', type: 'number', min: 0, max: 5, default: 0 },

  { name: 'cables_provided_by_client', label: 'Cables Provided by Client', type: 'boolean', required: true, default: false },
  { name: 'ducts_provided_by_client', label: 'Ducts Provided by Client', type: 'boolean', required: true, default: false },
  { name: 'project_duration_months', label: 'Project Duration', type: 'number', required: true, min: 1, unit: 'months', default: 3 },

  { name: 'has_jrc', label: 'Include JRC', type: 'boolean', default: false },
  { name: 'jrc_count', label: 'JRC Count', type: 'number', min: 0, default: 0, conditional: { field: 'has_jrc', value: true } },
  { name: 'has_splitter', label: 'Include Splitters', type: 'boolean', default: false },
  { name: 'splitter_count', label: 'Splitter Count', type: 'number', min: 0, default: 0, conditional: { field: 'has_splitter', value: true } },
  { name: 'cable_type', label: 'Cable Type', type: 'select', options: ['Single Mode', 'Multi Mode'], default: 'Single Mode' },
  { name: 'client_advance_percentage', label: 'Client Advance', type: 'number', min: 0, max: 100, unit: '%', default: 20 },
  { name: 'payment_terms', label: 'Payment Terms', type: 'select', options: ['30 days', '45 days', '60 days', '90 days'], default: '30 days' },
];

const FORM_STEPS: StepDefinition[] = [
  {
    id: 'project-basics',
    title: 'Project Basics',
    subtitle: 'Identity and location details',
    fieldNames: [],
  },
  {
    id: 'core-parameters',
    title: 'Core Parameters',
    subtitle: 'Underground work and site complexity',
    fieldNames: [
      'underground_length',
      'number_of_rings',
      'number_of_links',
      'overhead_length',
      'number_of_bridges',
      'number_of_culverts',
      'number_of_rivers',
    ],
  },
  {
    id: 'provisions-duration',
    title: 'Client & Duration',
    subtitle: 'Client provisions and timeline',
    fieldNames: [
      'cables_provided_by_client',
      'ducts_provided_by_client',
      'project_duration_months',
      'client_advance_percentage',
      'payment_terms',
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced Options',
    subtitle: 'Optional technical/commercial assumptions',
    fieldNames: [
      'has_jrc',
      'jrc_count',
      'has_splitter',
      'splitter_count',
      'cable_type',
    ],
  },
];

const parseNumberInput = (value: string): number => {
  if (value.trim() === '') {
    return Number.NaN;
  }
  return Number(value);
};

const numberInputValue = (value: unknown): string => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value === 0) {
    return '';
  }
  return `${value}`;
};

export default function ProjectAssumptionsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [showValidation, setShowValidation] = useState(false);
  const [editing, setEditing] = useState(true);

  useEffect(() => {
    if (projectId) {
      void fetchPageData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fields = useMemo(() => {
    if (project?.templateCode === 'OPTICAL_FIBER') {
      return OPTICAL_FIBER_FIELD_CONFIG;
    }

    return template?.inputSchema?.fields ?? [];
  }, [project?.templateCode, template]);

  const currentStepDef = FORM_STEPS[currentStep];

  const isFieldVisible = useCallback((field: TemplateField): boolean => {
    if (!field.conditional) {
      return true;
    }

    const actualValue = values[field.conditional.field];
    return actualValue === field.conditional.value;
  }, [values]);

  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    if (!projectName.trim()) {
      errors.projectName = 'Project name is required';
    }
    if (!clientName.trim()) {
      errors.clientName = 'Client name is required';
    }
    if (!location.trim()) {
      errors.location = 'Location is required';
    }

    const contactEmail = typeof values.client_contact_email === 'string' ? values.client_contact_email.trim() : '';
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      errors.client_contact_email = 'Enter a valid contact email address';
    }

    const contactPhone = typeof values.client_contact_phone === 'string' ? values.client_contact_phone.trim() : '';
    if (contactPhone && !/^\+?[0-9\s\-()]{7,20}$/.test(contactPhone)) {
      errors.client_contact_phone = 'Enter a valid contact phone number';
    }

    fields.forEach((field) => {
      if (!isFieldVisible(field)) {
        return;
      }

      const value = values[field.name];
      const fieldLabel = field.label || field.name;

      if (field.type === 'number') {
        const numericValue = typeof value === 'number' ? value : Number(value ?? 0);

        if (field.required && !Number.isFinite(numericValue)) {
          errors[field.name] = `${fieldLabel} is required`;
          return;
        }

        if (field.required && numericValue <= 0) {
          errors[field.name] = `${fieldLabel} must be greater than 0`;
          return;
        }

        if (field.min !== undefined && numericValue < field.min) {
          errors[field.name] = `${fieldLabel} must be at least ${field.min}`;
          return;
        }

        if (field.max !== undefined && numericValue > field.max) {
          errors[field.name] = `${fieldLabel} must be at most ${field.max}`;
        }

        return;
      }

      if (field.type === 'select') {
        if (field.required && (!value || `${value}`.trim() === '')) {
          errors[field.name] = `${fieldLabel} is required`;
        }
        return;
      }

      if (field.type === 'text') {
        if (field.required && (!value || `${value}`.trim() === '')) {
          errors[field.name] = `${fieldLabel} is required`;
        }
      }
    });

    return errors;
  }, [clientName, fields, isFieldVisible, location, projectName, values]);

  const missingRequiredCount = Object.keys(validationErrors).length;
  const canCalculate = missingRequiredCount === 0;
  const workflowState = useMemo(() => getWorkflowState(project?.inputParameters ?? {}), [project?.inputParameters]);

  const fetchPageData = async () => {
    try {
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (!projectResponse.ok) {
        throw new Error('Failed to load project');
      }

      const projectData: Project = await projectResponse.json();
      setProject(projectData);
      setProjectName(projectData.projectName ?? '');
      setClientName(projectData.clientName ?? '');
      setLocation(projectData.location ?? '');
      setDescription(projectData.description ?? '');

      const templateResponse = await fetch(`/api/templates/${projectData.templateCode}`);
      if (!templateResponse.ok) {
        throw new Error('Failed to load template');
      }

      const templateData: Template = await templateResponse.json();
      setTemplate(templateData);

      const initialValues = { ...projectData.inputParameters };
      const fieldsToUse = projectData.templateCode === 'OPTICAL_FIBER'
        ? OPTICAL_FIBER_FIELD_CONFIG
        : (templateData.inputSchema?.fields ?? []);

      fieldsToUse.forEach((field) => {
        if (initialValues[field.name] === undefined) {
          initialValues[field.name] = field.default ?? (field.type === 'boolean' ? false : field.type === 'number' ? 0 : '');
        }
      });

      setValues(initialValues);
    } catch (error) {
      console.error('Error loading assumptions page:', error);
      toast.error('Failed to load assumptions');
      router.push(`/projects/${projectId}`);
    } finally {
      setLoading(false);
    }
  };

  const updateValue = (fieldName: string, nextValue: unknown) => {
    setValues((prev) => ({
      ...prev,
      [fieldName]: nextValue,
    }));
  };

  const saveAssumptions = async (completeStep: boolean) => {
    if (!project) {
      return;
    }

    setShowValidation(true);

    if (completeStep && !canCalculate) {
      const firstErrorKey = Object.keys(validationErrors)[0];
      if (firstErrorKey) {
        const stepIndex = FORM_STEPS.findIndex((step) => step.fieldNames.includes(firstErrorKey));
        if (stepIndex >= 0) {
          setCurrentStep(stepIndex);
        } else {
          setCurrentStep(0);
        }
      }

      toast.error('Complete mandatory fields before finishing Step 1');
      return;
    }

    setSaving(true);
    try {
      const nextInputParameters = withUpdatedWorkflowState(values, {
        assumptions: completeStep ? true : canCalculate,
      });

      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: projectName.trim(),
          clientName: clientName.trim() || null,
          location: location.trim() || null,
          description: description.trim() || null,
          inputParameters: nextInputParameters,
          status: project.status === 'APPROVED' ? 'APPROVED' : 'DRAFT',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save assumptions');
      }

      const updatedProject: Project = await response.json();
      setProject(updatedProject);

      if (completeStep) {
        toast.success('Step 1 completed');
        router.push(`/projects/${project.id}/revenue`);
      } else {
        toast.success('Assumptions draft saved');
      }
    } catch (error) {
      console.error('Error saving assumptions:', error);
      toast.error('Failed to save assumptions');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) {
      return;
    }

    const confirmed = window.confirm('Delete this project? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      toast.success('Project deleted');
      router.push('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const stepFields = fields
    .filter((field) => currentStepDef.fieldNames.includes(field.name))
    .filter((field) => isFieldVisible(field))
    .filter((field) => {
      if (!searchTerm.trim()) {
        return true;
      }

      const target = `${field.label || field.name} ${field.name}`.toLowerCase();
      return target.includes(searchTerm.toLowerCase());
    });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[40vh] gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading assumptions...</span>
        </div>
      </div>
    );
  }

  if (!project || !template) {
    return null;
  }

  if (project.templateCode !== 'OPTICAL_FIBER') {
    return (
      <div className="container mx-auto p-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Form not available yet</CardTitle>
            <CardDescription>
              The modern stepper assumptions form is currently implemented for Optical Fiber projects only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/projects/${project.id}`}>
              <Button variant="outline">Back to Project</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <FeasibilityProgress projectId={project.id} currentStep="assumptions" workflowState={workflowState} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Step 1 · Assumptions</h1>
          <p className="text-muted-foreground">
            {project.projectName} • {template.templateName}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">Draft Save Enabled</Badge>
            <Badge variant={canCalculate ? 'default' : 'secondary'}>
              {canCalculate ? 'Ready to Calculate' : `${missingRequiredCount} Missing Required`}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing((prev) => !prev)}>
            {editing ? <Lock className="h-4 w-4 mr-2" /> : <Edit3 className="h-4 w-4 mr-2" />}
            {editing ? 'Lock Fields' : 'Edit Fields'}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteProject}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Link href={`/projects/${project.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      <Card className="interactive-card outlined-card">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            {FORM_STEPS.map((step, index) => {
              const active = index === currentStep;
              const complete = index < currentStep;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    'rounded-lg border text-left p-3 transition-colors',
                    active && 'border-primary bg-primary/10',
                    complete && 'border-emerald-500/40 bg-emerald-500/10',
                    !active && !complete && 'border-border hover:border-primary/30'
                  )}
                >
                  <p className="text-xs text-muted-foreground">Step {index + 1}</p>
                  <p className="text-sm font-medium">{step.title}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {showValidation && missingRequiredCount > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Complete required fields before calculation</p>
              <p className="text-sm text-muted-foreground">Missing: {Object.values(validationErrors).slice(0, 3).join(' • ')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{currentStepDef.title}</CardTitle>
          <CardDescription>
            {currentStepDef.subtitle}
          </CardDescription>
          {currentStep !== 0 && (
            <div className="relative search-enhanced outlined-input rounded-xl max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search fields..."
                className="w-full bg-transparent pl-10 pr-4 py-2.5 h-10 text-sm focus:outline-none border-0"
              />
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          {currentStep === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name <span className="text-destructive">*</span></Label>
                <Input
                  id="projectName"
                  value={projectName}
                  disabled={!editing}
                  onChange={(event) => setProjectName(event.target.value)}
                  className={cn(showValidation && validationErrors.projectName && 'border-destructive focus-visible:ring-destructive')}
                  placeholder="e.g., Dhaka Metro Fiber Network"
                />
                {showValidation && validationErrors.projectName && <p className="text-xs text-destructive">{validationErrors.projectName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name <span className="text-destructive">*</span></Label>
                <Input
                  id="clientName"
                  value={clientName}
                  disabled={!editing}
                  onChange={(event) => setClientName(event.target.value)}
                  className={cn(showValidation && validationErrors.clientName && 'border-destructive focus-visible:ring-destructive')}
                  placeholder="e.g., Bangladesh Telecom Ltd"
                />
                {showValidation && validationErrors.clientName && <p className="text-xs text-destructive">{validationErrors.clientName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location <span className="text-destructive">*</span></Label>
                <Input
                  id="location"
                  value={location}
                  disabled={!editing}
                  onChange={(event) => setLocation(event.target.value)}
                  className={cn(showValidation && validationErrors.location && 'border-destructive focus-visible:ring-destructive')}
                  placeholder="Dhaka / Chittagong / Sylhet"
                />
                {showValidation && validationErrors.location && <p className="text-xs text-destructive">{validationErrors.location}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="clientCompanyAddress">Client Company Address</Label>
                <Input
                  id="clientCompanyAddress"
                  value={typeof values.client_company_address === 'string' ? values.client_company_address : ''}
                  disabled={!editing}
                  onChange={(event) => updateValue('client_company_address', event.target.value)}
                  placeholder="Full company address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={typeof values.client_contact_person === 'string' ? values.client_contact_person : ''}
                  disabled={!editing}
                  onChange={(event) => updateValue('client_contact_person', event.target.value)}
                  placeholder="Name of primary client contact"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone Number</Label>
                <Input
                  id="contactPhone"
                  value={typeof values.client_contact_phone === 'string' ? values.client_contact_phone : ''}
                  disabled={!editing}
                  onChange={(event) => updateValue('client_contact_phone', event.target.value)}
                  className={cn(showValidation && validationErrors.client_contact_phone && 'border-destructive focus-visible:ring-destructive')}
                  placeholder="e.g., +8801XXXXXXXXX"
                />
                {showValidation && validationErrors.client_contact_phone && <p className="text-xs text-destructive">{validationErrors.client_contact_phone}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="contactEmail">Contact Email Address</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={typeof values.client_contact_email === 'string' ? values.client_contact_email : ''}
                  disabled={!editing}
                  onChange={(event) => updateValue('client_contact_email', event.target.value)}
                  className={cn(showValidation && validationErrors.client_contact_email && 'border-destructive focus-visible:ring-destructive')}
                  placeholder="contact@client-company.com"
                />
                {showValidation && validationErrors.client_contact_email && <p className="text-xs text-destructive">{validationErrors.client_contact_email}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={description}
                  disabled={!editing}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Optional project notes, assumptions, constraints..."
                  className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          ) : stepFields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No fields found in this section for the current search.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {stepFields.map((field) => {
                const fieldValue = values[field.name];
                const label = field.label || field.name;
                const fieldError = validationErrors[field.name];
                const showFieldError = !!fieldError && showValidation;

                if (field.type === 'boolean') {
                  const checked = Boolean(fieldValue);
                  return (
                    <div key={field.name} className="space-y-2 md:col-span-2">
                      <Label className={cn('flex items-center gap-3 rounded-md border px-3 py-2', showFieldError && 'border-destructive')}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!editing}
                          onChange={(event) => updateValue(field.name, event.target.checked)}
                          className="h-4 w-4 rounded border-border"
                        />
                        <span>
                          {label}
                          {field.required ? <span className="text-destructive ml-1">*</span> : null}
                        </span>
                      </Label>
                      {showFieldError && <p className="text-xs text-destructive">{fieldError}</p>}
                    </div>
                  );
                }

                if (field.type === 'select') {
                  const selectedValue = typeof fieldValue === 'string' ? fieldValue : '';
                  return (
                    <div key={field.name} className="space-y-2">
                      <Label htmlFor={field.name}>{label}{field.required ? <span className="text-destructive ml-1">*</span> : null}</Label>
                      <select
                        id={field.name}
                        value={selectedValue}
                        disabled={!editing}
                        onChange={(event) => updateValue(field.name, event.target.value)}
                        className={cn(
                          'w-full h-10 rounded-md border border-input bg-background px-3 text-sm',
                          showFieldError && 'border-destructive'
                        )}
                      >
                        <option value="">Select option</option>
                        {(field.options ?? []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {showFieldError && <p className="text-xs text-destructive">{fieldError}</p>}
                    </div>
                  );
                }

                if (field.type === 'number') {
                  const numericValue = numberInputValue(fieldValue);
                  return (
                    <div key={field.name} className="space-y-2">
                      <Label htmlFor={field.name}>
                        {label}
                        {field.required ? <span className="text-destructive ml-1">*</span> : null}
                        {field.unit ? <span className="text-muted-foreground ml-1">({field.unit})</span> : null}
                      </Label>
                      <Input
                        id={field.name}
                        type="number"
                        value={numericValue}
                        disabled={!editing}
                        min={field.min}
                        max={field.max}
                        required={field.required}
                        onChange={(event) => updateValue(field.name, parseNumberInput(event.target.value))}
                        className={cn(showFieldError && 'border-destructive focus-visible:ring-destructive')}
                      />
                      {showFieldError && <p className="text-xs text-destructive">{fieldError}</p>}
                    </div>
                  );
                }

                const textValue = typeof fieldValue === 'string' ? fieldValue : '';
                return (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>{label}{field.required ? <span className="text-destructive ml-1">*</span> : null}</Label>
                    <Input
                      id={field.name}
                      type="text"
                      value={textValue}
                      disabled={!editing}
                      required={field.required}
                      onChange={(event) => updateValue(field.name, event.target.value)}
                      className={cn(showFieldError && 'border-destructive focus-visible:ring-destructive')}
                    />
                    {showFieldError && <p className="text-xs text-destructive">{fieldError}</p>}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={currentStep === 0}
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={currentStep === FORM_STEPS.length - 1}
                onClick={() => setCurrentStep((prev) => Math.min(FORM_STEPS.length - 1, prev + 1))}
              >
                Next
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => saveAssumptions(false)} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Draft
            </Button>
            <Button onClick={() => saveAssumptions(true)} disabled={saving}>
              Complete Step 1
            </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
