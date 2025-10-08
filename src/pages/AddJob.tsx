import { useState } from "react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to create a job");
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
        toast.error("Company not found");
        return;
      }

      // Get company code for job code generation
      const { data: company } = await supabase
        .from("companies")
        .select("company_code")
        .eq("id", profile.company_id)
        .single();

      if (!company) {
        toast.error("Company not found");
        return;
      }

      // Check if customer exists, if not create
      let customerId: string;
      const { data: existingCustomer } = await supabase
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
        description: formData.description,
        num_dresses: parseInt(formData.numberOfDresses),
        price: parseFloat(formData.price),
        amount_paid: parseFloat(formData.amountPaid) || 0,
        outstanding_amount: parseFloat(formData.outstandingAmount) || 0,
        status: formData.status,
      });

      if (jobError) {
        toast.error("Failed to create job");
        return;
      }

      toast.success(
        <div>
          <p className="font-semibold">Job created successfully!</p>
          <p className="text-sm mt-1">
            Job Code: <span className="font-mono font-bold">{jobCodeData}</span>
          </p>
        </div>,
        { duration: 5000 }
      );

      navigate("/admin/dashboard");
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
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                placeholder="Enter customer name"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Customer Phone *</Label>
              <Input
                id="customerPhone"
                type="tel"
                placeholder="+234 801 234 5678"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                required
              />
            </div>

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
                <Label htmlFor="numberOfDresses">Number of Dresses *</Label>
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
    </div>
  );
};

export default AddJob;
