"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Landmark, User, ShieldCheck, LogOut, ArrowRightLeft, Send, History, Settings } from "lucide-react";
import { toast } from "sonner";
import { SafeUser } from "@/lib/types/bank";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";

interface NavbarProps {
  initialUser?: SafeUser | null;
}

export function Navbar({ initialUser }: NavbarProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(initialUser ?? null);
  const [loading, setLoading] = useState(!initialUser);

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await apiFetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      } catch {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadMe();
  }, []);

  async function handleLogout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      toast.success("Signed out successfully", {
        className: "bg-emerald-50 text-emerald-900 border-emerald-200",
      });
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to sign out", {
        className: "bg-rose-50 text-rose-900 border-rose-200",
      });
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/95 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black font-semibold shadow-sm transition-transform group-hover:scale-105">
            <Landmark className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-base sm:text-lg leading-tight">
              MINI<span className="text-muted-foreground font-light ml-1">BANK</span>
            </span>
            <span className="text-[10px] text-muted-foreground tracking-widest uppercase">
              Monochrome P2P
            </span>
          </div>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          ) : currentUser ? (
            <div className="flex items-center gap-2 sm:gap-4">
              {currentUser.role === "admin" ? (
                <Link href="/admin">
                  <Badge variant="outline" className="hidden sm:inline-flex gap-1.5 py-1 px-2.5 font-mono text-xs border-black dark:border-white cursor-pointer hover:bg-muted">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Admin Suite
                  </Badge>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <Badge variant="outline" className="hidden sm:inline-flex gap-1.5 py-1 px-2.5 font-mono text-xs cursor-pointer hover:bg-muted">
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    {currentUser.account?.accountAddress}
                  </Badge>
                </Link>
              )}

              {/* User Dropdown / Profile Icon */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="relative h-9 w-9 rounded-full ring-1 ring-border p-0 hover:bg-muted flex items-center justify-center cursor-pointer outline-none transition-transform active:scale-95"
                  title="Open Profile & Settings"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-black text-white dark:bg-white dark:text-black text-xs font-semibold">
                      {currentUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 font-sans shadow-lg">
                  <DropdownMenuLabel className="font-normal pb-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold leading-none text-foreground">{currentUser.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                      <div className="flex items-center gap-1.5 pt-1">
                        <span
                          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                            currentUser.status === "active"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {currentUser.status.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {currentUser.account?.accountAddress}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  {/* Profile Tab Link */}
                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard?tab=profile")}
                    className="cursor-pointer flex items-center text-xs font-semibold"
                  >
                    <User className="mr-2 h-4 w-4 text-foreground" />
                    Profile & Settings
                  </DropdownMenuItem>

                  {currentUser.role === "admin" ? (
                    <DropdownMenuItem
                      onClick={() => router.push("/admin")}
                      className="cursor-pointer flex items-center text-xs"
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem
                        onClick={() => router.push("/dashboard?tab=send")}
                        className="cursor-pointer flex items-center text-xs"
                      >
                        <Send className="mr-2 h-4 w-4 text-muted-foreground" />
                        Send Money
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push("/dashboard?tab=activity")}
                        className="cursor-pointer flex items-center text-xs"
                      >
                        <History className="mr-2 h-4 w-4 text-muted-foreground" />
                        Activity History
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-xs text-rose-600 focus:text-rose-600 focus:bg-rose-50 font-medium"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-xs sm:text-sm font-medium"
                )}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "text-xs sm:text-sm bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black"
                )}
              >
                Open Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
