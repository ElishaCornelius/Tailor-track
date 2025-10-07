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

type JobStatus = "red" | "yellow" | "green";

const AddJob = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    description: "",
    numberOfDresses: "",
    price: "",
    status: "red" as JobStatus,
  });

  const generateJobCode = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `TT-${timestamp.slice(-6)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const jobCode = generateJobCode();
    
    toast.success(
      <div>
        <p className="font-semibold">Job created successfully!</p>
        <p className="text-sm mt-1">Job Code: <span className="font-mono font-bold">{jobCode}</span></p>
      </div>,
      { duration: 5000 }
    );

    // Will be saved to database
    console.log({ ...formData, code: jobCode });
    
    navigate("/admin/dashboard");
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
                <Label htmlFor="price">Price (₦) *</Label>
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
