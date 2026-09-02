import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Fingerprint, LogOut, Package, QrCode, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatusBadge from "@/components/StatusBadge";
import JobQRCode from "@/components/JobQRCode";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  biometricEnabled,
  biometricSupported,
  disableBiometric,
  enableBiometric,
  fetchCustomerJobs,
  fetchCustomerProfile,
  getCustomerToken,
  logoutCustomer,
} from "@/lib/customerAuth";

type JobStatus = "red" | "yellow" | "green";

interface PortalJob {
  code: string;
  description: string;
  num_dresses: number;
  price: number;
  amount_paid: number;
  outstanding_amount: number;
  status: string;
  created_at: string;
  company_name: string;
  customer_name: string;
}

const money = (n: number) => `₦${Number(n || 0).toLocaleString()}`;

const CustomerPortal = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [jobs, setJobs] = useState<PortalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCode, setSearchCode] = useState("");
  const [searchResult, setSearchResult] = useState<PortalJob | null>(null);
  const [searching, setSearching] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [bioOn, setBioOn] = useState(biometricEnabled());
  const [bioAvailable, setBioAvailable] = useState(false);

  useEffect(() => {
    const token = getCustomerToken();
    if (!token) {
      navigate("/customer/login", { replace: true });
      return;
    }
    biometricSupported().then(setBioAvailable);
    (async () => {
      try {
        const profile = await fetchCustomerProfile(token);
        if (!profile) {
          await logoutCustomer();
          navigate("/customer/login", { replace: true });
          return;
        }
        setPhone(profile.phone);
        setJobs((await fetchCustomerJobs(token)) as unknown as PortalJob[]);
      } catch (err) {
        console.error(err);
        toast.error("Could not load your orders");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase.rpc("track_job", { p_code: searchCode.trim() });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        setSearchResult(null);
        toast.error("No job found with that code");
      } else {
        setSearchResult(row as unknown as PortalJob);
      }
    } catch {
      toast.error("Could not look up that job code");
    } finally {
      setSearching(false);
    }
  };

  const toggleBiometric = async () => {
    if (bioOn) {
      disableBiometric();
      setBioOn(false);
      toast.success("Biometric unlock disabled");
      return;
    }
    try {
      const token = getCustomerToken();
      if (!token) return;
      await enableBiometric(phone, token);
      setBioOn(true);
      toast.success("Biometric unlock enabled on this device");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not enable biometrics");
    }
  };

  const handleLogout = async () => {
    await logoutCustomer();
    navigate("/customer/login", { replace: true });
  };

  const JobCard = ({ job }: { job: PortalJob }) => (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-mono font-bold">{job.code}</p>
          <p className="text-sm text-muted-foreground">{job.company_name}</p>
        </div>
        <StatusBadge status={job.status as JobStatus} />
      </div>
      <p className="mt-3">{job.description}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
        <div>
          <p className="text-muted-foreground">Items</p>
          <p className="font-semibold">{job.num_dresses}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Price</p>
          <p className="font-semibold">{money(job.price)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Paid</p>
          <p className="font-semibold">{money(job.amount_paid)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Outstanding</p>
          <p className="font-semibold">{money(job.outstanding_amount)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-muted-foreground">
          {new Date(job.created_at).toLocaleDateString()}
        </p>
        <Button variant="outline" size="sm" onClick={() => setQrCode(job.code)}>
          <QrCode className="w-4 h-4 mr-2" />
          QR
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen p-4 pt-20" style={{ background: "var(--gradient-page)" }}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link to="/" className="inline-flex items-center text-sm hover:text-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Home
          </Link>
          <div className="flex items-center gap-2">
            {bioAvailable && (
              <Button variant="outline" size="sm" onClick={toggleBiometric}>
                <Fingerprint className="w-4 h-4 mr-2" />
                {bioOn ? "Disable biometrics" : "Enable biometrics"}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold">My Orders</h1>
          <p className="text-muted-foreground">{phone}</p>
        </div>

        <Card className="p-5">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search any job code (e.g. BEL-077-677411)"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
            />
            <Button type="submit" disabled={searching}>
              <Search className="w-4 h-4" />
            </Button>
          </form>
          {searchResult && (
            <div className="mt-4">
              <JobCard job={searchResult} />
            </div>
          )}
        </Card>

        <div className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Loading your orders…</p>
          ) : jobs.length === 0 ? (
            <Card className="p-10 text-center">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold">No orders yet</p>
              <p className="text-sm text-muted-foreground">
                Orders registered with this phone number will appear here automatically.
              </p>
            </Card>
          ) : (
            jobs.map((job) => <JobCard key={job.code} job={job} />)
          )}
        </div>
      </div>

      <Dialog open={!!qrCode} onOpenChange={(o) => !o && setQrCode(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Order QR Code</DialogTitle>
          </DialogHeader>
          {qrCode && <JobQRCode code={qrCode} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerPortal;
