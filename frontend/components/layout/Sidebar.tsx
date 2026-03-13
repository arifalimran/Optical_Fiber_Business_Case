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
    <div className="flex h-full flex-col border-r bg-background">
      {/* Logo Section */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg font-bold">OF</span>
          </div>
          <span className="text-lg">Optical Fiber</span>
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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      {/* Bottom Section */}
      <div className="border-t p-4">
        <div className="rounded-lg bg-muted p-3 text-sm">
          <p className="font-medium">Business Case v1.0</p>
          <p className="text-xs text-muted-foreground">Fiber Optic Project Management</p>
        </div>
      </div>
    </div>
  );
}
