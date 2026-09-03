import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import JobQRCode from "@/components/JobQRCode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CustomerOption {
  id: string;
  name: string;
  phone: string | null;
}

const jobSchema = z.object({
  customerName: z.string().trim().min(2, "Customer name must be at least 2 characters").max(100, "Name too long"),
  customerPhone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(20, "Phone number too long"),
  description: z.string().trim().min(5, "Description must be at least 5 characters").max(500, "Description too long"),
  numberOfDresses: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be a positive number"),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Must be a positive number"),
  amountPaid: z.string().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), "Must be a positive number or empty"),
  outstandingAmount: z.string().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), "Must be a positive number or empty"),
  status: z.enum(["red", "yellow", "green"]),
});

type JobStatus = "red" | "yellow" | "green";

const AddJob = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    description: "",
    numberOfDresses: "",
    price: "",
    amountPaid: "",
    outstandingAmount: "",
    status: "red" as JobStatus,
  });
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [matchedCustomerId, setMatchedCustomerId] = useState<string | null>(null);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const nameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile?.company_id) return;
      setCompanyId(profile.company_id);
      const { data } = await supabase
        .from("customers")
        .select("id, name, phone")
        .eq("company_id", profile.company_id)
        .order("name");
      setCustomers((data ?? []) as CustomerOption[]);
    })();
  }, [user]);

  const nameMatches = useMemo(() => {
    const q = formData.customerName.trim().toLowerCase();
    if (!q) return [];
    return customers.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6);
  }, [customers, formData.customerName]);

  const phoneMatches = useMemo(() => {
    const q = formData.customerPhone.replace(/\D/g, "");
    if (!q) return [];
    return customers
      .filter((c) => (c.phone ?? "").replace(/\D/g, "").includes(q))
      .slice(0, 6);
  }, [customers, formData.customerPhone]);

  const selectCustomer = (c: CustomerOption) => {
    setFormData((prev) => ({ ...prev, customerName: c.name, customerPhone: c.phone ?? "" }));
    setMatchedCustomerId(c.id);
    setShowNameSuggestions(false);
    setShowPhoneSuggestions(false);
  };

  const showPhoneField = formData.customerName.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to create a job");
      navigate("/admin/login");
      return;
    }

    // Validate input
    const validation = jobSchema.safeParse(formData);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    try {
      // Get user's company_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) {
        toast.error("Company not found. Please contact support.");
        console.error("User profile missing company_id");
        return;
      }

      // Get company code for job code generation
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("company_code")
        .eq("id", profile.company_id)
        .single();

      if (companyError || !company) {
        toast.error("Failed to retrieve company information");
        console.error("Company fetch error:", companyError);
        return;
      }

      // Check if customer exists, if not create
      let customerId: string;
      const { data: existingCustomer } = matchedCustomerId
        ? { data: { id: matchedCustomerId } }
        : await supabase
        .from("customers")
        .select("id")
        .eq("company_id", profile.company_id)
        .eq("phone", formData.customerPhone)
        .maybeSingle();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert({
            company_id: profile.company_id,
            name: formData.customerName,
            phone: formData.customerPhone,
          })
          .select("id")
          .single();

        if (customerError || !newCustomer) {
          toast.error("Failed to create customer");
          return;
        }
        customerId = newCustomer.id;
      }

      // Generate job code using database function
      const { data: jobCodeData, error: jobCodeError } = await supabase
        .rpc("generate_job_code", { company_code: company.company_code });

      if (jobCodeError || !jobCodeData) {
        toast.error("Failed to generate job code");
        return;
      }

      // Create job
      const { error: jobError } = await supabase.from("jobs").insert({
        company_id: profile.company_id,
        customer_id: customerId,
        code: jobCodeData,
        description: formData.description.trim(),
        num_dresses: parseInt(formData.numberOfDresses),
        price: parseFloat(formData.price),
        amount_paid: parseFloat(formData.amountPaid) || 0,
        outstanding_amount: parseFloat(formData.outstandingAmount) || 0,
        status: formData.status,
      });

      if (jobError) {
        toast.error("Failed to create job");
        console.error("Job creation error:", jobError);
        return;
      }

      toast.success("Job created successfully!");
      setCreatedCode(jobCodeData as string);
    } catch (error) {
      console.error("Error creating job:", error);
      toast.error("An error occurred while creating the job");
    }
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

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-8 shadow-luxury">
          <h1 className="text-3xl font-bold mb-6">Add New Job</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 relative" ref={nameRef}>
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                autoComplete="off"
                placeholder="Start typing a name..."
                value={formData.customerName}
                onChange={(e) => {
                  setFormData({ ...formData, customerName: e.target.value });
                  setMatchedCustomerId(null);
                  setShowNameSuggestions(true);
                }}
                onFocus={() => setShowNameSuggestions(true)}
                onBlur={() => setTimeout(() => setShowNameSuggestions(false), 150)}
                required
              />
              {showNameSuggestions && nameMatches.length > 0 && (
                <ul className="absolute z-20 left-0 right-0 top-full mt-1 bg-popover border rounded-md shadow-lg overflow-hidden">
                  {nameMatches.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-accent"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectCustomer(c)}
                      >
                        <span className="font-medium">{c.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">{c.phone}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {showPhoneField && (
              <div className="space-y-2 relative animate-fade-in">
                <Label htmlFor="customerPhone">Customer Phone *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  autoComplete="off"
                  placeholder="+234 801 234 5678"
                  value={formData.customerPhone}
                  onChange={(e) => {
                    setFormData({ ...formData, customerPhone: e.target.value });
                    setMatchedCustomerId(null);
                    setShowPhoneSuggestions(true);
                  }}
                  onFocus={() => setShowPhoneSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowPhoneSuggestions(false), 150)}
                  required
                />
                {matchedCustomerId ? (
                  <p className="text-xs text-muted-foreground">
                    Existing customer — this job will be added to their record.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    New customer — their full details will be saved.
                  </p>
                )}
                {showPhoneSuggestions && phoneMatches.length > 0 && (
                  <ul className="absolute z-20 left-0 right-0 top-full mt-1 bg-popover border rounded-md shadow-lg overflow-hidden">
                    {phoneMatches.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-accent"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectCustomer(c)}
                        >
                          <span className="font-medium">{c.phone}</span>
                          <span className="text-sm text-muted-foreground ml-2">{c.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                placeholder="e.g., 2 Ankara gowns, 1 shirt"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numberOfDresses">Number of Items *</Label>
                <Input
                  id="numberOfDresses"
                  type="number"
                  min="1"
                  placeholder="0"
                  value={formData.numberOfDresses}
                  onChange={(e) => setFormData({ ...formData, numberOfDresses: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Total Price (₦) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amountPaid">Amount Paid (₦)</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.amountPaid}
                  onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="outstandingAmount">Outstanding Amount (₦)</Label>
                <Input
                  id="outstandingAmount"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.outstandingAmount}
                  onChange={(e) => setFormData({ ...formData, outstandingAmount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Job Status *</Label>
              <RadioGroup
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as JobStatus })}
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:border-status-red/50 transition-colors">
                  <RadioGroupItem value="red" id="red" />
                  <Label htmlFor="red" className="flex items-center gap-2 cursor-pointer flex-1">
                    <div className="w-3 h-3 rounded-full bg-status-red" />
                    <span>Not Started</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:border-status-yellow/50 transition-colors">
                  <RadioGroupItem value="yellow" id="yellow" />
                  <Label htmlFor="yellow" className="flex items-center gap-2 cursor-pointer flex-1">
                    <div className="w-3 h-3 rounded-full bg-status-yellow" />
                    <span>In Progress</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:border-status-green/50 transition-colors">
                  <RadioGroupItem value="green" id="green" />
                  <Label htmlFor="green" className="flex items-center gap-2 cursor-pointer flex-1">
                    <div className="w-3 h-3 rounded-full bg-status-green" />
                    <span>Completed</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" size="lg" className="flex-1">
                Create Job
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate("/admin/dashboard")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </main>

      <Dialog open={!!createdCode} onOpenChange={(o) => { if (!o) { setCreatedCode(null); navigate("/admin/dashboard"); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Job created</DialogTitle>
          </DialogHeader>
          {createdCode && <JobQRCode code={createdCode} />}
          <Button onClick={() => { setCreatedCode(null); navigate("/admin/dashboard"); }}>
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddJob;
