import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useNailPro() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: nailPro, isLoading } = useQuery({
    queryKey: ["nail-pro", user?.email],
    queryFn: () => base44.entities.NailPro.filter({ user_email: user.email }, "-created_date", 1).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.NailPro.update(nailPro.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nail-pro"] }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.NailPro.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["nail-pro"] }),
  });

  return {
    user,
    nailPro,
    isLoading: isLoading || !user,
    updateNailPro: updateMutation.mutateAsync,
    createNailPro: createMutation.mutateAsync,
  };
}