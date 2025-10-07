import { ArrowLeft, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";

interface CustomerRanking {
  name: string;
  totalSpent: number;
  totalJobs: number;
}

const Rankings = () => {
  const customers: CustomerRanking[] = [
    { name: "Amaka Johnson", totalSpent: 125000, totalJobs: 8 },
    { name: "Chidinma Okafor", totalSpent: 95000, totalJobs: 5 },
    { name: "Ngozi Adeyemi", totalSpent: 78000, totalJobs: 12 },
    { name: "Funke Adeleke", totalSpent: 65000, totalJobs: 4 },
    { name: "Blessing Okoli", totalSpent: 54000, totalJobs: 6 },
  ];

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
              <div className="space-y-3">
                {bySpending.map((customer, index) => (
                  <RankingCard key={customer.name} customer={customer} rank={index + 1} />
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="jobs">
            <Card className="p-6 shadow-luxury">
              <h2 className="text-xl font-bold mb-4">Top Customers by Number of Jobs</h2>
              <div className="space-y-3">
                {byJobs.map((customer, index) => (
                  <RankingCard key={customer.name} customer={customer} rank={index + 1} />
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Rankings;
