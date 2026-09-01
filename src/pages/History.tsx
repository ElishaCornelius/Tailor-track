import { useEffect, useState } from "react";
import { ArrowLeft, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import StatusBadge from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CompletedJob {
  id: string;
  code: string;
  customerName: string;
  description: string;
  price: number;
  amountPaid: number;
  completedDate: string;
}

const History = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/admin/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("jobs")
        .select("id, code, description, price, amount_paid, status, created_at, completed_at, customers(name)")
        .eq("status", "green")
        .order("completed_at", { ascending: false });

      if (!error && data) {
        setCompletedJobs(
          (data as any[]).map((j) => {
            const completedAt = j.completed_at ?? j.created_at;
            return {
              id: j.id,
              code: j.code,
              customerName: j.customers?.name ?? "Unknown",
              description: j.description,
              price: Number(j.price) || 0,
              amountPaid: Number(j.amount_paid) || 0,
              completedDate: new Date(completedAt).toISOString().split("T")[0],
            };
          })
        );
      }
      setLoading(false);
    };
    fetchHistory();
  }, [user]);

  const groupByDate = (jobs: CompletedJob[]) => {
    const groups: Record<string, CompletedJob[]> = {};
    jobs.forEach((job) => {
      if (!groups[job.completedDate]) {
        groups[job.completedDate] = [];
      }
      groups[job.completedDate].push(job);
    });
    return groups;
  };

  const groupedJobs = groupByDate(completedJobs);

  const getTotalForDate = (jobs: CompletedJob[]) => {
    return jobs.reduce((sum, job) => sum + job.price, 0);
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
          <h1 className="text-3xl font-bold mb-2">Past Jobs</h1>
          <p className="text-muted-foreground">View completed jobs and daily earnings</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : completedJobs.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No completed jobs yet. Jobs marked green will appear here.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedJobs).map(([date, jobs]) => (
              <Card key={date} className="p-6 shadow-card">
                <div className="flex items-center justify-between mb-4 pb-4 border-b">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">
                      {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Daily Total</p>
                    <p className="text-xl font-bold text-primary">
                      ₦{getTotalForDate(jobs).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{job.customerName}</p>
                          <p className="text-sm text-muted-foreground">Code: {job.code}</p>
                        </div>
                        <StatusBadge status="green" />
                      </div>
                      <p className="text-sm mb-2">{job.description}</p>
                      <p className="text-lg font-bold text-primary">₦{job.price.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
