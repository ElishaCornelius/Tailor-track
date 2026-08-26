import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ActivityEntry {
  id: string;
  actor_label: string | null;
  action: string;
  entity_type: string;
  entity_label: string | null;
  details: Record<string, { from?: unknown; to?: unknown } | unknown> | null;
  authorized: boolean;
  created_at: string;
}

const entityName = (type: string) => {
  if (type === "jobs") return "Job";
  if (type === "customers") return "Customer";
  if (type === "security") return "Security";
  return type;
};

const fieldName = (key: string) =>
  key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const describe = (entry: ActivityEntry) => {
  const who = entry.actor_label || "Someone";
  const what = `${entityName(entry.entity_type)}${
    entry.entity_label ? ` "${entry.entity_label}"` : ""
  }`;
  if (entry.entity_type === "security") {
    return `${who} attempted "${entry.entity_label}" — blocked`;
  }
  return `${who} ${entry.action} ${what}`;
};

const Notifications = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/admin/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchEntries = async () => {
      const { data } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      setEntries((data as unknown as ActivityEntry[]) ?? []);
      setLoading(false);
    };

    fetchEntries();

    const channel = supabase
      .channel("activity-log-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_log" },
        (payload) =>
          setEntries((prev) => [payload.new as ActivityEntry, ...prev]),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center text-sm hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            Notifications
          </h1>
          <p className="text-muted-foreground">
            Every change made on your account — authorised or not.
          </p>
        </div>

        <Card className="p-6 shadow-luxury">
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 border rounded-lg flex flex-col gap-1"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{describe(entry)}</p>
                    {entry.authorized ? (
                      <Badge variant="secondary">{entry.action}</Badge>
                    ) : (
                      <Badge variant="destructive" className="shrink-0">
                        <ShieldAlert className="w-3 h-3 mr-1" />
                        Unauthorised
                      </Badge>
                    )}
                  </div>
                  {entry.details &&
                    Object.keys(entry.details).length > 0 &&
                    Object.entries(entry.details).map(([key, value]) => {
                      const change = value as { from?: unknown; to?: unknown };
                      return (
                        <p
                          key={key}
                          className="text-sm text-muted-foreground"
                        >
                          {change && typeof change === "object" && "to" in change
                            ? `${fieldName(key)}: ${String(
                                change.from ?? "—",
                              )} → ${String(change.to ?? "—")}`
                            : `${fieldName(key)}: ${String(value)}`}
                        </p>
                      );
                    })}
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default Notifications;
