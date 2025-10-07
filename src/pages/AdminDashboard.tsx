import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, TrendingUp, Users, CheckCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/StatusBadge";

type JobStatus = "red" | "yellow" | "green";

interface Job {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  description: string;
  numberOfDresses: number;
  price: number;
  status: JobStatus;
  createdAt: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    // Check authentication
    const isAuth = localStorage.getItem("isAdminAuthenticated");
    if (!isAuth) {
      navigate("/admin/login");
      return;
    }

    // Load demo data
    const demoJobs: Job[] = [
      {
        id: "1",
        code: "TT-001",
        customerName: "Amaka Johnson",
        customerPhone: "+234 801 234 5678",
        description: "2 Ankara gowns",
        numberOfDresses: 2,
        price: 25000,
        status: "green",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        code: "TT-002",
        customerName: "Chidinma Okafor",
        customerPhone: "+234 802 345 6789",
        description: "1 wedding gown, 2 bridesmaid dresses",
        numberOfDresses: 3,
        price: 85000,
        status: "yellow",
        createdAt: new Date().toISOString(),
      },
      {
        id: "3",
        code: "TT-003",
        customerName: "Ngozi Adeyemi",
        customerPhone: "+234 803 456 7890",
        description: "3 casual shirts",
        numberOfDresses: 3,
        price: 15000,
        status: "red",
        createdAt: new Date().toISOString(),
      },
    ];
    setJobs(demoJobs);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("isAdminAuthenticated");
    navigate("/admin/login");
  };

  const activeJobs = jobs.filter((j) => j.status !== "green").length;
  const completedToday = jobs.filter((j) => j.status === "green").length;
  const totalCustomers = new Set(jobs.map((j) => j.customerName)).size;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 shadow-card hover:shadow-luxury transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Jobs</p>
                <p className="text-3xl font-bold">{activeJobs}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-status-yellow/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-status-yellow" />
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-card hover:shadow-luxury transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed Today</p>
                <p className="text-3xl font-bold">{completedToday}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-status-green/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-status-green" />
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-card hover:shadow-luxury transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Customers</p>
                <p className="text-3xl font-bold">{totalCustomers}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link to="/admin/add-job">
            <Button size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Add New Job
            </Button>
          </Link>
          <Link to="/admin/rankings">
            <Button variant="outline" size="lg">
              Customer Rankings
            </Button>
          </Link>
          <Link to="/admin/history">
            <Button variant="outline" size="lg">
              Past Jobs
            </Button>
          </Link>
        </div>

        {/* Jobs List */}
        <Card className="p-6 shadow-card">
          <h2 className="text-xl font-bold mb-4">All Jobs</h2>
          <div className="space-y-4">
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
                  <StatusBadge status={job.status} />
                </div>
                <p className="text-sm mb-2">{job.description}</p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>{job.numberOfDresses} dresses</span>
                  <span>₦{job.price.toLocaleString()}</span>
                  <span>{job.customerPhone}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
