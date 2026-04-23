"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { getAuthCallbackUrl } from "@/lib/env";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type AccountSettingsProps = {
  email: string | null | undefined;
};

type Identity = {
  provider?: string;
  identity_id?: string;
};

export function AccountSettings({ email }: AccountSettingsProps) {
  const searchParams = useSearchParams();
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [linking, setLinking] = useState(false);
  const linkedProvider = searchParams.get("linked") ?? "";

  const githubLinked = useMemo(
    () => identities.some((identity) => identity.provider === "github"),
    [identities],
  );

  useEffect(() => {
    let active = true;

    async function loadIdentities() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.getUserIdentities();

        if (!active) return;

        if (error) {
          setError(error.message);
          setIdentities([]);
          return;
        }

        setIdentities((data?.identities ?? []) as Identity[]);
      } catch (error) {
        if (!active) return;
        setError(error instanceof Error ? error.message : "Unable to load linked identities.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadIdentities();

    return () => {
      active = false;
    };
  }, []);

  async function connectGitHub() {
    setError("");
    setLinking(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.linkIdentity({
        provider: "github",
        options: {
          redirectTo: getAuthCallbackUrl("/dashboard/account?linked=github"),
        },
      });

      if (error) {
        setError(
          error.message.includes("manual linking")
            ? "GitHub linking not enabled in Supabase. Turn on manual linking to use this button."
            : error.message,
        );
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to link GitHub.");
    } finally {
      setLinking(false);
    }
  }

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-sm text-muted-foreground">Signed in as {email ?? "your account"}.</p>
      </div>

      <div className="space-y-2 text-sm">
        <p>GitHub status: {githubLinked ? "linked" : "not linked"}</p>
        <p className="text-muted-foreground">
          {loading ? "Loading identities..." : `${identities.length} linked identity(s).`}
        </p>
      </div>

      {linkedProvider === "github" ? (
        <p className="text-sm text-emerald-600">GitHub connected.</p>
      ) : null}

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <button
        type="button"
        onClick={connectGitHub}
        disabled={linking}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {linking ? "Connecting GitHub..." : githubLinked ? "Reconnect GitHub" : "Connect GitHub"}
      </button>
    </div>
  );
}
