"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, CheckCircle, Loader2, Eye, EyeOff, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

    // Password validation
    const passwordRequirements = [
        { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
        { label: "Contains uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
        { label: "Contains lowercase letter", test: (p: string) => /[a-z]/.test(p) },
        { label: "Contains number", test: (p: string) => /[0-9]/.test(p) },
    ];

    useEffect(() => {
        // Check if we have an active session from the reset link
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsValidSession(!!session);
        };
        checkSession();

        // Listen for auth state changes (when user clicks the reset link)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === "PASSWORD_RECOVERY") {
                    setIsValidSession(true);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validate passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        // Validate password requirements
        const failedRequirements = passwordRequirements.filter(
            (req) => !req.test(password)
        );
        if (failedRequirements.length > 0) {
            setError(`Password must: ${failedRequirements.map((r) => r.label.toLowerCase()).join(", ")}`);
            return;
        }

        setIsLoading(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password,
            });

            if (updateError) {
                throw new Error(updateError.message);
            }

            setSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (err: any) {
            setError(err.message || "Failed to reset password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading while checking session
    if (isValidSession === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
        );
    }

    // Show error if no valid session
    if (!isValidSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
                <Card className="w-full max-w-md bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <CardTitle className="text-2xl text-white">Invalid or Expired Link</CardTitle>
                        <CardDescription className="text-slate-400">
                            This password reset link is invalid or has expired. Please request a new one.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
                            onClick={() => router.push("/forgot-password")}
                        >
                            Request New Link
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Show success message
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
                <Card className="w-full max-w-md bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <CardTitle className="text-2xl text-white">Password Reset Successful</CardTitle>
                        <CardDescription className="text-slate-400">
                            Your password has been updated. Redirecting to login...
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <Card className="w-full max-w-md bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-cyan-500" />
                    </div>
                    <CardTitle className="text-2xl text-white">Reset Your Password</CardTitle>
                    <CardDescription className="text-slate-400">
                        Enter your new password below.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* New Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300">
                                New Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter new password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-cyan-500 pr-10"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Password Requirements */}
                        <div className="space-y-1">
                            {passwordRequirements.map((req, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-center text-xs ${req.test(password) ? "text-green-400" : "text-slate-500"
                                        }`}
                                >
                                    <CheckCircle className={`w-3 h-3 mr-2 ${req.test(password) ? "opacity-100" : "opacity-30"}`} />
                                    {req.label}
                                </div>
                            ))}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-slate-300">
                                Confirm Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-cyan-500 pr-10"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <p className="text-xs text-red-400">Passwords do not match</p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                            disabled={isLoading || !password || !confirmPassword}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Reset Password"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
