"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  PendingApprovals,
  PageHeader
} from "@/components/dashboard";
import { Clock } from "lucide-react";

export default function ApprovalsPage() {
  const router = useRouter();

  const handleApprove = (approvalId: string) => {
    // Approve the reimbursement
    console.log("Approve:", approvalId);
    // Implement approval logic
  };

  const handleReject = (approvalId: string) => {
    // Reject the reimbursement
    console.log("Reject:", approvalId);
    if (confirm("Are you sure you want to reject this reimbursement?")) {
      // Implement rejection logic
    }
  };

  const handleView = (approvalId: string) => {
    // Navigate to detailed view
    console.log("View approval:", approvalId);
    // router.push(`/admin/approvals/${approvalId}`);
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      <PageHeader
        title="Pending Approvals"
        description="Review and approve reimbursement claims requiring your attention"
        icon={Clock}
        iconColor="text-orange-600"
        iconBgColor="bg-orange-100"
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

      <PendingApprovals
        onApprove={handleApprove}
        onReject={handleReject}
        onView={handleView}
      />
    </div>
  );
}
