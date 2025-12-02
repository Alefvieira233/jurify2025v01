
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  template: string;
  event_type: string;
  is_active: boolean;
  roles_enabled: string[];
}

export const useNotificationTemplates = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('event_type');

      if (error) throw error;
      return data as NotificationTemplate[];
    }
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (template: Partial<NotificationTemplate> & { id: string }) => {
      const { error } = await supabase
        .from('notification_templates')
        .update(template)
        .eq('id', template.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast({
        title: "Template atualizado",
        description: "O template foi salvo com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao salvar template.",
        variant: "destructive",
      });
      console.error('Erro ao atualizar template:', error);
    }
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (template: Omit<NotificationTemplate, 'id'>) => {
      const { error } = await supabase
        .from('notification_templates')
        .insert({ ...template, created_by: user?.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast({
        title: "Template criado",
        description: "O template foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar template.",
        variant: "destructive",
      });
      console.error('Erro ao criar template:', error);
    }
  });

  return {
    templates,
    isLoading,
    updateTemplate: updateTemplateMutation.mutate,
    createTemplate: createTemplateMutation.mutate,
    isUpdating: updateTemplateMutation.isPending || createTemplateMutation.isPending
  };
};
