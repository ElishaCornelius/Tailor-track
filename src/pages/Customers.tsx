import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Search, Users, MoreVertical, Eye, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PasswordConfirmDialog from "@/components/PasswordConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CustomerRow {
  id: string;
  name: string;
  phone: string | null;
  total_spent: number | null;
  total_jobs: number | null;
  created_at: string;
}

interface CustomerJob {
  code: string;
  description: string;
  price: number;
  amount_paid: number;
  outstanding_amount: number;
  status: string;
  created_at: string;
}

const money = (n: number) => `₦${Number(n || 0).toLocaleString()}`;

const Customers = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<CustomerRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailJobs, setDetailJobs] = useState<CustomerJob[]>([]);
  const [hasPortal, setHasPortal] = useState<boolean | null>(null);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [newPasscode, setNewPasscode] = useState("");
  const [savingPasscode, setSavingPasscode] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/admin/login");
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone, total_spent, total_jobs, created_at")
        .order("name");
      if (error) {
        console.error(error);
        toast.error("Could not load customers");
      } else {
        setCustomers((data ?? []) as CustomerRow[]);
      }
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    const digits = q.replace(/\D/g, "");
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (digits && (c.phone ?? "").replace(/\D/g, "").includes(digits))
    );
  }, [customers, query]);

  const openDetails = async (c: CustomerRow) => {
    setSelected(c);
    setDetailOpen(true);
    setDetailJobs([]);
    setHasPortal(null);

    const { data: jobs } = await supabase
      .from("jobs")
      .select("code, description, price, amount_paid, outstanding_amount, status, created_at")
      .eq("customer_id", c.id)
      .order("created_at", { ascending: false });
    setDetailJobs((jobs ?? []) as CustomerJob[]);

    if (c.phone) {
      const { data: exists } = await supabase.rpc("customer_account_exists", { p_phone: c.phone });
      setHasPortal(Boolean(exists));
    } else {
      setHasPortal(false);
    }
  };

  const outstanding = detailJobs.reduce((s, j) => s + Number(j.outstanding_amount ?? 0), 0);

  const submitPasscode = async () => {
    if (!selected) return;
    if (!/^\d{4}$/.test(newPasscode)) {
      toast.error("Passcode must be exactly 4 digits");
      return;
    }
    setSavingPasscode(true);
    const { error } = await supabase.rpc("admin_reset_customer_passcode", {
      p_customer_id: selected.id,
      p_passcode: newPasscode,
    });
    setSavingPasscode(false);
    if (error) {
      toast.error(error.message || "Could not set a new passcode");
      return;
    }
    toast.success(`New passcode set for ${selected.name}`);
    setResetOpen(false);
    setNewPasscode("");
    setHasPortal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link to="/admin/dashboard" className="inline-flex items-center text-sm hover:text-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">
            {customers.length} customer{customers.length === 1 ? "" : "s"} in your database
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or phone number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading customers…</p>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">No customers found</p>
            <p className="text-sm text-muted-foreground">
              {customers.length === 0
                ? "Customers are added automatically when you create a job."
                : "Try a different name or number."}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <Card key={c.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-muted-foreground inline-flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {c.phone || "No phone"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold">{money(c.total_spent ?? 0)}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.total_jobs ?? 0} job{(c.total_jobs ?? 0) === 1 ? "" : "s"}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Options for ${c.name}`}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openDetails(c)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View customer info
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelected(c);
                          setPasswordOpen(true);
                        }}
                      >
                        <KeyRound className="w-4 h-4 mr-2" />
                        Set new portal passcode
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>{selected?.phone || "No phone number on file"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">Jobs</p>
                <p className="font-semibold">{detailJobs.length}</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">Spent</p>
                <p className="font-semibold">{money(selected?.total_spent ?? 0)}</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">Owing</p>
                <p className="font-semibold text-status-red">{money(outstanding)}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <p className="text-sm font-medium">Portal passcode</p>
              <p className="text-xs text-muted-foreground">
                {hasPortal === null
                  ? "Checking…"
                  : hasPortal
                  ? "This customer has a portal account. For their safety, passcodes are stored scrambled and can never be read back — if they forget it, set a new one for them."
                  : "This customer has not created a portal account yet. You can set a passcode for them here."}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setDetailOpen(false);
                  setPasswordOpen(true);
                }}
              >
                <KeyRound className="w-4 h-4 mr-2" />
                Set new passcode
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Job history</p>
              {detailJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No jobs yet.</p>
              ) : (
                detailJobs.map((j) => (
                  <div key={j.code} className="p-3 border rounded-lg text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">{j.code}</span>
                      <span>{new Date(j.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-muted-foreground">{j.description}</p>
                    <p className="text-muted-foreground">
                      {money(j.price)} · paid {money(j.amount_paid)}
                      {Number(j.outstanding_amount) > 0 && (
                        <span className="text-status-red">
                          {" "}
                          · owing {money(j.outstanding_amount)}
                        </span>
                      )}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PasswordConfirmDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        actionLabel={`Set new portal passcode for ${selected?.name ?? ""}`}
        description="Setting a customer's portal passcode requires your admin password."
        onConfirmed={() => setResetOpen(true)}
      />

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New passcode for {selected?.name}</DialogTitle>
            <DialogDescription>
              Choose a 4-digit passcode and share it with the customer. They can change it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-passcode">4-digit passcode</Label>
            <Input
              id="new-passcode"
              inputMode="numeric"
              maxLength={4}
              placeholder="1234"
              value={newPasscode}
              onChange={(e) => setNewPasscode(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitPasscode} disabled={savingPasscode}>
              {savingPasscode ? "Saving..." : "Save passcode"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
