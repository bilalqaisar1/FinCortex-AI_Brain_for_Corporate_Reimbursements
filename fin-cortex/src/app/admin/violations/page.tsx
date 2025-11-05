"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  PolicyViolations,
  PageHeader
} from "@/components/dashboard";
import { AlertTriangle } from "lucide-react";

export default function ViolationsPage() {
  const router = useRouter();

  const handleView = (violationId: string) => {
    // Navigate to detailed violation view
    console.log("View violation:", violationId);
    // router.push(`/admin/violations/${violationId}`);
  };

  const handleResolve = (violationId: string) => {
    // Resolve the violation
    console.log("Resolve violation:", violationId);
    if (confirm("Are you sure you want to resolve this violation?")) {
      // Implement resolve logic
    }
  };

  const handleDismiss = (violationId: string) => {
    // Dismiss the violation
    console.log("Dismiss violation:", violationId);
    if (confirm("Are you sure you want to dismiss this violation?")) {
      // Implement dismiss logic
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      <PageHeader
        title="Policy Violations"
        description="Monitor and manage policy violations and compliance issues"
        icon={AlertTriangle}
        iconColor="text-red-600"
        iconBgColor="bg-red-100"
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

      <PolicyViolations
        onView={handleView}
        onResolve={handleResolve}
        onDismiss={handleDismiss}
      />
    </div>
  );
}
