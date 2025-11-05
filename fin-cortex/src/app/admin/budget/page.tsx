"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  BudgetOverview,
  PageHeader
} from "@/components/dashboard";
import { DollarSign } from "lucide-react";

export default function BudgetPage() {
  const router = useRouter();

  const handleViewDetails = (companyId: string) => {
    // Navigate to detailed budget view
    console.log("View budget details for company:", companyId);
    // router.push(`/admin/budget/${companyId}`);
  };

  const handleAddBudget = () => {
    // Navigate to add budget form or open modal
    console.log("Add budget clicked");
    // router.push("/admin/budget/add");
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      <PageHeader
        title="Budget Management"
        description="Monitor budget utilization and manage financial allocations across companies"
        icon={DollarSign}
        iconColor="text-green-600"
        iconBgColor="bg-green-100"
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

      <BudgetOverview
        onViewDetails={handleViewDetails}
        onAddBudget={handleAddBudget}
      />
    </div>
  );
}
