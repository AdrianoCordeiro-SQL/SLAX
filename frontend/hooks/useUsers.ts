import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createUser,
  deleteUser,
  fetchUsers,
  updateUser,
  type CreateUserInput,
  type EditUserInput,
  type Users,
} from "@/lib/api/users";

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
