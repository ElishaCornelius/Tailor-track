import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import Index from "./pages/Index";
import AdminLogin from "./pages/AdminLogin";
import CompanyRegister from "./pages/CompanyRegister";
import AdminDashboard from "./pages/AdminDashboard";
import AddJob from "./pages/AddJob";
import Rankings from "./pages/Rankings";
import History from "./pages/History";
import CustomerTrack from "./pages/CustomerTrack";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ThemeToggle />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/company/register" element={<CompanyRegister />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/add-job" element={<AddJob />} />
            <Route path="/admin/rankings" element={<Rankings />} />
            <Route path="/admin/history" element={<History />} />
            <Route path="/admin/notifications" element={<Notifications />} />
            <Route path="/customer/track" element={<CustomerTrack />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
