"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import TypeWriter from "@/components/TypeWriter";

export default function HomePage() {
  const { isDarkTheme, toggleTheme, themeIcon } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Typewriter texts for hero section
  const typewriterTexts = [
    "AI-Powered Reimbursement",
    "Smart Expense Management", 
    "Automated Financial Workflows",
    "Intelligent Policy Enforcement"
  ];

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle mobile menu toggle
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      const mobileToggle = document.getElementById('mobileToggle');
      const navLinks = document.getElementById('navLinks');
      
      if (mobileToggle && navLinks && !mobileToggle.contains(target) && !navLinks.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute('href');
    if (href?.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <section id="home" className="min-h-screen bg-dark text-primary overflow-x-hidden relative">
      {/* Animated Background */}
      <div className="animated-bg absolute top-0 left-0 w-full h-full -z-10 opacity-10">
        <div className="floating-shapes absolute w-full h-full">
          <div className="shape absolute w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 left-[10%] animate-float"></div>
          <div className="shape absolute w-30 h-30 rounded-full bg-gradient-to-br from-pink-500 to-red-500 right-[10%] animate-float" style={{ animationDelay: '-5s' }}></div>
          <div className="shape absolute w-15 h-15 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 left-[70%] animate-float" style={{ animationDelay: '-10s' }}></div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero min-h-screen flex items-center justify-center px-8 py-24 relative">
        <div className="hero-container max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="hero-content animate-fade-in-left">
            <div className="hero-badge inline-flex items-center gap-2 px-6 py-3 bg-card/10 backdrop-blur-xl border border-subtle rounded-full text-sm font-semibold mb-6 shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 hover:border-blue-400">
              <span>🤖</span>
              AI-Powered Financial Technology
            </div>
            
            <h1 className="hero-title text-5xl lg:text-6xl font-extrabold leading-tight mb-6 min-h-20 flex items-start">
              <TypeWriter 
                texts={typewriterTexts}
                typingSpeed={100}
                deletingSpeed={60}
                pauseDuration={2000}
                className="typewriter text-primary bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 bg-clip-text text-transparent inline-block leading-tight font-extrabold relative"
              />
            </h1>
            
                    <p className="hero-description text-xl text-muted mb-10 max-w-lg leading-relaxed">
                      AI-powered expense management with automated OCR, policy enforcement, and intelligent workflows. The future of financial operations.
                    </p>
            
            <div className="hero-cta flex gap-4 flex-wrap">
              <Link href="/login" className="btn btn-outline px-6 py-3 rounded-full text-primary border-2 border-subtle bg-transparent font-semibold transition-all duration-300 hover:border-blue-400 hover:shadow-lg hover:-translate-y-0.5 relative overflow-hidden min-w-44 min-h-11 flex items-center justify-center">
                Sign In
              </Link>
              <Link href="/signup" className="btn btn-primary px-6 py-3 rounded-full text-white font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl relative overflow-hidden min-w-44 min-h-11 flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                <span className="relative z-10">Get Started</span>
              </Link>
            </div>
          </div>

          <div className="hero-visual relative animate-fade-in-right">
            <div className="dashboard-mockup w-full h-96 bg-card/10 backdrop-blur-3xl rounded-3xl border border-subtle relative overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-3xl">
              <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 opacity-90 z-10"></div>
              
              <div className="mockup-content p-12 h-full flex flex-col gap-6 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500/50 scrollbar-track-transparent">
                <div className="stat-card bg-card/10 backdrop-blur-sm border border-subtle rounded-2xl p-8 animate-stat-pulse hover:-translate-y-1 hover:shadow-lg transition-all duration-300 hover:border-blue-400 shadow-lg">
                  <div className="stat-number text-3xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">98%</div>
                  <div className="stat-label text-muted text-sm">OCR Accuracy</div>
                </div>
                <div className="stat-card bg-card/10 backdrop-blur-sm border border-subtle rounded-2xl p-8 animate-stat-pulse hover:-translate-y-1 hover:shadow-lg transition-all duration-300 hover:border-blue-400 shadow-lg" style={{ animationDelay: '0.5s' }}>
                  <div className="stat-number text-3xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">75%</div>
                  <div className="stat-label text-muted text-sm">Time Saved</div>
                </div>
                <div className="stat-card bg-card/10 backdrop-blur-sm border border-subtle rounded-2xl p-8 animate-stat-pulse hover:-translate-y-1 hover:shadow-lg transition-all duration-300 hover:border-blue-400 shadow-lg" style={{ animationDelay: '1s' }}>
                  <div className="stat-number text-3xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">$2M+</div>
                  <div className="stat-label text-muted text-sm">Processed Monthly</div>
                </div>
                <div className="stat-card bg-card/10 backdrop-blur-sm border border-subtle rounded-2xl p-8 animate-stat-pulse hover:-translate-y-1 hover:shadow-lg transition-all duration-300 hover:border-blue-400 shadow-lg" style={{ animationDelay: '1.5s' }}>
                  <div className="stat-number text-3xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">24/7</div>
                  <div className="stat-label text-muted text-sm">AI Processing</div>
                </div>
                <div className="stat-card bg-card/10 backdrop-blur-sm border border-subtle rounded-2xl p-8 animate-stat-pulse hover:-translate-y-1 hover:shadow-lg transition-all duration-300 hover:border-blue-400 shadow-lg" style={{ animationDelay: '2s' }}>
                  <div className="stat-number text-3xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">99.9%</div>
                  <div className="stat-label text-muted text-sm">Uptime</div>
                </div>
                <div className="stat-card bg-card/10 backdrop-blur-sm border border-subtle rounded-2xl p-8 animate-stat-pulse hover:-translate-y-1 hover:shadow-lg transition-all duration-300 hover:border-blue-400 shadow-lg" style={{ animationDelay: '2.5s' }}>
                  <div className="stat-number text-3xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">500+</div>
                  <div className="stat-label text-muted text-sm">Companies Trust Us</div>
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <div className="floating-card absolute top-[45%] -left-[8%] bg-card/80 backdrop-blur-xl border border-subtle rounded-full px-3 py-1.5 text-xs font-semibold animate-float-card shadow-lg" style={{ animationDelay: '0s' }}>
              <div className="text-primary font-semibold">✅ Approved</div>
            </div>

            <div className="floating-card absolute bottom-[15%] -left-[8%] bg-card/80 backdrop-blur-xl border border-subtle rounded-full px-3 py-1.5 text-xs font-semibold animate-float-card shadow-lg" style={{ animationDelay: '2s' }}>
              <div className="text-green-500 font-semibold">✅ Compliant</div>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}