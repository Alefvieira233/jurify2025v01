/**
 * 📅 HOOK: GOOGLE CALENDAR INTEGRATION
 *
 * Gerencia integração com Google Calendar via OAuth2.
 * VERSÃO REAL - Não usa mock data.
 *
 * @version 2.0.0 (OAuth Real)
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { GoogleOAuthService, type CalendarEvent } from '@/lib/google/GoogleOAuthService';
import type { Database } from '@/integrations/supabase/types';

export type GoogleCalendarSettings = Database['public']['Tables']['google_calendar_settings']['Row'];

export const useGoogleCalendar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<GoogleCalendarSettings | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [calendars, setCalendars] = useState<any[]>([]);

  // Verificar se OAuth está configurado
  const isOAuthConfigured = GoogleOAuthService.isConfigured();

  // ==========================================
  // CONFIGURAÇÕES
  // ==========================================

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
        // Criar configurações padrão
        const defaultSettings = {
          user_id: user.id,
          calendar_enabled: false,
          auto_sync: true,
          sync_direction: 'jurify_to_google' as const,
          notification_enabled: true,
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

      // Verificar se usuário está autenticado
      const token = await GoogleOAuthService.loadTokens(user.id);
      setIsAuthenticated(!!token);

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

  // ==========================================
  // AUTENTICAÇÃO OAUTH
  // ==========================================

  const initializeGoogleAuth = useCallback(async () => {
    if (!user?.id) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado.',
        variant: 'destructive',
      });
      return;
    }

    if (!isOAuthConfigured) {
      toast({
        title: 'Configuração Necessária',
        description: 'Configure VITE_GOOGLE_CLIENT_ID e VITE_GOOGLE_CLIENT_SECRET no arquivo .env',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('🔄 [useGoogleCalendar] Iniciando autenticação OAuth...');

      // Gerar state criptográfico seguro (não usar user.id - previsível!)
      const cryptoState = Array.from(
        crypto.getRandomValues(new Uint8Array(32))
      ).map(b => b.toString(16).padStart(2, '0')).join('');

      // Gerar URL de autenticação
      const authUrl = GoogleOAuthService.getAuthUrl(cryptoState);

      // Salvar state no localStorage para validar callback
      localStorage.setItem('google_oauth_state', cryptoState);

      // Redirecionar para Google
      window.location.href = authUrl;

    } catch (error: any) {
      console.error('❌ [useGoogleCalendar] Erro ao iniciar OAuth:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao iniciar autenticação',
        variant: 'destructive',
      });
    }
  }, [user?.id, isOAuthConfigured, toast]);

  const handleOAuthCallback = useCallback(async (code: string, state: string) => {
    if (!user?.id) return false;

    try {
      setLoading(true);
      console.log('🔄 [useGoogleCalendar] Processando callback OAuth...');

      // Validar state
      const savedState = localStorage.getItem('google_oauth_state');
      if (state !== savedState) {
        throw new Error('State inválido. Possível ataque CSRF.');
      }

      // Trocar código por tokens
      await GoogleOAuthService.exchangeCodeForTokens(code, user.id);

      // Limpar state
      localStorage.removeItem('google_oauth_state');

      // Carregar calendários
      const userCalendars = await GoogleOAuthService.listCalendars(user.id);
      setCalendars(userCalendars);

      // Selecionar calendário primário por padrão
      const primaryCalendar = userCalendars.find(cal => cal.primary);
      if (primaryCalendar) {
        await updateSettings({
          calendar_enabled: true,
          calendar_id: primaryCalendar.id,
        });
      }

      setIsAuthenticated(true);

      toast({
        title: 'Sucesso',
        description: 'Google Calendar conectado com sucesso!',
      });

      return true;

    } catch (error: any) {
      console.error('❌ [useGoogleCalendar] Erro no callback OAuth:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao conectar Google Calendar',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id, updateSettings, toast]);

  const disconnectGoogle = useCallback(async () => {
    if (!user?.id) return false;

    try {
      setLoading(true);
      console.log('🔄 [useGoogleCalendar] Desconectando Google Calendar...');

      // Revogar tokens
      await GoogleOAuthService.revokeTokens(user.id);

      // Desabilitar integração
      await updateSettings({
        calendar_enabled: false,
        calendar_id: null,
      });

      setIsAuthenticated(false);
      setCalendars([]);

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

  // ==========================================
  // OPERAÇÕES DE CALENDÁRIO
  // ==========================================

  const createCalendarEvent = useCallback(async (eventData: any, agendamentoId: string) => {
    if (!user?.id || !settings?.calendar_id) {
      console.warn('⚠️  [useGoogleCalendar] Google Calendar não configurado');
      return null;
    }

    try {
      console.log('📅 [useGoogleCalendar] Criando evento no Google Calendar...');

      // Converter dados do agendamento para formato Google Calendar
      const calendarEvent: CalendarEvent = {
        summary: eventData.titulo || 'Agendamento Jurify',
        description: eventData.descricao || '',
        start: {
          dateTime: new Date(eventData.data_hora).toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: new Date(new Date(eventData.data_hora).getTime() + 60 * 60 * 1000).toISOString(), // +1 hora
          timeZone: 'America/Sao_Paulo',
        },
        attendees: eventData.participantes?.map((email: string) => ({ email })) || [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 dia antes
            { method: 'popup', minutes: 30 }, // 30 min antes
          ],
        },
      };

      // Criar evento via API
      const googleEvent = await GoogleOAuthService.createEvent(
        user.id,
        settings.calendar_id,
        calendarEvent
      );

      // Registrar sincronização
      await supabase.from('google_calendar_sync_logs').insert([{
        user_id: user.id,
        action: 'create',
        agendamento_id: agendamentoId,
        google_event_id: googleEvent.id,
        status: 'success',
        sync_data: calendarEvent,
      }]);

      console.log('✅ [useGoogleCalendar] Evento criado no Google Calendar');

      return googleEvent.id;

    } catch (error: any) {
      console.error('❌ [useGoogleCalendar] Erro ao criar evento:', error);

      // Registrar erro
      await supabase.from('google_calendar_sync_logs').insert([{
        user_id: user.id,
        action: 'create',
        agendamento_id: agendamentoId,
        status: 'error',
        error_message: error.message,
      }]);

      toast({
        title: 'Erro',
        description: 'Não foi possível criar evento no Google Calendar.',
        variant: 'destructive',
      });

      return null;
    }
  }, [user?.id, settings?.calendar_id, toast]);

  const updateCalendarEvent = useCallback(async (googleEventId: string, eventData: any, agendamentoId: string) => {
    if (!user?.id || !settings?.calendar_id) {
      console.warn('⚠️  [useGoogleCalendar] Google Calendar não configurado');
      return false;
    }

    try {
      console.log('📅 [useGoogleCalendar] Atualizando evento no Google Calendar...');

      const calendarEvent: Partial<CalendarEvent> = {
        summary: eventData.titulo,
        description: eventData.descricao,
        start: eventData.data_hora ? {
          dateTime: new Date(eventData.data_hora).toISOString(),
          timeZone: 'America/Sao_Paulo',
        } : undefined,
      };

      await GoogleOAuthService.updateEvent(
        user.id,
        settings.calendar_id,
        googleEventId,
        calendarEvent
      );

      // Registrar sincronização
      await supabase.from('google_calendar_sync_logs').insert([{
        user_id: user.id,
        action: 'update',
        agendamento_id: agendamentoId,
        google_event_id: googleEventId,
        status: 'success',
        sync_data: calendarEvent,
      }]);

      console.log('✅ [useGoogleCalendar] Evento atualizado no Google Calendar');

      return true;

    } catch (error: any) {
      console.error('❌ [useGoogleCalendar] Erro ao atualizar evento:', error);

      await supabase.from('google_calendar_sync_logs').insert([{
        user_id: user.id,
        action: 'update',
        agendamento_id: agendamentoId,
        google_event_id: googleEventId,
        status: 'error',
        error_message: error.message,
      }]);

      return false;
    }
  }, [user?.id, settings?.calendar_id]);

  const deleteCalendarEvent = useCallback(async (googleEventId: string, agendamentoId: string) => {
    if (!user?.id || !settings?.calendar_id) {
      console.warn('⚠️  [useGoogleCalendar] Google Calendar não configurado');
      return false;
    }

    try {
      console.log('📅 [useGoogleCalendar] Deletando evento do Google Calendar...');

      await GoogleOAuthService.deleteEvent(
        user.id,
        settings.calendar_id,
        googleEventId
      );

      // Registrar sincronização
      await supabase.from('google_calendar_sync_logs').insert([{
        user_id: user.id,
        action: 'delete',
        agendamento_id: agendamentoId,
        google_event_id: googleEventId,
        status: 'success',
      }]);

      console.log('✅ [useGoogleCalendar] Evento deletado do Google Calendar');

      return true;

    } catch (error: any) {
      console.error('❌ [useGoogleCalendar] Erro ao deletar evento:', error);

      await supabase.from('google_calendar_sync_logs').insert([{
        user_id: user.id,
        action: 'delete',
        agendamento_id: agendamentoId,
        google_event_id: googleEventId,
        status: 'error',
        error_message: error.message,
      }]);

      return false;
    }
  }, [user?.id, settings?.calendar_id]);

  const loadCalendars = useCallback(async () => {
    if (!user?.id || !isAuthenticated) return;

    try {
      setLoading(true);
      const userCalendars = await GoogleOAuthService.listCalendars(user.id);
      setCalendars(userCalendars);
    } catch (error: any) {
      console.error('❌ [useGoogleCalendar] Erro ao carregar calendários:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isAuthenticated]);

  // ==========================================
  // EFFECTS
  // ==========================================

  useEffect(() => {
    if (user?.id) {
      loadSettings();
    }
  }, [user?.id, loadSettings]);

  // ==========================================
  // RETURN
  // ==========================================

  return {
    // Estado
    loading,
    settings,
    isAuthenticated,
    isOAuthConfigured,
    calendars,

    // Configurações
    loadSettings,
    updateSettings,

    // Autenticação
    initializeGoogleAuth,
    handleOAuthCallback,
    disconnectGoogle,

    // Operações de Calendário
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    loadCalendars,
  };
};
