"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  User,
  DollarSign,
  Lock,
  Bell,
  LogOut,
  ArrowRight,
  Eye,
  EyeOff,
  Edit2,
  Check,
  AlertCircle,
  Volume2,
  VolumeX,
} from "lucide-react";

export default function UserProfilePage() {
  const { isDarkTheme, toggleTheme, themeIcon } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editBankOpen, setEditBankOpen] = useState(false);
  const [editPasswordOpen, setEditPasswordOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    claimApproved: true,
    claimRejected: true,
    claimSubmitted: false,
    reimbursementProcessed: true,
  });

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle mobile menu toggle
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
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

  // Mock user data
  const userData = {
    name: "Jane Doe",
    employeeId: "E-1045",
    email: "jane.doe@company.com",
    department: "Marketing",
    manager: "John Smith",
    bankName: "HDFC Bank",
    bankAccountLast4: "4521",
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-white dark:bg-slate-950">
      {/* Navbar */}
      <nav
        className={`navbar fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "scrolled" : ""
        }`}
      >
        <div className="nav-container" style={{ justifyContent: "space-between" }}>
          {/* Left side - Logo */}
          <Link href="/user" className="logo">
            Fincortex
          </Link>

          {/* Center - Menu Links (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/user" className="nav-link">
              Home
            </Link>
            <Link href="/user/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link href="/user/claims/history" className="nav-link">
              Claims
            </Link>
            <Link href="/user/profile" className="nav-link active">
              Profile
            </Link>
          </div>

          {/* Right side - Theme toggle & Mobile menu toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all duration-200 hover:bg-opacity-80 text-foreground"
              aria-label="Toggle theme"
            >
              {themeIcon}
            </button>
            <button
              id="mobileToggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg transition-all duration-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            id="navLinks"
            className="md:hidden bg-background border-t border-border"
          >
            <Link
              href="/user"
              className="block px-4 py-3 text-sm font-medium hover:bg-accent/50 transition-colors"
              onClick={handleLinkClick}
            >
              Home
            </Link>
            <Link
              href="/user/dashboard"
              className="block px-4 py-3 text-sm font-medium hover:bg-accent/50 transition-colors"
              onClick={handleLinkClick}
            >
              Dashboard
            </Link>
            <Link
              href="/user/claims/history"
              className="block px-4 py-3 text-sm font-medium hover:bg-accent/50 transition-colors"
              onClick={handleLinkClick}
            >
              Claims
            </Link>
            <Link
              href="/user/profile"
              className="block px-4 py-3 text-sm font-medium hover:bg-accent/50 transition-colors"
              onClick={handleLinkClick}
            >
              Profile
            </Link>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full pt-20 px-4 md:px-6 lg:px-8 pb-12 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Profile & Settings
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your account information and preferences
            </p>
          </div>

          {/* Tabs Navigation */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-50 dark:bg-slate-900/40 dark:backdrop-blur-md dark:border-slate-800/50 border border-slate-200 rounded-xl shadow-sm">
              <TabsTrigger value="profile" className="gap-2">
                <User size={18} />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="banking" className="gap-2">
                <DollarSign size={18} />
                <span className="hidden sm:inline">Banking</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Lock size={18} />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* PROFILE TAB */}
            <TabsContent value="profile" className="space-y-6">
              {/* Profile Information Card */}
              <Card className="bg-white dark:bg-slate-900/40 dark:backdrop-blur-xl dark:border-slate-800/50 border-slate-200 hover:shadow-lg transition-all shadow-sm rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <User className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                        Personal Information
                      </CardTitle>
                      <CardDescription className="text-sm mt-1 text-slate-600 dark:text-slate-400">
                        Your identity information (synced from HR system)
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Full Name
                      </Label>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 dark:backdrop-blur-lg dark:border-slate-700/50 border border-slate-200">
                        <p className="text-foreground font-medium">{userData.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        To change this, please contact HR
                      </p>
                    </div>

                    {/* Employee ID & Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                          Employee ID
                        </Label>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 dark:backdrop-blur-lg dark:border-slate-700/50 border border-slate-200">
                          <p className="text-foreground font-medium">{userData.employeeId}</p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">Read-only</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                          Email Address
                        </Label>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 dark:backdrop-blur-lg dark:border-slate-700/50 border border-slate-200">
                          <p className="text-foreground font-medium">{userData.email}</p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">Read-only</p>
                      </div>
                    </div>

                    {/* Department & Manager */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                          Department
                        </Label>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 dark:backdrop-blur-lg dark:border-slate-700/50 border border-slate-200">
                          <p className="text-foreground font-medium">{userData.department}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                          Reports To
                        </Label>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 dark:backdrop-blur-lg dark:border-slate-700/50 border border-slate-200">
                          <p className="text-foreground font-medium">{userData.manager}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Info Box */}
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex gap-3 shadow-sm">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">HR Sync Info</p>
                  <p className="text-sm text-blue-600 dark:text-blue-200">
                    Your profile information is automatically synced from your HR records. Changes made by HR will be reflected here within 24 hours.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* BANKING TAB */}
            <TabsContent value="banking" className="space-y-6">
              {/* Current Bank Account Card */}
              <Card className="bg-white dark:bg-slate-900/40 dark:backdrop-blur-xl dark:border-slate-800/50 border-slate-200 hover:shadow-lg transition-all shadow-sm rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                        Bank Account
                      </CardTitle>
                      <CardDescription className="text-sm mt-1 text-slate-600 dark:text-slate-400">
                        Primary account for receiving reimbursements
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Current Account Display */}
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 dark:backdrop-blur-lg dark:border-emerald-800/50 border border-emerald-200 flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Current Account</p>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 dark:backdrop-blur-lg flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{userData.bankName}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Account ending in •••• {userData.bankAccountLast4}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    </div>

                    {/* Edit Bank Dialog */}
                    <Dialog open={editBankOpen} onOpenChange={setEditBankOpen}>
                      <DialogTrigger asChild>
                        <Button
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold"
                          onClick={() => setEditBankOpen(true)}
                        >
                          <Edit2 size={18} />
                          Edit Bank Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white dark:bg-slate-900/50 dark:backdrop-blur-3xl dark:border-slate-800/50 border-slate-200 shadow-2xl rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold text-foreground">
                            Update Bank Account
                          </DialogTitle>
                          <DialogDescription className="text-slate-600 dark:text-slate-400 mt-2">
                            Update your bank details for reimbursement transfers
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          {/* Bank Name */}
                          <div className="space-y-2">
                            <Label htmlFor="bank-name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Bank Name
                            </Label>
                            <Input
                              id="bank-name"
                              placeholder="e.g., HDFC Bank"
                              defaultValue={userData.bankName}
                              className="bg-slate-50 dark:bg-slate-800/30 dark:backdrop-blur-lg dark:border-slate-700/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>

                          {/* Account Holder Name */}
                          <div className="space-y-2">
                            <Label htmlFor="account-holder" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Owner Name
                            </Label>
                            <Input
                              id="account-holder"
                              placeholder="Full name as per bank records"
                              defaultValue={userData.name}
                              className="bg-slate-50 dark:bg-slate-800/30 dark:backdrop-blur-lg dark:border-slate-700/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>

                          {/* Account Number */}
                          <div className="space-y-2">
                            <Label htmlFor="account-number" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Account Number
                            </Label>
                            <Input
                              id="account-number"
                              placeholder="e.g., 10234567890123"
                              type="password"
                              className="bg-slate-50 dark:bg-slate-800/30 dark:backdrop-blur-lg dark:border-slate-700/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>

                          {/* Current Password - Security Verification */}
                          <div className="space-y-2">
                            <Label htmlFor="bank-password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                              Current Password <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                              <Input
                                id="bank-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password to authorize changes"
                                className="bg-slate-50 dark:bg-slate-800/30 dark:backdrop-blur-lg dark:border-slate-700/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                              />
                              <button
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Required for security verification
                            </p>
                          </div>

                          {/* Security Warning */}
                          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 dark:backdrop-blur-lg dark:border-amber-800/50 border border-amber-200 flex gap-2 shadow-sm">
                            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-700 dark:text-amber-200">
                              For security, changing your bank details may require 2-factor authentication.
                            </p>
                          </div>
                        </div>

                        <DialogFooter className="gap-3 pt-4 flex justify-center">
                          <Button
                            variant="outline"
                            onClick={() => setEditBankOpen(false)}
                            className="w-[30%] border-slate-300 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg"
                          >
                            Cancel
                          </Button>
                          <Button
                            className="w-[30%] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md"
                            onClick={() => {
                              setEditBankOpen(false);
                            }}
                          >
                            <Check size={18} />
                            Save
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Info Box */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex gap-3 shadow-sm">
                <AlertCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-1">Important</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-200">
                    Ensure your bank details are accurate. Incorrect information may result in failed transfers. We never display your full account number for security.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="settings" className="space-y-6">
              {/* Security Settings Card */}
              <Card className="bg-white dark:bg-slate-900/40 dark:backdrop-blur-xl dark:border-slate-800/50 border-slate-200 hover:shadow-lg transition-all shadow-sm rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Lock className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                    Security
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                    Manage your account security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Change Password */}
                  <Dialog open={editPasswordOpen} onOpenChange={setEditPasswordOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between border-slate-300 dark:border-slate-600/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg"
                        onClick={() => setEditPasswordOpen(true)}
                      >
                        <span>Change Password</span>
                        <ArrowRight size={18} />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white dark:bg-slate-900/50 dark:backdrop-blur-3xl dark:border-slate-800/50 border-slate-200 shadow-2xl rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-foreground">
                          Change Password
                        </DialogTitle>
                        <DialogDescription className="text-slate-600 dark:text-slate-400 mt-2">
                          Update your password to keep your account secure
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        {/* Current Password */}
                        <div className="space-y-2">
                          <Label htmlFor="current-password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Current Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="current-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter current password"
                              className="bg-slate-50 dark:bg-slate-800/30 dark:backdrop-blur-lg dark:border-slate-700/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500 pr-10"
                            />
                            <button
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-2">
                          <Label htmlFor="new-password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            New Password
                          </Label>
                          <Input
                            id="new-password"
                            type="password"
                            placeholder="Enter new password"
                            className="bg-slate-50 dark:bg-slate-800/30 dark:backdrop-blur-lg dark:border-slate-700/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            At least 8 characters with uppercase, lowercase, and numbers
                          </p>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Confirm Password
                          </Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            placeholder="Confirm new password"
                            className="bg-slate-50 dark:bg-slate-800/30 dark:backdrop-blur-lg dark:border-slate-700/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <DialogFooter className="gap-3 pt-4 flex justify-center">
                        <Button
                          variant="outline"
                          onClick={() => setEditPasswordOpen(false)}
                          className="w-[30%] border-slate-300 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-lg"
                        >
                          Cancel
                        </Button>
                        <Button
                          className="w-[30%] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md"
                          onClick={() => {
                            setEditPasswordOpen(false);
                          }}
                        >
                          <Check size={18} />
                          Update
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Notification Preferences Card */}
              <Card className="bg-white dark:bg-slate-900/40 dark:backdrop-blur-xl dark:border-slate-800/50 border-slate-200 hover:shadow-lg transition-all shadow-sm rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Bell className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                    Notifications
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                    Control how we notify you about your reimbursements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Claim Approved */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 dark:backdrop-blur-lg dark:border-slate-700/50 border border-slate-200 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 flex-1">
                      {notifications.claimApproved ? (
                        <Volume2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">Claim Approved</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Email notification when your claim is approved
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.claimApproved}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, claimApproved: checked })
                      }
                      className="flex-shrink-0"
                    />
                  </div>

                  {/* Claim Rejected */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 dark:backdrop-blur-lg dark:border-slate-700/50 border border-slate-200 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 flex-1">
                      {notifications.claimRejected ? (
                        <Volume2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">Claim Rejected</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Email notification when your claim is rejected
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.claimRejected}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, claimRejected: checked })
                      }
                      className="flex-shrink-0"
                    />
                  </div>

                  {/* Claim Submitted */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 dark:backdrop-blur-lg dark:border-slate-700/50 border border-slate-200 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 flex-1">
                      {notifications.claimSubmitted ? (
                        <Volume2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">Claim Submitted</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Confirmation email when you submit a new claim
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.claimSubmitted}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, claimSubmitted: checked })
                      }
                      className="flex-shrink-0"
                    />
                  </div>

                  {/* Reimbursement Processed */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 dark:backdrop-blur-lg dark:border-slate-700/50 border border-slate-200 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 flex-1">
                      {notifications.reimbursementProcessed ? (
                        <Volume2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">Reimbursement Processed</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Email notification when your reimbursement is transferred
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.reimbursementProcessed}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, reimbursementProcessed: checked })
                      }
                      className="flex-shrink-0"
                    />
                  </div>

                  {/* Save Settings Button */}
                  <div className="flex justify-center pt-6 border-t border-slate-200 dark:border-slate-700">
                    <Button className="px-8 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md flex items-center gap-2">
                      <Check size={18} />
                      <span>Save Preferences</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Logout Card */}
              <Card className="bg-red-50 dark:bg-red-900/20 dark:backdrop-blur-lg dark:border-red-800/50 border-red-200 hover:shadow-lg transition-all shadow-sm rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-red-600 dark:text-red-400">
                    Sign Out
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Sign out from your account. You will need to log in again to access your profile.
                  </p>
                  <Button
                    variant="outline"
                    className="border-red-300 dark:border-red-700/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
