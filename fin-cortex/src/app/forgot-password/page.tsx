"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { ArrowLeft, Mail, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error("Please enter a valid email address");
            }

            // Send password reset email via Supabase
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(
                email,
                {
                    redirectTo: `${window.location.origin}/reset-password`,
                }
            );

            if (resetError) {
                throw new Error(resetError.message);
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Failed to send reset email. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
                <Card className="w-full max-w-md bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <CardTitle className="text-2xl text-white">Check Your Email</CardTitle>
                        <CardDescription className="text-slate-400">
                            We&apos;ve sent a password reset link to{" "}
                            <span className="text-cyan-400 font-medium">{email}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-400 text-center">
                            Click the link in the email to reset your password. The link will
                            expire in 1 hour.
                        </p>
                        <p className="text-sm text-slate-500 text-center">
                            Didn&apos;t receive the email? Check your spam folder or{" "}
                            <button
                                onClick={() => setSuccess(false)}
                                className="text-cyan-400 hover:underline"
                            >
                                try again
                            </button>
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button
                            variant="outline"
                            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                            onClick={() => router.push("/login")}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Login
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <Card className="w-full max-w-md bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <Mail className="w-8 h-8 text-cyan-500" />
                    </div>
                    <CardTitle className="text-2xl text-white">Forgot Password?</CardTitle>
                    <CardDescription className="text-slate-400">
                        Enter your email address and we&apos;ll send you a link to reset your
                        password.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-cyan-500"
                                disabled={isLoading}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                            disabled={isLoading || !email}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                "Send Reset Link"
                            )}
                        </Button>
                        <Link
                            href="/login"
                            className="text-sm text-slate-400 hover:text-cyan-400 flex items-center justify-center"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to Login
                        </Link>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
