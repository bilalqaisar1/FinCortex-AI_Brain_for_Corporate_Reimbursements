"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Send,
  ArrowRight,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import Footer from "@/components/layout/Footer";
import { EnhancedSeparator } from "@/components/ui/separator-enhanced";

export default function ContactPage() {
  const { isDarkTheme } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  return (
    <div id="contact" className="bg-[var(--background-dark)] min-h-screen">
      <section className="py-24 px-6 md:px-12 lg:px-24 relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-20">
            <Badge className="bg-[var(--card-dark)]/20 text-accent border-accent/30 mb-6 backdrop-blur-sm px-4 py-1.5 transition-all">
              <Sparkles className="w-4 h-4 mr-2" />
              Interface with the Core Team
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black text-[var(--text-primary)] mb-8 tracking-tighter leading-none">
              Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Touch</span>
            </h1>
            <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-medium">
              Ready to deploy custom intelligence layers? Our team of specialists is standing by.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Contact Info */}
            <div className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-widest">Global Ops</h2>
                <div className="grid gap-6">
                  {[
                    { icon: Mail, label: "Neural Inbox", value: "contact@fincortex.ai" },
                    { icon: Phone, label: "Encrypted Line", value: "+1 (123) 456-7890" },
                    { icon: MapPin, label: "HQ Origin", value: "Silicon Valley, CA, USA" }
                  ].map((info, i) => (
                    <div key={i} className="group flex items-center gap-6 p-4 rounded-2xl bg-[var(--card-dark)] border border-[var(--border-subtle)] hover:bg-[var(--card-hover)] transition-all">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                        <info.icon size={20} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-blue-400/60 uppercase tracking-[0.2em] mb-1">{info.label}</p>
                        <p className="text-lg font-bold text-[var(--text-primary)]">{info.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <HelpCircle className="text-indigo-400" size={20} />
                  </div>
                  <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-wider">Priority Support</h3>
                </div>
                <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                  Enterprise clients receive dedicated integration support and 24/7 uptime monitoring.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="relative">
              {isSubmitted ? (
                <Card className="p-12 border border-green-500/30 bg-green-500/5 backdrop-blur-3xl text-center rounded-[40px] animate-fade-in">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-green-500" size={40} />
                  </div>
                  <h3 className="text-3xl font-black text-[var(--text-primary)] mb-4 uppercase tracking-tighter">Signal Received</h3>
                  <p className="text-[var(--text-secondary)] font-medium">Your request has been processed. We'll be in touch soon.</p>
                </Card>
              ) : (
                <form onSubmit={handleSubmit} className="bg-[var(--card-dark)]/50 backdrop-blur-3xl border border-[var(--border-subtle)] rounded-[40px] p-10 shadow-2xl space-y-8 relative overflow-hidden group">
                  <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none group-focus-within:bg-blue-500/10 transition-all duration-700" />

                  <div className="space-y-6 relative z-10">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Agent Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="bg-[var(--background-dark)]/50 border-[var(--border-subtle)] focus:ring-2 focus:ring-blue-500/20 h-14 rounded-2xl font-bold"
                        placeholder="ENTER NAME..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Neural Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="bg-[var(--background-dark)]/50 border-[var(--border-subtle)] focus:ring-2 focus:ring-blue-500/20 h-14 rounded-2xl font-bold"
                        placeholder="ENTER EMAIL..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Communication</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={5}
                        className="bg-[var(--background-dark)]/50 border-[var(--border-subtle)] focus:ring-2 focus:ring-blue-500/20 rounded-2xl font-bold resize-none"
                        placeholder="HOW CAN WE ASSIST?"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-16 bg-[var(--text-primary)] text-[var(--background-dark)] hover:opacity-90 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl active:scale-[0.98]"
                  >
                    {isSubmitting ? "Processing Signal..." : "Transmit Message"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Mini Section */}
      <section className="py-24 px-6 md:px-12 lg:px-24 border-y border-[var(--border-subtle)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(99,102,241,0.03)_0%,transparent_50%)]" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h2 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-12">Frequent Clarifications</h2>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              { q: "Integration Speed?", a: "Standard API deployment within 24 hours. Custom ERP integrations vary." },
              { q: "Data Security?", a: "End-to-end encryption with SOC 2 compliance as baseline standard." },
              { q: "Support Tiers?", a: "Self-serve for small teams; 24h dedicated desks for enterprise partners." }
            ].map((faq, i) => (
              <div key={i} className="p-6 rounded-2xl bg-[var(--card-dark)]/30 border border-[var(--border-subtle)] group hover:border-blue-500/30 transition-all">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Query {i + 1}</p>
                <h4 className="text-lg font-bold text-[var(--text-primary)] mb-4">{faq.q}</h4>
                <p className="text-[var(--text-secondary)] font-medium text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
