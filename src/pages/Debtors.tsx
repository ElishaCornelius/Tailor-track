import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Search, Wallet, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface DebtorRow {
  id: string;
  name: string;
  phone: string | null;
  outstanding: number;
  jobs: number;
  codes: string[];
}

const money = (n: number) => `₦${Number(n || 0).toLocaleString()}`;

const Debtors = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<DebtorRow[]>([]);
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
        .from("jobs")
        .select("code, outstanding_amount, customers (id, name, phone)")
        .gt("outstanding_amount", 0);

      if (error) {
        console.error(error);
        toast.error("Could not load outstanding payments");
        setLoading(false);
        return;
      }

      const map = new Map<string, DebtorRow>();
      (data ?? []).forEach((job: any) => {
        const c = job.customers;
        if (!c) return;
        const existing = map.get(c.id) ?? {
          id: c.id,
          name: c.name,
          phone: c.phone,
          outstanding: 0,
          jobs: 0,
          codes: [],
        };
        existing.outstanding += Number(job.outstanding_amount ?? 0);
        existing.jobs += 1;
        existing.codes.push(job.code);
        map.set(c.id, existing);
      });

      setRows([...map.values()].sort((a, b) => b.outstanding - a.outstanding));
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    const digits = q.replace(/\D/g, "");
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (digits && (r.phone ?? "").replace(/\D/g, "").includes(digits)),
    );
  }, [rows, query]);

  const total = filtered.reduce((sum, r) => sum + r.outstanding, 0);

  const reminderLink = (row: DebtorRow) => {
    const digits = (row.phone || "").replace(/\D/g, "");
    if (!digits) return null;
    const intl = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
    const text = encodeURIComponent(
      `Hello ${row.name}, this is a friendly reminder that you have an outstanding balance of ${money(
        row.outstanding,
      )} on your order${row.jobs === 1 ? "" : "s"} (${row.codes.join(", ")}). Thank you!`,
    );
    return `https://wa.me/${intl}?text=${text}`;
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
          <h1 className="text-3xl font-bold">Outstanding Payments</h1>
          <p className="text-muted-foreground">
            {filtered.length} customer{filtered.length === 1 ? "" : "s"} owing {money(total)} in total,
            highest first
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
          <p className="text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center">
            <Wallet className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">No outstanding payments</p>
            <p className="text-sm text-muted-foreground">Everyone is fully paid up.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((row, index) => (
              <Card key={row.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{row.name}</p>
                    <p className="text-sm text-muted-foreground inline-flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {row.phone || "No phone"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-status-red">{money(row.outstanding)}</p>
                    <p className="text-sm text-muted-foreground">
                      {row.jobs} unpaid job{row.jobs === 1 ? "" : "s"}
                    </p>
                  </div>
                  {reminderLink(row) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(reminderLink(row) as string, "_blank", "noopener,noreferrer")
                      }
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Remind
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Debtors;
