"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";
import { UserNavbar } from "@/components/dashboard/UserNavbar";
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

import { useAuth } from "@/context/AuthContext";

export default function UserProfilePage() {
  const { isDarkTheme, toggleTheme, themeIcon } = useTheme();
  const { user, userProfile, signOut } = useAuth();

  const [editBankOpen, setEditBankOpen] = useState(false);
  const [editPasswordOpen, setEditPasswordOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    claimApproved: true,
    claimRejected: true,
    claimSubmitted: false,
    reimbursementProcessed: true,
  });

  // Dynamic User Data
  const userData = {
    name: userProfile?.full_name || user?.user_metadata?.full_name || "User",
    employeeId: userProfile?.employee_code || "N/A",
    email: userProfile?.email || user?.email || "N/A",
    department: userProfile?.departments?.department_name || "General",
    manager: userProfile?.managers?.full_name || "Unassigned",
    bankName: userProfile?.bank_name || "Not Configured",
    bankAccountLast4: userProfile?.account_number ? userProfile.account_number.slice(-4) : "XXXX",
    // Keep these if they aren't in profile yet, or map them if they are
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[var(--background-dark)]">
      {/* Navbar */}
      <UserNavbar toggleTheme={toggleTheme} themeIcon={themeIcon} />

      {/* Main Content */}
      <main className="flex-1 w-full pt-20 px-4 md:px-6 lg:px-8 pb-12 bg-[var(--background-dark)]">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Profile & Settings
            </h1>
            <p className="text-lg text-[var(--text-secondary)]">
              Manage your account information and preferences
            </p>
          </div>

          {/* Tabs Navigation */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-[var(--background-secondary)] border border-[var(--border-subtle)] rounded-xl shadow-sm">
              <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-[var(--card-dark)] data-[state=active]:text-[var(--text-primary)] text-[var(--text-secondary)]">
                <User size={18} />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="banking" className="gap-2 data-[state=active]:bg-[var(--card-dark)] data-[state=active]:text-[var(--text-primary)] text-[var(--text-secondary)]">
                <DollarSign size={18} />
                <span className="hidden sm:inline">Banking</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-[var(--card-dark)] data-[state=active]:text-[var(--text-primary)] text-[var(--text-secondary)]">
                <Lock size={18} />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* PROFILE TAB */}
            <TabsContent value="profile" className="space-y-6">
              {/* Profile Information Card */}
              <Card className="bg-[var(--card-dark)] border-[var(--border-subtle)] hover:shadow-lg transition-all shadow-sm rounded-2xl backdrop-blur-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <User className="w-6 h-6 text-blue-500" />
                        Personal Information
                      </CardTitle>
                      <CardDescription className="text-sm mt-1 text-[var(--text-secondary)]">
                        Your identity information (synced from HR system)
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-[var(--text-secondary)]">
                        Full Name
                      </Label>
                      <div className="p-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border-subtle)]">
                        <p className="text-[var(--text-primary)] font-medium">{userData.name}</p>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] italic">
                        To change this, please contact HR
                      </p>
                    </div>

                    {/* Employee ID & Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[var(--text-secondary)]">
                          Employee ID
                        </Label>
                        <div className="p-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border-subtle)]">
                          <p className="text-[var(--text-primary)] font-medium">{userData.employeeId}</p>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] italic">Read-only</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[var(--text-secondary)]">
                          Email Address
                        </Label>
                        <div className="p-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border-subtle)]">
                          <p className="text-[var(--text-primary)] font-medium">{userData.email}</p>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] italic">Read-only</p>
                      </div>
                    </div>

                    {/* Department & Manager */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[var(--text-secondary)]">
                          Department
                        </Label>
                        <div className="p-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border-subtle)]">
                          <p className="text-[var(--text-primary)] font-medium">{userData.department}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[var(--text-secondary)]">
                          Reports To
                        </Label>
                        <div className="p-3 rounded-xl bg-[var(--background-secondary)] border border-[var(--border-subtle)]">
                          <p className="text-[var(--text-primary)] font-medium">{userData.manager}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Info Box */}
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex gap-3 shadow-sm">
                <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">HR Sync Info</p>
                  <p className="text-sm text-blue-600/80 dark:text-blue-300">
                    Your profile information is automatically synced from your HR records. Changes made by HR will be reflected here within 24 hours.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* BANKING TAB */}
            <TabsContent value="banking" className="space-y-6">
              {/* Current Bank Account Card */}
              <Card className="bg-[var(--card-dark)] border-[var(--border-subtle)] hover:shadow-lg transition-all shadow-sm rounded-2xl backdrop-blur-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-emerald-500" />
                        Bank Account
                      </CardTitle>
                      <CardDescription className="text-sm mt-1 text-[var(--text-secondary)]">
                        Primary account for receiving reimbursements
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Current Account Display */}
                    <div className="p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border-subtle)] flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-sm text-[var(--text-secondary)] mb-1">Current Account</p>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-emerald-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-[var(--text-primary)]">{userData.bankName}</p>
                            <p className="text-sm text-[var(--text-secondary)]">
                              Account ending in •••• {userData.bankAccountLast4}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Check className="w-6 h-6 text-emerald-500 flex-shrink-0" />
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
                      <DialogContent className="bg-[var(--card-dark)] border-[var(--border-subtle)] shadow-2xl rounded-2xl backdrop-blur-3xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold text-[var(--text-primary)]">
                            Update Bank Account
                          </DialogTitle>
                          <DialogDescription className="text-[var(--text-secondary)] mt-2">
                            Update your bank details for reimbursement transfers
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          {/* Bank Name */}
                          <div className="space-y-2">
                            <Label htmlFor="bank-name" className="text-sm font-semibold text-[var(--text-secondary)]">
                              Bank Name
                            </Label>
                            <Input
                              id="bank-name"
                              placeholder="e.g., HDFC Bank"
                              defaultValue={userData.bankName}
                              className="bg-[var(--background-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>

                          {/* Account Holder Name */}
                          <div className="space-y-2">
                            <Label htmlFor="account-holder" className="text-sm font-semibold text-[var(--text-secondary)]">
                              Owner Name
                            </Label>
                            <Input
                              id="account-holder"
                              placeholder="Full name as per bank records"
                              defaultValue={userData.name}
                              className="bg-[var(--background-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>

                          {/* Account Number */}
                          <div className="space-y-2">
                            <Label htmlFor="account-number" className="text-sm font-semibold text-[var(--text-secondary)]">
                              Account Number
                            </Label>
                            <Input
                              id="account-number"
                              placeholder="e.g., 10234567890123"
                              type="password"
                              className="bg-[var(--background-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>

                          {/* Current Password - Security Verification */}
                          <div className="space-y-2">
                            <Label htmlFor="bank-password" className="text-sm font-semibold text-[var(--text-secondary)]">
                              Current Password <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                              <Input
                                id="bank-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password to authorize changes"
                                className="bg-[var(--background-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-blue-500 focus:ring-blue-500 pr-10"
                              />
                              <button
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                            <p className="text-xs text-[var(--text-muted)]">
                              Required for security verification
                            </p>
                          </div>

                          {/* Security Warning */}
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-2 shadow-sm">
                            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-600 dark:text-amber-300">
                              For security, changing your bank details may require 2-factor authentication.
                            </p>
                          </div>
                        </div>

                        <DialogFooter className="gap-3 pt-4 flex justify-center">
                          <Button
                            variant="outline"
                            onClick={() => setEditBankOpen(false)}
                            className="w-[30%] border-[var(--border-medium)] text-[var(--text-secondary)] hover:bg-[var(--background-secondary)] rounded-lg"
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
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex gap-3 shadow-sm">
                <AlertCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Important</p>
                  <p className="text-sm text-emerald-600/80 dark:text-emerald-300">
                    Ensure your bank details are accurate. Incorrect information may result in failed transfers. We never display your full account number for security.
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="settings" className="space-y-6">
              {/* Security Settings Card */}
              <Card className="bg-[var(--card-dark)] border-[var(--border-subtle)] hover:shadow-lg transition-all shadow-sm rounded-2xl backdrop-blur-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Lock className="w-6 h-6 text-blue-500" />
                    Security
                  </CardTitle>
                  <CardDescription className="text-sm text-[var(--text-secondary)]">
                    Manage your account security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Change Password */}
                  <Dialog open={editPasswordOpen} onOpenChange={setEditPasswordOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between border-[var(--border-medium)] text-[var(--text-secondary)] hover:bg-[var(--background-secondary)] rounded-lg"
                        onClick={() => setEditPasswordOpen(true)}
                      >
                        <span>Change Password</span>
                        <ArrowRight size={18} />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[var(--card-dark)] border-[var(--border-subtle)] shadow-2xl rounded-2xl backdrop-blur-3xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-[var(--text-primary)]">
                          Change Password
                        </DialogTitle>
                        <DialogDescription className="text-[var(--text-secondary)] mt-2">
                          Update your password to keep your account secure
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        {/* Current Password */}
                        <div className="space-y-2">
                          <Label htmlFor="current-password" className="text-sm font-semibold text-[var(--text-secondary)]">
                            Current Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="current-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter current password"
                              className="bg-[var(--background-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-blue-500 focus:ring-blue-500 pr-10"
                            />
                            <button
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-2">
                          <Label htmlFor="new-password" className="text-sm font-semibold text-[var(--text-secondary)]">
                            New Password
                          </Label>
                          <Input
                            id="new-password"
                            type="password"
                            placeholder="Enter new password"
                            className="bg-[var(--background-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-blue-500 focus:ring-blue-500"
                          />
                          <p className="text-xs text-[var(--text-muted)]">
                            At least 8 characters with uppercase, lowercase, and numbers
                          </p>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password" className="text-sm font-semibold text-[var(--text-secondary)]">
                            Confirm Password
                          </Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            placeholder="Confirm new password"
                            className="bg-[var(--background-secondary)] border-[var(--border-subtle)] text-[var(--text-primary)] focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <DialogFooter className="gap-3 pt-4 flex justify-center">
                        <Button
                          variant="outline"
                          onClick={() => setEditPasswordOpen(false)}
                          className="w-[30%] border-[var(--border-medium)] text-[var(--text-secondary)] hover:bg-[var(--background-secondary)] rounded-lg"
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
              <Card className="bg-[var(--card-dark)] border-[var(--border-subtle)] hover:shadow-lg transition-all shadow-sm rounded-2xl backdrop-blur-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Bell className="w-6 h-6 text-amber-500" />
                    Notifications
                  </CardTitle>
                  <CardDescription className="text-sm text-[var(--text-secondary)]">
                    Control how we notify you about your reimbursements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Claim Approved */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border-subtle)] hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 flex-1">
                      {notifications.claimApproved ? (
                        <Volume2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">Claim Approved</p>
                        <p className="text-sm text-[var(--text-secondary)]">
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
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border-subtle)] hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 flex-1">
                      {notifications.claimRejected ? (
                        <Volume2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">Claim Rejected</p>
                        <p className="text-sm text-[var(--text-secondary)]">
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
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border-subtle)] hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 flex-1">
                      {notifications.claimSubmitted ? (
                        <Volume2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">Claim Submitted</p>
                        <p className="text-sm text-[var(--text-secondary)]">
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
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background-secondary)] border border-[var(--border-subtle)] hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 flex-1">
                      {notifications.reimbursementProcessed ? (
                        <Volume2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">Reimbursement Processed</p>
                        <p className="text-sm text-[var(--text-secondary)]">
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
                  <div className="flex justify-center pt-6 border-t border-[var(--border-subtle)]">
                    <Button className="px-8 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-md flex items-center gap-2">
                      <Check size={18} />
                      <span>Save Preferences</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Logout Card */}
              <Card className="bg-red-500/10 border-red-500/20 hover:shadow-lg transition-all shadow-sm rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-red-500">
                    Sign Out
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Sign out from your account. You will need to log in again to access your profile.
                  </p>
                  <Button
                    variant="outline"
                    className="border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-lg"
                    onClick={signOut}
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
