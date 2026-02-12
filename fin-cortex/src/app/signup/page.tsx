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
  Shield
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

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
      text: 'At least 8 characters',
      met: formData.password.length >= 8
    },
    {
      id: 'uppercase',
      text: 'One uppercase letter',
      met: /[A-Z]/.test(formData.password)
    },
    {
      id: 'lowercase',
      text: 'One lowercase letter',
      met: /[a-z]/.test(formData.password)
    },
    {
      id: 'digit',
      text: 'One number',
      met: /\d/.test(formData.password)
    },
    {
      id: 'symbol',
      text: 'One special character',
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
        // Error handling is now done in AuthContext with toast notifications
      } else if (data?.user_id || data?.message) {
        // Auto-login after successful signup
        const loginResult = await signIn(formData.email, formData.password);
        if (!loginResult.error) {
          router.push('/admin');
        } else {
          // If auto-login fails, redirect to login page
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      // Error handling is now done in AuthContext with toast notifications
    } finally {
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
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <span className="text-2xl font-bold text-gradient-primary">FinCortex</span>
              <p className="text-xs text-muted -mt-1">AI-Powered</p>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-card backdrop-blur-sm border border-subtle hover:bg-card-hover transition-all duration-300 hover:scale-110"
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
        <div className="w-full max-w-2xl animate-fade-in-up">
          {/* Signup Card */}
          <Card className="p-8 bg-card backdrop-blur-sm border border-subtle shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-primary mb-2">
                Create admin account
              </h1>
              <p className="text-muted">
                Join FinCortex and start managing reimbursements
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name Field */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-secondary">
                  Full Name *
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-muted" />
                  </div>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="pl-10 h-12 bg-card border-subtle text-primary placeholder-muted focus:border-accent focus:ring-accent/20 rounded-xl"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-secondary">
                  Email address *
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-muted" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 h-12 bg-card border-subtle text-primary placeholder-muted focus:border-accent focus:ring-accent/20 rounded-xl"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>


              {/* Phone Number Field */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium text-secondary">
                  Phone Number
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-muted" />
                  </div>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="pl-10 h-12 bg-card border-subtle text-primary placeholder-muted focus:border-accent focus:ring-accent/20 rounded-xl"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              {/* Company Name Field */}
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium text-secondary">
                  Company Name *
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-muted" />
                  </div>
                  <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="pl-10 h-12 bg-card border-subtle text-primary placeholder-muted focus:border-accent focus:ring-accent/20 rounded-xl"
                    placeholder="Enter your organization name"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-secondary">
                  Password *
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 h-12 border-subtle focus:border-accent focus:ring-accent/20 rounded-xl"
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-slate-50 dark:hover:bg-slate-800 rounded-r-xl transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-muted hover:text-muted" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted hover:text-muted" />
                    )}
                  </button>
                </div>

                {/* Password Requirements - Only show if password has content and not all requirements met */}
                {formData.password.length > 0 && !allRequirementsMet && (
                  <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Password Requirements:</h4>
                    <ul className="space-y-1">
                      {passwordRequirements.map((requirement) => (
                        <li key={requirement.id} className="flex items-center space-x-2 text-sm">
                          {requirement.met ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                          <span className={requirement.met ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
                            {requirement.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-secondary">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted" />
                  </div>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 h-12 border-subtle focus:border-accent focus:ring-accent/20 rounded-xl"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-slate-50 dark:hover:bg-slate-800 rounded-r-xl transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-muted hover:text-muted" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted hover:text-muted" />
                    )}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {formData.confirmPassword.length > 0 && (
                  <div className="mt-2 flex items-center space-x-2 text-sm">
                    {passwordsMatch ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-green-700 dark:text-green-400">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 text-red-500" />
                        <span className="text-red-700 dark:text-red-400">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start space-x-3">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-accent focus:ring-primary border-slate-300 rounded mt-1"
                  required
                />
                <Label htmlFor="agreeToTerms" className="text-sm text-slate-700">
                  I agree to the{" "}
                  <Link href="/terms" className="text-accent hover:text-accent/80 font-medium">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-accent hover:text-accent/80 font-medium">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              {/* Create Account Button */}
              <Button
                type="submit"
                disabled={isLoading || !formData.agreeToTerms || !allRequirementsMet || !passwordsMatch || !formData.companyName}
                className="w-full h-12 btn-primary text-white font-medium disabled:opacity-50 rounded-xl"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </div>
                ) : (
                  <span>Create account</span>
                )}
              </Button>

            </form>

            {/* Sign In Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-accent hover:text-accent/80 font-medium transition-colors"
                >
                  Sign in
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
            By creating an account, you agree to our{" "}
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