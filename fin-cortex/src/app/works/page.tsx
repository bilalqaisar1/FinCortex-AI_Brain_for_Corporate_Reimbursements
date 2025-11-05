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
    <section id="works" className="py-20 bg-dark text-primary">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="bg-card/20 text-accent border-accent/30 mb-4 backdrop-blur-sm hover:shadow-md hover:shadow-blue-500/20 hover:border-blue-400/40 transition-all duration-300">
            <Sparkles className="w-4 h-4 mr-2" />
            How It Works
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
            Simple
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"> 4-Step Process</span>
          </h2>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            From receipt upload to reimbursement - our AI handles everything automatically. 
            Experience the fastest expense processing workflow in the industry.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {steps.map((step, index) => (
            <Card
              key={step.id}
              className={`group relative p-8 border border-subtle bg-card/50 backdrop-blur-sm transition-all duration-700 hover:-translate-y-2 ${step.bgGlow} ${step.borderGlow} ${
                visibleSteps.includes(index)
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
                <h3 className="text-xl font-bold text-primary group-hover:text-accent transition-colors duration-300">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-muted leading-relaxed group-hover:text-secondary transition-colors duration-300">
                  {step.description}
                </p>

                {/* Arrow for flow indication (except last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-8 h-8 bg-card/80 border border-subtle rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-all duration-300">
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

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-card/20 backdrop-blur-sm border border-subtle rounded-full text-sm font-medium text-primary hover:border-blue-400/50 hover:shadow-md hover:shadow-blue-500/20 transition-all duration-300">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Ready in under 30 seconds</span>
          </div>
                </div>
              </div>

      {/* Separator Above CTA */}
      <EnhancedSeparator variant="gradient" thickness="medium" animated className="mt-20 mb-0" />

      {/* CTA Section */}
      <div className="w-full">
        <div className="w-full">
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-400/80 via-purple-400/80 to-pink-400/80 p-12 text-center shadow-2xl">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/60 via-purple-400/60 to-pink-400/60"></div>
            
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-full animate-pulse"></div>
              <div className="absolute top-1/2 -right-8 w-32 h-32 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute -bottom-6 left-1/3 w-20 h-20 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Content */}
            <div className="relative z-10">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Expense Management?
              </h2>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Join hundreds of companies already saving time and money with Fincortex
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button className="btn btn-outline px-6 py-3 rounded-full text-white border-2 border-white/30 bg-transparent font-semibold transition-all duration-300 hover:border-blue-400 hover:shadow-lg hover:-translate-y-0.5 relative overflow-hidden min-w-44 min-h-11 flex items-center justify-center">
                  Contact Sales
                </button>
                <button className="btn btn-primary px-6 py-3 rounded-full text-white font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl relative overflow-hidden min-w-44 min-h-11 flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  <span className="relative z-10">Get Started</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Separator Below CTA */}
      <EnhancedSeparator variant="gradient" thickness="medium" animated className="mt-0 mb-0" />
    </section>
  );
}
