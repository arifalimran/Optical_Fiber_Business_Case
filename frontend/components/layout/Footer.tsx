"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/useAuth";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { user } = useAuth();

  return (
    <footer className="border-t bg-gradient-to-r from-background via-muted/10 to-background backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4">
        {/* Compact Single Row */}
        <div className="flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground md:flex-row">
          {/* Left: Copyright and User Info */}
          <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
            <p className="flex items-center gap-2">
              <span className="font-semibold text-foreground">©</span>
              <span>{currentYear} Optical Fiber Business Case</span>
            </p>
            {user && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-xs">
                  <span className="font-semibold text-foreground">{user.fullName}</span>
                  <span className="mx-1.5">·</span>
                  <span className={`font-medium ${
                    user.role === 'ADMIN' ? 'text-purple-600' : 
                    user.role === 'APPROVER' ? 'text-blue-600' : 
                    'text-green-600'
                  }`}>{user.role}</span>
                </p>
              </div>
            )}
          </div>

          {/* Right: Quick Links */}
          <div className="flex items-center gap-1">
            {[
              { href: '/', label: 'Dashboard' },
              { href: '/projects', label: 'Projects' },
              { href: '/settings', label: 'Settings' }
            ].map((link, i) => (
              <Link 
                key={link.href}
                href={link.href} 
                className="px-3 py-1.5 text-xs font-medium rounded-lg hover:text-foreground hover:bg-accent/50 transition-all duration-200 hover:scale-105"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
