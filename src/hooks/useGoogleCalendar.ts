
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

export type GoogleCalendarSettings = Database['public']['Tables']['google_calendar_settings']['Row'];

export const useGoogleCalendar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<GoogleCalendarSettings | null>(null);

  const loadSettings = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      console.log('🔄 [useGoogleCalendar] Carregando configurações...');
      
      const { data, error } = await supabase
        .from('google_calendar_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
        console.log('✅ [useGoogleCalendar] Configurações carregadas');
      } else {
        // Criar configurações padrão se não existirem
        const defaultSettings = {
          user_id: user.id,
          calendar_enabled: false,
          auto_sync: true,
          sync_direction: 'jurify_to_google' as const,
          notification_enabled: true
        };

        const { data: newSettings, error: createError } = await supabase
          .from('google_calendar_settings')
          .insert([defaultSettings])
          .select()
          .single();

        if (createError) throw createError;
        
        setSettings(newSettings);
        console.log('✅ [useGoogleCalendar] Configurações padrão criadas');
      }
    } catch (error: any) {
      console.error('❌ [useGoogleCalendar] Erro ao carregar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações do Google Calendar.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const updateSettings = useCallback(async (updates: Partial<GoogleCalendarSettings>) => {
    if (!user?.id || !settings) return false;

    try {
      setLoading(true);
      console.log('🔄 [useGoogleCalendar] Atualizando configurações...');
      
      const { data, error } = await supabase
        .from('google_calendar_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
      console.log('✅ [useGoogleCalendar] Configurações atualizadas');
      
      toast({
        title: 'Sucesso',
        description: 'Configurações do Google Calendar atualizadas!',
      });

      return true;
    } catch (error: any) {
      console.error('❌ [useGoogleCalendar] Erro ao atualizar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar as configurações.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id, settings, toast]);

  const initializeGoogleAuth = useCallback(() => {
    if (!user?.id) return;

    console.log('🔄 [useGoogleCalendar] Iniciando autenticação Google...');
    
    // Simular processo de autenticação (integração real requer OAuth)
    toast({
      title: 'Integração Google Calendar',
      description: 'Para configurar a integração completa, configure as credenciais OAuth nas configurações do sistema.',
      variant: 'default',
    });

    // Redirect para configuração de integração
    const currentUrl = window.location.origin;
    const redirectUrl = `${currentUrl}/auth/google/callback`;
    
    console.log('📋 [useGoogleCalendar] URL de callback:', redirectUrl);
    
    // Habilitar integração por padrão para demo
    updateSettings({ calendar_enabled: true });
  }, [user?.id, toast, updateSettings]);

  const disconnectGoogle = useCallback(async () => {
    if (!user?.id) return false;

    try {
      setLoading(true);
      console.log('🔄 [useGoogleCalendar] Desconectando Google Calendar...');
      
      // Desabilitar integração
      await updateSettings({ 
        calendar_enabled: false,
        calendar_id: null 
      });
      
      // Remover tokens se existirem
      await supabase
        .from('google_calendar_tokens')
        .delete()
        .eq('user_id', user.id);

      console.log('✅ [useGoogleCalendar] Google Calendar desconectado');
      
      toast({
        title: 'Sucesso',
        description: 'Google Calendar desconectado com sucesso!',
      });

      return true;
    } catch (error: any) {
      console.error('❌ [useGoogleCalendar] Erro ao desconectar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível desconectar o Google Calendar.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast, updateSettings]);

  const createCalendarEvent = useCallback(async (eventData: any, agendamentoId: string) => {
    console.log('📅 [useGoogleCalendar] Simulando criação de evento:', { eventData, agendamentoId });
    
    // Simular log de sincronização
    try {
      await supabase
        .from('google_calendar_sync_logs')
        .insert([{
          user_id: user?.id!,
          action: 'create',
          agendamento_id: agendamentoId,
          status: 'success',
          sync_data: eventData
        }]);

      console.log('✅ [useGoogleCalendar] Evento criado (simulado)');
    } catch (error) {
      console.error('❌ [useGoogleCalendar] Erro ao criar log:', error);
    }
  }, [user?.id]);

  const updateCalendarEvent = useCallback(async (eventId: string, eventData: any, agendamentoId: string) => {
    console.log('📅 [useGoogleCalendar] Simulando atualização de evento:', { eventId, eventData, agendamentoId });
    
    try {
      await supabase
        .from('google_calendar_sync_logs')
        .insert([{
          user_id: user?.id!,
          action: 'update',
          agendamento_id: agendamentoId,
          google_event_id: eventId,
          status: 'success',
          sync_data: eventData
        }]);

      console.log('✅ [useGoogleCalendar] Evento atualizado (simulado)');
    } catch (error) {
      console.error('❌ [useGoogleCalendar] Erro ao criar log:', error);
    }
  }, [user?.id]);

  const deleteCalendarEvent = useCallback(async (eventId: string, agendamentoId: string) => {
    console.log('📅 [useGoogleCalendar] Simulando exclusão de evento:', { eventId, agendamentoId });
    
    try {
      await supabase
        .from('google_calendar_sync_logs')
        .insert([{
          user_id: user?.id!,
          action: 'delete',
          agendamento_id: agendamentoId,
          google_event_id: eventId,
          status: 'success'
        }]);

      console.log('✅ [useGoogleCalendar] Evento excluído (simulado)');
    } catch (error) {
      console.error('❌ [useGoogleCalendar] Erro ao criar log:', error);
    }
  }, [user?.id]);

  return {
    loading,
    settings,
    loadSettings,
    updateSettings,
    initializeGoogleAuth,
    disconnectGoogle,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
  };
};
