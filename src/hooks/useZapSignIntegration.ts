
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseZapSignIntegrationReturn {
  isLoading: boolean;
  gerarLinkAssinatura: (contratoId: string, contractData: any) => Promise<boolean>;
  verificarStatusAssinatura: (contratoId: string) => Promise<void>;
  enviarViaWhatsApp: (contratoId: string, telefone: string, nomeCliente: string, linkAssinatura: string) => Promise<boolean>;
}

export const useZapSignIntegration = (): UseZapSignIntegrationReturn => {
  const [isLoading, setIsLoading] = useState(false);

  const gerarLinkAssinatura = async (contratoId: string, contractData: any): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('zapsign-integration', {
        body: {
          action: 'create_document',
          contratoId,
          contractData
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Link de assinatura gerado com sucesso!');
        return true;
      } else {
        throw new Error(data.error || 'Erro ao gerar link');
      }
    } catch (error) {
      console.error('Erro ao gerar link ZapSign:', error);
      toast.error(`Erro ao gerar link: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verificarStatusAssinatura = async (contratoId: string): Promise<void> => {
    try {
      const { data, error } = await supabase.functions.invoke('zapsign-integration', {
        body: {
          action: 'check_status',
          contratoId
        }
      });

      if (error) throw error;

      if (data.success) {
        console.log('Status atualizado:', data.status);
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      toast.error(`Erro ao verificar status: ${error.message}`);
    }
  };

  const enviarViaWhatsApp = async (
    contratoId: string, 
    telefone: string, 
    nomeCliente: string, 
    linkAssinatura: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-contract', {
        body: {
          contratoId,
          telefone,
          nomeCliente,
          linkAssinatura
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Link enviado via WhatsApp com sucesso!');
        return true;
      } else {
        throw new Error(data.error || 'Erro ao enviar via WhatsApp');
      }
    } catch (error) {
      console.error('Erro ao enviar via WhatsApp:', error);
      toast.error(`Erro ao enviar: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    gerarLinkAssinatura,
    verificarStatusAssinatura,
    enviarViaWhatsApp
  };
};
