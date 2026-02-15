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
  Shield,
  AlertCircle,
  User,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useToastNotification } from "@/hooks/useToastNotification";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { isDarkTheme, toggleTheme, themeIcon } = useTheme();
  const { loginWithRPC } = useAuth();
  const router = useRouter();
  const { showToast } = useToastNotification();

  // Sanitize input to prevent XSS
  const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
  };

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password
  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  // Validate employee code (alphanumeric, 3-20 characters)
  const validateEmployeeCode = (code: string): boolean => {
    if (!code) return true; // Optional for admin/manager
    const codeRegex = /^[A-Za-z0-9]{3,20}$/;
    return codeRegex.test(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);
    const sanitizedEmployeeCode = employeeCode ? sanitizeInput(employeeCode) : null;

    // Validate inputs
    if (!sanitizedEmail || !validateEmail(sanitizedEmail)) {
      setErrorMessage("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    if (!sanitizedPassword || !validatePassword(sanitizedPassword)) {
      setErrorMessage("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    if (sanitizedEmployeeCode && !validateEmployeeCode(sanitizedEmployeeCode)) {
      setErrorMessage("Employee code must be 3-20 alphanumeric characters");
      setIsLoading(false);
      return;
    }

    try {
      // Call API route to check credentials
      console.log('🔐 Calling check-login-credential API...');
      const response = await fetch('/api/v1/auth/check-login-credential', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: sanitizedEmail,
          password: sanitizedPassword,
          employee_code: sanitizedEmployeeCode
        }),
      });

      const result = await response.json();
      console.log('📊 API Response:', result);

      if (!response.ok) {
        console.error('❌ API error:', result);
        setErrorMessage(result.detail || "An error occurred during login. Please try again.");
        showToast('error', 'Login Failed', result.detail || 'An error occurred during login.');
        setIsLoading(false);
        return;
      }

      const data = result.data;
      console.log('✅ Credential check data:', data);

      // Handle API response
      if (!data) {
        setErrorMessage("Invalid response from server. Please try again.");
        showToast('error', 'Login Failed', 'Invalid response from server.');
        setIsLoading(false);
        return;
      }

      // Check if user exists (useruuid field contains UUID or empty string)
      if (!data.useruuid || data.useruuid === '' || data.useruuid === null) {
        setErrorMessage("No account found with this email address.");
        showToast('error', 'Account Not Found', 'No account found with this email address.');
        setIsLoading(false);
        return;
      }

      // Check password
      if (!data.password) {
        setErrorMessage("Incorrect password. Please try again.");
        showToast('error', 'Invalid Password', 'Incorrect password. Please try again.');
        setIsLoading(false);
        return;
      }

      // For users, check employee code
      if (data.role === 'user' && data.employee_code === false) {
        setErrorMessage("Invalid employee code. Please check and try again.");
        showToast('error', 'Invalid Employee Code', 'Invalid employee code. Please check and try again.');
        setIsLoading(false);
        return;
      }

      console.log('🚀 Proceeding with login for role:', data.role);

      // All validations passed - proceed with login
      // Pass the UUID from RPC response (useruuid field)
      const userId = data.useruuid && typeof data.useruuid === 'string' && data.useruuid !== '' ? data.useruuid : undefined;
      const loginResult = await loginWithRPC(sanitizedEmail, sanitizedPassword, data.role, userId);

      if (loginResult.error) {
        console.error('❌ Login error:', loginResult.error);
        setErrorMessage(loginResult.error.message || "Login failed. Please try again.");
        showToast('error', 'Login Failed', loginResult.error.message || "Login failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Success - show personalized welcome message with user's name
      const userName = data.name || sanitizedEmail.split('@')[0];
      console.log('🎉 Login successful! Welcome:', userName);
      console.log('🎭 User role:', data.role);

      // Wait a bit for user profile to load
      await new Promise(resolve => setTimeout(resolve, 500));

      showToast('success', 'Login Successful', `Welcome back, ${userName}! Redirecting to home...`);

      // Redirect to correct dashboard based on role
      const dashboardPath = data.role === 'admin' ? "/admin" :
        data.role === 'manager' ? "/manager" :
          "/user/dashboard";

      router.push(dashboardPath);

    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      showToast('error', 'Login Failed', 'An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex transition-colors duration-300">
      {/* Left Panel - Fixed Dark Branding */}
      <div className="hidden lg:flex w-1/2 bg-[#0A0A0B] relative overflow-hidden flex-col items-center justify-center p-20 border-r border-white/5">
        {/* Background Decorative Glows */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/[0.03] blur-[180px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
          <div className="w-24 h-24 bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#ec4899] rounded-[32px] flex items-center justify-center shadow-2xl shadow-purple-500/20 mb-12 animate-float">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-tight mb-6">
            Enterprise <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Intelligence</span>
          </h2>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.4em] leading-relaxed mb-12">
            The future of corporate reimbursement management is here.
          </p>

          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm">
              <p className="text-2xl font-black text-white mb-1">99.9%</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Accuracy</p>
            </div>
            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm">
              <p className="text-2xl font-black text-white mb-1">2.4s</p>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Processing</p>
            </div>
          </div>
        </div>

        {/* Footer Branding */}
        <div className="absolute bottom-12 left-12 flex items-center gap-3">
          <div className="h-px w-8 bg-slate-800" />
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">FINCORTEX CORE v2.0</p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 min-h-screen bg-[var(--background-dark)] flex flex-col relative overflow-hidden transition-colors duration-300">
        <header className="px-8 py-8 flex items-center justify-between relative z-20 w-full">
          <Link href="/" className="lg:hidden flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#6366f1] to-[#ec4899] rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-[var(--text-primary)] tracking-tighter uppercase">FINCORTEX</span>
          </Link>

          <div className="flex items-center gap-4 ml-auto">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full bg-[var(--card-dark)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
            >
              {themeIcon}
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">ORIGIN</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-8 py-12 relative z-10 overflow-auto">
          <div className="w-full max-w-[440px]">
            <div className="mb-12">
              <h1 className="text-4xl font-black text-[var(--text-primary)] uppercase tracking-tighter mb-4">
                AUTHENTICATE
              </h1>
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                SECURE ACCESS PROTOCOL
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1">IDENTIFIER</Label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)] group-focus-within:text-purple-400 transition-colors z-10" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrorMessage(null); }}
                      className="pl-14 h-14 bg-[var(--surface-elevated)] border-[var(--border-medium)] rounded-2xl text-xs font-bold transition-all"
                      placeholder="EMAIL ADDRESS"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1">SECURITY KEY</Label>
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)] group-focus-within:text-purple-400 transition-colors z-10" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrorMessage(null); }}
                      className="pl-14 pr-14 h-14 bg-[var(--surface-elevated)] border-[var(--border-medium)] rounded-2xl text-xs font-bold transition-all"
                      placeholder="ACCOUNT PASSWORD"
                      required
                    />
                    <button type="button" className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-purple-400 z-10" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] ml-1">EMPLOYEE CODE</Label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-muted)] group-focus-within:text-purple-400 transition-colors z-10" />
                    <Input
                      type="text"
                      value={employeeCode}
                      onChange={(e) => { setEmployeeCode(e.target.value); setErrorMessage(null); }}
                      className="pl-14 h-14 bg-[var(--surface-elevated)] border-[var(--border-medium)] rounded-2xl text-xs font-bold transition-all"
                      placeholder="OPTIONAL FOR ADMIN/MGR"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border-medium)] bg-[var(--surface-elevated)] text-purple-500 focus:ring-purple-500/20"
                  />
                  <Label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] cursor-pointer">PERSISTENT</Label>
                </div>
                <Link href="/forgot-password" title="RECOVERY" className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-purple-400">RECOVERY</Link>
              </div>

              {errorMessage && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl animate-shake">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none mb-1">AUTH ERROR</p>
                  <p className="text-[11px] font-bold text-red-400 uppercase leading-relaxed">{errorMessage}</p>
                </div>
              )}

              <Button type="submit" disabled={isLoading} variant="brand" className="w-full h-16 text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-purple-500/10">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "INITIALIZE SESSION"}
              </Button>
            </form>

            <div className="mt-12 text-center">
              <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                NEW TO PLATFORM? <Link href="/signup" className="text-purple-400 underline underline-offset-4 decoration-purple-500/30">ACQUIRE ACCESS</Link>
              </p>
            </div>
          </div>
        </main>

        <footer className="px-8 py-10 w-full text-center">
          <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">SYSTEM SECURITY PROTOCOLS ACTIVE</p>
        </footer>
      </div>
    </div>
  );
}
