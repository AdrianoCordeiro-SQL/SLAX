import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createUser,
  deleteUser,
  fetchActivity,
  type Activity,
  type CreateUserInput,
} from "@/lib/api/activity";

export type { Activity };

export function useActivity() {
  return useQuery<Activity, Error>({
    queryKey: ["activity"],
    queryFn: fetchActivity,
    staleTime: 15 * 1000,
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, CreateUserInput>({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });
}
