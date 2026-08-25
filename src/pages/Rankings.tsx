import { useEffect, useState } from "react";
import { ArrowLeft, Trophy, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CustomerRanking {
  id: string;
  name: string;
  totalSpent: number;
  totalJobs: number;
}

const Rankings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/admin/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchRankings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, jobs(price)");

      if (!error && data) {
        const ranked = (data as any[]).map((c) => ({
          id: c.id,
          name: c.name,
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

    fetchRankings();
  }, [user]);

  const bySpending = [...customers].sort((a, b) => b.totalSpent - a.totalSpent);
  const byJobs = [...customers].sort((a, b) => b.totalJobs - a.totalJobs);

  const RankingCard = ({ customer, rank }: { customer: CustomerRanking; rank: number }) => (
    <div className="flex items-center gap-4 p-4 border rounded-lg hover:border-primary/50 transition-colors">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 font-bold text-primary">
        {rank}
      </div>
      <div className="flex-1">
        <p className="font-semibold">{customer.name}</p>
        <p className="text-sm text-muted-foreground">
          ₦{customer.totalSpent.toLocaleString()} • {customer.totalJobs} jobs
        </p>
      </div>
      {rank === 1 && <Trophy className="w-6 h-6 text-secondary" />}
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
    </div>
  );
};

export default Rankings;
