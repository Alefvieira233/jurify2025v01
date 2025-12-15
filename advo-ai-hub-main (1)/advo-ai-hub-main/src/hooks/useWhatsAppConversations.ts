import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface WhatsAppConversation {
  id: string;
  lead_id: string | null;
  tenant_id: string;
  user_id: string | null;
  phone_number: string;
  contact_name: string | null;
  status: 'ativo' | 'aguardando' | 'qualificado' | 'finalizado';
  area_juridica: string | null;
  last_message: string | null;
  last_message_at: string;
  unread_count: number;
  ia_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  sender: 'lead' | 'ia' | 'agent';
  content: string;
  message_type: 'text' | 'image' | 'document' | 'audio';
  media_url: string | null;
  read: boolean;
  timestamp: string;
  created_at: string;
}

interface UseWhatsAppConversationsReturn {
  conversations: WhatsAppConversation[];
  messages: WhatsAppMessage[];
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  selectedConversation: WhatsAppConversation | null;
  selectConversation: (id: string) => void;
  sendMessage: (conversationId: string, content: string, sender: 'agent') => Promise<boolean>;
  markAsRead: (conversationId: string) => Promise<void>;
  fetchConversations: () => Promise<void>;
}

export const useWhatsAppConversations = (): UseWhatsAppConversationsReturn => {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch conversas
  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      console.log('📞 [useWhatsAppConversations] Carregando conversas...');
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (fetchError) throw fetchError;

      setConversations(data || []);
      console.log(`✅ [useWhatsAppConversations] ${data?.length || 0} conversas carregadas`);
    } catch (err: any) {
      console.error('❌ [useWhatsAppConversations] Erro ao carregar conversas:', err);
      setError(err.message || 'Erro ao carregar conversas');
      toast({
        title: 'Erro ao carregar conversas',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Fetch mensagens de uma conversa específica
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      console.log(`💬 [useWhatsAppConversations] Carregando mensagens da conversa ${conversationId}...`);

      const { data, error: fetchError } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (fetchError) throw fetchError;

      setMessages(data || []);
      console.log(`✅ [useWhatsAppConversations] ${data?.length || 0} mensagens carregadas`);
    } catch (err: any) {
      console.error('❌ [useWhatsAppConversations] Erro ao carregar mensagens:', err);
      toast({
        title: 'Erro ao carregar mensagens',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Selecionar conversa
  const selectConversation = useCallback((id: string) => {
    const conversation = conversations.find(c => c.id === id);
    if (conversation) {
      setSelectedConversation(conversation);
      fetchMessages(id);
    }
  }, [conversations, fetchMessages]);

  // Enviar mensagem
  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    sender: 'agent'
  ): Promise<boolean> => {
    try {
      const { error: insertError } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversationId,
          sender,
          content,
          message_type: 'text',
          timestamp: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      // Atualizar última mensagem da conversa
      await supabase
        .from('whatsapp_conversations')
        .update({
          last_message: content,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      toast({
        title: 'Mensagem enviada',
        description: 'Sua mensagem foi enviada com sucesso',
      });

      return true;
    } catch (err: any) {
      console.error('❌ [useWhatsAppConversations] Erro ao enviar mensagem:', err);
      toast({
        title: 'Erro ao enviar mensagem',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Marcar como lido
  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      await supabase
        .from('whatsapp_conversations')
        .update({ unread_count: 0 })
        .eq('id', conversationId);

      await supabase
        .from('whatsapp_messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('read', false);

      // Atualizar estado local
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (err: any) {
      console.error('❌ [useWhatsAppConversations] Erro ao marcar como lido:', err);
    }
  }, []);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;

    let conversationsChannel: RealtimeChannel;
    let messagesChannel: RealtimeChannel;

    const setupRealtime = () => {
      // Subscribe a mudanças em conversas
      conversationsChannel = supabase
        .channel('whatsapp_conversations_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'whatsapp_conversations',
          },
          (payload) => {
            console.log('🔄 [useWhatsAppConversations] Mudança em conversa:', payload);

            if (payload.eventType === 'INSERT') {
              setConversations(prev => [payload.new as WhatsAppConversation, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setConversations(prev =>
                prev.map(conv =>
                  conv.id === payload.new.id
                    ? (payload.new as WhatsAppConversation)
                    : conv
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setConversations(prev => prev.filter(conv => conv.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      // Subscribe a mudanças em mensagens
      messagesChannel = supabase
        .channel('whatsapp_messages_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'whatsapp_messages',
          },
          (payload) => {
            console.log('🔄 [useWhatsAppConversations] Nova mensagem:', payload);

            if (payload.eventType === 'INSERT') {
              const newMessage = payload.new as WhatsAppMessage;
              if (selectedConversation && newMessage.conversation_id === selectedConversation.id) {
                setMessages(prev => [...prev, newMessage]);
              }
            }
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      conversationsChannel?.unsubscribe();
      messagesChannel?.unsubscribe();
    };
  }, [user, selectedConversation]);

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Auto-select first conversation
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      selectConversation(conversations[0].id);
    }
  }, [conversations, selectedConversation, selectConversation]);

  const isEmpty = conversations.length === 0;

  return {
    conversations,
    messages,
    loading,
    error,
    isEmpty,
    selectedConversation,
    selectConversation,
    sendMessage,
    markAsRead,
    fetchConversations,
  };
};
