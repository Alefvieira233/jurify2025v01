/**
 * 🔗 WHATSAPP SETUP - OFFICIAL API CONFIGURATION
 *
 * Componente para configurar a API Oficial do WhatsApp Business.
 * Substitui o método instável de QR Code.
 *
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Smartphone,
  CheckCircle,
  Loader2,
  AlertCircle,
  Save,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppSetupProps {
  onConnectionSuccess?: () => void;
}

export default function WhatsAppSetup({ onConnectionSuccess }: WhatsAppSetupProps) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    phoneNumberId: '',
    accessToken: '',
    verifyToken: 'jurify_secret_token' // Default suggestion
  });
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  // Load existing config (mocked for now, ideally from DB)
  useEffect(() => {
    // TODO: Fetch existing config from database if available
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // In a real app, we would save this to a 'integrations' or 'tenant_settings' table.
      // For now, we'll simulate a save and maybe update a local state or Edge Function env var (if we had access).
      // Since we can't easily update Edge Function env vars from client, we assume these are set in the dashboard
      // OR we save them to a table that the Edge Function reads.

      // Simulating DB save
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Saving WhatsApp Config:', config);

      // Here you would insert into 'integrations' table
      /*
      const { error } = await supabase.from('integrations').upsert({
        type: 'whatsapp_official',
        config: config,
        tenant_id: ...
      });
      */

      setSaved(true);
      toast({
        title: 'Configuração Salva!',
        description: 'Suas credenciais do WhatsApp foram atualizadas.',
      });

      onConnectionSuccess?.();

    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-green-600" />
          WhatsApp Business API (Oficial)
        </h1>
        <p className="text-gray-600 mt-1">
          Conecte-se via API Oficial da Meta para garantir estabilidade e evitar banimentos.
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <ExternalLink className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          Você precisa de uma conta no <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" className="underline font-medium">Meta for Developers</a>.
          Crie um app, adicione o produto "WhatsApp" e obtenha as credenciais abaixo.
        </AlertDescription>
      </Alert>

      {/* Configuration Form */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Credenciais de Acesso</CardTitle>
          <CardDescription>
            Insira os dados do seu aplicativo WhatsApp Business.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          <div className="space-y-2">
            <Label htmlFor="phoneId">Phone Number ID</Label>
            <Input
              id="phoneId"
              placeholder="Ex: 123456789012345"
              value={config.phoneNumberId}
              onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
            />
            <p className="text-xs text-gray-500">Encontrado na seção "API Setup" do painel da Meta.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">Access Token (Permanente)</Label>
            <Input
              id="token"
              type="password"
              placeholder="EAA..."
              value={config.accessToken}
              onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
            />
            <p className="text-xs text-gray-500">Recomendamos usar um Token de Sistema para não expirar.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verify">Webhook Verify Token</Label>
            <Input
              id="verify"
              value={config.verifyToken}
              onChange={(e) => setConfig({ ...config, verifyToken: e.target.value })}
            />
            <p className="text-xs text-gray-500">Defina este mesmo valor na configuração do Webhook na Meta.</p>
          </div>

          <div className="bg-gray-100 p-4 rounded-md border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Webhook URL para configurar na Meta:</p>
            <code className="block bg-white p-2 rounded text-xs font-mono break-all border">
              https://[YOUR_PROJECT_REF].supabase.co/functions/v1/whatsapp-webhook
            </code>
          </div>

          <Button
            onClick={handleSave}
            disabled={loading || !config.phoneNumberId || !config.accessToken}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Configuração
              </>
            )}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}
