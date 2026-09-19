/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import type { CareerSession } from "@/lib/career-types";
import { getCareerSession } from "@/lib/career.functions";
import { getSessionKey } from "@/lib/session-key";

export function useSessionKey() {
  const [key, setKey] = useState("");
  useEffect(() => {
    setKey(getSessionKey());
  }, []);
  return key;
}

export function useCareerSession() {
  const sessionKey = useSessionKey();
  const query = useQuery({
    queryKey: ["career-session", sessionKey],
    enabled: !!sessionKey,
    queryFn: () => getCareerSession({ data: { sessionKey } }),
  });
  return { sessionKey, ...query };
}

type SessionServerFn = (opts: { data: any }) => Promise<any>;

/** Wraps a server function that returns the updated session and refreshes the cache. */
export function useSessionMutation<F extends SessionServerFn>(
  fn: F,
  options?: { successMessage?: string },
) {
  const sessionKey = useSessionKey();
  const queryClient = useQueryClient();

  return useMutation<CareerSession, Error, Omit<Parameters<F>[0]["data"], "sessionKey">>({
    mutationFn: async (input) => {
      if (!sessionKey) throw new Error("Session not ready yet.");
      return (await fn({ data: { ...(input as object), sessionKey } })) as CareerSession;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["career-session", sessionKey], data);
      if (options?.successMessage) toast.success(options.successMessage);
    },
    onError: (error: Error) => toast.error(error.message || "Something went wrong."),
  });
}
