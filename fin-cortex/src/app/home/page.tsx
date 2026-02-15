"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { FloatingPills } from "@/components/ui/FloatingPills";
import { FinCortexLogo } from "@/components/ui/FinCortexLogo";
import { MessageSquare, LogOut } from "lucide-react";

export default function HomePage() {
  const { isDarkTheme } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <section id="home" className="min-h-screen bg-[var(--background-dark)] text-[var(--text-primary)] relative flex flex-col items-center justify-center overflow-hidden transition-colors duration-500">
      <FloatingPills />

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl">
        {/* Large Centered Logo */}
        <div className="mb-16 transform hover:scale-105 transition-transform duration-700">
          <FinCortexLogo size="xl" />
        </div>

        {/* Hero Title */}
        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-10">
          Intelligence.<br />
          <span className="bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">
            Logic. Digital.
          </span>
        </h1>

        <p className="text-[var(--text-secondary)] text-sm md:text-base font-bold uppercase tracking-[0.3em] max-w-2xl leading-relaxed mb-16 opacity-80">
          Engineering robust digital systems through precise logic<br className="hidden md:block" />
          and high-performance AI integration.
        </p>

        {/* Dashboard Preview / CTA */}
        <div className="flex gap-6">
          <Link href={user ? "/dashboard" : "/signup"}>
            <button className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-white shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(168,85,247,0.4)] transition-all duration-500 active:scale-95 overflow-hidden">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-3">
                {user ? "View Dashboard" : "Get Started"}
                <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <MessageSquare className="w-2.5 h-2.5" />
                </div>
              </span>
            </button>
          </Link>
          {user && (
            <button
              onClick={handleSignOut}
              className="px-8 py-4 bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover,rgba(255,255,255,0.1))] border border-[var(--border-subtle)] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-[var(--text-primary)] transition-all duration-300 flex items-center gap-3"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Ask AI Widget */}
      <div className="absolute bottom-10 right-10 z-20">
        <button className="flex items-center gap-3 px-6 py-3 bg-[var(--surface-elevated)] backdrop-blur-2xl border border-[var(--border-subtle)] rounded-full group hover:border-purple-500/50 transition-all shadow-2xl">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366f1] to-[#ec4899] flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
            Ask FinCortex AI
          </span>
        </button>
      </div>

      {/* Decorative Border */}
      <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[var(--border-subtle)] to-transparent opacity-30" />
    </section>
  );
}