import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Plus,
  TrendingUp,
  History as HistoryIcon,
  LogOut,
  MessageCircle,
  MoreVertical,
  Pencil,
  Trash2,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "@/components/StatusBadge";
import PasswordConfirmDialog from "@/components/PasswordConfirmDialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type JobStatus = "red" | "yellow" | "green";

interface Job {
  id: string;
  code: string;
  customer_name: string;
  customer_phone: string | null;
  description: string;
  num_dresses: number;
  price: number;
  amount_paid: number;
  outstanding_amount: number;
  status: JobStatus;
  created_at: string;
}


const AdminDashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/admin/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchJobs();
      fetchCompanyInfo();
    }
  }, [user]);

  const fetchCompanyInfo = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profile?.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", profile.company_id)
        .single();

      if (company) {
        setCompanyName(company.name);
      }
    }
  };

  const fetchJobs = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("jobs")
      .select(`
        id,
        code,
        description,
        num_dresses,
        price,
        amount_paid,
        outstanding_amount,
        status,
        created_at,
        customers (name, phone)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load jobs");
      console.error(error);
    } else {
      const formattedJobs = data.map((job: any) => ({
        id: job.id,
        code: job.code,
        customer_name: job.customers?.name || "Unknown",
        customer_phone: job.customers?.phone || null,
        description: job.description,
        num_dresses: job.num_dresses,
        price: Number(job.price ?? 0),
        amount_paid: Number(job.amount_paid ?? 0),
        outstanding_amount: Number(job.outstanding_amount ?? 0),
        status: job.status as JobStatus,
        created_at: job.created_at,
      }));
      setJobs(formattedJobs);
    }
    setLoading(false);
  };

  const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
    const { error } = await supabase
      .from("jobs")
      .update({ 
        status: newStatus,
        completed_at: newStatus === "green" ? new Date().toISOString() : null
      })
      .eq("id", jobId);

    if (error) {
      toast.error("Failed to update job status");
    } else {
      setJobs(
        jobs.map((job) =>
          job.id === jobId ? { ...job, status: newStatus } : job
        )
      );
      if (newStatus === "green") {
        const job = jobs.find((j) => j.id === jobId);
        if (job) notifyCustomer({ ...job, status: newStatus });
      } else {
        toast.success("Job status updated");
      }
    }
  };

  const whatsappLink = (job: Job) => {
    const digits = (job.customer_phone || "").replace(/\D/g, "");
    if (!digits) return null;
    const intl = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
    const text = encodeURIComponent(
      `Hello ${job.customer_name}, your order ${job.code} (${job.description}) is ready for pickup! - ${companyName}`,
    );
    return `https://wa.me/${intl}?text=${text}`;
  };

  const notifyCustomer = (job: Job) => {
    const link = whatsappLink(job);
    if (!link) {
      toast.success("Job marked as completed", {
        description: "No phone number on file to send a WhatsApp alert.",
      });
      return;
    }
    toast.success("Job completed — notify the customer", {
      description: `Send \u201cready for pickup\u201d to ${job.customer_name}`,
      duration: 10000,
      action: {
        label: "WhatsApp",
        onClick: () => window.open(link, "_blank", "noopener,noreferrer"),
      },
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const activeJobs = jobs.filter((j) => j.status !== "green").length;
  const completedToday = jobs.filter((j) => {
    const jobDate = new Date(j.created_at);
    const today = new Date();
    return (
      j.status === "green" &&
      jobDate.toDateString() === today.toDateString()
    );
  }).length;
  const totalCustomers = new Set(jobs.map((j) => j.customer_name)).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <LayoutDashboard className="w-10 h-10 text-primary" />
              Dashboard
            </h1>
            {companyName && (
              <p className="text-muted-foreground">{companyName}</p>
            )}
          </div>
          <Button onClick={signOut} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 hover:shadow-luxury transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Jobs</p>
                <p className="text-3xl font-bold text-status-yellow">
                  {activeJobs}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-status-yellow/10 flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-status-yellow" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-luxury transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Completed Today
                </p>
                <p className="text-3xl font-bold text-status-green">
                  {completedToday}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-status-green/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-status-green" />
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-luxury transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Customers
                </p>
                <p className="text-3xl font-bold text-primary">
                  {totalCustomers}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link to="/admin/add-job">
            <Button className="w-full" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Add New Job
            </Button>
          </Link>
          <Link to="/admin/rankings">
            <Button variant="outline" className="w-full" size="lg">
              <TrendingUp className="w-5 h-5 mr-2" />
              View Rankings
            </Button>
          </Link>
          <Link to="/admin/history">
            <Button variant="outline" className="w-full" size="lg">
              <HistoryIcon className="w-5 h-5 mr-2" />
              View History
            </Button>
          </Link>
        </div>

        {/* Jobs List */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">All Jobs</h2>
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No jobs yet</p>
              <Link to="/admin/add-job">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Job
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{job.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Code: {job.code}
                      </p>
                    </div>
                    {job.status === "green" ? (
                      <div className="flex items-center gap-2">
                        <StatusBadge status={job.status} />
                        {whatsappLink(job) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              window.open(whatsappLink(job) as string, "_blank", "noopener,noreferrer")
                            }
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Notify
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Select
                        value={job.status}
                        onValueChange={(value) =>
                          handleStatusChange(job.id, value as JobStatus)
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue>
                            <StatusBadge status={job.status} size="sm" />
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="red">
                            <StatusBadge status="red" size="sm" />
                          </SelectItem>
                          <SelectItem value="yellow">
                            <StatusBadge status="yellow" size="sm" />
                          </SelectItem>
                          <SelectItem value="green">
                            <StatusBadge status="green" size="sm" />
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <p className="text-sm mb-2">{job.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>Dresses: {job.num_dresses}</span>
                    <span>Price: ₦{job.price.toLocaleString()}</span>
                    <span>
                      Date: {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
