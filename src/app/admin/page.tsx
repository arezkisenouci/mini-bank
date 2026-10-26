"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api-client";
import {
  Shield,
  Users,
  Coins,
  Search,
  MoreVertical,
  PlusCircle,
  Ban,
  CheckCircle2,
  Trash2,
  Copy,
  RefreshCw,
  Loader2,
  ArrowRightLeft,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { SafeUser, Transaction } from "@/lib/types/bank";
import { cn } from "@/lib/utils";

interface AdminMetrics {
  totalUsers: number;
  totalLiquidity: number;
  activeUsersCount: number;
  suspendedUsersCount: number;
}

export default function AdminPage() {
  const router = useRouter();

  const [users, setUsers] = useState<SafeUser[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [notAdmin, setNotAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Deposit Dialog State
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);

  // Status Toggle State
  const [statusConfirmUser, setStatusConfirmUser] = useState<SafeUser | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Delete User State
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<SafeUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function fetchAdminData() {
    try {
      const res = await apiFetch("/api/admin/users");
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          setNotAdmin(true);
          setLoading(false);
          return;
        }
        throw new Error("Failed to load admin data");
      }

      const data = await res.json();
      setUsers(data.users || []);
      setTransactions(data.transactions || []);
      setMetrics(data.metrics || null);
      setNotAdmin(false);
    } catch {
      toast.error("Failed to load administration data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function handleQuickAdminLogin() {
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "admin@bank.com", password: "admin123" }),
      });
      if (res.ok) {
        toast.success("Authenticated as Administrator", {
          className: "bg-emerald-50 text-emerald-900 border-emerald-200",
        });
        await fetchAdminData();
      } else {
        toast.error("Failed to sign in as admin");
      }
    } catch {
      toast.error("Error signing in as admin");
    } finally {
      setLoading(false);
    }
  }

  function copyAddress(address?: string) {
    if (!address) return;
    navigator.clipboard.writeText(address);
    toast.success("Account address copied to clipboard", {
      className: "bg-emerald-50 text-emerald-900 border-emerald-200",
    });
  }

  function openDepositModal(user: SafeUser) {
    setSelectedUser(user);
    setDepositAmount("100");
    setDepositNote("Admin Liquidity Credit");
    setIsDepositOpen(true);
  }

  // Handle Deposit Execution
  async function handleExecuteDeposit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser?.account?.accountAddress) return;

    const amountNum = parseFloat(depositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid deposit amount greater than $0.00", {
        className: "bg-rose-50 text-rose-900 border-rose-200",
      });
      return;
    }

    setDepositLoading(true);
    try {
      const res = await apiFetch("/api/admin/deposit", {
        method: "POST",
        body: JSON.stringify({
          targetAddress: selectedUser.account.accountAddress,
          amount: amountNum,
          note: depositNote.trim() || "Administrative Deposit",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Deposit failed", {
          className: "bg-rose-50 text-rose-900 border-rose-200",
        });
        return;
      }

      toast.success(
        `Deposited $${amountNum.toFixed(2)} into ${selectedUser.name}'s account (${selectedUser.account.accountAddress})`,
        { className: "bg-emerald-50 text-emerald-900 border-emerald-200" }
      );

      setIsDepositOpen(false);
      setDepositAmount("");
      setDepositNote("");
      setSelectedUser(null);
      await fetchAdminData();
    } catch {
      toast.error("Network error during deposit");
    } finally {
      setDepositLoading(false);
    }
  }

  // Handle Status Toggle (Suspend / Reactivate)
  async function handleToggleStatus() {
    if (!statusConfirmUser) return;
    const nextStatus = statusConfirmUser.status === "active" ? "suspended" : "active";

    setStatusLoading(true);
    try {
      const res = await apiFetch("/api/admin/status", {
        method: "POST",
        body: JSON.stringify({
          userId: statusConfirmUser.id,
          status: nextStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update status", {
          className: "bg-rose-50 text-rose-900 border-rose-200",
        });
        return;
      }

      if (nextStatus === "suspended") {
        toast.warning(`Account for ${statusConfirmUser.name} has been suspended.`, {
          className: "bg-amber-50 text-amber-900 border-amber-200",
        });
      } else {
        toast.success(`Account for ${statusConfirmUser.name} is now active.`, {
          className: "bg-emerald-50 text-emerald-900 border-emerald-200",
        });
      }

      setStatusConfirmUser(null);
      await fetchAdminData();
    } catch {
      toast.error("Network error updating status");
    } finally {
      setStatusLoading(false);
    }
  }

  // Handle Delete User
  async function handleDeleteUser() {
    if (!deleteConfirmUser) return;

    setDeleteLoading(true);
    try {
      const res = await apiFetch("/api/admin/delete", {
        method: "POST",
        body: JSON.stringify({ userId: deleteConfirmUser.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete user", {
          className: "bg-rose-50 text-rose-900 border-rose-200",
        });
        return;
      }

      toast.warning(`User ${deleteConfirmUser.name} and their account were deleted permanently.`, {
        className: "bg-amber-50 text-amber-900 border-amber-200",
      });

      setDeleteConfirmUser(null);
      await fetchAdminData();
    } catch {
      toast.error("Network error deleting user");
    } finally {
      setDeleteLoading(false);
    }
  }

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase().trim();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.account?.accountAddress && u.account.accountAddress.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (notAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-border bg-card text-center p-6 shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black">
              <Shield className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">Admin Authorization Required</CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1.5 text-muted-foreground">
              You must be signed in with administrator privileges to manage accounts and deposit liquidity.
            </CardDescription>
            <div className="mt-6 flex flex-col gap-2.5">
              <Button
                onClick={handleQuickAdminLogin}
                className="w-full bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black font-semibold h-10 text-xs sm:text-sm"
              >
                Sign In as Administrator (1-Click)
              </Button>
              <Link
                href="/login"
                className={cn(buttonVariants({ variant: "outline" }), "w-full h-10 text-xs border-border flex items-center justify-center")}
              >
                Go to Login Page
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-black selection:text-white">
      <Navbar />

      <main className="flex-1 container mx-auto max-w-5xl px-4 py-6 sm:py-8 sm:px-6">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center">
                <Shield className="h-4 w-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Admin Governance & Accounts</h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Inspect all bank accounts, inject direct deposits, and control user access states.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAdminData}
              className="h-8 text-xs gap-1.5 border-border hover:bg-muted"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh Accounts
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mb-8">
          <Card className="border-border shadow-sm bg-card">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total System Liquidity
              </CardDescription>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold font-mono">
                ${metrics?.totalLiquidity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-[11px] text-muted-foreground">Total money deposited across all accounts</span>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm bg-card">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Customer Accounts
              </CardDescription>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold font-mono">
                {metrics?.totalUsers}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                  <CheckCircle2 className="h-3 w-3" /> {metrics?.activeUsersCount} Active
                </span>
                <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                  <AlertTriangle className="h-3 w-3" /> {metrics?.suspendedUsersCount} Suspended
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm bg-card">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ledger Entries
              </CardDescription>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold font-mono">
                {transactions.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-[11px] text-muted-foreground">Peer-to-peer transfers & admin deposits</span>
            </CardContent>
          </Card>
        </div>

        {/* Administration Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full sm:w-80 grid-cols-2 bg-muted p-1 border border-border">
            <TabsTrigger value="users" className="text-xs sm:text-sm font-medium">
              Accounts ({users.length})
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs sm:text-sm font-medium">
              System Audit Log
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: USERS & ACCOUNTS */}
          <TabsContent value="users" className="space-y-4">
            {/* Search Bar & Quick Count */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by account address, user name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 text-sm border-border bg-card"
                />
              </div>
              <span className="text-xs text-muted-foreground self-start sm:self-auto">
                Showing {filteredUsers.length} of {users.length} registered accounts
              </span>
            </div>

            {/* Mobile View: High-Density Account Cards */}
            <div className="grid grid-cols-1 gap-3.5 md:hidden">
              {filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground border rounded-xl bg-card">
                  No accounts found matching &quot;{searchTerm}&quot;.
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isAdmin = u.role === "admin";
                  return (
                    <Card key={u.id} className="border-border shadow-sm bg-card p-4">
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm sm:text-base text-foreground">{u.name}</span>
                            {isAdmin && (
                              <Badge variant="outline" className="text-[9px] font-mono uppercase bg-muted">
                                Admin
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{u.email}</span>
                        </div>

                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize font-medium ${
                            u.status === "active"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {u.status}
                        </Badge>
                      </div>

                      {/* Account Address & Balance Row */}
                      <div className="mt-3.5 rounded-lg border border-border bg-muted/30 p-2.5 flex items-center justify-between text-xs">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                            Account Address
                          </span>
                          <span className="font-mono font-bold text-xs text-foreground flex items-center gap-1.5 mt-0.5">
                            {u.account?.accountAddress || "—"}
                            {u.account?.accountAddress && (
                              <button
                                type="button"
                                onClick={() => copyAddress(u.account?.accountAddress)}
                                className="text-muted-foreground hover:text-foreground p-0.5"
                                title="Copy Address"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </span>
                        </div>

                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                            Balance
                          </span>
                          <span className="font-mono font-extrabold text-sm text-foreground mt-0.5">
                            ${u.account?.balance.toFixed(2) || "0.00"}
                          </span>
                        </div>
                      </div>

                      {/* Prominent Action Bar for Admin */}
                      {!isAdmin && (
                        <div className="mt-3.5 flex flex-col gap-2 border-t border-border/60 pt-3">
                          {/* PRIMARY ACTION: ADD MONEY */}
                          <Button
                            onClick={() => openDepositModal(u)}
                            className="w-full h-9 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black font-semibold text-xs flex items-center justify-center gap-1.5"
                          >
                            <PlusCircle className="h-4 w-4" />
                            Add Money to Account
                          </Button>

                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setStatusConfirmUser(u)}
                              className="h-8 text-[11px] font-medium border-border hover:bg-muted"
                            >
                              <Ban className="h-3 w-3 mr-1 text-amber-600" />
                              {u.status === "active" ? "Suspend Access" : "Reactivate"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirmUser(u)}
                              className="h-8 text-[11px] font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                            >
                              <Trash2 className="h-3 w-3 mr-1" /> Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>

            {/* Desktop View: Full shadcn Table with Prominent Add Money Button */}
            <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent bg-muted/30">
                    <TableHead className="text-xs uppercase font-semibold">Account Holder & Email</TableHead>
                    <TableHead className="text-xs uppercase font-semibold">Account Address</TableHead>
                    <TableHead className="text-xs uppercase font-semibold">Status</TableHead>
                    <TableHead className="text-xs uppercase font-semibold text-right">Available Balance</TableHead>
                    <TableHead className="text-xs uppercase font-semibold text-right">Admin Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-xs text-muted-foreground">
                        No matching accounts found for &quot;{searchTerm}&quot;.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => {
                      const isAdmin = u.role === "admin";
                      return (
                        <TableRow key={u.id} className="border-border hover:bg-muted/30 transition-colors">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                {u.name}
                                {isAdmin && (
                                  <Badge variant="outline" className="text-[9px] font-mono uppercase bg-muted">
                                    Admin
                                  </Badge>
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground">{u.email}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-foreground">
                                {u.account?.accountAddress || "—"}
                              </span>
                              {u.account?.accountAddress && (
                                <button
                                  type="button"
                                  onClick={() => copyAddress(u.account?.accountAddress)}
                                  className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
                                  title="Copy Address"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] capitalize font-medium ${
                                u.status === "active"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {u.status}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right font-mono font-extrabold text-sm text-foreground">
                            ${u.account?.balance.toFixed(2) || "0.00"}
                          </TableCell>

                          <TableCell className="text-right">
                            {isAdmin ? (
                              <span className="text-xs text-muted-foreground italic pr-2">Protected System Account</span>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                {/* DIRECT PROMINENT ADD MONEY BUTTON */}
                                <Button
                                  size="sm"
                                  onClick={() => openDepositModal(u)}
                                  className="h-8 text-xs px-3 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black font-semibold gap-1.5"
                                >
                                  <PlusCircle className="h-3.5 w-3.5" />
                                  Add Money
                                </Button>

                                {/* Additional Actions Dropdown */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer outline-none">
                                    <MoreVertical className="h-4 w-4" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="font-sans w-48">
                                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                                      Account Governance
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => openDepositModal(u)}
                                      className="cursor-pointer text-xs"
                                    >
                                      <PlusCircle className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                                      Deposit Money
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => setStatusConfirmUser(u)}
                                      className="cursor-pointer text-xs"
                                    >
                                      <Ban className="mr-2 h-3.5 w-3.5 text-amber-600" />
                                      {u.status === "active" ? "Suspend Account" : "Reactivate Account"}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => setDeleteConfirmUser(u)}
                                      className="cursor-pointer text-xs text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                                    >
                                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                                      Delete Account
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* TAB 2: SYSTEM AUDIT LOG */}
          <TabsContent value="audit">
            <Card className="border-border shadow-sm bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">System Transaction Ledger</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Complete chronological history of all deposits and user transfers.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    No transactions recorded on the system yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between rounded-lg border border-border p-3 text-xs font-sans hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            tx.type === "deposit"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-muted text-foreground border border-border"
                          }`}>
                            {tx.type === "deposit" ? "DEP" : "P2P"}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-xs sm:text-sm">
                              {tx.senderName} ➔ {tx.recipientName}
                            </p>
                            <p className="font-mono text-[11px] text-muted-foreground">
                              {tx.senderAddress} ➔ {tx.recipientAddress}
                            </p>
                            {tx.note && (
                              <p className="italic text-[10px] text-muted-foreground mt-0.5">&quot;{tx.note}&quot;</p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end">
                          <span className={`font-mono font-bold text-sm ${
                            tx.type === "deposit" ? "text-emerald-700 font-extrabold" : "text-foreground"
                          }`}>
                            +${tx.amount.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(tx.timestamp).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* MODAL: ADMIN DEPOSIT DIALOG */}
        <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
          <DialogContent className="font-sans max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center">
                  <DollarSign className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">Add Money to Account</DialogTitle>
                  <DialogDescription className="text-xs">
                    Inject funds directly into this customer&apos;s account address.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleExecuteDeposit} className="space-y-4 my-2">
              {/* Account Card Preview */}
              <div className="rounded-lg border border-border bg-muted/40 p-3.5 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Holder:</span>
                  <span className="font-bold text-foreground">{selectedUser?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Address:</span>
                  <span className="font-bold text-foreground">{selectedUser?.account?.accountAddress}</span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-2">
                  <span className="text-muted-foreground">Current Balance:</span>
                  <span className="font-bold text-foreground">
                    ${selectedUser?.account?.balance.toFixed(2)}
                  </span>
                </div>
                {parseFloat(depositAmount) > 0 && (
                  <div className="flex justify-between border-t border-emerald-200 bg-emerald-50/60 p-1.5 rounded text-emerald-900 font-bold">
                    <span>New Balance After Deposit:</span>
                    <span>
                      ${((selectedUser?.account?.balance || 0) + parseFloat(depositAmount)).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Deposit Amount Input */}
              <div className="space-y-1.5">
                <Label htmlFor="depositAmount" className="text-xs font-semibold">
                  Deposit Amount (USD)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground font-bold text-sm">$</span>
                  <Input
                    id="depositAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="100.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    required
                    className="pl-7 font-mono text-base h-10 border-border"
                    disabled={depositLoading}
                  />
                </div>

                {/* Quick Add Amount Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[50, 100, 250, 500, 1000, 5000].map((v) => (
                    <Button
                      key={v}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDepositAmount(v.toString())}
                      className="h-7 text-xs px-2.5 font-mono bg-background hover:bg-muted"
                    >
                      +${v}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Deposit Memo */}
              <div className="space-y-1.5">
                <Label htmlFor="depositNote" className="text-xs font-semibold">
                  Memo / Reference Note
                </Label>
                <Input
                  id="depositNote"
                  type="text"
                  placeholder="e.g. Account bonus, payroll credit, cash deposit"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  className="text-xs h-10 border-border"
                  disabled={depositLoading}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDepositOpen(false)}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={depositLoading || !depositAmount || parseFloat(depositAmount) <= 0}
                  className="h-9 text-xs bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black font-semibold"
                >
                  {depositLoading ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing Deposit...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <PlusCircle className="h-3.5 w-3.5" /> Execute Deposit
                    </span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* MODAL 2: STATUS TOGGLE CONFIRMATION */}
        <AlertDialog open={!!statusConfirmUser} onOpenChange={(open) => !open && setStatusConfirmUser(null)}>
          <AlertDialogContent className="font-sans">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base font-bold">
                {statusConfirmUser?.status === "active" ? "Suspend Account Access?" : "Reactivate Account Access?"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs leading-relaxed">
                {statusConfirmUser?.status === "active" ? (
                  <span>
                    Suspending <strong>{statusConfirmUser?.name}</strong> ({statusConfirmUser?.account?.accountAddress}) will immediately freeze their outgoing peer-to-peer transfers and alert them on sign-in.
                  </span>
                ) : (
                  <span>
                    Reactivating <strong>{statusConfirmUser?.name}</strong> ({statusConfirmUser?.account?.accountAddress}) will restore their ability to transfer money.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-xs h-9">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleToggleStatus}
                className="text-xs h-9 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black font-semibold"
              >
                {statusConfirmUser?.status === "active" ? "Confirm Suspension" : "Confirm Activation"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* MODAL 3: DELETE USER CONFIRMATION */}
        <AlertDialog open={!!deleteConfirmUser} onOpenChange={(open) => !open && setDeleteConfirmUser(null)}>
          <AlertDialogContent className="font-sans">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-rose-700 font-bold">
                Permanently Delete User Account?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs leading-relaxed">
                Are you sure you want to permanently delete <strong>{deleteConfirmUser?.name}</strong> ({deleteConfirmUser?.account?.accountAddress})? All account records and remaining balance of <strong>${deleteConfirmUser?.account?.balance.toFixed(2)}</strong> will be wiped permanently.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-xs h-9">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                className="text-xs h-9 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                Yes, Delete User Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
