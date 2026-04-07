import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createUser,
  deleteUser,
  fetchUserActivity,
  fetchUsers,
  updateUser,
  type CreateUserInput,
  type EditUserInput,
  type UserActivityItem,
  type Users,
} from "@/lib/api/users";

// Hooks React Query de usuários para listagem, mutações e histórico por usuário.

export type { Users };

export function useUsers() {
  return useQuery<Users, Error>({
    queryKey: ["users"],
    queryFn: fetchUsers,
    staleTime: 15 * 1000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, CreateUserInput>({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { id: number; input: EditUserInput }>({
    mutationFn: ({ id, input }) => updateUser(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useUserActivity(userId: number | null) {
  return useQuery<UserActivityItem[], Error>({
    queryKey: ["user-activity", userId],
    queryFn: () => {
      if (userId === null) {
        throw new Error("Usuário não informado para carregar histórico");
      }
      return fetchUserActivity(userId);
    },
    enabled: userId !== null,
    staleTime: 15_000,
  });
}
