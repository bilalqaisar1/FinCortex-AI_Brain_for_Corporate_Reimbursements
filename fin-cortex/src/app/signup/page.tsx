"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowLeft,
  User,
  Users,
  Check,
  X,
  Shield,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isDarkTheme, toggleTheme, themeIcon } = useTheme();
  const { signUp, signIn } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    companyName: "",
    agreeToTerms: false
  });

  // Password requirements validation
  const passwordRequirements = [
    {
      id: 'length',
      text: '8+ CHARACTERS',
      met: formData.password.length >= 8
    },
    {
      id: 'uppercase',
      text: 'UPPERCASE CASE',
      met: /[A-Z]/.test(formData.password)
    },
    {
      id: 'lowercase',
      text: 'LOWERCASE CASE',
      met: /[a-z]/.test(formData.password)
    },
    {
      id: 'digit',
      text: 'NUMERIC VALUE',
      met: /\d/.test(formData.password)
    },
    {
      id: 'symbol',
      text: 'SPECIAL SYMBOL',
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)
    }
  ];

  const allRequirementsMet = passwordRequirements.every(req => req.met);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        phone_number: formData.phoneNumber,
        company_name: formData.companyName
      });

      if (error) {
        console.error('Signup error details:', error.message || error);
      } else if (data?.user_id || data?.message) {
        const loginResult = await signIn(formData.email, formData.password);
        if (!loginResult.error) {
          router.push('/admin');
        } else {
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background-dark)] flex flex-col relative overflow-hidden selection:bg-purple-500/30 transition-colors duration-300">
      {/* Background Decorative Glows */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="px-8 py-8 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#ec4899] rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/20 group-hover:scale-110 transition-transform duration-500">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none">FinCortex</span>
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mt-1">Intelligence Layer</span>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full bg-[var(--card-dark)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              {themeIcon}
            </button>
            <Link
              href="/login"
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              ALREADY REGISTERED? <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-3xl animate-fade-in-up">
          <Card className="p-12 bg-[var(--card-dark)] backdrop-blur-3xl border-[var(--border-subtle)] shadow-2xl relative overflow-hidden group rounded-[40px]">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-transparent via-purple-500/20 to-transparent" />

            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-br from-[#6366f1] to-[#ec4899] rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-500/20 transform rotate-3 group-hover:rotate-0 transition-transform duration-700">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-black text-[var(--text-primary)] uppercase tracking-tighter mb-4">
                CREATE ENTITY
              </h1>
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                INITIALIZE ADMINISTRATIVE NODE ACCESS
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              {/* Full Name Field */}
              <div className="space-y-3">
                <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1">
                  FULL IDENTITY
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-600 group-focus-within:text-purple-400 transition-colors" />
                  </div>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="pl-14 h-14 bg-[var(--surface-elevated)] border-[var(--border-medium)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/50 focus:ring-purple-500/10 rounded-2xl text-xs font-bold transition-all"
                    placeholder="ENTER LEGAL NAME"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-3">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1">
                  COMMUNICATION CHANNEL
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-600 group-focus-within:text-purple-400 transition-colors" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-14 h-14 bg-[var(--surface-elevated)] border-[var(--border-medium)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/50 focus:ring-purple-500/10 rounded-2xl text-xs font-bold transition-all"
                    placeholder="ENTER EMAIL ADDRESS"
                    required
                  />
                </div>
              </div>

              {/* Company Name Field */}
              <div className="space-y-3">
                <Label htmlFor="companyName" className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1">
                  ORGANIZATION
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-slate-600 group-focus-within:text-purple-400 transition-colors" />
                  </div>
                  <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="pl-14 h-14 bg-[var(--surface-elevated)] border-[var(--border-medium)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/50 focus:ring-purple-500/10 rounded-2xl text-xs font-bold transition-all"
                    placeholder="ENTER COMPANY NAME"
                    required
                  />
                </div>
              </div>

              {/* Phone Number Field */}
              <div className="space-y-3">
                <Label htmlFor="phoneNumber" className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1">
                  TELEMETRY LINK
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-600 group-focus-within:text-purple-400 transition-colors" />
                  </div>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="pl-14 h-14 bg-[var(--surface-elevated)] border-[var(--border-medium)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/50 focus:ring-purple-500/10 rounded-2xl text-xs font-bold transition-all"
                    placeholder="ENTER PHONE NUMBER"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-3">
                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1">
                  GENERATE SECURITY KEY
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-600 group-focus-within:text-purple-400 transition-colors" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-14 pr-14 h-14 bg-[var(--surface-elevated)] border-[var(--border-medium)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/50 focus:ring-purple-500/10 rounded-2xl text-xs font-bold transition-all"
                    placeholder="CREATE PASSWORD"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-5 flex items-center text-slate-600 hover:text-purple-400 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1">
                  VERIFY SECURITY KEY
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-600 group-focus-within:text-purple-400 transition-colors" />
                  </div>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-14 pr-14 h-14 bg-[var(--surface-elevated)] border-[var(--border-medium)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/50 focus:ring-purple-500/10 rounded-2xl text-xs font-bold transition-all"
                    placeholder="RE-ENTER PASSWORD"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-5 flex items-center text-slate-600 hover:text-purple-400 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Password Complexity Feedback */}
              <div className="md:col-span-2 p-6 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-[24px]">
                <div className="flex flex-wrap gap-4">
                  {passwordRequirements.map((req) => (
                    <div key={req.id} className="flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full transition-all", req.met ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-[var(--border-medium)]")} />
                      <span className={cn("text-[8px] font-black uppercase tracking-[0.1em]", req.met ? "text-emerald-400" : "text-slate-600")}>
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
                {formData.confirmPassword.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", passwordsMatch ? "bg-emerald-500" : "bg-red-500")} />
                    <span className={cn("text-[8px] font-black uppercase tracking-[0.1em]", passwordsMatch ? "text-emerald-400" : "text-red-400")}>
                      {passwordsMatch ? "PARITY VERIFIED" : "PARITY MISMATCH"}
                    </span>
                  </div>
                )}
              </div>

              {/* Terms Agreement */}
              <div className="md:col-span-2 flex items-start gap-4 px-1">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="h-5 w-5 rounded-lg border-[var(--border-medium)] bg-[var(--surface-elevated)] text-purple-500 focus:ring-purple-500/20 mt-1 cursor-pointer"
                  required
                />
                <Label htmlFor="agreeToTerms" className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-muted)] leading-relaxed cursor-pointer hover:text-[var(--text-primary)]">
                  I ACKNOWLEDGE THE{" "}
                  <Link href="/terms" className="text-purple-400 hover:text-[var(--text-primary)] underline underline-offset-4 decoration-purple-500/20">OPERATIONAL PROTOCOLS</Link>
                  {" "}AND{" "}
                  <Link href="/privacy" className="text-purple-400 hover:text-[var(--text-primary)] underline underline-offset-4 decoration-purple-500/20">DATA MANAGEMENT POLICIES</Link>
                </Label>
              </div>

              {/* Create Account Button */}
              <div className="md:col-span-2 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || !formData.agreeToTerms || !allRequirementsMet || !passwordsMatch || !formData.companyName}
                  variant="brand"
                  className="w-full h-16 text-[11px] font-black uppercase tracking-[0.3em] disabled:opacity-30 transition-all duration-500 shadow-2xl shadow-purple-500/20"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>INITIALIZING...</span>
                    </div>
                  ) : (
                    <span>ESTABLISH ADMINISTRATIVE NODE</span>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-12 text-center pb-2">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                IDENTITY ALREADY REGISTERED?{" "}
                <Link
                  href="/login"
                  className="text-purple-400 hover:text-[var(--text-primary)] transition-all underline underline-offset-4 decoration-purple-500/30"
                >
                  RESUME SESSION
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-10 relative z-10 text-center border-t border-[var(--border-subtle)] bg-[var(--background-dark)]/50 backdrop-blur-md">
        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">
          SECURE INFRASTRUCTURE DEPLOYMENT PROTOCOL v2.4 // FINCORTEX AI
        </p>
      </footer>
    </div>
  );
}