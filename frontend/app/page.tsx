'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, 
  Cable, 
  DollarSign, 
  FileText, 
  FolderKanban, 
  Plus, 
  Radio,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Activity,
  Eye,
  ChevronRight,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalProjects: number;
  projectsByStatus: Record<string, number>;
  totalRevenue: number;
  totalCosts: number;
  avgProfitMargin: number;
  recentProjects: Array<{
    id: string;
    projectName: string;
    templateCode: string;
    status: string;
    netProfit: number | null;
    updatedAt: string;
  }>;
}

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getProjectIcon = (templateCode: string) => {
    switch (templateCode) {
      case 'optical-fiber':
        return Cable;
      case '5g-tower':
        return Radio;
      default:
        return FileText;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 p-6 space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <Skeleton className="h-9 w-80" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="interactive-card p-6 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2].map(i => (
            <div key={i} className="interactive-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-4 w-32" />
              <div className="space-y-3">
                {[1, 2, 3].map(j => (
                  <div key={j} className="flex items-center justify-between p-3 rounded-lg border border-border/20">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 p-6 space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Welcome back!
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 dark:border-emerald-400/20">
              <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">System Active</span>
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Here's an overview of your feasibility analysis projects and business insights
          </p>
        </div>
        <Link href="/projects/new">
          <Button className="gap-2 h-11 px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 rounded-xl">
            <Plus className="h-4 w-4" />
            <span className="font-medium">New Project</span>
            <Sparkles className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card outlined-card dashboard-kpi-card hover-lift overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all duration-200">
              <FolderKanban className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{stats?.totalProjects || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              Active feasibility analyses
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card outlined-card dashboard-kpi-card hover-lift overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Potential</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-green-500/10 group-hover:from-emerald-500/20 group-hover:to-green-500/20 transition-all duration-200">
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Zap className="h-3 w-3 text-emerald-500" />
              Projected gross revenue
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card outlined-card dashboard-kpi-card hover-lift overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Costs</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 group-hover:from-orange-500/20 group-hover:to-red-500/20 transition-all duration-200">
              <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{formatCurrency(stats?.totalCosts || 0)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Activity className="h-3 w-3 text-orange-500" />
              Combined project costs
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card outlined-card dashboard-kpi-card hover-lift overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Profit Margin</CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-violet-500/10 group-hover:from-purple-500/20 group-hover:to-violet-500/20 transition-all duration-200">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-foreground">{stats?.avgProfitMargin?.toFixed(1) || '--'}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <CheckCircle className="h-3 w-3 text-purple-500" />
              Average across all projects
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Project Status Overview */}
        <Card className="glass-card outlined-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span>Project Status</span>
            </CardTitle>
            <CardDescription>
              Overview of your projects by status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.projectsByStatus && Object.entries(stats.projectsByStatus).map(([status, count]) => (
              <div key={status} className="status-card-outline dashboard-status-card flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 hover:from-muted/50 hover:to-muted/20 transition-colors duration-150 group">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    status === 'COMPLETED' && "bg-emerald-500",
                    status === 'IN_PROGRESS' && "bg-blue-500",
                    status === 'DRAFT' && "bg-gray-400",
                    status === 'APPROVED' && "bg-green-500",
                    status === 'REJECTED' && "bg-red-500"
                  )} />
                  <Badge className={cn(
                    "border-none group-hover:scale-105 transition-transform",
                    STATUS_COLORS[status as keyof typeof STATUS_COLORS]
                  )}>
                    {status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{count}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            ))}
            {(!stats?.projectsByStatus || Object.keys(stats.projectsByStatus).length === 0) && (
              <div className="text-center py-12 text-muted-foreground bg-gradient-to-br from-muted/20 to-muted/5 rounded-xl border border-border/20">
                <FolderKanban className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No projects yet</p>
                <p className="text-xs mt-1">Create your first project to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card className="glass-card outlined-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/10 to-blue-500/10">
                <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span>Recent Projects</span>
            </CardTitle>
            <CardDescription>
              Your most recently updated projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentProjects && stats.recentProjects.length > 0 ? (
              <div className="space-y-3">
                {stats.recentProjects.map((project) => {
                  const IconComponent = getProjectIcon(project.templateCode);
                  return (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <div className="flex items-center justify-between p-4 rounded-xl border border-border/30 hover:border-border/60 bg-gradient-to-r from-background/50 to-muted/20 hover:from-background/80 hover:to-muted/40 transition-all duration-200 cursor-pointer group hover-lift">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl group-hover:scale-110 transition-transform">
                            <IconComponent className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm group-hover:text-primary transition-colors">{project.projectName}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  "text-xs",
                                  STATUS_COLORS[project.status as keyof typeof STATUS_COLORS]
                                )}
                              >
                                {project.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(project.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {project.netProfit !== null && (
                            <div className={cn(
                              "text-sm font-semibold px-3 py-1 rounded-lg",
                              project.netProfit >= 0 ? 
                                "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400" : 
                                "text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400"
                            )}>
                              {formatCurrency(project.netProfit)}
                            </div>
                          )}
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground bg-gradient-to-br from-muted/20 to-muted/5 rounded-xl border border-border/20">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium mb-4">No recent projects</p>
                <Link href="/projects/new">
                  <Button variant="outline" size="sm" className="rounded-xl hover:scale-105 transition-transform">
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Project
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass-card outlined-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10">
              <Zap className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription>
            Get started with common tasks and workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/projects/new">
              <div className="interactive-card outlined-card group text-center hover:border-primary/40 hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10">
                <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 group-hover:from-blue-500/20 group-hover:to-cyan-500/20 transition-all duration-200 group-hover:scale-110 mb-4">
                  <Plus className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">New Project</h3>
                <p className="text-sm text-muted-foreground mb-4">Create a new feasibility analysis project</p>
                <div className="flex items-center justify-center gap-2 text-xs text-primary group-hover:gap-3 transition-all">
                  <span>Get Started</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
            
            <Link href="/projects">
              <div className="interactive-card outlined-card group text-center hover:border-emerald-500/40 hover:bg-gradient-to-br hover:from-emerald-500/5 hover:to-green-500/10">
                <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 group-hover:from-emerald-500/20 group-hover:to-green-500/20 transition-all duration-200 group-hover:scale-110 mb-4">
                  <FolderKanban className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">View All Projects</h3>
                <p className="text-sm text-muted-foreground mb-4">Browse and manage your existing projects</p>
                <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 group-hover:gap-3 transition-all">
                  <span>Explore</span>
                  <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </Link>
            
            <Link href="/reports">
              <div className="interactive-card outlined-card group text-center hover:border-purple-500/40 hover:bg-gradient-to-br hover:from-purple-500/5 hover:to-violet-500/10">
                <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 group-hover:from-purple-500/20 group-hover:to-violet-500/20 transition-all duration-200 group-hover:scale-110 mb-4">
                  <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Generate Reports</h3>
                <p className="text-sm text-muted-foreground mb-4">Create detailed analytical reports</p>
                <div className="flex items-center justify-center gap-2 text-xs text-purple-600 dark:text-purple-400 group-hover:gap-3 transition-all">
                  <span>Generate</span>
                  <BarChart3 className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

