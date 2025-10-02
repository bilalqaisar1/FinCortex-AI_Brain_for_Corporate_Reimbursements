"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft,
  Shield,
  Smartphone,
  Mail,
  Clock,
  CheckCircle
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function OTPPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [isVerified, setIsVerified] = useState(false);
  const [otpExpired, setOtpExpired] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { isDarkTheme, toggleTheme, themeIcon } = useTheme();
  const { verifyOtp, resendOtp } = useAuth();
  const router = useRouter();

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    
    // Focus the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex((digit, index) => !digit && index < 6);
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      return;
    }

    // Prevent multiple submissions
    if (isLoading) {
      console.log('Already loading, ignoring submission');
      return;
    }

    console.log('Starting OTP verification for:', otpString);
    setIsLoading(true);
    
    try {
      // Get email from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const email = urlParams.get('email');
      
      if (!email) {
        console.log('No email found, redirecting to signup');
        router.push('/signup');
        return;
      }

      console.log('Verifying OTP for email:', email);
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('OTP verification timeout')), 15000)
      );
      
      const { data, error } = await Promise.race([verifyOtp(email, otpString), timeoutPromise]);

      console.log('OTP verification result:', { data, error });

      if (error) {
        console.error('OTP verification error:', error);
        
        // Handle specific OTP errors
        if (error.message?.includes('expired') || error.message?.includes('invalid')) {
          console.log('OTP expired or invalid, clearing OTP fields');
          setOtp(['', '', '', '', '', '']);
          setOtpExpired(true);
          // Focus on first input
          inputRefs.current[0]?.focus();
        }
        // Error handling is now done in AuthContext with toast notifications
      } else if (data?.access_token || data?.user) {
        console.log('OTP verification successful, data:', data);
        setIsVerified(true);
        // Redirect to complete page after success
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        console.log('No user data returned from OTP verification');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      // Error handling is now done in AuthContext with toast notifications
    } finally {
      console.log('Setting loading to false');
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    
    try {
      // Get email from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const email = urlParams.get('email');
      
      if (!email) {
        router.push('/signup');
        return;
      }

      const { data, error } = await resendOtp(email);

      if (error) {
        console.error('Resend OTP error:', error);
        // Error handling is now done in AuthContext with toast notifications
      } else {
        setTimeLeft(300); // Reset timer
        setOtpExpired(false); // Reset expired state
        // Success message is now handled in AuthContext with toast notifications
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      // Error handling is now done in AuthContext with toast notifications
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center px-4">
        <Card className="p-8 bg-card backdrop-blur-sm border border-subtle shadow-2xl max-w-md w-full text-center animate-scale-in">
          <div className="w-20 h-20 bg-success-gradient rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-primary mb-4">
            Verification Successful!
          </h1>
          <p className="text-muted mb-6">
            Your account has been verified successfully. Redirecting to main page...
          </p>
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="bg-success-gradient h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
        </Card>
      </div>
    );
  }

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
              className="p-2 rounded-lg bg-card backdrop-blur-sm border border-subtle hover:bg-card-hover transition-all duration-300 hover:scale-110"
            >
              <span className="text-xl">{themeIcon}</span>
            </button>
            <Link 
              href="/login" 
              className="flex items-center space-x-2 text-muted hover:text-primary transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Back to Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* OTP Card */}
          <Card className="p-8 bg-card backdrop-blur-sm border border-subtle shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-primary mb-2">
                Verify your account
              </h1>
              <p className="text-muted">
                We&apos;ve sent a 6-digit code to your email
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* OTP Input */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-secondary text-center block">
                  Enter verification code
                </Label>
                
                {/* OTP Expired Warning */}
                {otpExpired && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center justify-center space-x-2 text-red-700 dark:text-red-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span className="text-sm font-medium">OTP expired. Please request a new code.</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-center space-x-3" role="group" aria-label="OTP verification code">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-12 h-12 text-center text-xl font-semibold bg-card border-subtle text-primary focus:border-accent focus:ring-accent/20 rounded-xl"
                      autoComplete="off"
                      aria-label={`Digit ${index + 1} of 6`}
                      tabIndex={0}
                    />
                  ))}
                </div>
              </div>

              {/* Timer and Resend */}
              <div className="text-center space-y-4">
                {timeLeft > 0 ? (
                  <div className="flex items-center justify-center space-x-2 text-muted" role="timer" aria-live="polite">
                    <Clock className="w-4 h-4" aria-hidden="true" />
                    <span className="text-sm">
                      Resend code in <span aria-label={`${Math.floor(timeLeft / 60)} minutes and ${timeLeft % 60} seconds`}>{formatTime(timeLeft)}</span>
                    </span>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-accent border-accent hover:bg-accent/5 rounded-full"
                    aria-label="Resend verification code"
                  >
                    {isResending ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                        <span>Resending...</span>
                      </div>
                    ) : (
                      "Resend code"
                    )}
                  </Button>
                )}
              </div>

              {/* Verify Button */}
              <Button 
                type="submit"
                disabled={isLoading || otp.join('').length !== 6}
                className="w-full h-12 btn-primary text-white font-medium disabled:opacity-50 rounded-xl"
                aria-label={isLoading ? "Verifying your account" : "Verify your account with the entered code"}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  <span>Verify Account</span>
                )}
              </Button>
              
              {/* Debug Reset Button - Only show if loading for too long */}
              {isLoading && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Manual reset triggered');
                      setIsLoading(false);
                    }}
                    className="text-xs text-muted hover:text-primary underline"
                  >
                    Reset if stuck
                  </button>
                </div>
              )}
            </form>

            {/* Help Text */}
            <div className="mt-8 text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 text-muted">
                <Mail className="w-4 h-4" />
                <span className="text-sm">
                  Check your email for the verification code
                </span>
              </div>
              <p className="text-xs text-muted">
                Didn't receive the code? Check your spam folder or{" "}
                <button
                  onClick={handleResend}
                  disabled={isResending || timeLeft > 0}
                  className="text-accent hover:text-accent/80 font-medium disabled:opacity-50"
                >
                  resend
                </button>
              </p>
            </div>
          </Card>

          {/* Security Notice */}
          <div className="mt-8 p-4 bg-card backdrop-blur-sm rounded-xl border border-subtle animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-primary mb-1">Security Notice</h4>
                <p className="text-xs text-muted">
                  This verification code expires in 5 minutes. Never share this code with anyone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-6 animate-fade-in-up relative z-10" style={{ animationDelay: '0.4s' }}>
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs text-muted">
            Having trouble?{" "}
            <Link href="/contact" className="text-accent hover:text-accent/80 transition-colors">
              Contact Support
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
