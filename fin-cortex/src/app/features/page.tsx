"use client";

import Link from "next/link";
import { 
  CreditCard, 
  BarChart3, 
  Shield, 
  Zap, 
  Users, 
  Smartphone,
  Globe,
  FileText,
  Clock,
  ArrowLeft
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/hooks/useTheme";

export default function FeaturesPage() {
  const { toggleTheme, themeIcon } = useTheme();
  const mainFeatures = [
    {
      icon: CreditCard,
      title: "AI Receipt Processing",
      description: "Automatically extract data from receipts using AI and validate reimbursement claims instantly.",
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700"
    },
    {
      icon: BarChart3,
      title: "Smart Analytics",
      description: "AI-powered insights into reimbursement patterns and automated fraud detection.",
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700"
    },
    {
      icon: Shield,
      title: "Automated Validation",
      description: "AI validates receipts, checks policy compliance, and flags suspicious claims automatically.",
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700"
    },
    {
      icon: Zap,
      title: "Instant Approvals",
      description: "Process reimbursements in seconds with AI-powered automated approval workflows.",
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700"
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Role-based access control and automated approval chains for team reimbursement workflows.",
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700"
    },
    {
      icon: Smartphone,
      title: "Mobile App",
      description: "Submit receipts and track reimbursement status on-the-go with our mobile application.",
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700"
    }
  ];


  return (
    <section id="features" className="py-20 bg-[var(--background-dark)] text-[var(--text-primary)]">
      <div className="max-w-6xl mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-12">
              <Badge className="bg-[var(--card-dark)]/20 text-accent border-accent/30 mb-4 backdrop-blur-sm hover:shadow-md hover:shadow-blue-500/20 hover:border-blue-400/40 transition-all duration-300">
                ✨ AI Features
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-[var(--text-primary)] mb-4">
                AI-Powered
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"> Reimbursement</span>
              </h2>
              <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
                Automate your entire reimbursement workflow with AI. From receipt processing 
                to instant approvals, we handle it all.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {mainFeatures.map((feature, index) => (
                <Card 
                  key={index}
                  className="p-6 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-400 hover:-translate-y-2 hover:scale-105 border border-[var(--border-subtle)] bg-[var(--card-dark)] backdrop-blur-xl group hover:border-blue-400/50 relative overflow-hidden"
                >
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-600 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </div>

                  <div className="space-y-3 relative z-10">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">{feature.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{feature.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
    </section>
  );
}
