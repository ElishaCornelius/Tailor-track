import { useEffect, useState } from "react";
import { ArrowLeft, Trophy, TrendingUp, MoreVertical, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PasswordConfirmDialog from "@/components/PasswordConfirmDialog";
import { toast } from "sonner";

interface CustomerRanking {
  id: string;
  name: string;
  phone: string | null;
  totalSpent: number;
  totalJobs: number;
}

const Rankings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCustomer, setPendingCustomer] = useState<CustomerRanking | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/admin/login");
  }, [user, authLoading, navigate]);

  const fetchRankings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("id, name, phone, jobs(price)");

    if (!error && data) {
      const ranked = (data as any[]).map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone ?? null,
        totalJobs: c.jobs?.length ?? 0,
        totalSpent: (c.jobs ?? []).reduce(
          (sum: number, j: { price: number | null }) => sum + Number(j.price ?? 0),
          0
        ),
      }));
      setCustomers(ranked);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchRankings();
  }, [user]);

  const requestEdit = (customer: CustomerRanking) => {
    setPendingCustomer(customer);
    setForm({ name: customer.name, phone: customer.phone ?? "" });
    setPasswordOpen(true);
  };

  const saveCustomer = async () => {
    if (!pendingCustomer) return;
    if (form.name.trim().length < 2) {
      toast.error("Customer name must be at least 2 characters");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("customers")
      .update({ name: form.name.trim(), phone: form.phone.trim() || null })
      .eq("id", pendingCustomer.id);
    setSaving(false);

    if (error) {
      toast.error("Failed to update customer");
      return;
    }
    toast.success("Customer updated");
    setEditOpen(false);
    setPendingCustomer(null);
    fetchRankings();
  };

  const bySpending = [...customers].sort((a, b) => b.totalSpent - a.totalSpent);
  const byJobs = [...customers].sort((a, b) => b.totalJobs - a.totalJobs);

  const RankingCard = ({ customer, rank }: { customer: CustomerRanking; rank: number }) => (
    <div className="flex items-center gap-4 p-4 border rounded-lg hover:border-primary/50 transition-colors">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 font-bold text-primary">
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{customer.name}</p>
        <p className="text-sm text-muted-foreground">
          ₦{customer.totalSpent.toLocaleString()} • {customer.totalJobs} jobs
          {customer.phone ? ` • ${customer.phone}` : ""}
        </p>
      </div>
      {rank === 1 && <Trophy className="w-6 h-6 text-secondary" />}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Options for ${customer.name}`}>
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => requestEdit(customer)}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit customer info
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const renderList = (list: CustomerRanking[]) => {
    if (loading) return <p className="text-muted-foreground">Loading…</p>;
    if (list.length === 0)
      return (
        <p className="text-muted-foreground">
          No customers yet. Add a job to start building your rankings.
        </p>
      );
    return (
      <div className="space-y-3">
        {list.map((customer, index) => (
          <RankingCard key={customer.id} customer={customer} rank={index + 1} />
        ))}
      </div>
    );
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Customer Rankings</h1>
          <p className="text-muted-foreground">View your top customers by spending and jobs</p>
        </div>

        <Tabs defaultValue="spending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="spending">
              <TrendingUp className="w-4 h-4 mr-2" />
              By Spending
            </TabsTrigger>
            <TabsTrigger value="jobs">
              <Trophy className="w-4 h-4 mr-2" />
              By Jobs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="spending">
            <Card className="p-6 shadow-luxury">
              <h2 className="text-xl font-bold mb-4">Top Customers by Total Spending</h2>
              {renderList(bySpending)}
            </Card>
          </TabsContent>

          <TabsContent value="jobs">
            <Card className="p-6 shadow-luxury">
              <h2 className="text-xl font-bold mb-4">Top Customers by Number of Jobs</h2>
              {renderList(byJobs)}
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <PasswordConfirmDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        actionLabel={`Edit customer ${pendingCustomer?.name ?? ""}`}
        description="Editing customer information requires your admin password."
        onConfirmed={() => setEditOpen(true)}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit customer</DialogTitle>
            <DialogDescription>Correct the customer's details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Customer name</Label>
              <Input
                id="customer-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone number</Label>
              <Input
                id="customer-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCustomer} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Rankings;
