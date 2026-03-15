'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Settings, 
  Calculator,
  BarChart3,
  DollarSign,
  FileText,
  Loader2,
  Cable,
  Radio,
  Building2,
  MapPin,
  User,
  Calendar,
  Edit3,
  Save,
  X
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { getWorkflowState, getStepProgressPercent, areAllStepsCompleted } from '@/lib/workflow/feasibilitySteps';

interface Project {
  id: string;
  templateCode: string;
  projectName: string;
  clientName: string | null;
  location: string | null;
  description: string | null;
  status: string;
  inputParameters: Record<string, any>;
  calculatedCosts: Record<string, any> | null;
  calculatedRevenue: Record<string, any> | null;
  totalCost: number | null;
  grossRevenue: number | null;
  netProfit: number | null;
  profitMargin: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  approvedBy: string | null;
  tags: string[];
}

interface Template {
  code: string;
  name: string;
  description: string;
}

const projectCache = new Map<string, Project>();
const templateCache = new Map<string, Template>();

const STATUS_COLORS = {
  DRAFT: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', label: 'Draft' },
  ANALYZING: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300', label: 'Analyzing' },
  PENDING_APPROVAL: { bg: 'bg-amber-100 dark:bg-amber-900', text: 'text-amber-700 dark:text-amber-300', label: 'Pending Approval' },
  COMPLETED: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-300', label: 'Completed' },
  APPROVED: { bg: 'bg-emerald-100 dark:bg-emerald-900', text: 'text-emerald-700 dark:text-emerald-300', label: 'Approved' },
  REJECTED: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-700 dark:text-red-300', label: 'Rejected' }
};

const TEMPLATE_ICONS: Record<string, React.ComponentType<any>> = {
  'OPTICAL_FIBER': Cable,
  '5G_TOWER': Radio,
  '5G_TOWER_CONVERSION': Radio,
  default: Building2
};

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const projectId = params.id as string;

  useEffect(() => {
    if (projectId) {
      const cachedProject = projectCache.get(projectId);
      if (cachedProject) {
        setProject(cachedProject);
        setTempName(cachedProject.projectName);
        setLoading(false);

        const cachedTemplate = templateCache.get(cachedProject.templateCode);
        if (cachedTemplate) {
          setTemplate(cachedTemplate);
        }

        void fetchProject(true);
      } else {
        void fetchProject(false);
      }
    }
  }, [projectId]);

  const fetchTemplate = async (templateCode: string) => {
    try {
      const templateResponse = await fetch(`/api/templates/${templateCode}`);
      if (templateResponse.ok) {
        const templateData = await templateResponse.json();
        setTemplate(templateData);
        templateCache.set(templateCode, templateData);
      }
    } catch (error) {
      console.error('Error fetching template:', error);
    }
  };

  const fetchProject = async (silent: boolean) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        if (response.status === 404) {
          if (!silent) {
            toast.error('Project not found');
          }
          router.push('/projects');
          return;
        }
        throw new Error('Failed to fetch project');
      }
      
      const projectData = await response.json();
      setProject(projectData);
      projectCache.set(projectData.id, projectData);
      setTempName(projectData.projectName);

      setLoading(false);
      void fetchTemplate(projectData.templateCode);
    } catch (error) {
      console.error('Error fetching project:', error);
      if (!silent) {
        toast.error('Failed to load project');
      }
      setLoading(false);
    }
  };

  const handleNameSave = async () => {
    if (!tempName.trim() || tempName === project?.projectName) {
      setEditingName(false);
      setTempName(project?.projectName || '');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: tempName.trim() })
      });

      if (!response.ok) throw new Error('Failed to update project');
      
      const updatedProject = await response.json();
      setProject(updatedProject);
      setEditingName(false);
      toast.success('Project name updated');
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project name');
    }
  };

  const handleCalculate = async () => {
    if (!project) {
      return;
    }

    const workflowState = getWorkflowState(project.inputParameters ?? {});
    if (!areAllStepsCompleted(workflowState)) {
      toast.error('Complete Steps 1-5 before running decision calculation');
      return;
    }

    setCalculating(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/calculate`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to calculate project' }));
        throw new Error(errorData.error || 'Failed to calculate project');
      }

      const updatedProject = await response.json();
      setProject(updatedProject);
      projectCache.set(updatedProject.id, updatedProject);
      toast.success('Calculation completed');
    } catch (error) {
      console.error('Error calculating project:', error);
      toast.error('Failed to calculate project');
    } finally {
      setCalculating(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/approve`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to approve project' }));
        throw new Error(errorData.error || 'Failed to approve project');
      }

      const updatedProject = await response.json();
      setProject(updatedProject);
      projectCache.set(updatedProject.id, updatedProject);
      toast.success('Project approved');
    } catch (error) {
      console.error('Error approving project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to approve project');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Enter rejection reason');
    if (!reason?.trim()) {
      return;
    }

    setRejecting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: reason.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to reject project' }));
        throw new Error(errorData.error || 'Failed to reject project');
      }

      const updatedProject = await response.json();
      setProject(updatedProject);
      projectCache.set(updatedProject.id, updatedProject);
      toast.success('Project rejected');
    } catch (error) {
      console.error('Error rejecting project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reject project');
    } finally {
      setRejecting(false);
    }
  };

  const getTemplateIcon = (templateCode: string) => {
    const IconComponent = TEMPLATE_ICONS[templateCode] || TEMPLATE_ICONS.default;
    return IconComponent;
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '--';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading project...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Project not found</h3>
          <p className="text-muted-foreground mb-4">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link href="/projects">
            <Button>Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_COLORS[project.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.DRAFT;
  const IconComponent = getTemplateIcon(project.templateCode);
  const workflowState = getWorkflowState(project.inputParameters ?? {});
  const workflowProgress = getStepProgressPercent(workflowState);
  const allStepsDone = areAllStepsCompleted(workflowState);
  const calculationScenarios = (
    project.calculatedRevenue as { scenarios?: Array<{ name: string; netProfit: number; profitMargin: number }> } | null
  )?.scenarios ?? [];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/projects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
        
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <IconComponent className="h-6 w-6 text-primary" />
              </div>
              {editingName ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="text-2xl font-bold bg-transparent border-b-2 border-primary focus:outline-none flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNameSave();
                      if (e.key === 'Escape') {
                        setEditingName(false);
                        setTempName(project.projectName);
                      }
                    }}
                  />
                  <Button size="sm" onClick={handleNameSave}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setEditingName(false);
                      setTempName(project.projectName);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  <h1 className="text-2xl font-bold tracking-tight">{project.projectName}</h1>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setEditingName(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {template && <span>{template.name}</span>}
              {project.clientName && (
                <>
                  <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {project.clientName}
                  </div>
                </>
              )}
              {project.location && (
                <>
                  <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {project.location}
                  </div>
                </>
              )}
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Updated {formatDate(project.updatedAt)}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className={`${statusConfig.bg} ${statusConfig.text} border-none`}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Project Workspace</CardTitle>
              <CardDescription>
                Configure your project parameters and view results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href={`/projects/${project.id}/assumptions`}>
                  <Button variant="outline" className="w-full h-20 flex-col gap-2">
                    <Settings className="h-6 w-6" />
                    <span>Assumptions</span>
                  </Button>
                </Link>
                
                <Button variant="outline" className="w-full h-20 flex-col gap-2" onClick={handleCalculate} disabled={calculating || !allStepsDone}>
                    <Calculator className="h-6 w-6" />
                    <span>{calculating ? 'Calculating...' : 'Calculate'}</span>
                  </Button>
                
                <Button variant="outline" className="w-full h-20 flex-col gap-2" onClick={() => router.push(`/projects/${project.id}`)}>
                    <FileText className="h-6 w-6" />
                    <span>Summary</span>
                  </Button>
                
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Workflow progress: {workflowProgress}% complete {allStepsDone ? '(ready for calculation)' : '(finish Steps 1-5 to unlock calculation)'}
              </p>
            </CardContent>
          </Card>

          {/* Project Description */}
          {project.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {project.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>Project created on {formatDate(project.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Last updated on {formatDate(project.updatedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Cost</span>
                  <span className="font-semibold">{formatCurrency(project.totalCost)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gross Revenue</span>
                  <span className="font-semibold">{formatCurrency(project.grossRevenue)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm text-muted-foreground">Net Profit</span>
                  <span className={`font-semibold ${(project.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(project.netProfit)}
                  </span>
                </div>
                {project.profitMargin !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Profit Margin</span>
                    <span className="font-semibold">{project.profitMargin.toFixed(1)}%</span>
                  </div>
                )}
              </div>
              
              {project.status === 'DRAFT' && (
                  <Button className="w-full" onClick={handleCalculate} disabled={calculating || !allStepsDone}>
                    <Calculator className="h-4 w-4 mr-2" />
                    {calculating ? 'Calculating...' : 'Calculate Financials'}
                  </Button>
              )}

              {project.calculatedRevenue && (
                <div className="rounded-lg border border-border p-3 mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Decision</p>
                  <p className="font-medium">
                    {(project.calculatedRevenue as { decision?: { label?: string; message?: string } }).decision?.label || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(project.calculatedRevenue as { decision?: { message?: string } }).decision?.message || 'Run calculation to generate decision guidance.'}
                  </p>
                </div>
              )}

              {calculationScenarios.length > 0 && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Scenario Summary</p>
                  {calculationScenarios.map((scenario) => (
                    <div key={scenario.name} className="flex items-center justify-between text-sm">
                      <span>{scenario.name}</span>
                      <span className={scenario.netProfit >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {formatCurrency(scenario.netProfit)} ({scenario.profitMargin.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Template</span>
                <span className="font-medium">{template?.name || project.templateCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={`${statusConfig.bg} ${statusConfig.text} border-none text-xs`}>
                  {statusConfig.label}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              {project.approvedBy && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approved By</span>
                  <span className="font-medium">{project.approvedBy}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={handleCalculate} disabled={calculating || !allStepsDone}>
                <Calculator className="h-4 w-4 mr-2" />
                {calculating ? 'Calculating...' : 'Recalculate'}
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleApprove} disabled={approving || project.status === 'APPROVED'}>
                <BarChart3 className="h-4 w-4 mr-2" />
                {approving ? 'Approving...' : project.status === 'APPROVED' ? 'Approved' : 'Approve Project'}
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleReject} disabled={rejecting}>
                <FileText className="h-4 w-4 mr-2" />
                {rejecting ? 'Rejecting...' : 'Reject with Reason'}
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}