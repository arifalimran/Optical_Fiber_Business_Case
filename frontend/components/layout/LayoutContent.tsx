"use client";

import { usePathname } from "next/navigation";
import { MainLayout } from "@/components/layout";

interface LayoutContentProps {
  children: React.ReactNode;
}

export function LayoutContent({ children }: LayoutContentProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return <MainLayout>{children}</MainLayout>;
}