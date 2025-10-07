import { useState } from "react";
import { ArrowLeft, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/StatusBadge";

type JobStatus = "red" | "yellow" | "green";

interface JobDetails {
  code: string;
  customerName: string;
  description: string;
  numberOfDresses: number;
  status: JobStatus;
  createdAt: string;
}

const CustomerTrack = () => {
  const [jobCode, setJobCode] = useState("");
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setNotFound(false);

    // Simulate API call
    setTimeout(() => {
      if (jobCode.toUpperCase() === "TT-001") {
        setJobDetails({
          code: "TT-001",
          customerName: "Amaka Johnson",
          description: "2 Ankara gowns",
          numberOfDresses: 2,
          status: "green",
          createdAt: new Date().toISOString(),
        });
        setNotFound(false);
      } else if (jobCode.toUpperCase() === "TT-002") {
        setJobDetails({
          code: "TT-002",
          customerName: "Chidinma Okafor",
          description: "1 wedding gown, 2 bridesmaid dresses",
          numberOfDresses: 3,
          status: "yellow",
          createdAt: new Date().toISOString(),
        });
        setNotFound(false);
      } else {
        setJobDetails(null);
        setNotFound(true);
      }
      setIsSearching(false);
    }, 800);
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
              <div className="flex gap-2">
                <Input
                  id="jobCode"
                  placeholder="e.g., TT-001"
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
          </Card>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Try demo codes: <code className="bg-muted px-2 py-1 rounded mx-1">TT-001</code> or
            <code className="bg-muted px-2 py-1 rounded mx-1">TT-002</code>
          </p>
        </div>
      </main>
    </div>
  );
};

export default CustomerTrack;
