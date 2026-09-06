import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  // Following the emailed link creates a recovery session — skip the code step.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setVerified(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && window.location.hash.includes("type=recovery")) setVerified(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const verifyCode = async () => {
    const parsed = z
      .object({
        email: z.string().trim().email("Enter a valid email address"),
        code: z.string().trim().min(6, "Enter the 6-digit code from your email"),
      })
      .safeParse({ email, code });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: parsed.data.email,
        token: parsed.data.code,
        type: "recovery",
      });
      if (error) throw error;
      setVerified(true);
      toast.success("Verified. Choose a new password.");
    } catch (error: any) {
      toast.error(error.message || "That code is invalid or has expired.");
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You can sign in now.");
      navigate("/admin/login");
    } catch (error: any) {
      toast.error(error.message || "Could not update the password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/admin/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to login
        </Link>

        <Card className="p-8 shadow-luxury space-y-4">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Reset password</h1>
            <p className="text-muted-foreground text-sm">
              {verified
                ? "Choose a new password for your admin account."
                : "Enter the code we emailed you, or just open the link in that email."}
            </p>
          </div>

          {!verified ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Verification code</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={verifyCode} disabled={busy}>
                {busy ? "Verifying..." : "Verify code"}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    className="pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={savePassword} disabled={busy}>
                {busy ? "Saving..." : "Save new password"}
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
