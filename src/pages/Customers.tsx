import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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

const money = (n: number) => `₦${Number(n || 0).toLocaleString()}`;

const Customers = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

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
                <div className="text-right">
                  <p className="font-semibold">{money(c.total_spent ?? 0)}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.total_jobs ?? 0} job{(c.total_jobs ?? 0) === 1 ? "" : "s"}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Customers;
