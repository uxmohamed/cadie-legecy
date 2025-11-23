"use client";

import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import * as React from "react";

export function useAuth() {
  const [user, setUser] = React.useState<User | null>(null);
  const [authChecked, setAuthChecked] = React.useState(false);

  React.useEffect(() => {
    const supabase = createClient();

    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setAuthChecked(true);
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setAuthChecked(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, authChecked };
}
