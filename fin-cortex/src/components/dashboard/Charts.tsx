"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export function Chart({ 
  title, 
  description, 
  children, 
  className,
  loading = false 
}: ChartProps) {
  if (loading) {
    return (
      <Card className={cn("bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg", className)}>
        {title && (
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">{title}</CardTitle>
            {description && (
              <p className="text-sm text-slate-600">{description}</p>
            )}
          </CardHeader>
        )}
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-32 bg-slate-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg", className)}>
      {title && (
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">{title}</CardTitle>
          {description && (
            <p className="text-sm text-slate-600">{description}</p>
          )}
        </CardHeader>
      )}
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  );
}

// Simple Bar Chart Component
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
  className?: string;
}

export function BarChart({ data, maxValue, className }: BarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value));
  
  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-700">{item.label}</span>
            <span className="font-medium text-slate-900">{item.value}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                item.color || "bg-gradient-to-r from-blue-500 to-purple-600"
              )}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Simple Line Chart Component
interface LineChartProps {
  data: { x: string; y: number }[];
  className?: string;
}

export function LineChart({ data, className }: LineChartProps) {
  const maxY = Math.max(...data.map(d => d.y));
  const minY = Math.min(...data.map(d => d.y));
  const range = maxY - minY;
  
  return (
    <div className={cn("relative h-32", className)}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="2"
          points={data.map((point, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - ((point.y - minY) / range) * 100;
            return `${x},${y}`;
          }).join(" ")}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Simple Pie Chart Component
interface PieChartProps {
  data: { label: string; value: number; color: string }[];
  className?: string;
}

export function PieChart({ data, className }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;
  
  return (
    <div className={cn("relative w-32 h-32 mx-auto", className)}>
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const startAngle = (cumulativePercentage / 100) * 360;
          const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
          
          const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
          const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
          const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
          const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
          
          const largeArcFlag = percentage > 50 ? 1 : 0;
          
          const pathData = [
            `M 50 50`,
            `L ${x1} ${y1}`,
            `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `Z`
          ].join(" ");
          
          cumulativePercentage += percentage;
          
          return (
            <path
              key={index}
              d={pathData}
              fill={item.color}
              className="transition-all duration-300 hover:opacity-80"
            />
          );
        })}
      </svg>
    </div>
  );
}
