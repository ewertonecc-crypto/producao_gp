import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConvitePayload {
  nome: string;
  email: string;
  cargo?: string;
  departamento?: string;
  papel_global?: "admin" | "gerente" | "membro" | "visualizador";
}

export function useConvidarUsuario() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ConvitePayload) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Você precisa estar logado");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/convidar-usuario`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Erro ao enviar convite");
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
