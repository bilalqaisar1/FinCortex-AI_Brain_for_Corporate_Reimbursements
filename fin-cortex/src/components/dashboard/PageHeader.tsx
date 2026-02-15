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
    <div className={cn("mb-12", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center space-x-3 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-6">
          {breadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              {index > 0 && <span className="text-[var(--text-muted)] opacity-30">/</span>}
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-[var(--text-primary)] transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-purple-400">{item.label}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div className="flex items-center space-x-6">
          {showBackButton && (
            <Link href={backButtonHref} className="mr-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-[var(--card-dark)] border-[var(--border-subtle)] hover:bg-[var(--card-hover)]"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
          )}

          {Icon && (
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/20 bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#ec4899] relative overflow-hidden group"
            )}>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Icon className="w-8 h-8 text-white relative z-10" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 flex-wrap mb-1">
              <h1 className="text-4xl font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none">{title}</h1>
              {badge && (
                <Badge
                  variant={badge.variant || "secondary"}
                  className={cn("bg-[var(--card-dark)] text-purple-400 border-[var(--border-subtle)] text-[10px] uppercase font-black tracking-widest px-3 py-1", badge.className)}
                >
                  {badge.text}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-widest">{description}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
