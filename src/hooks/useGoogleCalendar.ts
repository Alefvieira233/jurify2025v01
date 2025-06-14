
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface GoogleCalendarToken {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
  token_type: string;
}

interface CalendarSettings {
  calendar_enabled: boolean;
  auto_sync: boolean;
  calendar_id: string | null;
  sync_direction: 'jurify_to_google' | 'google_to_jurify' | 'bidirectional';
  notification_enabled: boolean;
}

interface GoogleCalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{ email: string }>;
}

export const useGoogleCalendar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<CalendarSettings | null>(null);

  const GOOGLE_CLIENT_ID = 'your-google-client-id.googleusercontent.com';
  const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar';
  const REDIRECT_URI = `${window.location.origin}/auth/google/callback`;

  const initializeGoogleAuth = useCallback(() => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(GOOGLE_SCOPES)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${user?.id}`;
    
    window.location.href = authUrl;
  }, [user?.id]);

  const refreshAccessToken = useCallback(async (refreshToken: string) => {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) throw new Error('Failed to refresh token');
      
      const data = await response.json();
      
      // Atualizar token no banco
      await supabase
        .from('google_calendar_tokens')
        .update({
          access_token: data.access_token,
          expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString()
        })
        .eq('user_id', user?.id);

      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }, [user?.id]);

  const getValidAccessToken = useCallback(async () => {
    if (!user?.id) return null;

    const { data: tokenData } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!tokenData) return null;

    // Verificar se token está expirado
    const isExpired = new Date(tokenData.expires_at) <= new Date();
    
    if (isExpired) {
      return await refreshAccessToken(tokenData.refresh_token);
    }

    return tokenData.access_token;
  }, [user?.id, refreshAccessToken]);

  const createCalendarEvent = useCallback(async (eventData: GoogleCalendarEvent, agendamentoId: string) => {
    try {
      setLoading(true);
      const accessToken = await getValidAccessToken();
      
      if (!accessToken) {
        throw new Error('No valid access token');
      }

      const { data: settingsData } = await supabase
        .from('google_calendar_settings')
        .select('calendar_id')
        .eq('user_id', user?.id)
        .single();

      const calendarId = settingsData?.calendar_id || 'primary';

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData)
        }
      );

      if (!response.ok) throw new Error('Failed to create calendar event');
      
      const event = await response.json();

      // Atualizar agendamento com google_event_id
      await supabase
        .from('agendamentos')
        .update({ google_event_id: event.id })
        .eq('id', agendamentoId);

      // Log da sincronização
      await supabase
        .from('google_calendar_sync_logs')
        .insert({
          user_id: user?.id,
          agendamento_id: agendamentoId,
          google_event_id: event.id,
          action: 'create',
          status: 'success',
          sync_data: eventData
        });

      toast({
        title: "Evento criado",
        description: "Agendamento sincronizado com Google Calendar.",
      });

      return event;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      
      // Log do erro
      await supabase
        .from('google_calendar_sync_logs')
        .insert({
          user_id: user?.id,
          agendamento_id: agendamentoId,
          action: 'create',
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });

      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar com Google Calendar.",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getValidAccessToken, user?.id, toast]);

  const updateCalendarEvent = useCallback(async (googleEventId: string, eventData: GoogleCalendarEvent, agendamentoId: string) => {
    try {
      setLoading(true);
      const accessToken = await getValidAccessToken();
      
      if (!accessToken) throw new Error('No valid access token');

      const { data: settingsData } = await supabase
        .from('google_calendar_settings')
        .select('calendar_id')
        .eq('user_id', user?.id)
        .single();

      const calendarId = settingsData?.calendar_id || 'primary';

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${googleEventId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventData)
        }
      );

      if (!response.ok) throw new Error('Failed to update calendar event');
      
      const event = await response.json();

      // Log da sincronização
      await supabase
        .from('google_calendar_sync_logs')
        .insert({
          user_id: user?.id,
          agendamento_id: agendamentoId,
          google_event_id: googleEventId,
          action: 'update',
          status: 'success',
          sync_data: eventData
        });

      toast({
        title: "Evento atualizado",
        description: "Agendamento atualizado no Google Calendar.",
      });

      return event;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      
      await supabase
        .from('google_calendar_sync_logs')
        .insert({
          user_id: user?.id,
          agendamento_id: agendamentoId,
          google_event_id: googleEventId,
          action: 'update',
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });

      toast({
        title: "Erro na atualização",
        description: "Não foi possível atualizar evento no Google Calendar.",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getValidAccessToken, user?.id, toast]);

  const deleteCalendarEvent = useCallback(async (googleEventId: string, agendamentoId: string) => {
    try {
      setLoading(true);
      const accessToken = await getValidAccessToken();
      
      if (!accessToken) throw new Error('No valid access token');

      const { data: settingsData } = await supabase
        .from('google_calendar_settings')
        .select('calendar_id')
        .eq('user_id', user?.id)
        .single();

      const calendarId = settingsData?.calendar_id || 'primary';

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${googleEventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to delete calendar event');
      }

      // Log da sincronização
      await supabase
        .from('google_calendar_sync_logs')
        .insert({
          user_id: user?.id,
          agendamento_id: agendamentoId,
          google_event_id: googleEventId,
          action: 'delete',
          status: 'success'
        });

      toast({
        title: "Evento removido",
        description: "Agendamento removido do Google Calendar.",
      });

    } catch (error) {
      console.error('Error deleting calendar event:', error);
      
      await supabase
        .from('google_calendar_sync_logs')
        .insert({
          user_id: user?.id,
          agendamento_id: agendamentoId,
          google_event_id: googleEventId,
          action: 'delete',
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });

      toast({
        title: "Erro na remoção",
        description: "Não foi possível remover evento do Google Calendar.",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getValidAccessToken, user?.id, toast]);

  const loadSettings = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data } = await supabase
        .rpc('get_user_calendar_settings', { user_id: user.id })
        .single();

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, [user?.id]);

  const updateSettings = useCallback(async (newSettings: Partial<CalendarSettings>) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('google_calendar_settings')
        .upsert({
          user_id: user.id,
          ...newSettings
        });

      if (error) throw error;

      await loadSettings();
      
      toast({
        title: "Configurações salvas",
        description: "Suas preferências de integração foram atualizadas.",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    }
  }, [user?.id, loadSettings, toast]);

  const disconnectGoogle = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Remover tokens
      await supabase
        .from('google_calendar_tokens')
        .delete()
        .eq('user_id', user.id);

      // Desabilitar integração
      await updateSettings({ calendar_enabled: false });

      toast({
        title: "Desconectado",
        description: "Integração com Google Calendar foi desabilitada.",
      });
    } catch (error) {
      console.error('Error disconnecting Google:', error);
      toast({
        title: "Erro",
        description: "Não foi possível desconectar do Google Calendar.",
        variant: "destructive",
      });
    }
  }, [user?.id, updateSettings, toast]);

  return {
    loading,
    settings,
    initializeGoogleAuth,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    loadSettings,
    updateSettings,
    disconnectGoogle,
    getValidAccessToken
  };
};
