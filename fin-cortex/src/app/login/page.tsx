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
  User
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

      // Always redirect to home page - dashboard button will link to correct dashboard based on role
      router.push('/');

    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      showToast('error', 'Login Failed', 'An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute w-80 h-80 bg-blue-500 rounded-full -top-40 -left-40 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500 rounded-full -bottom-40 -right-40 animate-pulse delay-1000"></div>
        <div className="absolute w-64 h-64 bg-indigo-500 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className="px-4 py-4 animate-fade-in-down relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold text-gradient-primary">FinCortex</span>
              <p className="text-xs text-muted -mt-1">AI-Powered</p>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:bg-slate-700/50 transition-all duration-300 hover:scale-110"
            >
              <span className="text-xl">{themeIcon}</span>
            </button>
            <Link
              href="/"
              className="flex items-center space-x-2 text-muted hover:text-primary transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Login Card */}
          <Card className="p-8 bg-card backdrop-blur-sm border border-subtle shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-primary mb-2">
                Welcome back
              </h1>
              <p className="text-muted">
                Sign in to your FinCortex account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-secondary">
                  Email address
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="pl-10 h-12 bg-card border-subtle text-primary placeholder-muted focus:border-accent focus:ring-accent/20 rounded-xl"
                    placeholder="Enter your email"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-secondary">
                  Password
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="pl-10 pr-10 h-12 bg-card border-subtle text-primary placeholder-muted focus:border-accent focus:ring-accent/20 rounded-xl"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-card-hover rounded-r-xl transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-muted hover:text-primary" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted hover:text-primary" />
                    )}
                  </button>
                </div>
              </div>

              {/* Employee Code Field */}
              <div className="space-y-2">
                <Label htmlFor="employee-code" className="text-sm font-medium text-secondary">
                  Employee Code <span className="text-muted text-xs">(Required for users)</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    id="employee-code"
                    type="text"
                    value={employeeCode}
                    onChange={(e) => {
                      setEmployeeCode(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="pl-10 h-12 bg-card border-subtle text-primary placeholder-muted focus:border-accent focus:ring-accent/20 rounded-xl"
                    placeholder="Enter your employee code"
                    autoComplete="off"
                  />
                </div>
                <p className="text-xs text-muted">
                  Leave blank if you are an admin or manager
                </p>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-accent focus:ring-accent border-subtle bg-card rounded"
                  />
                  <Label htmlFor="remember-me" className="ml-2 text-sm text-secondary">
                    Remember me
                  </Label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">
                        Login Failed
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 btn-primary text-white font-medium disabled:opacity-50 rounded-xl"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <span>Sign in</span>
                )}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="text-accent hover:text-accent/80 font-medium transition-colors"
                >
                  Create account
                </Link>
              </p>
            </div>
          </Card>

        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-6 animate-fade-in-up relative z-10" style={{ animationDelay: '0.4s' }}>
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs text-muted">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-accent hover:text-accent/80 transition-colors">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-accent hover:text-accent/80 transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
