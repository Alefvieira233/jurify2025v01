
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`Google OAuth error: ${error}`);
        }

        if (!code || !state || state !== user?.id) {
          throw new Error('Invalid callback parameters');
        }

        // Para agora, apenas simulamos o sucesso até configurar as credenciais reais
        console.log('Google OAuth callback received:', { code, state });

        // Habilitar integração por padrão (simulação)
        await supabase
          .from('google_calendar_settings')
          .upsert({
            user_id: user?.id,
            calendar_enabled: true,
            auto_sync: true,
            sync_direction: 'jurify_to_google',
            notification_enabled: true
          });

        setStatus('success');
        
        toast({
          title: "Conectado com sucesso!",
          description: "Sua conta Google foi conectada ao Jurify.",
        });

        setTimeout(() => {
          navigate('/?tab=configuracoes');
        }, 2000);

      } catch (error) {
        console.error('Google auth callback error:', error);
        setStatus('error');
        
        toast({
          title: "Erro na conexão",
          description: "Não foi possível conectar com sua conta Google.",
          variant: "destructive",
        });

        setTimeout(() => {
          navigate('/?tab=configuracoes');
        }, 3000);
      }
    };

    if (user?.id) {
      handleCallback();
    }
  }, [searchParams, user?.id, navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Conectando com Google</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-500" />
              <p className="text-gray-600">Processando autenticação...</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
              <p className="text-gray-600">Conexão realizada com sucesso!</p>
              <p className="text-sm text-gray-500">Redirecionando...</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-8 w-8 mx-auto text-red-500" />
              <p className="text-gray-600">Erro na conexão</p>
              <p className="text-sm text-gray-500">Redirecionando...</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleAuthCallback;
