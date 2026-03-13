"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  FileText,
  Calculator,
  Settings,
  BarChart3,
  FolderKanban,
  Users,
  DollarSign,
} from "lucide-react";

const menuItems = [
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
    title: "Cost Calculator",
    icon: Calculator,
    href: "/calculator",
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
    title: "Financial",
    icon: DollarSign,
    href: "/financial",
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col border-r bg-gradient-to-b from-background to-muted/20">
      {/* Logo Section */}
      <div className="flex h-16 items-center border-b px-6 bg-background/80 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-3 font-semibold group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
            <span className="text-lg font-bold">OF</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Optical Fiber</span>
            <span className="text-[10px] text-muted-foreground font-normal">Business Case</span>
          </div>
        </Link>
      </div>

      {/* Navigation Section */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out relative overflow-hidden",
                  isActive
                    ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm border border-primary/20"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground hover:translate-x-1"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/50 rounded-r-full" />
                )}
                <Icon className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isActive ? "text-primary" : "group-hover:scale-110"
                )} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      {/* Bottom Section */}
      <div className="border-t p-4 bg-gradient-to-t from-muted/30 to-transparent">
        <div className="rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-3 text-sm shadow-inner">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-foreground">Business Case</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">v1.0</span>
          </div>
          <p className="text-xs text-muted-foreground">Fiber Optic Project Management</p>
        </div>
      </div>
    </div>
  );
}
