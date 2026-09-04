import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Search, Package, Bell, MessageCircle, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Link, useSearchParams } from "react-router-dom";
import StatusBadge from "@/components/StatusBadge";
import QrScanDialog from "@/components/QrScanDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";


type JobStatus = "red" | "yellow" | "green";

interface JobDetails {
  code: string;
  customerName: string;
  description: string;
  numberOfDresses: number;
  status: JobStatus;
  createdAt: string;
  companyName: string;
  companyPhone: string | null;
}

const STORAGE_KEY = "tt_tracked_jobs";
const NOTIFIED_KEY = "tt_notified_jobs";

const readList = (key: string): string[] => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

const addToList = (key: string, value: string) => {
  const list = readList(key);
  if (!list.includes(value)) {
    localStorage.setItem(key, JSON.stringify([value, ...list].slice(0, 20)));
  }
};

const fetchJob = async (code: string): Promise<JobDetails | null> => {
  const { data, error } = await supabase.rpc("track_job", { p_code: code });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    code: row.code,
    customerName: row.customer_name,
    description: row.description,
    numberOfDresses: row.num_dresses,
    status: row.status as JobStatus,
    createdAt: row.created_at,
    companyName: row.company_name,
    companyPhone: row.company_phone,
  };
};

const CustomerTrack = () => {
  const [jobCode, setJobCode] = useState("");
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [pastJobs, setPastJobs] = useState<JobDetails[]>([]);
  const [searchParams] = useSearchParams();
  const [scanOpen, setScanOpen] = useState(false);

  const lookup = useCallback(async (code: string) => {
    setIsSearching(true);
    setNotFound(false);
    try {
      const job = await fetchJob(code);
      if (!job) {
        setJobDetails(null);
        setNotFound(true);
        return;
      }
      setJobDetails(job);
      addToList(STORAGE_KEY, job.code);
      setPastJobs((prev) => [job, ...prev.filter((j) => j.code !== job.code)]);
      if (job.status === "green") {
        addToList(NOTIFIED_KEY, job.code);
        toast.success("Your order is ready for pickup!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not look up that job code. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleScanResult = useCallback(
    (code: string) => {
      setJobCode(code);
      lookup(code);
    },
    [lookup],
  );



  // Support QR codes that link to /customer/track?code=XXX
  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;
    setJobCode(code);
    setIsSearching(true);
    fetchJob(code)
      .then((job) => {
        if (!job) {
          setNotFound(true);
          return;
        }
        setJobDetails(job);
        addToList(STORAGE_KEY, job.code);
      })
      .catch(() => toast.error("Could not look up that job code."))
      .finally(() => setIsSearching(false));
  }, [searchParams]);

  // In-app notifications: check saved codes and alert on newly completed jobs
  useEffect(() => {
    const codes = readList(STORAGE_KEY);
    if (codes.length === 0) return;

    (async () => {
      const results: JobDetails[] = [];
      for (const code of codes) {
        try {
          const job = await fetchJob(code);
          if (job) {
            results.push(job);
            if (job.status === "green" && !readList(NOTIFIED_KEY).includes(job.code)) {
              addToList(NOTIFIED_KEY, job.code);
              toast.success("Your order is ready for pickup!", {
                description: `${job.code} — ${job.description}`,
                duration: 8000,
              });
            }
          }
        } catch {
          /* ignore */
        }
      }
      setPastJobs(results);
    })();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await lookup(jobCode);
  };


  const getStatusMessage = (status: JobStatus) => {
    switch (status) {
      case "red":
        return "Your order has been received and will be started soon.";
      case "yellow":
        return "Your order is currently being worked on.";
      case "green":
        return "Your order is ready for pickup! 🎉";
      default:
        return "";
    }
  };

  const whatsappLink = (job: JobDetails) => {
    const digits = (job.companyPhone || "").replace(/\D/g, "");
    if (!digits) return null;
    const text = encodeURIComponent(
      `Hello ${job.companyName}, I'd like to ask about my order ${job.code} (${job.description}).`,
    );
    return `https://wa.me/${digits}?text=${text}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      <header className="border-b bg-card/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="inline-flex items-center text-sm hover:text-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
          <p className="text-muted-foreground">Enter your job code to see your order status</p>
        </div>

        <Card className="p-8 shadow-luxury mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jobCode">Job Code</Label>
              <p className="text-xs text-muted-foreground">
                Have a QR code from your tailor? Scan it below, or type your job code.
              </p>
              <div className="flex gap-2">
                <Input
                  id="jobCode"
                  placeholder="e.g., BEL-077-001"
                  value={jobCode}
                  onChange={(e) => setJobCode(e.target.value)}
                  className="uppercase"
                  required
                />
                <Button type="submit" disabled={isSearching}>
                  {isSearching ? (
                    "Searching..."
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setScanOpen(true)}
              >
                <Camera className="w-4 h-4 mr-2" />
                Scan QR code with camera
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Already have an account?{" "}
                <Link to="/customer/login" className="text-primary hover:underline">
                  Log in to see all your orders
                </Link>
              </p>
            </div>
          </form>


          {notFound && (
            <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                Job code not found. Please check the code and try again.
              </p>
            </div>
          )}
        </Card>

        {jobDetails && (
          <Card className="p-8 shadow-luxury animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{jobDetails.customerName}</h2>
                <p className="text-sm text-muted-foreground">Job Code: {jobDetails.code}</p>
                <p className="text-sm text-muted-foreground">{jobDetails.companyName}</p>
              </div>
              <StatusBadge status={jobDetails.status} size="lg" />
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Job Description</p>
                <p className="font-medium">{jobDetails.description}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Number of Dresses</p>
                <p className="font-medium">{jobDetails.numberOfDresses}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Order Date</p>
                <p className="font-medium">
                  {new Date(jobDetails.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div
              className={`p-4 rounded-lg ${
                jobDetails.status === "green"
                  ? "bg-status-green/10 border border-status-green/20"
                  : jobDetails.status === "yellow"
                  ? "bg-status-yellow/10 border border-status-yellow/20"
                  : "bg-status-red/10 border border-status-red/20"
              }`}
            >
              <p className="text-sm font-medium">{getStatusMessage(jobDetails.status)}</p>
            </div>

            {whatsappLink(jobDetails) && (
              <a
                href={whatsappLink(jobDetails) as string}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex"
              >
                <Button variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat with {jobDetails.companyName}
                </Button>
              </a>
            )}
          </Card>
        )}

        {pastJobs.length > 0 && (
          <Card className="p-6 mt-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Your Past Jobs
            </h2>
            <div className="space-y-3">
              {pastJobs.map((job) => (
                <button
                  key={job.code}
                  onClick={() => {
                    setJobCode(job.code);
                    setJobDetails(job);
                    setNotFound(false);
                  }}
                  className="w-full text-left p-3 border rounded-lg hover:bg-accent/10 transition-colors flex items-center justify-between gap-4"
                >
                  <span>
                    <span className="font-medium block">{job.code}</span>
                    <span className="text-sm text-muted-foreground">{job.description}</span>
                  </span>
                  <StatusBadge status={job.status} size="sm" />
                </button>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default CustomerTrack;
