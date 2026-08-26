import { supabase } from "@/integrations/supabase/client";

interface LogActivityInput {
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  details?: Record<string, unknown>;
  authorized?: boolean;
}

/**
 * Writes an entry to the activity log for the current admin's company.
 * Database triggers already log job/customer changes — this is for
 * app-level events (blocked attempts, sign-ins, etc.).
 */
export const logActivity = async ({
  action,
  entityType,
  entityId = null,
  entityLabel = null,
  details = {},
  authorized = true,
}: LogActivityInput) => {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.company_id) return;

  const actorLabel =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    user.email ||
    "Admin";

  await supabase.from("activity_log").insert({
    company_id: profile.company_id,
    actor_id: user.id,
    actor_label: actorLabel,
    action,
    entity_type: entityType,
    entity_id: entityId,
    entity_label: entityLabel,
    details: details as never,
    authorized,
  });
};
