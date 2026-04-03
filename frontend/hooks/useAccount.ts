import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changePassword,
  fetchMe,
  getToken,
  updateMe,
  type Account,
} from "@/lib/api/auth";

export type { Account };

export function useAccount() {
  const token = getToken();
  return useQuery<Account, Error>({
    queryKey: ["account"],
    queryFn: () => fetchMe(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation<
    Account,
    Error,
    { name?: string; avatar_url?: string | null }
  >({
    mutationFn: (payload) => {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");
      return updateMe(token, payload);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["account"], updated);
    },
  });
}

export function useChangePassword() {
  return useMutation<void, Error, { current_password: string; new_password: string }>({
    mutationFn: (payload) => {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");
      return changePassword(token, payload);
    },
  });
}
