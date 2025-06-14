
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Notification = Database['public']['Tables']['notificacoes']['Row'];
type NotificationType = Database['public']['Enums']['notification_type'];

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Buscar notificações
  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('ativo', true)
        .order('data_criacao', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);

      // Calcular não lidas
      const unread = (data || []).filter(n => 
        !n.lido_por?.includes(user.id)
      ).length;
      setUnreadCount(unread);

    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as notificações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Marcar como lida
  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .rpc('marcar_notificacao_lida', {
          notificacao_id: notificationId,
          user_id: user.id
        });

      if (error) throw error;
      
      if (data) {
        // Atualizar estado local
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, lido_por: [...(n.lido_por || []), user.id] }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .rpc('marcar_todas_lidas', { user_id: user.id });

      if (error) throw error;

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => ({
          ...n,
          lido_por: [...(n.lido_por || []), user.id]
        }))
      );
      setUnreadCount(0);

      toast({
        title: "Sucesso",
        description: `${data} notificação(ões) marcada(s) como lida(s).`
      });
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar todas como lidas.",
        variant: "destructive"
      });
    }
  };

  // Criar notificação
  const createNotification = async (
    titulo: string, 
    mensagem: string, 
    tipo: NotificationType = 'info'
  ) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('notificacoes')
        .insert({
          titulo,
          mensagem,
          tipo,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Notificação criada",
        description: "A notificação foi criada com sucesso."
      });

      // Recarregar notificações
      await fetchNotifications();
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a notificação.",
        variant: "destructive"
      });
    }
  };

  // Verificar se usuário leu a notificação
  const isRead = (notification: Notification): boolean => {
    return user?.id ? notification.lido_por?.includes(user.id) || false : false;
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.id]);

  return {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    isRead
  };
};
