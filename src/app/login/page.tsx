"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Landmark, ArrowRight, AlertCircle, Shield, UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const demoParam = searchParams.get("demo");
    if (demoParam === "alex") {
      setEmail("alex@bank.com");
      setPassword("password123");
    } else if (demoParam === "jordan") {
      setEmail("jordan@bank.com");
      setPassword("password123");
    } else if (demoParam === "admin") {
      setEmail("admin@bank.com");
      setPassword("admin123");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to sign in. Please verify your credentials.");
        return;
      }

      toast.success(`Welcome back, ${data.user.name}!`, {
        className: "bg-emerald-50 text-emerald-900 border-emerald-200",
      });

      if (data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(type: "alex" | "jordan" | "admin") {
    setError(null);
    if (type === "alex") {
      setEmail("alex@bank.com");
      setPassword("password123");
    } else if (type === "jordan") {
      setEmail("jordan@bank.com");
      setPassword("password123");
    } else if (type === "admin") {
      setEmail("admin@bank.com");
      setPassword("admin123");
    }
  }

  return (
    <Card className="w-full max-w-md shadow-sm border-border bg-card">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
          <Landmark className="h-5 w-5" />
        </div>
        <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
          Sign In to Mini Bank
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Enter your credentials to access your account & balance
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Quick Demo Fill Bar */}
        <div className="mb-5 rounded-lg border border-border bg-muted/40 p-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Instant Demo Fill:
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fillDemo("alex")}
              className="h-7 text-xs px-2.5 bg-background border-border hover:bg-muted font-mono"
            >
              <UserCheck className="mr-1 h-3 w-3" /> Alex (User)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fillDemo("jordan")}
              className="h-7 text-xs px-2.5 bg-background border-border hover:bg-muted font-mono"
            >
              <UserCheck className="mr-1 h-3 w-3" /> Jordan (User)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fillDemo("admin")}
              className="h-7 text-xs px-2.5 bg-background border-border hover:bg-muted font-mono"
            >
              <Shield className="mr-1 h-3 w-3" /> Admin
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="mb-4 bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs sm:text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g. alex@bank.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 text-sm border-border focus-visible:ring-black dark:focus-visible:ring-white"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs sm:text-sm font-medium">
                Password
              </Label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-10 text-sm border-border focus-visible:ring-black dark:focus-visible:ring-white"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-10 mt-2 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black font-medium"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Signing In...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                Sign In <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col border-t border-border/60 pt-4 pb-4 text-center">
        <p className="text-xs text-muted-foreground">
          Don&apos;t have an account yet?{" "}
          <Link href="/register" className="font-semibold text-foreground underline underline-offset-4">
            Open Account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
        <Suspense fallback={<div className="h-96 w-full max-w-md animate-pulse bg-muted rounded-xl" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
