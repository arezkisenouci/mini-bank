import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Shield,
  Zap,
  Lock,
  ArrowRightLeft,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-black selection:text-white">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-14 sm:py-24 border-b border-border/60">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 flex flex-col items-center text-center">
            {/* Pill Announcement */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3.5 py-1 text-xs text-muted-foreground mb-6 transition-all hover:bg-muted">
              <Sparkles className="h-3.5 w-3.5 text-foreground" />
              <span>Version 1.0 • shadcn/ui & Monochrome Design</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15] max-w-2xl">
              Modern Banking. <br />
              <span className="text-muted-foreground font-light">Zero Complexity.</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-sm sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
              Experience instant peer-to-peer transfers with real-time balance sufficiency checks,
              unique account addresses, and comprehensive administrative controls.
            </p>

            {/* CTA Group */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full sm:w-auto px-8 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black cursor-pointer"
                )}
              >
                Open Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full sm:w-auto px-8 border-border cursor-pointer"
                )}
              >
                Sign In
              </Link>
            </div>

            {/* Demo Quick-Access Box */}
            <div className="mt-12 w-full max-w-lg rounded-xl border border-border bg-card p-4 text-left shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                  Quick Demo Access
                </span>
                <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                  Pre-configured Accounts
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Jump right in using one of the pre-seeded testing profiles:
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <Link
                  href="/login?demo=alex"
                  className="p-2.5 rounded-lg border border-border hover:bg-muted/70 transition-colors flex flex-col group"
                >
                  <span className="font-semibold text-foreground group-hover:underline">
                    Alex Rivera (User)
                  </span>
                  <span className="text-[11px] text-muted-foreground">alex@bank.com • $2,450.00</span>
                </Link>
                <Link
                  href="/login?demo=admin"
                  className="p-2.5 rounded-lg border border-border hover:bg-muted/70 transition-colors flex flex-col group"
                >
                  <span className="font-semibold text-foreground group-hover:underline">
                    Admin Portal
                  </span>
                  <span className="text-[11px] text-muted-foreground">admin@bank.com • Gov Suite</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-14 sm:py-20 bg-muted/20 border-b border-border/60">
          <div className="container mx-auto max-w-5xl px-4 sm:px-6">
            <div className="text-center max-w-lg mx-auto mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Core Financial Engine</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Engineered with mobile-first usability and strict transaction safety.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Feature 1 */}
              <Card className="border-border/80 shadow-none bg-card">
                <CardHeader className="pb-3">
                  <div className="h-10 w-10 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mb-2">
                    <ArrowRightLeft className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">Address-Based Transfers</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Send funds directly using formatted account addresses (`ACCT-XXXX-XXXX`) with real-time pre-flight sufficiency verification.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md bg-muted/60 p-2.5 font-mono text-xs flex items-center justify-between">
                    <span className="text-muted-foreground">ACCT-4821-9302</span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200">
                      Verified
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="border-border/80 shadow-none bg-card">
                <CardHeader className="pb-3">
                  <div className="h-10 w-10 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mb-2">
                    <Shield className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">Admin Governance</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Centralized administrator suite to inspect all active accounts, deposit liquidity, toggle suspensions, and manage users.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md bg-muted/60 p-2.5 font-mono text-xs flex items-center justify-between">
                    <span className="text-muted-foreground">System Governance</span>
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-200">
                      Protected
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="border-border/80 shadow-none bg-card">
                <CardHeader className="pb-3">
                  <div className="h-10 w-10 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mb-2">
                    <Lock className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">Account Ownership</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Full user autonomy with secure self-service account deletion, transaction history audit, and hideable balance toggles.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md bg-muted/60 p-2.5 font-mono text-xs flex items-center justify-between">
                    <span className="text-muted-foreground">Self Management</span>
                    <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-800 border-rose-200">
                      Full Control
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Semantic Status Badge Guide */}
        <section className="py-12 border-b border-border/60">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground text-center mb-6">
              Semantic Event Palette
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 flex items-center gap-2.5 text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-semibold">Light Green (Success)</p>
                  <p className="text-[11px] opacity-80">Transfers completed, deposits, active state</p>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 flex items-center gap-2.5 text-xs">
                <Zap className="h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="font-semibold">Light Yellow (Warning)</p>
                  <p className="text-[11px] opacity-80">Suspension alerts, caution prompts</p>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-900 flex items-center gap-2.5 text-xs">
                <Shield className="h-4 w-4 shrink-0 text-rose-600" />
                <div>
                  <p className="font-semibold">Light Red (Error)</p>
                  <p className="text-[11px] opacity-80">Insufficient balance, invalid address, deletion</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border/40 bg-muted/10">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2026 Mini Bank Systems Inc. Clean monochrome mobile-first edition.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">Login</Link>
            <Link href="/register" className="hover:text-foreground">Register</Link>
            <Link href="/admin" className="hover:text-foreground">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
