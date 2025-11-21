"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ReceiptText } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import ExpenseForm from "@/app/components/forms/ExpenseForm";

export default function SubmitClaimPage() {
  const { isDarkTheme, toggleTheme, themeIcon } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const mobileToggle = document.getElementById("mobileToggle");
      const navLinks = document.getElementById("navLinks");

      if (mobileToggle && navLinks && !mobileToggle.contains(target) && !navLinks.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-0px)] w-full">
      <nav className={`navbar ${isScrolled ? "scrolled" : ""}`} id="navbar">
        <div className="nav-container" style={{ justifyContent: "space-between" }}>
          <Link href="/user/dashboard" className="logo">
            Fincortex
          </Link>

          <ul
            className={`nav-links ${isMobileMenuOpen ? "active" : ""}`}
            id="navLinks"
            style={{ margin: "0 auto", gap: "2.5rem" }}
          >
            <li>
              <Link href="/user/dashboard" onClick={handleLinkClick}>
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/user/claims/new" onClick={handleLinkClick}>
                Submit Claims
              </Link>
            </li>
            <li>
              <Link href="/user/claims/history" onClick={handleLinkClick}>
                Claim History
              </Link>
            </li>
            <li>
              <Link href="/user/profile" onClick={handleLinkClick}>
                Profile
              </Link>
            </li>
          </ul>

          <div className="flex items-center gap-4">
            <button className="theme-toggle" onClick={toggleTheme}>
              <div className="theme-icon">{themeIcon}</div>
            </button>
            <button
              className={`mobile-toggle ${isMobileMenuOpen ? "active" : ""}`}
              id="mobileToggle"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

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