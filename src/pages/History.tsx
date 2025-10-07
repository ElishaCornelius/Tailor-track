import { ArrowLeft, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/StatusBadge";

interface CompletedJob {
  id: string;
  code: string;
  customerName: string;
  description: string;
  price: number;
  completedDate: string;
}

const History = () => {
  const completedJobs: CompletedJob[] = [
    {
      id: "1",
      code: "TT-001",
      customerName: "Amaka Johnson",
      description: "2 Ankara gowns",
      price: 25000,
      completedDate: "2025-10-07",
    },
    {
      id: "2",
      code: "TT-004",
      customerName: "Blessing Okoli",
      description: "1 traditional outfit",
      price: 35000,
      completedDate: "2025-10-07",
    },
    {
      id: "3",
      code: "TT-005",
      customerName: "Funke Adeleke",
      description: "3 casual dresses",
      price: 18000,
      completedDate: "2025-10-06",
    },
  ];

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

        <div className="space-y-6">
          {Object.entries(groupedJobs).map(([date, jobs]) => (
            <Card key={date} className="p-6 shadow-card">
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold">
                    {new Date(date).toLocaleDateString("en-US", {
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
      </main>
    </div>
  );
};

export default History;
