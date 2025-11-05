"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  QuickAnalytics,
  PageHeader
} from "@/components/dashboard";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  const router = useRouter();

  const handleRefresh = () => {
    // Refresh analytics data
    console.log("Refresh analytics data");
    // Implement refresh logic
  };

  const handleExport = () => {
    // Export analytics report
    console.log("Export analytics report");
    // Implement export logic
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      <PageHeader
        title="Analytics & Reports"
        description="View comprehensive analytics and generate detailed reports"
        icon={BarChart3}
        iconColor="text-purple-600"
        iconBgColor="bg-purple-100"
        actions={
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => router.back()}
              className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              ← Back
            </button>
          </div>
        }
      />

      <QuickAnalytics
        onRefresh={handleRefresh}
        onExport={handleExport}
      />
    </div>
  );
}
