"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PolicyViolations,
  PageHeader
} from "@/components/dashboard";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchViolations } from "@/app/api/v1/admin/policy-rules-api";

export default function ViolationsPage() {
  const router = useRouter();
  const { userProfile } = useAuth();

  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.user_id) {
      loadViolations();
    }
  }, [userProfile?.user_id]);

  async function loadViolations() {
    if (!userProfile?.user_id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchViolations(userProfile.user_id);
      setViolations(data as any);
    } catch (err) {
      console.error("Failed to load violations", err);
      setError("Failed to load violations. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleView = (violationId: string) => {
    console.log("View violation:", violationId);
  };

  const handleResolve = (violationId: string) => {
    console.log("Resolve violation:", violationId);
    if (confirm("Are you sure you want to resolve this violation?")) {
      // Implement resolve logic
    }
  };

  const handleDismiss = (violationId: string) => {
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <span className="ml-2 text-slate-600">Loading violations...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          {error}
          <button
            onClick={loadViolations}
            className="ml-3 px-3 py-1 text-sm bg-red-50 border border-red-200 rounded-md hover:bg-red-100 text-red-600"
          >
            Retry
          </button>
        </div>
      ) : violations.length === 0 ? (
        <div className="text-center py-16">
          <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-green-400" />
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
            No violations detected
          </p>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            All employee claims are currently compliant with company policies.
            Violations will appear here when claims are flagged for restricted items,
            duplicate submissions, or exceeding policy limits.
          </p>
        </div>
      ) : (
        <PolicyViolations
          violations={violations}
          onView={handleView}
          onResolve={handleResolve}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  );
}
