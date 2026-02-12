"use client";

import {
    Building2,
    Rocket,
    ShieldCheck,
    Cpu,
    Check,
    ArrowRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SolutionsPage() {
    const solutions = [
        {
            title: "Enterprise Suite",
            description: "Comprehensive financial management for large-scale corporations with complex hierarchy and multiple departments.",
            icon: Building2,
            features: ["Custom Approval Chains", "ERP Integration", "Advanced Policy Engine"],
            color: "from-blue-500 to-indigo-600",
            delay: 0
        },
        {
            title: "SMB Growth",
            description: "Efficient and scalable expense tracking for growing teams that need speed without sacrificing control.",
            icon: Rocket,
            features: ["Instant Setup", "Mobile Receipt Upload", "Automated Reimbursement"],
            color: "from-purple-500 to-pink-600",
            delay: 200
        },
        {
            title: "AI Core Automation",
            description: "Our proprietary neural network that automates data extraction and policy compliance with 98%+ accuracy.",
            icon: Cpu,
            features: ["Real-time OCR", "Smart Categorization", "Natural Language Analysis"],
            color: "from-cyan-500 to-blue-600",
            delay: 400
        },
        {
            title: "Security & Fraud",
            description: "Bank-grade security combined with AI-driven fraud detection to protect your company's bottom line.",
            icon: ShieldCheck,
            features: ["Anomaly Detection", "Duplicate Prevention", "Audit-Ready Trails"],
            color: "from-emerald-500 to-teal-600",
            delay: 600
        }
    ];

    return (
        <section id="solutions" className="py-24 bg-dark relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-6xl mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 mb-4 px-4 py-1.5 backdrop-blur-md">
                        Custom Solutions
                    </Badge>
                    <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
                        Tailored for
                        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"> Every Business</span>
                    </h2>
                    <p className="text-xl text-muted max-w-2xl mx-auto">
                        Whether you're a fast-growing startup or a global enterprise, Fincortex
                        provides the intelligence needed to scale your operations.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {solutions.map((solution, index) => (
                        <Card
                            key={index}
                            className="group p-8 bg-card/40 border border-subtle backdrop-blur-xl hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden"
                        >
                            {/* Corner Accent */}
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${solution.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-2xl`}></div>

                            <div className="flex flex-col h-full space-y-6">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${solution.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                                    <solution.icon className="w-8 h-8" />
                                </div>

                                <div>
                                    <h3 className="text-2xl font-bold text-primary mb-3 group-hover:text-blue-400 transition-colors">
                                        {solution.title}
                                    </h3>
                                    <p className="text-muted leading-relaxed mb-6">
                                        {solution.description}
                                    </p>
                                </div>

                                <ul className="space-y-3 flex-grow">
                                    {solution.features.map((feature, fIndex) => (
                                        <li key={fIndex} className="flex items-center text-secondary">
                                            <div className="mr-3 p-0.5 rounded-full bg-blue-500/20 text-blue-400">
                                                <Check className="w-4 h-4" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button className="flex items-center text-blue-400 font-semibold group/btn hover:text-blue-300 transition-colors">
                                    Learn more
                                    <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
