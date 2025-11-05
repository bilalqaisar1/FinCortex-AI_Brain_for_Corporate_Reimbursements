"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <Card className={cn("bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg", className)}>
      <CardContent className="p-12 text-center">
        {Icon && (
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8 text-slate-400" />
          </div>
        )}
        
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        
        {description && (
          <p className="text-slate-500 mb-6 max-w-md mx-auto">{description}</p>
        )}
        
        {action && (
          <Button
            onClick={action.onClick}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            {action.label}
          </Button>
        )}
        
        {children}
      </CardContent>
    </Card>
  );
}
