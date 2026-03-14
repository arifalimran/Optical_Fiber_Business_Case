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

const STATUS_COLORS = {
  DRAFT: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', label: 'Draft' },
  IN_PROGRESS: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-300', label: 'In Progress' },
  COMPLETED: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-300', label: 'Completed' },
  APPROVED: { bg: 'bg-emerald-100 dark:bg-emerald-900', text: 'text-emerald-700 dark:text-emerald-300', label: 'Approved' },
  REJECTED: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-700 dark:text-red-300', label: 'Rejected' }
};

const TEMPLATE_ICONS: Record<string, React.ComponentType<any>> = {
  'optical-fiber': Cable,
  '5g-tower': Radio,
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

  const projectId = params.id as string;

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Project not found');
          router.push('/projects');
          return;
        }
        throw new Error('Failed to fetch project');
      }
      
      const projectData = await response.json();
      setProject(projectData);
      setTempName(projectData.projectName);
      
      // Fetch template info
      const templateResponse = await fetch(`/api/templates/${projectData.templateCode}`);
      if (templateResponse.ok) {
        const templateData = await templateResponse.json();
        setTemplate(templateData);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project');
    } finally {
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
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-32 bg-gray-200 rounded-xl"></div>
              <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
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
                
                <Link href={`/projects/${project.id}/calculate`}>
                  <Button variant="outline" className="w-full h-20 flex-col gap-2">
                    <Calculator className="h-6 w-6" />
                    <span>Calculate</span>
                  </Button>
                </Link>
                
                <Link href={`/projects/${project.id}/report`}>
                  <Button variant="outline" className="w-full h-20 flex-col gap-2">
                    <FileText className="h-6 w-6" />
                    <span>Report</span>
                  </Button>
                </Link>
              </div>
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
                <Link href={`/projects/${project.id}/calculate`}>
                  <Button className="w-full">
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate Financials
                  </Button>
                </Link>
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