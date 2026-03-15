"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getWorkflowState, isStepAccessible, type FeasibilityStep, type FeasibilityWorkflowState } from "@/lib/workflow/feasibilitySteps";
import {
  LayoutDashboard,
  FileText,
  Settings,
  BarChart3,
  FolderKanban,
  Users,
  DollarSign,
  Plus,
  ArrowLeft,
  Sliders,
  Building2,
  TrendingUp,
  Waves
} from "lucide-react";

// General app navigation
const generalMenuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    title: "Projects",
    icon: FolderKanban,
    href: "/projects",
  },
  {
    title: "Reports",
    icon: FileText,
    href: "/reports",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    href: "/analytics",
  },
  {
    title: "Team",
    icon: Users,
    href: "/team",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

// Project-specific navigation (when inside /projects/[id])
const getProjectMenuItems = (projectId: string) => [
  {
    title: "Overview",
    icon: LayoutDashboard,
    href: `/projects/${projectId}`,
  },
  {
    title: "Assumptions",
    icon: Sliders,
    href: `/projects/${projectId}/assumptions`,
    step: 'assumptions' as FeasibilityStep,
  },
  {
    title: "Revenue",
    icon: TrendingUp,
    href: `/projects/${projectId}/revenue`,
    step: 'revenue' as FeasibilityStep,
  },
  {
    title: "CapEx",
    icon: Building2,
    href: `/projects/${projectId}/capex`,
    step: 'capex' as FeasibilityStep,
  },
  {
    title: "OpEx",
    icon: DollarSign,
    href: `/projects/${projectId}/opex`,
    step: 'opex' as FeasibilityStep,
  },
  {
    title: "Cashflow",
    icon: Waves,
    href: `/projects/${projectId}/cashflow`,
    step: 'cashflow' as FeasibilityStep,
  },
  {
    title: "Report",
    icon: FileText,
    href: `/projects/${projectId}/report`,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const [workflowState, setWorkflowState] = useState<FeasibilityWorkflowState | null>(null);
  
  // Check if we're inside a project
  const projectId = params?.id as string;
  const isInProject = pathname.startsWith('/projects/') && projectId && !pathname.endsWith('/new');

  useEffect(() => {
    if (!isInProject || !projectId) {
      setWorkflowState(null);
      return;
    }

    let isActive = true;

    const loadWorkflowState = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
          return;
        }

        const project = await response.json();
        if (isActive) {
          setWorkflowState(getWorkflowState(project.inputParameters ?? {}));
        }
      } catch {
        if (isActive) {
          setWorkflowState(null);
        }
      }
    };

    void loadWorkflowState();

    return () => {
      isActive = false;
    };
  }, [isInProject, projectId, pathname]);
  
  // Choose menu items based on context
  const menuItems = isInProject ? getProjectMenuItems(projectId) : generalMenuItems;

  const completedSteps = useMemo(() => {
    if (!workflowState) {
      return new Set<FeasibilityStep>();
    }

    return new Set<FeasibilityStep>(
      (['assumptions', 'revenue', 'capex', 'opex', 'cashflow'] as FeasibilityStep[]).filter((step) => workflowState[step])
    );
  }, [workflowState]);

  return (
    <div className="sidebar-surface flex h-full flex-col">
      {/* Logo Section */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-3 font-semibold group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
            <span className="text-lg font-bold">OF</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Optical Fiber</span>
            <span className="text-[10px] text-muted-foreground font-normal">Business Case</span>
          </div>
        </Link>
      </div>

      {/* Navigation Section */}
      <ScrollArea className="flex-1 px-2.5 py-3">
        {/* Project context header */}
        {isInProject && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="px-2 gap-1">
                  <ArrowLeft className="h-3 w-3" />
                  <span className="text-xs">All Projects</span>
                </Button>
              </Link>
            </div>
            <Separator className="my-2" />
          </div>
        )}
        
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isStepItem = 'step' in item && !!item.step;
            const accessible = !isStepItem || !workflowState || isStepAccessible(item.step, workflowState);
            const stepDone = isStepItem && item.step ? completedSteps.has(item.step) : false;

            return (
              <Link
                key={item.href}
                href={accessible ? item.href : '#'}
                onClick={(event) => {
                  if (!accessible) {
                    event.preventDefault();
                  }
                }}
                className={cn(
                  "nav-link group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium relative overflow-hidden",
                  isActive
                    ? "nav-link-active"
                    : "text-foreground/85 hover:text-foreground",
                  !accessible && "opacity-55 cursor-not-allowed"
                )}
                aria-disabled={!accessible}
              >
                {isActive && (
                  <div className="absolute left-0 top-1 bottom-1 w-1 bg-primary/80 rounded-r-full" />
                )}
                <Icon className={cn(
                  "h-4 w-4",
                  isActive ? "text-primary" : "text-foreground/70"
                )} />
                <span>{item.title}</span>
                {isStepItem && (
                  <Badge variant={stepDone ? 'default' : accessible ? 'secondary' : 'outline'} className="ml-auto text-[10px] h-5 px-1.5">
                    {stepDone ? 'Done' : accessible ? 'Run' : 'Lock'}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
        
        {/* Add separator and quick actions for general navigation */}
        {!isInProject && (
          <div className="mt-4 pt-3 border-t border-border/70">
            <div className="space-y-1">
              <Link href="/projects/new">
                <Button variant="outline" className="w-full justify-start gap-2 text-sm ui-input">
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              </Link>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Bottom Section */}
      <div className="border-t p-3">
        <div className="surface-card p-3 text-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-foreground">Business Case</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium border border-primary/25">v1.0</span>
          </div>
          <p className="text-xs text-muted-foreground">Fiber Optic Project Management</p>
        </div>
      </div>
    </div>
  );
}
