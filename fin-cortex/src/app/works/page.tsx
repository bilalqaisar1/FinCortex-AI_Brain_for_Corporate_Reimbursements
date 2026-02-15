"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  Brain,
  CheckCircle,
  CreditCard,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnhancedSeparator } from "@/components/ui/separator-enhanced";
import Link from "next/link";

export default function WorksPage() {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);

  // Animate steps on scroll or mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleSteps([0]);
    }, 200);

    const timer2 = setTimeout(() => {
      setVisibleSteps([0, 1]);
    }, 600);

    const timer3 = setTimeout(() => {
      setVisibleSteps([0, 1, 2]);
    }, 1000);

    const timer4 = setTimeout(() => {
      setVisibleSteps([0, 1, 2, 3]);
    }, 1400);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  const steps = [
    {
      id: 1,
      title: "Upload Receipt",
      description: "Simply capture or upload your receipt using our mobile app or web interface. Supports all major formats including photos and PDFs.",
      icon: Upload,
      color: "from-blue-500 to-cyan-500",
      bgGlow: "group-hover:shadow-blue-500/25",
      borderGlow: "hover:border-blue-400/50"
    },
    {
      id: 2,
      title: "AI Processing",
      description: "Our advanced AI engine extracts all relevant data from your receipt with 98% accuracy. OCR technology reads text, amounts, dates, and vendor information.",
      icon: Brain,
      color: "from-purple-500 to-pink-500",
      bgGlow: "group-hover:shadow-purple-500/25",
      borderGlow: "hover:border-purple-400/50"
    },
    {
      id: 3,
      title: "Smart Validation",
      description: "Automated policy compliance checks ensure your expense meets company guidelines. Fraud detection algorithms verify authenticity and flag anomalies.",
      icon: CheckCircle,
      color: "from-green-500 to-emerald-500",
      bgGlow: "group-hover:shadow-green-500/25",
      borderGlow: "hover:border-green-400/50"
    },
    {
      id: 4,
      title: "Instant Approval",
      description: "Approved expenses are automatically processed and integrated with your accounting system. Get reimbursed faster with streamlined workflows.",
      icon: CreditCard,
      color: "from-orange-500 to-red-500",
      bgGlow: "group-hover:shadow-orange-500/25",
      borderGlow: "hover:border-orange-400/50"
    }
  ];

  return (
    <div id="works" className="bg-[var(--background-dark)]">
      {/* Works Section */}
      <section className="py-20 text-[var(--text-primary)]">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge className="bg-[var(--card-dark)]/20 text-accent border-accent/30 mb-4 backdrop-blur-sm hover:shadow-md hover:shadow-blue-500/20 hover:border-blue-400/40 transition-all duration-300">
              <Sparkles className="w-4 h-4 mr-2" />
              How It Works
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-[var(--text-primary)] mb-4 tracking-tighter">
              Simple
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"> 4-Step Process</span>
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto font-medium">
              From receipt upload to reimbursement - our AI handles everything automatically.
              Experience the fastest expense processing workflow in the industry.
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {steps.map((step, index) => (
              <Card
                key={step.id}
                className={`group relative p-8 border border-[var(--border-subtle)] bg-[var(--card-dark)]/50 backdrop-blur-sm transition-all duration-700 hover:-translate-y-2 ${step.bgGlow} ${step.borderGlow} ${visibleSteps.includes(index)
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 translate-y-8 scale-95'
                  }`}
                style={{
                  transitionDelay: `${index * 200}ms`,
                  animationFillMode: 'both'
                }}
              >
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform duration-300">
                  {step.id}
                </div>

                {/* Content */}
                <div className="space-y-4">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors duration-300">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[var(--text-secondary)] leading-relaxed group-hover:text-secondary transition-colors duration-300">
                    {step.description}
                  </p>

                  {/* Arrow for flow indication (except last item) */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2">
                      <div className="w-8 h-8 bg-[var(--card-dark)]/80 border border-[var(--border-subtle)] rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-all duration-300">
                        <ArrowRight className="w-4 h-4 text-accent" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className={`absolute inset-0 bg-gradient-to-r ${step.color} opacity-5 rounded-lg`}></div>
                </div>
              </Card>
            ))}
          </div>

          {/* Bottom Info */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--card-dark)]/20 backdrop-blur-sm border border-[var(--border-subtle)] rounded-full text-sm font-medium text-[var(--text-primary)] hover:border-blue-400/50 hover:shadow-md hover:shadow-blue-500/20 transition-all duration-300">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>Ready in under 30 seconds</span>
            </div>
          </div>
        </div>
      </section>

      <EnhancedSeparator variant="gradient" thickness="medium" animated className="my-0" />

      {/* CTA Section */}
      <section className="relative w-full py-32 px-6 md:px-12 lg:px-24 bg-[var(--background-dark)] overflow-hidden">
        {/* Modern Glow Effects */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-8">
            Next-Gen Automation
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[var(--text-primary)] mb-8 tracking-tighter leading-tight max-w-4xl">
            Ready to transform your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              business with AI?
            </span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mb-12 font-medium">
            Deploy custom intelligence layers and automate complex financial workflows with precision.
          </p>
          <div className="flex flex-col sm:flex-row gap-6">
            <Link
              href="/contact"
              className="px-12 py-4 rounded-2xl bg-[var(--text-primary)] text-[var(--background-dark)] text-xs font-black uppercase tracking-[0.3em] hover:opacity-90 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
            >
              Initialize Protocol
            </Link>
            <Link
              href="/solutions"
              className="px-12 py-4 rounded-2xl bg-[var(--card-dark)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-black uppercase tracking-[0.3em] hover:bg-[var(--card-hover)] transition-all backdrop-blur-sm"
            >
              View Solutions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
