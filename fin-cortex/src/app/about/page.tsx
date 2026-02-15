"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Globe,
  Shield,
  Award,
  Brain,
  ShieldCheck,
  Zap,
  Sparkles,
  Users,
  Target,
  TrendingUp,
  Building2,
  Lightbulb
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnhancedSeparator } from "@/components/ui/separator-enhanced";

export default function AboutPage() {
  const [visibleCards, setVisibleCards] = useState<number[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setVisibleCards([0, 1, 2, 3]), 200);
    return () => clearTimeout(timer);
  }, []);

  const aboutFeatures = [
    {
      title: "MISSION",
      icon: Target,
      content: "To engineer the most reliable logic engines for the digital frontier.",
      color: "text-blue-400"
    },
    {
      title: "VISION",
      icon: Globe,
      content: "Standardizing algorithmic precision across global enterprise infrastructures.",
      color: "text-purple-400"
    },
    {
      title: "CORE LOGIC",
      icon: Brain,
      content: "High-performance AI integration that actually delivers real business value.",
      color: "text-emerald-400"
    },
    {
      title: "SECURITY",
      icon: ShieldCheck,
      content: "Deep-layer protection built into every architectural decision we make.",
      color: "text-pink-400"
    }
  ];

  return (
    <section id="about" className="py-24 bg-[var(--background-dark)] text-[var(--text-primary)] relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 relative z-10">

        {/* Header Section */}
        <div className="text-center mb-16 space-y-4">
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--text-muted)] animate-fade-in-up">
            BRAND DNA
          </span>
          <h2 className="text-4xl md:text-6xl font-black text-[var(--text-primary)] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            About <span className="bg-gradient-to-r from-[#6366f1] via-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">FinCortex</span>
          </h2>
          <p className="text-sm md:text-base text-[var(--text-secondary)] italic font-medium max-w-2xl mx-auto opacity-80 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            "Precision isn't a goal; it's our baseline. At FinCortex, we don't just write code; we architect the logic that powers the next generation of intelligent business."
          </p>
        </div>

        {/* Tablet / Window Frame */}
        <div className="relative mx-auto max-w-5xl rounded-[2.5rem] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] backdrop-blur-3xl p-1 md:p-3 shadow-2xl animate-scale-in" style={{ animationDelay: '0.3s' }}>
          {/* Inner Frame */}
          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--background-dark)]/40 p-8 md:p-12 overflow-hidden relative shadow-inner">

            {/* Corner Glow Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />

            <div className="grid md:grid-cols-2 gap-12 relative z-10">
              {aboutFeatures.map((feature, idx) => (
                <div
                  key={feature.title}
                  className={cn(
                    "space-y-4 transition-all duration-700",
                    visibleCards.includes(idx) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                  )}
                  style={{ transitionDelay: `${idx * 150}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-full border border-[var(--border-subtle)] flex items-center justify-center", feature.color)}>
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--text-primary)]">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed pl-14">
                    {feature.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Separator */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--border-subtle)] to-transparent my-12" />

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div className="text-center md:text-left">
                <div className="text-2xl font-black text-[var(--text-primary)] mb-1">500+</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Clients</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-2xl font-black text-[var(--text-primary)] mb-1">95%</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Reduction</div>
              </div>
              <div className="text-center md:text-left col-span-2 md:col-span-1">
                <div className="text-2xl font-black text-[var(--text-primary)] mb-1">24/7</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Operations</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decorative Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none z-0 opacity-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/30 blur-[120px] rounded-full" />
      </div>
    </section>
  );
}
