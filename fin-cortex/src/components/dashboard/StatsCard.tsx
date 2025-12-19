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
    <Card className={cn(
      "bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 group hover:scale-105",
      className
    )}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide truncate">
              {title}
            </p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {value}
            </p>
            {change && (
              <div className={cn("flex items-center space-x-1 text-xs sm:text-sm", getChangeColor())}>
                {getChangeIcon()}
                <span className="truncate">{change}</span>
              </div>
            )}
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                {description}
              </p>
            )}
          </div>
          <div className={cn(
            "w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0",
            iconBgColor
          )}>
            <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
