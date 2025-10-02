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
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);
  const { isDarkTheme, toggleTheme, themeIcon } = useTheme();
  const { signIn, signInWithGoogle, checkUserExists } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setUserNotFound(false);
    
    try {
      // First check if user exists
      setIsCheckingUser(true);
      const userCheck = await checkUserExists(email);
      setIsCheckingUser(false);

      if (!userCheck.exists) {
        setUserNotFound(true);
        setIsLoading(false);
        return;
      }

      // Proceed with login
      const { data, error } = await signIn(email, password);

      if (error) {
        console.error('Login error:', error);
        // Error handling is now done in AuthContext with toast notifications
      } else if (data?.user) {
        // Redirect to complete page as requested
        router.push('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Error handling is now done in AuthContext with toast notifications
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await signInWithGoogle();
      
      if (error) {
        console.error('Google auth error:', error);
        // Error handling is now done in AuthContext with toast notifications
      } else if (data?.user) {
        // Redirect to complete page as requested
        router.push('/');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      // Error handling is now done in AuthContext with toast notifications
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
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-card border-subtle text-primary placeholder-muted focus:border-accent focus:ring-accent/20 rounded-xl"
                    placeholder="Enter your email"
                    required
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
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-card border-subtle text-primary placeholder-muted focus:border-accent focus:ring-accent/20 rounded-xl"
                    placeholder="Enter your password"
                    required
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

              {/* User Not Found Error */}
              {userNotFound && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">
                        Account Not Found
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        No account found with this email address. Please check your email or create a new account.
                      </p>
                      <div className="mt-3">
                        <Link 
                          href="/signup" 
                          className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium underline"
                        >
                          Create new account →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sign In Button */}
              <Button 
                type="submit"
                disabled={isLoading || isCheckingUser}
                className="w-full h-12 btn-primary text-white font-medium disabled:opacity-50 rounded-xl"
              >
                {isLoading || isCheckingUser ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isCheckingUser ? 'Checking...' : 'Signing in...'}</span>
                  </div>
                ) : (
                  <span>Sign in</span>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-subtle" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-secondary text-muted">Or continue with</span>
                </div>
              </div>
            </div>

            {/* Social Login */}
            <div className="mt-6">
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-full border-subtle bg-card text-primary hover:bg-card-hover transition-all duration-300 group hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-300 dark:hover:border-blue-600 hover:-translate-y-1 active:scale-95"
                onClick={handleGoogleSignIn}
              >
                <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="group-hover:font-semibold transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">Continue with Google</span>
              </Button>
            </div>

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
