"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api-client";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  Eye,
  EyeOff,
  Send,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Loader2,
  RefreshCw,
  Wallet,
  ShieldAlert,
  ArrowRightLeft,
  User,
  KeyRound,
  LogOut,
  Save,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { SafeUser, Transaction } from "@/lib/types/bank";
import { cn } from "@/lib/utils";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<SafeUser | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("send");

  // Transfer Form State
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Edit Profile Name State
  const [editName, setEditName] = useState("");
  const [nameLoading, setNameLoading] = useState(false);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Deletion State
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Listen to ?tab= query parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "profile" || tabParam === "activity" || tabParam === "send") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  async function fetchAccountData() {
    try {
      const res = await apiFetch("/api/auth/me");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setUser(data.user);
      setEditName(data.user.name);
      setTransactions(data.transactions || []);
    } catch {
      toast.error("Failed to load account data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAccountData();
  }, []);

  function copyAddress(address?: string) {
    if (!address) return;
    navigator.clipboard.writeText(address);
    toast.success("Account address copied to clipboard!", {
      className: "bg-emerald-50 text-emerald-900 border-emerald-200",
    });
  }

  const currentBalance = user?.account?.balance ?? 0;
  const parsedAmount = parseFloat(amount) || 0;
  const hasInsufficientFunds = parsedAmount > currentBalance;
  const isSuspended = user?.status === "suspended";

  // Pre-flight validation before opening confirmation dialog
  function handleInitiateTransfer(e: React.FormEvent) {
    e.preventDefault();
    setTransferError(null);

    if (isSuspended) {
      setTransferError("Your account is currently suspended. Outgoing transfers are paused.");
      return;
    }

    if (!recipientAddress.trim()) {
      setTransferError("Please enter a valid recipient account address.");
      return;
    }

    if (recipientAddress.trim().toUpperCase() === user?.account?.accountAddress.toUpperCase()) {
      setTransferError("You cannot transfer money to your own account address.");
      return;
    }

    if (parsedAmount <= 0) {
      setTransferError("Please enter an amount greater than $0.00.");
      return;
    }

    if (hasInsufficientFunds) {
      setTransferError(`Insufficient funds. Your available balance is $${currentBalance.toFixed(2)}.`);
      return;
    }

    // Open confirmation dialog
    setIsConfirmOpen(true);
  }

  async function handleConfirmTransfer() {
    setIsConfirmOpen(false);
    setTransferLoading(true);
    setTransferError(null);

    try {
      const res = await apiFetch("/api/transfer", {
        method: "POST",
        body: JSON.stringify({
          recipientAddress: recipientAddress.trim(),
          amount: parsedAmount,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTransferError(data.error || "Transfer failed. Please verify the recipient address.");
        toast.error(data.error || "Transfer failed", {
          className: "bg-rose-50 text-rose-900 border-rose-200",
        });
        return;
      }

      toast.success(`Successfully sent $${parsedAmount.toFixed(2)} to ${recipientAddress.toUpperCase()}`, {
        className: "bg-emerald-50 text-emerald-900 border-emerald-200",
      });

      // Reset form
      setRecipientAddress("");
      setAmount("");
      setNote("");

      // Refresh balance & ledger
      await fetchAccountData();
    } catch {
      setTransferError("A network error occurred. Please try again.");
    } finally {
      setTransferLoading(false);
    }
  }

  // Update Profile Name
  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error("Profile name cannot be empty", {
        className: "bg-rose-50 text-rose-900 border-rose-200",
      });
      return;
    }

    setNameLoading(true);
    try {
      const res = await apiFetch("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: editName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update profile name", {
          className: "bg-rose-50 text-rose-900 border-rose-200",
        });
        return;
      }

      setUser(data.user);
      toast.success("Profile name updated successfully!", {
        className: "bg-emerald-50 text-emerald-900 border-emerald-200",
      });
    } catch {
      toast.error("Network error while updating profile");
    } finally {
      setNameLoading(false);
    }
  }

  // Change Password
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await apiFetch("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || "Failed to change password.");
        toast.error(data.error || "Failed to change password", {
          className: "bg-rose-50 text-rose-900 border-rose-200",
        });
        return;
      }

      toast.success("Password changed successfully!", {
        className: "bg-emerald-50 text-emerald-900 border-emerald-200",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError("Network error while updating password.");
    } finally {
      setPasswordLoading(false);
    }
  }

  // Logout
  async function handleLogout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out successfully", {
        className: "bg-emerald-50 text-emerald-900 border-emerald-200",
      });
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Error signing out");
    }
  }

  // Delete Account
  async function handleDeleteAccount() {
    setDeleteLoading(true);
    try {
      const res = await apiFetch("/api/user/delete", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete account", {
          className: "bg-rose-50 text-rose-900 border-rose-200",
        });
        return;
      }

      toast.warning("Your profile and account have been permanently deleted.", {
        className: "bg-amber-50 text-amber-900 border-amber-200",
      });

      router.push("/");
      router.refresh();
    } catch {
      toast.error("Network error while deleting account.");
    } finally {
      setDeleteLoading(false);
    }
  }

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

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-black selection:text-white">
      <Navbar initialUser={user} />

      <main className="flex-1 container mx-auto max-w-4xl px-4 py-6 sm:py-8 sm:px-6">
        {/* Suspended Alert Banner */}
        {isSuspended && (
          <Alert className="mb-6 bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-sm font-semibold">Account Suspended</AlertTitle>
            <AlertDescription className="text-xs">
              Your account has been placed on administrative hold. You can review your balance and transaction history, but outgoing money transfers are disabled. Please contact the administrator.
            </AlertDescription>
          </Alert>
        )}

        {/* Primary Account Card (Mobile-First) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2 border-border shadow-sm bg-card overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between">
              <div>
                <CardDescription className="text-xs font-mono uppercase tracking-wider">
                  Available Balance
                </CardDescription>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl sm:text-4xl font-extrabold tracking-tight font-mono">
                    {showBalance ? `$${currentBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "••••••••"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowBalance(!showBalance)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    title={showBalance ? "Hide Balance" : "Show Balance"}
                  >
                    {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="text-right">
                <Badge
                  variant="outline"
                  className={`text-xs capitalize font-medium ${
                    user?.status === "active"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                  }`}
                >
                  {user?.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 p-3">
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Your Account Address
                  </span>
                  <span className="text-sm sm:text-base font-mono font-bold text-foreground">
                    {user?.account?.accountAddress}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyAddress(user?.account?.accountAddress)}
                  className="h-8 text-xs gap-1.5 border-border bg-background hover:bg-muted"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Address
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Share this address with other Mini Bank users to receive peer-to-peer transfers.
              </p>
            </CardContent>
          </Card>

          {/* Quick Profile Summary */}
          <Card className="border-border shadow-sm bg-card flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Account Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Account Holder</span>
                <span className="font-semibold text-foreground">{user?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Email</span>
                <span className="font-semibold text-foreground truncate max-w-[140px]">{user?.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Currency</span>
                <span className="font-mono font-semibold text-foreground">{user?.account?.currency || "USD"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Status</span>
                <span className="capitalize font-semibold">{user?.status}</span>
              </div>
            </CardContent>
            <CardFooter className="pt-2 pb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("profile")}
                className="w-full text-xs text-muted-foreground hover:text-foreground h-8 gap-1.5"
              >
                <User className="h-3.5 w-3.5" /> Manage Profile & Settings
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Dashboard Tabs: Send Money vs. Transactions vs. Profile */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted p-1 border border-border">
            <TabsTrigger value="send" className="text-xs sm:text-sm font-medium">
              Send Money
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs sm:text-sm font-medium">
              Activity ({transactions.length})
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Profile
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: SEND MONEY */}
          <TabsContent value="send" className="space-y-4">
            <Card className="border-border shadow-sm bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Send className="h-4 w-4" /> Send Money to Another Address
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Transfers are settled immediately with real-time balance checks.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {transferError && (
                  <Alert className="mb-4 bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300">
                    <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    <AlertDescription className="text-xs font-medium">{transferError}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleInitiateTransfer} className="space-y-4">
                  {/* Recipient Address */}
                  <div className="space-y-1.5">
                    <Label htmlFor="recipientAddress" className="text-xs sm:text-sm font-medium">
                      Recipient Account Address
                    </Label>
                    <Input
                      id="recipientAddress"
                      type="text"
                      placeholder="ACCT-XXXX-XXXX"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value.toUpperCase())}
                      required
                      className="font-mono uppercase text-sm h-10 border-border"
                      disabled={isSuspended || transferLoading}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Format: <code className="font-mono">ACCT-1234-5678</code>
                    </p>
                  </div>

                  {/* Transfer Amount with Sufficiency check */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="amount" className="text-xs sm:text-sm font-medium">
                        Amount (USD)
                      </Label>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        Available: ${currentBalance.toFixed(2)}
                      </span>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground font-bold text-sm">
                        $
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className={`pl-7 font-mono text-base h-10 border-border ${
                          hasInsufficientFunds ? "border-rose-400 focus-visible:ring-rose-400 text-rose-700" : ""
                        }`}
                        disabled={isSuspended || transferLoading}
                      />
                    </div>

                    {/* Insufficient Funds Live Alert */}
                    {hasInsufficientFunds && (
                      <div className="p-2 rounded border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-1.5 mt-1 font-medium">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                        <span>Insufficient funds. You cannot send more than your current balance (${currentBalance.toFixed(2)}).</span>
                      </div>
                    )}

                    {/* Quick amount chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[10, 25, 50, 100, 250].map((val) => (
                        <Button
                          key={val}
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSuspended || val > currentBalance}
                          onClick={() => setAmount(val.toString())}
                          className="h-7 text-xs px-2 font-mono bg-background hover:bg-muted"
                        >
                          ${val}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSuspended || currentBalance <= 0}
                        onClick={() => setAmount(currentBalance.toFixed(2))}
                        className="h-7 text-xs px-2.5 font-mono font-semibold bg-background hover:bg-muted"
                      >
                        All (${currentBalance.toFixed(2)})
                      </Button>
                    </div>
                  </div>

                  {/* Transfer Note */}
                  <div className="space-y-1.5">
                    <Label htmlFor="note" className="text-xs sm:text-sm font-medium">
                      Memo / Note (Optional)
                    </Label>
                    <Input
                      id="note"
                      type="text"
                      placeholder="e.g. Rent, coffee, split bill"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={60}
                      className="text-sm h-10 border-border"
                      disabled={isSuspended || transferLoading}
                    />
                  </div>

                  {/* Submit Action */}
                  <Button
                    type="submit"
                    disabled={isSuspended || hasInsufficientFunds || parsedAmount <= 0 || !recipientAddress.trim() || transferLoading}
                    className="w-full h-11 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black font-semibold text-sm"
                  >
                    {transferLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Processing Transfer...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Review & Send Funds <ArrowUpRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Transfer Confirmation AlertDialog */}
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
              <AlertDialogContent className="font-sans">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-lg font-bold">
                    Confirm Money Transfer
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-xs sm:text-sm">
                    Please review the transfer details before executing this transaction.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="my-3 space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recipient Address:</span>
                    <span className="font-bold text-foreground">{recipientAddress.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transfer Amount:</span>
                    <span className="font-bold text-foreground text-sm">${parsedAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transfer Fee:</span>
                    <span className="text-emerald-700 font-semibold">$0.00 (Free)</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="text-muted-foreground">Remaining Balance:</span>
                    <span className="font-bold text-foreground">
                      ${Math.max(0, currentBalance - parsedAmount).toFixed(2)}
                    </span>
                  </div>
                  {note && (
                    <div className="flex justify-between border-t border-border/50 pt-1 text-[11px]">
                      <span className="text-muted-foreground">Note:</span>
                      <span className="italic text-foreground">{note}</span>
                    </div>
                  )}
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel className="text-xs h-9">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleConfirmTransfer}
                    className="text-xs h-9 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black font-semibold"
                  >
                    Confirm & Transfer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* TAB 2: ACTIVITY / TRANSACTION HISTORY */}
          <TabsContent value="activity">
            <Card className="border-border shadow-sm bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Transaction History</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Real-time audit ledger for {user?.account?.accountAddress}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAccountData}
                  className="h-8 text-xs gap-1 border-border"
                >
                  <RefreshCw className="h-3 w-3" /> Refresh
                </Button>
              </CardHeader>

              <CardContent>
                {transactions.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <ArrowRightLeft className="mx-auto h-8 w-8 opacity-40 mb-2" />
                    <p className="text-sm font-medium">No transactions recorded yet</p>
                    <p className="text-xs">Your transfers and incoming deposits will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {transactions.map((tx) => {
                      const isIncoming = tx.recipientAddress.toUpperCase() === user?.account?.accountAddress.toUpperCase();
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                                isIncoming
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : "bg-zinc-100 text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100"
                              }`}
                            >
                              {isIncoming ? (
                                <ArrowDownLeft className="h-4 w-4" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4" />
                              )}
                            </div>

                            <div className="flex flex-col">
                              <span className="text-xs sm:text-sm font-semibold text-foreground">
                                {isIncoming ? `Received from ${tx.senderName}` : `Sent to ${tx.recipientName}`}
                              </span>
                              <span className="text-[11px] font-mono text-muted-foreground">
                                {isIncoming ? tx.senderAddress : tx.recipientAddress}
                              </span>
                              {tx.note && (
                                <span className="text-[11px] text-muted-foreground italic">
                                  &quot;{tx.note}&quot;
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end">
                            <span
                              className={`text-sm sm:text-base font-bold font-mono ${
                                isIncoming ? "text-emerald-700" : "text-foreground"
                              }`}
                            >
                              {isIncoming ? "+" : "-"}${tx.amount.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(tx.timestamp).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: PROFILE TAB (SEE & EDIT NAME, CHANGE PASSWORD, LOGOUT, DELETE PROFILE) */}
          <TabsContent value="profile" className="space-y-6">
            {/* 1. Profile Overview Header */}
            <Card className="border-border shadow-sm bg-card">
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <Avatar className="h-16 w-16 border-2 border-border shadow-sm">
                    <AvatarFallback className="bg-black text-white dark:bg-white dark:text-black text-xl font-bold">
                      {user?.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold text-foreground">{user?.name}</h2>
                      <Badge
                        variant="outline"
                        className={`self-center sm:self-auto text-[10px] capitalize font-medium ${
                          user?.status === "active"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {user?.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <p className="text-xs font-mono font-semibold text-foreground pt-0.5">
                      {user?.account?.accountAddress}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="h-8 text-xs gap-1.5 border-border hover:bg-muted text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 2. Edit Profile Name Card */}
            <Card className="border-border shadow-sm bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <User className="h-4 w-4" /> Edit Profile Name
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Update your display name visible across peer-to-peer transfers and receipts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateName} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="editName" className="text-xs font-medium">
                      Full Legal Name
                    </Label>
                    <Input
                      id="editName"
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      className="text-sm h-10 border-border max-w-md"
                      disabled={nameLoading}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={nameLoading || !editName.trim() || editName.trim() === user?.name}
                    className="h-9 text-xs bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black font-semibold"
                  >
                    {nameLoading ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Save className="h-3.5 w-3.5" /> Save Changes
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* 3. Change Password Card */}
            <Card className="border-border shadow-sm bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <KeyRound className="h-4 w-4" /> Change Password
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Ensure your account is protected with a secure password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {passwordError && (
                  <Alert className="mb-4 bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300">
                    <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    <AlertDescription className="text-xs font-medium">{passwordError}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleChangePassword} className="space-y-3.5 max-w-md">
                  <div className="space-y-1.5">
                    <Label htmlFor="currentPassword" className="text-xs font-medium">
                      Current Password
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="text-sm h-10 border-border"
                      disabled={passwordLoading}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword" className="text-xs font-medium">
                      New Password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="text-sm h-10 border-border"
                      disabled={passwordLoading}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-xs font-medium">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="text-sm h-10 border-border"
                      disabled={passwordLoading}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                    className="h-9 text-xs bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black font-semibold"
                  >
                    {passwordLoading ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating...
                      </span>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* 4. Danger Zone (Delete Profile & Account) */}
            <Card className="border-rose-200 bg-rose-50/40 dark:bg-rose-950/20 dark:border-rose-900 shadow-none">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-400">
                  <ShieldAlert className="h-5 w-5" />
                  <CardTitle className="text-base font-bold">Delete Profile & Account</CardTitle>
                </div>
                <CardDescription className="text-xs text-rose-900/80 dark:text-rose-300/80">
                  Permanent actions regarding your bank membership, credentials, and balance.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-2 pb-4">
                <p className="text-xs text-rose-900/90 dark:text-rose-300/90 leading-relaxed mb-4">
                  Deleting your profile will permanently wipe your login credentials, revoke your account address (<code>{user?.account?.accountAddress}</code>), and forfeit any remaining balance (${currentBalance.toFixed(2)}). This action cannot be reversed.
                </p>

                <AlertDialog>
                  <AlertDialogTrigger
                    className={cn(
                      buttonVariants({ variant: "destructive" }),
                      "h-9 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                    )}
                    disabled={deleteLoading}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete My Profile
                  </AlertDialogTrigger>
                  <AlertDialogContent className="font-sans">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-rose-700 font-bold">
                        Permanently Delete Your Profile?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-xs sm:text-sm">
                        Are you completely certain? This will immediately terminate your account, wipe all security credentials, and forfeit your remaining balance of <strong>${currentBalance.toFixed(2)}</strong>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="text-xs h-9">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="text-xs h-9 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                      >
                        Yes, Permanently Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function UserDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background font-sans">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
