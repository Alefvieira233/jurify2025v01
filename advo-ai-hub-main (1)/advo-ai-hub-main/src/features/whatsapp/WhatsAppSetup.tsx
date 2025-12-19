/**
 * 🔗 WHATSAPP SETUP - CONFIGURAÇÃO INICIAL
 *
 * Componente para vincular WhatsApp via QR Code.
 * Permite conectar uma nova sessão do WhatsApp Web.
 *
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  QrCode,
  Smartphone,
  CheckCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppSetupProps {
  onConnectionSuccess?: () => void;
}

export default function WhatsAppSetup({ onConnectionSuccess }: WhatsAppSetupProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'generating' | 'waiting' | 'connected'>('idle');
  const { toast } = useToast();

  const generateQRCode = async () => {
    setLoading(true);
    setError(null);
    setStatus('generating');

    try {
      console.log('📱 [WhatsApp Setup] Gerando QR Code...');

      // Chamar Edge Function para gerar QR Code
      const { data, error: functionError } = await supabase.functions.invoke('whatsapp-generate-qr', {
        body: {}
      });

      if (functionError) {
        throw functionError;
      }

      if (!data?.qrCode) {
        throw new Error('QR Code não foi gerado pelo servidor');
      }

      setQrCode(data.qrCode);
      setStatus('waiting');

      console.log('✅ [WhatsApp Setup] QR Code gerado com sucesso');

      // Iniciar polling para verificar conexão
      startConnectionPolling(data.sessionId);

    } catch (err: any) {
      console.error('❌ [WhatsApp Setup] Erro ao gerar QR Code:', err);
      setError(err.message || 'Erro ao gerar QR Code');
      setStatus('idle');

      toast({
        title: 'Erro ao gerar QR Code',
        description: err.message || 'Tente novamente em alguns instantes.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const startConnectionPolling = (sessionId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('whatsapp_sessions')
          .select('status')
          .eq('id', sessionId)
          .single();

        if (data?.status === 'connected') {
          clearInterval(pollInterval);
          setStatus('connected');

          toast({
            title: 'WhatsApp conectado!',
            description: 'Sua sessão foi vinculada com sucesso.',
          });

          setTimeout(() => {
            onConnectionSuccess?.();
          }, 2000);
        }
      } catch (err) {
        console.error('Erro no polling:', err);
      }
    }, 3000); // Verifica a cada 3 segundos

    // Limpar após 5 minutos
    setTimeout(() => {
      clearInterval(pollInterval);
      if (status === 'waiting') {
        setError('Tempo esgotado. Por favor, gere um novo QR Code.');
        setStatus('idle');
      }
    }, 300000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Smartphone className="h-7 w-7" />
          Conectar WhatsApp
        </h1>
        <p className="text-gray-600 mt-1">
          Vincule sua conta do WhatsApp para começar a atender leads automaticamente
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Como funciona:</strong> Após gerar o QR Code, abra o WhatsApp no seu celular,
          vá em <strong>Configurações → Aparelhos conectados → Conectar um aparelho</strong> e
          escaneie o código abaixo.
        </AlertDescription>
      </Alert>

      {/* QR Code Card */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code de Vinculação
          </CardTitle>
          <CardDescription>
            Escaneie este código com seu WhatsApp para conectar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code Display */}
          <div className="flex justify-center items-center bg-gray-50 rounded-lg p-8 min-h-[300px]">
            {status === 'idle' && (
              <div className="text-center">
                <QrCode className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Clique no botão abaixo para gerar o QR Code</p>
              </div>
            )}

            {status === 'generating' && (
              <div className="text-center">
                <Loader2 className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Gerando QR Code...</p>
              </div>
            )}

            {status === 'waiting' && qrCode && (
              <div className="text-center">
                <img
                  src={qrCode}
                  alt="QR Code WhatsApp"
                  className="w-64 h-64 mx-auto border-4 border-green-500 rounded-lg"
                />
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 text-green-500 animate-spin" />
                  <p className="text-gray-600">Aguardando leitura do QR Code...</p>
                </div>
              </div>
            )}

            {status === 'connected' && (
              <div className="text-center">
                <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-900 mb-2">Conectado!</h3>
                <p className="text-gray-600">Redirecionando para o painel...</p>
              </div>
            )}

            {error && (
              <div className="text-center">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <p className="text-red-700 font-medium mb-2">Erro na conexão</p>
                <p className="text-gray-600 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            {status === 'idle' && (
              <Button
                onClick={generateQRCode}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Gerar QR Code
                  </>
                )}
              </Button>
            )}

            {(status === 'waiting' || error) && (
              <Button
                onClick={generateQRCode}
                variant="outline"
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Gerar Novo QR Code
              </Button>
            )}
          </div>

          {/* Instructions */}
          {status === 'waiting' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">⏱️ Atenção:</h4>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>O QR Code expira em 5 minutos</li>
                <li>Certifique-se de que seu celular tem internet</li>
                <li>Mantenha esta aba aberta até concluir a conexão</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="max-w-2xl mx-auto bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">Precisa de ajuda?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <strong>Não consigo escanear o QR Code:</strong>
              <p>Verifique se o WhatsApp no seu celular está atualizado e tente gerar um novo código.</p>
            </div>
            <div>
              <strong>O código expira muito rápido:</strong>
              <p>É normal! Por segurança, QR Codes expiram em 5 minutos. Basta gerar outro.</p>
            </div>
            <div>
              <strong>Erro ao gerar QR Code:</strong>
              <p>Verifique se a Edge Function 'whatsapp-generate-qr' está configurada no Supabase.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
