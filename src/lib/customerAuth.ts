import { supabase } from "@/integrations/supabase/client";

const TOKEN_KEY = "tt_customer_token";
const BIO_KEY = "tt_customer_biometric";

export const getCustomerToken = () => localStorage.getItem(TOKEN_KEY);
export const setCustomerToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearCustomerToken = () => localStorage.removeItem(TOKEN_KEY);

export const registerCustomer = async (phone: string, passcode: string) => {
  const { data, error } = await supabase.rpc("customer_register", {
    p_phone: phone,
    p_passcode: passcode,
  });
  if (error) throw error;
  setCustomerToken(data as string);
  return data as string;
};

export const loginCustomer = async (phone: string, passcode: string) => {
  const { data, error } = await supabase.rpc("customer_login", {
    p_phone: phone,
    p_passcode: passcode,
  });
  if (error) throw error;
  setCustomerToken(data as string);
  return data as string;
};

export const accountExists = async (phone: string) => {
  const { data, error } = await supabase.rpc("customer_account_exists", { p_phone: phone });
  if (error) throw error;
  return Boolean(data);
};

export const fetchCustomerProfile = async (token: string) => {
  const { data, error } = await supabase.rpc("customer_me", { p_token: token });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ? (row as { phone: string }) : null;
};

export const fetchCustomerJobs = async (token: string) => {
  const { data, error } = await supabase.rpc("customer_jobs", { p_token: token });
  if (error) throw error;
  return (data ?? []) as Array<{
    code: string;
    customer_name: string;
    description: string;
    num_dresses: number;
    price: number;
    amount_paid: number;
    outstanding_amount: number;
    status: string;
    created_at: string;
    completed_at: string | null;
    company_name: string;
    company_phone: string | null;
  }>;
};

export const logoutCustomer = async () => {
  const token = getCustomerToken();
  if (token) {
    try {
      await supabase.rpc("customer_logout", { p_token: token });
    } catch {
      /* ignore */
    }
  }
  clearCustomerToken();
};

/* ---------------- Biometric unlock (WebAuthn, device-bound) ---------------- */

const toB64 = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromB64 = (str: string) => {
  const b = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
};

export const biometricSupported = async () => {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};

export const biometricEnabled = () => Boolean(localStorage.getItem(BIO_KEY));

export const disableBiometric = () => localStorage.removeItem(BIO_KEY);

export const enableBiometric = async (phone: string, token: string) => {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Tailor Track", id: window.location.hostname },
      user: { id: userId, name: phone, displayName: phone },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
    },
  })) as PublicKeyCredential | null;

  if (!cred) throw new Error("Biometric setup was cancelled");

  localStorage.setItem(
    BIO_KEY,
    JSON.stringify({ credentialId: toB64(cred.rawId), phone, token })
  );
};

export const unlockWithBiometric = async () => {
  const raw = localStorage.getItem(BIO_KEY);
  if (!raw) throw new Error("Biometric unlock is not set up on this device");
  const saved = JSON.parse(raw) as { credentialId: string; phone: string; token: string };

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [{ type: "public-key", id: fromB64(saved.credentialId) }],
      userVerification: "required",
      timeout: 60000,
    },
  });
  if (!assertion) throw new Error("Biometric unlock failed");

  const profile = await fetchCustomerProfile(saved.token);
  if (!profile) {
    disableBiometric();
    throw new Error("Your session expired. Please sign in with your passcode.");
  }
  setCustomerToken(saved.token);
  return saved.token;
};
