
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Circle, 
  Users, 
  Calendar, 
  Bot, 
  Settings,
  PlayCircle,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  optional?: boolean;
}

const OnboardingFlow = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'welcome',
      title: 'Bem-vindo ao Jurify SaaS',
      description: 'Configure seu escritório digital em poucos passos',
      icon: Settings,
      completed: false
    },
    {
      id: 'users',
      title: 'Cadastre Usuários',
      description: 'Adicione sua equipe e configure permissões',
      icon: Users,
      completed: false
    },
    {
      id: 'calendar',
      title: 'Google Calendar',
      description: 'Sincronize seus agendamentos',
      icon: Calendar,
      completed: false,
      optional: true
    },
    {
      id: 'agents',
      title: 'Agentes de IA',
      description: 'Configure seu primeiro agente inteligente',
      icon: Bot,
      completed: false
    },
    {
      id: 'complete',
      title: 'Configuração Completa',
      description: 'Tudo pronto para começar!',
      icon: CheckCircle,
      completed: false
    }
  ]);

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      // Verificar se já completou onboarding
      const { data: settings } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'onboarding_completed')
        .single();

      if (!settings?.value || settings.value === 'false') {
        setShowOnboarding(true);
        await checkStepsCompletion();
      }
    } catch (error) {
      console.error('Erro ao verificar onboarding:', error);
      setShowOnboarding(true);
    }
  };

  const checkStepsCompletion = async () => {
    try {
      // Verificar usuários cadastrados
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Verificar agentes IA
      const { count: agentsCount } = await supabase
        .from('agentes_ia')
        .select('*', { count: 'exact' });

      // Verificar Google Calendar
      const { data: calendarSettings } = await supabase
        .from('google_calendar_settings')
        .select('calendar_enabled')
        .eq('user_id', user?.id)
        .single();

      setSteps(prev => prev.map(step => {
        switch (step.id) {
          case 'welcome':
            return { ...step, completed: true };
          case 'users':
            return { ...step, completed: (usersCount || 0) > 1 };
          case 'calendar':
            return { ...step, completed: calendarSettings?.calendar_enabled || false };
          case 'agents':
            return { ...step, completed: (agentsCount || 0) > 0 };
          case 'complete':
            return { ...step, completed: false };
          default:
            return step;
        }
      }));
    } catch (error) {
      console.error('Erro ao verificar steps:', error);
    }
  };

  const completeOnboarding = async () => {
    try {
      // Marcar onboarding como completo
      await supabase
        .from('system_settings')
        .upsert({
          key: 'onboarding_completed',
          value: 'true',
          category: 'sistema',
          description: 'Onboarding completo'
        });

      setShowOnboarding(false);
      toast({
        title: "Configuração Completa!",
        description: "Seu escritório digital está pronto para uso.",
      });
    } catch (error) {
      console.error('Erro ao completar onboarding:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração.",
        variant: "destructive",
      });
    }
  };

  const getProgressPercentage = () => {
    const completedSteps = steps.filter(step => step.completed).length;
    return (completedSteps / steps.length) * 100;
  };

  const goToStep = (stepId: string) => {
    switch (stepId) {
      case 'users':
        window.location.href = '/?tab=usuarios';
        break;
      case 'calendar':
        window.location.href = '/?tab=integracoes';
        break;
      case 'agents':
        window.location.href = '/?tab=agentes';
        break;
      default:
        break;
    }
  };

  if (!showOnboarding) return null;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const allRequiredCompleted = steps.filter(s => !s.optional).every(s => s.completed);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-600">
            Configuração Inicial
          </CardTitle>
          <div className="mt-4">
            <Progress value={getProgressPercentage()} className="h-2" />
            <p className="text-sm text-gray-600 mt-2">
              {Math.round(getProgressPercentage())}% concluído
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStepData.id === 'welcome' && (
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold">
                Bem-vindo ao Jurify SaaS!
              </h3>
              <p className="text-gray-600">
                Olá, <strong>{profile?.nome_completo}</strong>! 
                Vamos configurar seu escritório digital em alguns passos simples.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">O que você vai configurar:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Cadastro de usuários e permissões</li>
                  <li>• Integração com Google Calendar</li>
                  <li>• Configuração de agentes de IA</li>
                  <li>• Personalização do sistema</li>
                </ul>
              </div>
            </div>
          )}

          {currentStepData.id !== 'welcome' && currentStepData.id !== 'complete' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <currentStepData.icon className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="text-xl font-semibold">{currentStepData.title}</h3>
                  <p className="text-gray-600">{currentStepData.description}</p>
                  {currentStepData.optional && (
                    <Badge variant="secondary" className="mt-1">Opcional</Badge>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <Button 
                  onClick={() => goToStep(currentStepData.id)}
                  className="w-full"
                  variant={currentStepData.completed ? "outline" : "default"}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {currentStepData.completed ? 'Revisar Configuração' : 'Configurar Agora'}
                </Button>
              </div>

              {currentStepData.completed && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Configuração completa</span>
                </div>
              )}
            </div>
          )}

          {currentStepData.id === 'complete' && (
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-green-600">
                Configuração Completa!
              </h3>
              <p className="text-gray-600">
                Parabéns! Seu Jurify SaaS está configurado e pronto para uso.
              </p>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Próximos passos:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Explore o dashboard principal</li>
                  <li>• Cadastre seus primeiros leads</li>
                  <li>• Teste os agentes de IA</li>
                  <li>• Configure integrações adicionais</li>
                </ul>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={() => window.open('/docs', '_blank')}
                  variant="outline"
                  size="sm"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Ver Tutorial
                </Button>
                <Button 
                  onClick={completeOnboarding}
                  className="flex-1"
                >
                  Começar a Usar
                </Button>
              </div>
            </div>
          )}

          {/* Lista de todos os steps */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Progresso da Configuração</h4>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div 
                  key={step.id} 
                  className={`flex items-center space-x-3 p-2 rounded ${
                    index === currentStep ? 'bg-blue-50' : ''
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                  <span className={`text-sm ${step.completed ? 'text-green-600' : 'text-gray-600'}`}>
                    {step.title}
                  </span>
                  {step.optional && (
                    <Badge variant="outline" size="sm">Opcional</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Navegação */}
          <div className="flex justify-between pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Anterior
            </Button>
            
            <div className="flex space-x-2">
              {!isLastStep && (
                <Button 
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  disabled={currentStep === steps.length - 1}
                >
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              
              {allRequiredCompleted && (
                <Button 
                  onClick={completeOnboarding}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Finalizar Configuração
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingFlow;
