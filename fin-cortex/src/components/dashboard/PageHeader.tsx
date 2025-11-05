"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ArrowLeft, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  breadcrumbs?: BreadcrumbItem[];
  showBackButton?: boolean;
  backButtonHref?: string;
  backButtonLabel?: string;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
    className?: string;
  };
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  iconColor = "text-blue-600",
  iconBgColor = "bg-blue-100",
  breadcrumbs = [],
  showBackButton = false,
  backButtonHref = "/admin",
  backButtonLabel = "Back",
  badge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center space-x-2 text-sm text-slate-600 mb-4">
          {breadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              {index > 0 && <ChevronRight className="w-4 h-4" />}
              {item.href ? (
                <Link 
                  href={item.href} 
                  className="hover:text-blue-600 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-slate-900 font-medium">{item.label}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          {showBackButton && (
            <Link href={backButtonHref} className="mr-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {backButtonLabel}
              </Button>
            </Link>
          )}
          
          {Icon && (
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
              iconBgColor
            )}>
              <Icon className={cn("w-6 h-6", iconColor)} />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">{title}</h1>
              {badge && (
                <Badge 
                  variant={badge.variant || "secondary"}
                  className={cn("text-xs sm:text-sm", badge.className)}
                >
                  {badge.text}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-sm sm:text-base text-slate-600 mt-1 line-clamp-2">{description}</p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center space-x-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
