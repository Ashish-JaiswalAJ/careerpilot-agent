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

/** Wraps a server function that returns the updated session and refreshes the cache. */
export function useSessionMutation<TInput>(
  fn: (input: TInput & { sessionKey: string }) => Promise<unknown>,
  options?: { successMessage?: string },
) {
  const sessionKey = useSessionKey();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TInput) => {
      if (!sessionKey) throw new Error("Session not ready yet.");
      return (await fn({ ...(input as object), sessionKey } as TInput & {
        sessionKey: string;
      })) as CareerSession;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["career-session", sessionKey], data);
      if (options?.successMessage) toast.success(options.successMessage);
    },
    onError: (error: Error) => toast.error(error.message || "Something went wrong."),
  });
}
