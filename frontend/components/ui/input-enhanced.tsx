'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  hint?: string;
  loading?: boolean;
}

const InputEnhanced = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, hint, loading, ...props }, ref) => {
    const hasError = Boolean(error);
    
    return (
      <div className="space-y-2">
        <div className="relative">
          <input
            type={type}
            className={cn(
              'flex h-11 w-full rounded-xl border bg-background/80 backdrop-blur-sm px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
              hasError
                ? 'border-red-500/60 focus-visible:ring-red-500/20 bg-red-50/50 dark:bg-red-950/20'
                : 'border-border/60 hover:border-border/80 focus-visible:border-primary/60',
              loading && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            </div>
          )}
          {hasError && !loading && (
            <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
          )}
        </div>
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        {hint && !error && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground/75">
            <Info className="h-3.5 w-3.5" />
            <span>{hint}</span>
          </div>
        )}
      </div>
    );
  }
);
InputEnhanced.displayName = 'InputEnhanced';

export { InputEnhanced };