import { Link } from "react-router-dom";
import { Scissors, UserCircle, Github, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Scissors className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Tailor Track
          </h1>
          <p className="text-xl text-muted-foreground">
            Professional Sewing Job Management
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-8 hover:shadow-luxury transition-all duration-300 group">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <UserCircle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Register Company</h2>
              <p className="text-muted-foreground mb-6">
                Create your sewing company workspace
              </p>
              <Link to="/company/register">
                <Button className="w-full" size="lg">
                  Register Now
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-8 hover:shadow-luxury transition-all duration-300 group">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <UserCircle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Admin Login</h2>
              <p className="text-muted-foreground mb-6">
                Manage jobs, track progress, and view customer insights
              </p>
              <Link to="/admin/login">
                <Button className="w-full" size="lg">
                  Login
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-8 hover:shadow-luxury transition-all duration-300 group">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10 mb-4 group-hover:bg-secondary/20 transition-colors">
                <Scissors className="w-8 h-8 text-secondary-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Customer Portal</h2>
              <p className="text-muted-foreground mb-6">
                Track your sewing order status with your job code
              </p>
              <Link to="/customer/track">
                <Button variant="secondary" className="w-full" size="lg">
                  Track My Order
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <div className="absolute bottom-4 left-4">
        <p className="text-sm text-muted-foreground mb-2">Meet the developer</p>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/ElishaCornelius"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            aria-label="GitHub"
          >
            <Github className="w-5 h-5" />
          </a>
          <a
            href="https://www.linkedin.com/in/elisha-cornelius-081b83230/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;
