"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BudgetOverview,
  PageHeader,
  CategoriesManager
} from "@/components/dashboard";
import { DollarSign, Tag, Calculator } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function BudgetPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Resolve company_id from admin profile
  useEffect(() => {
    const resolveCompanyId = async () => {
      const adminId = userProfile?.admin_id || userProfile?.user_id;
      if (!adminId) return;

      try {
        const { data, error } = await supabaseAdmin
          .from("companies")
          .select("company_id")
          .eq("admin_id", adminId)
          .maybeSingle();

        if (!error && data) {
          setCompanyId(data.company_id);
        } else {
          console.error("Failed to resolve company_id for admin:", error);
        }
      } catch (err) {
        console.error("Error resolving company_id:", err);
      }
    };

    resolveCompanyId();
  }, [userProfile]);

  const handleViewDetails = (companyId: string) => {
    console.log("View budget details for company:", companyId);
  };

  const handleAddBudget = () => {
    console.log("Add budget clicked");
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      <PageHeader
        title="BUDGET MANAGEMENT"
        description="Manage company budgets and department allocations"
        icon={DollarSign}
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

      <Tabs defaultValue="budget" className="w-full">
        <TabsList className="bg-white/[0.02] border border-white/5 p-1 mb-8">
          <TabsTrigger
            value="budget"
            className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest px-6"
          >
            <Calculator className="w-3.5 h-3.5 mr-2" />
            Budget Allocation
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest px-6"
          >
            <Tag className="w-3.5 h-3.5 mr-2" />
            Expense Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budget" className="mt-0 outline-none animate-in fade-in duration-500">
          <BudgetOverview
            onViewDetails={handleViewDetails}
            onAddBudget={handleAddBudget}
          />
        </TabsContent>

        <TabsContent value="categories" className="mt-0 outline-none animate-in fade-in duration-500">
          <CategoriesManager companyId={companyId} adminId={userProfile?.admin_id || userProfile?.user_id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
