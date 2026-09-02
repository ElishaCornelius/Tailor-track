import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Fingerprint, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  accountExists,
  biometricEnabled,
  biometricSupported,
  getCustomerToken,
  loginCustomer,
  registerCustomer,
  unlockWithBiometric,
} from "@/lib/customerAuth";

type Step = "phone" | "login" | "register";

const CustomerLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [canBio, setCanBio] = useState(false);

  useEffect(() => {
    if (getCustomerToken()) navigate("/customer/portal", { replace: true });
    biometricSupported().then((ok) => setCanBio(ok && biometricEnabled()));
  }, [navigate]);

  const onlyDigits = (v: string) => v.replace(/\D/g, "").slice(0, 4);

  const handlePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      const exists = await accountExists(phone);
      setStep(exists ? "login" : "register");
    } catch {
      toast.error("Could not check that phone number. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.length !== 4) {
      toast.error("Passcode must be 4 digits");
      return;
    }
    if (step === "register" && passcode !== confirmPasscode) {
      toast.error("The two passcodes do not match");
      return;
    }
    setLoading(true);
    try {
      if (step === "register") {
        await registerCustomer(phone, passcode);
        toast.success("Your portal is ready!");
      } else {
        await loginCustomer(phone, passcode);
        toast.success("Welcome back!");
      }
      navigate("/customer/portal", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message.replace(/^.*?:\s*/, ""));
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = async () => {
    try {
      await unlockWithBiometric();
      navigate("/customer/portal", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Biometric unlock failed");
    }
  };

  const passcodeField = (
    id: string,
    label: string,
    value: string,
    setValue: (v: string) => void
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          inputMode="numeric"
          type={showPasscode ? "text" : "password"}
          placeholder="••••"
          className="tracking-[0.6em] text-center text-lg pr-10"
          value={value}
          onChange={(e) => setValue(onlyDigits(e.target.value))}
        />
        <button
          type="button"
          onClick={() => setShowPasscode((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={showPasscode ? "Hide passcode" : "Show passcode"}
        >
          {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 pt-20" style={{ background: "var(--gradient-page)" }}>
      <div className="max-w-md mx-auto">
        <Link to="/" className="inline-flex items-center text-sm hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <Card className="p-8 shadow-luxury">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-3">
              <Phone className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Customer Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {step === "phone" && "Sign in with your phone number"}
              {step === "login" && "Enter your 4-digit passcode"}
              {step === "register" && "Create a 4-digit passcode"}
            </p>
          </div>

          {step === "phone" ? (
            <form onSubmit={handlePhone} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+234 801 234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Continue
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">{phone}</p>
              {passcodeField("passcode", "Passcode", passcode, setPasscode)}
              {step === "register" &&
                passcodeField("confirm", "Confirm Passcode", confirmPasscode, setConfirmPasscode)}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {step === "register" ? "Create Account" : "Sign In"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("phone");
                  setPasscode("");
                  setConfirmPasscode("");
                }}
              >
                Use a different number
              </Button>
            </form>
          )}

          {canBio && step === "phone" && (
            <Button variant="outline" className="w-full mt-4" onClick={handleBiometric}>
              <Fingerprint className="w-4 h-4 mr-2" />
              Unlock with biometrics
            </Button>
          )}

          <p className="text-xs text-muted-foreground text-center mt-6">
            Just want to check one order?{" "}
            <Link to="/customer/track" className="text-primary hover:underline">
              Track with a job code
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default CustomerLogin;
