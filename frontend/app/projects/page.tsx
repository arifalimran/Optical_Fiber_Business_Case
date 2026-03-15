'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Search, 
  FolderOpen, 
  Calendar, 
  User,
  DollarSign,
  TrendingUp,
  Clock,
  Filter,
  MoreVertical,
  Building2,
  Cable,
  Radio,
  Zap,
  Grid3X3,
  List,
  SortAsc,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Eye,
  Edit,
  Trash2,
  X,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  projectName: string;
  clientName: string | null;
  templateCode: string;
  status: string;
  totalCost: number | null;
  grossRevenue: number | null;
  netProfit: number | null;
  profitMargin: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  approvedBy: string | null;
}

interface Template {
  code: string;
  name: string;
  description: string;
}

let projectsCache: Project[] | null = null;
let templatesCache: Template[] | null = null;

const STATUS_COLORS = {
  DRAFT: { 
    bg: 'bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700', 
    text: 'text-slate-700 dark:text-slate-300', 
    label: 'Draft',
    icon: AlertTriangle
  },
  IN_PROGRESS: { 
    bg: 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900', 
    text: 'text-blue-700 dark:text-blue-300', 
    label: 'In Progress',
    icon: Clock
  },
  COMPLETED: { 
    bg: 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900', 
    text: 'text-green-700 dark:text-green-300', 
    label: 'Completed',
    icon: CheckCircle
  },
  APPROVED: { 
    bg: 'bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900', 
    text: 'text-emerald-700 dark:text-emerald-300', 
    label: 'Approved',
    icon: Sparkles
  },
  REJECTED: { 
    bg: 'bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900 dark:to-rose-900', 
    text: 'text-red-700 dark:text-red-300', 
    label: 'Rejected',
    icon: AlertTriangle
  }
};

const TEMPLATE_ICONS = {
  'OPTICAL_FIBER': Cable,
  '5G_TOWER': Radio,
  'BUILDING': Building2,
  'NETWORK': Zap,
  default: FolderOpen
};

const TEMPLATE_COLORS = {
  'OPTICAL_FIBER': { 
    gradient: 'from-blue-500/10 via-cyan-500/5 to-transparent',
    border: 'border-blue-500/20',
    icon: 'text-blue-500'
  },
  '5G_TOWER': { 
    gradient: 'from-purple-500/10 via-pink-500/5 to-transparent',
    border: 'border-purple-500/20', 
    icon: 'text-purple-500'
  },
  'BUILDING': { 
    gradient: 'from-emerald-500/10 via-green-500/5 to-transparent',
    border: 'border-emerald-500/20',
    icon: 'text-emerald-500'
  },
  default: { 
    gradient: 'from-slate-500/10 via-gray-500/5 to-transparent',
    border: 'border-slate-500/20',
    icon: 'text-slate-500'
  }
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(projectsCache ?? []);
  const [templates, setTemplates] = useState<Template[]>(templatesCache ?? []);
  const [loading, setLoading] = useState(!projectsCache);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status' | 'profit'>('date');

  useEffect(() => {
    void fetchProjects();
    void fetchTemplates();
  }, []);

  useEffect(() => {
    projects.slice(0, 10).forEach((project) => {
      router.prefetch(`/projects/${project.id}`);
    });
  }, [projects, router]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(data);
      projectsCache = data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      const data = await response.json();
      setTemplates(data);
      templatesCache = data;
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const getTemplateName = (code: string) => {
    const template = templates.find(t => t.code === code);
    return template?.name || code;
  };

  const getTemplateIcon = (code: string) => {
    return TEMPLATE_ICONS[code as keyof typeof TEMPLATE_ICONS] || TEMPLATE_ICONS.default;
  };

  const getTemplateColor = (code: string) => {
    return TEMPLATE_COLORS[code as keyof typeof TEMPLATE_COLORS] || TEMPLATE_COLORS.default;
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.clientName && project.clientName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading projects...</span>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats after filtering
  const stats = {
    total: projects.length,
    completed: projects.filter(p => p.status === 'COMPLETED').length,
    inProgress: projects.filter(p => p.status === 'IN_PROGRESS').length,
    totalRevenue: projects.reduce((sum, p) => sum + (p.grossRevenue || 0), 0),
    totalProfit: projects.reduce((sum, p) => sum + (p.netProfit || 0), 0),
    avgMargin: projects.length > 0 
      ? projects.filter(p => p.profitMargin).reduce((sum, p) => sum + (p.profitMargin || 0), 0) / projects.filter(p => p.profitMargin).length
      : 0
  };

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.projectName.localeCompare(b.projectName);
      case 'status':
        return a.status.localeCompare(b.status);
      case 'profit':
        return (b.netProfit || 0) - (a.netProfit || 0);
      case 'date':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20">
              <FolderOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Projects
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage your feasibility analysis projects
              </p>
            </div>
          </div>
        </div>
        <Link href="/projects/new">
          <Button size="lg" className="modern-button h-12 px-6 gap-3 shadow-lg">
            <Plus className="h-5 w-5" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="interactive-card outlined-card projects-kpi-card shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10">
                <FolderOpen className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="interactive-card outlined-card projects-kpi-card shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-foreground">{stats.completed}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="interactive-card outlined-card projects-kpi-card shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold text-foreground">{stats.inProgress}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="interactive-card outlined-card projects-kpi-card shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search, Filters and View Controls */}
      <Card className="interactive-card outlined-card shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 search-enhanced outlined-input rounded-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search projects by name or client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent pl-10 pr-4 py-2.5 h-10 text-sm focus:outline-none border-0"
              />
            </div>
            
            {/* Filters and Controls */}
            <div className="flex flex-wrap gap-3">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="modern-input outlined-input px-3 py-2 h-10 rounded-lg text-sm min-w-[120px]"
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="modern-input outlined-input px-3 py-2 h-10 rounded-lg text-sm min-w-[120px]"
              >
                <option value="date">Recent</option>
                <option value="name">Name A-Z</option>
                <option value="status">Status</option>
                <option value="profit">Profit</option>
              </select>

              {/* View Mode */}
              <div className="flex rounded-lg border border-border overflow-hidden glass-card">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="modern-button rounded-none h-10 px-3"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="modern-button rounded-none h-10 px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Active Filters */}
          {(searchTerm || statusFilter !== 'ALL') && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm('')}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {statusFilter !== 'ALL' && (
                <Badge variant="secondary" className="gap-1">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('ALL')}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects Grid/List */}
      {sortedProjects.length === 0 ? (
        <Card className="glass-card border-none shadow-lg">
          <CardContent className="text-center py-16">
            <div className="space-y-6">
              <div className="p-4 rounded-full bg-gradient-to-br from-muted to-muted/60 w-20 h-20 mx-auto flex items-center justify-center">
                <FolderOpen className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  {projects.length === 0 ? "No projects yet" : "No projects found"}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {projects.length === 0 
                    ? "Get started by creating your first feasibility analysis project" 
                    : "Try adjusting your search criteria or filters to find what you're looking for"}
                </p>
              </div>
              {projects.length === 0 && (
                <Link href="/projects/new">
                  <Button size="lg" className="modern-button mt-4">
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Project
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedProjects.map((project) => {
            const statusConfig = STATUS_COLORS[project.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.DRAFT;
            const templateColor = getTemplateColor(project.templateCode);
            const TemplateIcon = getTemplateIcon(project.templateCode);
            const StatusIcon = statusConfig.icon;

            return (
              <Link 
                key={project.id} 
                href={`/projects/${project.id}`}
                className="block"
                onMouseEnter={() => router.prefetch(`/projects/${project.id}`)}
              >
                <Card
                  className={cn(
                    "interactive-card outlined-card shadow-lg cursor-pointer",
                    "group relative overflow-hidden backdrop-blur-lg"
                  )}
                >
                  {/* Background gradient */}
                  <div className={cn(
                    "absolute inset-0 opacity-50",
                    `bg-gradient-to-br ${templateColor.gradient}`
                  )} />
                  
                  <CardContent className="relative p-6 space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg bg-background/80 backdrop-blur-sm border",
                        templateColor.border
                      )}>
                        <TemplateIcon className={cn("h-5 w-5", templateColor.icon)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate text-lg">
                          {project.projectName}
                        </h3>
                        {project.clientName && (
                          <p className="text-sm text-muted-foreground truncate">
                            {project.clientName}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <Badge className={cn(
                      "font-medium px-2 py-1",
                      statusConfig.bg,
                      statusConfig.text,
                      "border-none"
                    )}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>

                  {/* Template Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{getTemplateName(project.templateCode)}</span>
                    </div>
                    
                    {/* Financial Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Revenue</div>
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(project.grossRevenue)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Profit</div>
                        <div className="text-sm font-semibold text-emerald-600">
                          {formatCurrency(project.netProfit)}
                        </div>
                      </div>
                    </div>

                    {/* Profit Margin */}
                    {project.profitMargin !== null && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm text-emerald-600 font-medium">
                          {project.profitMargin.toFixed(1)}% margin
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(project.updatedAt)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground pointer-events-none">
                      <Eye className="h-4 w-4" />
                      <MoreVertical className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        // List View
        <Card className="interactive-card outlined-card shadow-lg">
          <CardContent className="p-0">
            <div className="space-y-0">
              {sortedProjects.map((project) => {
                const statusConfig = STATUS_COLORS[project.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.DRAFT;
                const templateColor = getTemplateColor(project.templateCode);
                const TemplateIcon = getTemplateIcon(project.templateCode);
                const StatusIcon = statusConfig.icon;

                return (
                  <Link 
                    key={project.id} 
                    href={`/projects/${project.id}`}
                    className="block"
                    onMouseEnter={() => router.prefetch(`/projects/${project.id}`)}
                  >
                    <div className="p-6 border-b border-border/50 last:border-b-0 hover:bg-accent/30 transition-colors duration-150 rounded-lg mx-2 my-1 first:mt-0 last:mb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={cn(
                            "p-2 rounded-lg bg-background border",
                            templateColor.border
                          )}>
                            <TemplateIcon className={cn("h-5 w-5", templateColor.icon)} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-foreground truncate">
                                {project.projectName}
                              </h3>
                              <Badge className={cn(
                                "font-medium px-2 py-1",
                                statusConfig.bg,
                                statusConfig.text,
                                "border-none"
                              )}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Template: {getTemplateName(project.templateCode)}</span>
                              {project.clientName && (
                                <>
                                  <span>•</span>
                                  <span>Client: {project.clientName}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>Updated: {formatDate(project.updatedAt)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="text-right">
                              <div className="text-green-600 font-medium">
                                {formatCurrency(project.grossRevenue)}
                              </div>
                              <div className="text-xs text-muted-foreground">Revenue</div>
                            </div>
                            <div className="text-right">
                              <div className="text-emerald-600 font-medium">
                                {formatCurrency(project.netProfit)}
                              </div>
                              <div className="text-xs text-muted-foreground">Profit</div>
                            </div>
                            {project.profitMargin !== null && (
                              <div className="text-right">
                                <div className="text-emerald-600 font-medium">
                                  {project.profitMargin.toFixed(1)}%
                                </div>
                                <div className="text-xs text-muted-foreground">Margin</div>
                              </div>
                            )}
                          </div>
                          
                          <div className="h-8 w-8 flex items-center justify-center text-muted-foreground pointer-events-none">
                            <MoreVertical className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}