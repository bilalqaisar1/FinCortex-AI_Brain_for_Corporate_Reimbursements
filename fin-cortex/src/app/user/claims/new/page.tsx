"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ReceiptText } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { UserNavbar } from "@/components/dashboard/UserNavbar";
import ExpenseForm from "@/app/components/forms/ExpenseForm";

export default function SubmitClaimPage() {
  const { isDarkTheme, toggleTheme, themeIcon } = useTheme();


  return (
    <div className="flex min-h-[calc(100vh-0px)] w-full">
      {/* Navbar */}
      <UserNavbar toggleTheme={toggleTheme} themeIcon={themeIcon} />

      <main className="flex min-h-[100dvh] flex-1 flex-col pt-20">
        <div className="border-b border-subtle glass-effect px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <ReceiptText className="size-6 md:size-7 text-primary" />
            <div>
              <h1 className="text-lg md:text-xl font-bold text-primary">Submit New Claim</h1>
              <p className="text-xs md:text-sm text-muted">Upload receipt and fill claim details</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10">
          <ExpenseForm isDarkTheme={isDarkTheme} />
        </div>
      </main>
    </div>
  );
}