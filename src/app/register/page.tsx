"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Landmark, ArrowRight, AlertCircle, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create your account.");
        return;
      }

      toast.success("Account created successfully! $100 welcome bonus credited.", {
        className: "bg-emerald-50 text-emerald-900 border-emerald-200",
      });

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
        <Card className="w-full max-w-md shadow-sm border-border bg-card">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
              <Landmark className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
              Open Your Free Account
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Instant setup with unique address and welcome funds
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Feature Callout */}
            <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <div>
                  <span className="font-semibold">Automatic Instant Provisioning:</span>
                  <p className="mt-0.5 text-[11px] opacity-90">
                    You will instantly receive a unique <code className="font-mono font-bold">ACCT-XXXX-XXXX</code> address and a $100.00 initial balance.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <Alert className="mb-4 bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs sm:text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g. Elena Rostova"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-10 text-sm border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs sm:text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. elena@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 text-sm border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs sm:text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 text-sm border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-medium">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-10 text-sm border-border"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 mt-3 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black font-medium"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Provisioning Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    Create Account <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col border-t border-border/60 pt-4 pb-4 text-center">
            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-foreground underline underline-offset-4">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
