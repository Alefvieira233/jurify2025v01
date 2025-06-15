import React from 'react';
import { X, Bot, Edit, Clock, MessageSquare, Tags, Target, Code, BarChart, Zap, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AgenteIA {
  id: string;
  nome: string;
  area_juridica: string;
  objetivo: string;
  script_saudacao: string;
  perguntas_qualificacao: string[];
  keywords_acao: string[];
  delay_resposta: number;
  status: string;
  created_at: string;
  updated_at: string;
  descricao_funcao: string;
  prompt_base: string;
  tipo_agente: string;
  parametros_avancados: any;
}

interface DetalhesAgenteProps {
  agente: AgenteIA;
  onClose: () => void;
  onEdit: () => void;
}

const DetalhesAgente: React.FC<DetalhesAgenteProps> = ({ agente, onClose, onEdit }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTipoAgenteInfo = (tipo: string) => {
    const tipos = {
      chat_interno: { label: 'Chat Interno', icon: Bot, color: 'blue' },
      analise_dados: { label: 'Análise de Dados', icon: BarChart, color: 'purple' },
      api_externa: { label: 'API Externa', icon: Zap, color: 'amber' }
    };
    return tipos[tipo as keyof typeof tipos] || tipos.chat_interno;
  };

  const tipoInfo = getTipoAgenteInfo(agente.tipo_agente);
  const TipoIcon = tipoInfo.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${agente.status === 'ativo' ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Bot className={`h-6 w-6 ${agente.status === 'ativo' ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{agente.nome}</h2>
              <p className="text-sm text-gray-500">{agente.area_juridica}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status e Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Status</span>
              </div>
              <Badge 
                variant={agente.status === 'ativo' ? 'default' : 'secondary'}
                className={agente.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
              >
                {agente.status === 'ativo' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TipoIcon className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Tipo de Agente</span>
              </div>
              <Badge variant="outline" className={`bg-${tipoInfo.color}-50 text-${tipoInfo.color}-700 border-${tipoInfo.color}-200`}>
                <TipoIcon className="h-3 w-3 mr-1" />
                {tipoInfo.label}
              </Badge>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Delay de Resposta</span>
              </div>
              <p className="text-lg font-semibold">{agente.delay_resposta} segundos</p>
            </div>
          </div>

          {/* Descrição/Função */}
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <h3 className="text-lg font-semibold text-amber-800 mb-2">Descrição/Função do Agente</h3>
            <p className="text-amber-700">{agente.descricao_funcao}</p>
          </div>

          {/* Prompt Base */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span>Prompt Base (Instruções)</span>
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <pre className="text-gray-700 whitespace-pre-wrap font-mono text-sm">{agente.prompt_base}</pre>
            </div>
          </div>

          {/* Parâmetros Avançados */}
          {agente.parametros_avancados && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Parâmetros Avançados</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <div className="text-xs font-medium text-purple-600 mb-1">Temperatura</div>
                  <div className="text-lg font-semibold text-purple-800">
                    {agente.parametros_avancados.temperatura || 0.7}
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-xs font-medium text-blue-600 mb-1">Top P</div>
                  <div className="text-lg font-semibold text-blue-800">
                    {agente.parametros_avancados.top_p || 0.9}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="text-xs font-medium text-green-600 mb-1">Frequency Penalty</div>
                  <div className="text-lg font-semibold text-green-800">
                    {agente.parametros_avancados.frequency_penalty || 0}
                  </div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <div className="text-xs font-medium text-amber-600 mb-1">Presence Penalty</div>
                  <div className="text-lg font-semibold text-amber-800">
                    {agente.parametros_avancados.presence_penalty || 0}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Objetivo (compatibilidade) */}
          {agente.objetivo && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Objetivo Resumido</h3>
              <p className="text-blue-700">{agente.objetivo}</p>
            </div>
          )}

          {/* Script de Saudação */}
          {agente.script_saudacao && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Script de Saudação</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap">{agente.script_saudacao}</p>
              </div>
            </div>
          )}

          {/* Perguntas de Qualificação */}
          {agente.perguntas_qualificacao && agente.perguntas_qualificacao.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Perguntas de Qualificação</h3>
              <div className="space-y-2">
                {agente.perguntas_qualificacao.map((pergunta, index) => (
                  <div key={index} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-start space-x-2">
                      <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-blue-800">{pergunta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keywords de Ação */}
          {agente.keywords_acao && agente.keywords_acao.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Tags className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Keywords de Ação</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {agente.keywords_acao.map((keyword, index) => (
                  <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Informações de Sistema */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Informações do Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Criado em:</span> {formatDate(agente.created_at)}
              </div>
              <div>
                <span className="font-medium">Última atualização:</span> {formatDate(agente.updated_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DetalhesAgente;
