"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral" | "warning";
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  description?: string;
  className?: string;
  loading?: boolean;
  onClick?: () => void;
}

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  description,
  iconColor = "text-blue-600 dark:text-blue-400",
  iconBgColor = "bg-blue-100 dark:bg-blue-900/30",
  className,
  loading = false,
  onClick,
}: StatsCardProps) {
  if (loading) {
    return (
      <Card className={cn("bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg", className)}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
              </div>
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getChangeIcon = () => {
    if (changeType === "positive") return <TrendingUp className="w-3 h-3" />;
    if (changeType === "negative") return <TrendingDown className="w-3 h-3" />;
    if (changeType === "warning") return <TrendingUp className="w-3 h-3" />;
    return null;
  };

  const getChangeColor = () => {
    switch (changeType) {
      case "positive":
        return "text-green-600 dark:text-green-400";
      case "negative":
        return "text-red-600 dark:text-red-400";
      case "warning":
        return "text-orange-600 dark:text-orange-400";
      default:
        return "text-slate-600 dark:text-slate-400";
    }
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        "bg-[var(--card-dark)] border border-[var(--border-subtle)] shadow-2xl transition-all duration-500 group overflow-hidden relative",
        onClick && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        className
      )}>
      {/* Background Accent Glow */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardContent className="p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] group-hover:text-purple-400 transition-colors duration-300">
              {title}
            </p>
            <p className="text-3xl font-black text-[var(--text-primary)] tracking-tight">
              {value}
            </p>

            <div className="flex items-center gap-2 mt-2">
              {change && (
                <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--card-dark)] border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-wider", getChangeColor())}>
                  {getChangeIcon()}
                  <span>{change}</span>
                </div>
              )}
              {description && (
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest truncate">
                  {description}
                </p>
              )}
            </div>
          </div>

          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 relative overflow-hidden group-hover:scale-110",
            "bg-[var(--card-dark)] border border-[var(--border-medium)] group-hover:border-purple-500/30 group-hover:bg-purple-500/10"
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-[#6366f1]/0 to-[#ec4899]/0 group-hover:from-[#6366f1]/10 group-hover:to-[#ec4899]/10 transition-all duration-500" />
            <Icon className={cn("w-6 h-6 relative z-10 transition-colors duration-300",
              "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
