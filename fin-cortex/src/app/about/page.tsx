"use client";

import { useState, useEffect } from "react";
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

  // Animate cards on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleCards([0]);
    }, 200);

    const timer2 = setTimeout(() => {
      setVisibleCards([0, 1]);
    }, 400);

    const timer3 = setTimeout(() => {
      setVisibleCards([0, 1, 2]);
    }, 600);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);


  const platformFeatures = [
    {
      id: 1,
      title: "AI-Powered Processing",
      description: "Advanced machine learning algorithms automatically extract and validate data from receipts with 98% accuracy",
      icon: Brain,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: 2,
      title: "Policy Enforcement", 
      description: "Intelligent compliance checking ensures all reimbursements meet company policies and regulatory requirements",
      icon: ShieldCheck,
      color: "from-green-500 to-emerald-500",
    },
    {
      id: 3,
      title: "Streamlined Workflows",
      description: "Automated approval chains and real-time notifications accelerate the entire reimbursement process",
      icon: Zap,
      color: "from-purple-500 to-pink-500",
    }
  ];

  return (
    <section id="about" className="py-20 bg-dark text-primary">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Revolutionizing Section */}
        <div className="mb-20">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge className="bg-card/20 text-accent border-accent/30 mb-4 backdrop-blur-sm hover:shadow-md hover:shadow-blue-500/20 hover:border-blue-400/40 transition-all duration-300">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Platform
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
              Revolutionizing
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"> Reimbursement Management</span>
            </h2>
            <p className="text-lg text-muted max-w-3xl mx-auto">
              Transform your financial workflows with AI-powered automation, intelligent 
              policy enforcement, and real-time insights that drive smarter business decisions.
            </p>
          </div>

          {/* Platform Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {platformFeatures.map((feature, index) => (
              <Card
                key={feature.id}
                className="group p-8 border border-subtle bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-25 transition-all duration-400 hover:-translate-y-2 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 hover:border-blue-400/50 relative overflow-hidden"
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-600 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </div>

                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-primary mb-4 group-hover:text-accent transition-colors duration-300">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted leading-relaxed group-hover:text-secondary transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          <EnhancedSeparator variant="gradient" thickness="medium" animated className="my-12" />
        </div>

        {/* About Us Section */}
        <div className="mb-20">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary mb-4">
              About FinCortex
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Pioneering the future of intelligent reimbursement management through AI innovation.
            </p>
          </div>

          {/* About Content with Icons */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Left Column - Story */}
            <Card className="p-8 border border-subtle bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-25 hover:shadow-lg hover:shadow-blue-500/25 hover:border-blue-400/50 transition-all duration-400 relative overflow-hidden group">
              {/* Shimmer Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-600 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-primary">Our Story</h3>
                </div>
                
                <div className="space-y-4">
                  <p className="text-primary leading-relaxed">
                    FinCortex was founded with a simple yet powerful vision: to eliminate the complexity and inefficiency 
                    that plagues traditional reimbursement systems. We recognized that organizations worldwide were losing 
                    countless hours and resources to manual processes.
                  </p>
                  
                  <p className="text-primary leading-relaxed">
                    Our team of AI experts, financial technology veterans, and enterprise software engineers came together 
                    to create a revolutionary platform that transforms how businesses handle reimbursements.
                  </p>
                </div>
              </div>
            </Card>

            {/* Right Column - Mission */}
            <Card className="p-8 border border-subtle bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-25 hover:shadow-lg hover:shadow-blue-500/25 hover:border-blue-400/50 transition-all duration-400 relative overflow-hidden group">
              {/* Shimmer Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-600 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-primary">Our Mission</h3>
                </div>
                
                <div className="space-y-4">
                  <p className="text-primary leading-relaxed">
                    Empowering organizations to manage reimbursements intelligently while maintaining complete 
                    transparency and compliance. We believe that financial operations should be seamless, 
                    automated, and insightful.
                  </p>
                  
                  <p className="text-primary leading-relaxed">
                    By leveraging cutting-edge artificial intelligence, machine learning, and automation technologies, 
                    we've built a solution that doesn't just digitize existing processes—it reimagines them entirely.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Stats Row */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 border border-subtle bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-25 hover:shadow-lg hover:shadow-purple-500/25 hover:border-purple-400/50 transition-all duration-400 relative overflow-hidden group text-center">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-600 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">500+</div>
                <div className="text-muted text-sm">Companies Trust Us</div>
              </div>
            </Card>

            <Card className="p-6 border border-subtle bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-25 hover:shadow-lg hover:shadow-green-500/25 hover:border-green-400/50 transition-all duration-400 relative overflow-hidden group text-center">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-600 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">95%</div>
                <div className="text-muted text-sm">Time Reduction</div>
              </div>
            </Card>

            <Card className="p-6 border border-subtle bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-25 hover:shadow-lg hover:shadow-blue-500/25 hover:border-blue-400/50 transition-all duration-400 relative overflow-hidden group text-center">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-600 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">$2M+</div>
                <div className="text-muted text-sm">Processed Monthly</div>
              </div>
            </Card>
          </div>

          <EnhancedSeparator variant="gradient" thickness="medium" animated className="my-12" />
        </div>

      </div>
    </section>
  );
}
