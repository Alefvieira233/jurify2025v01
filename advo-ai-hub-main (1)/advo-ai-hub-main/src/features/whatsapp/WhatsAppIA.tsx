
import React, { useState } from 'react';
import { 
  MessageSquare, 
  Bot, 
  Send, 
  Settings, 
  Play, 
  Pause,
  BarChart3,
  Clock,
  CheckCircle2
} from 'lucide-react';

const WhatsAppIA = () => {
  const [isActive, setIsActive] = useState(true);
  const [newMessage, setNewMessage] = useState('');

  const conversations = [
    {
      id: 1,
      nome: 'Maria Silva',
      telefone: '+55 11 99999-1234',
      status: 'ativo',
      ultimaMensagem: 'Preciso de ajuda com questão trabalhista',
      horario: '14:32',
      naoLidas: 2,
      areaJuridica: 'Direito Trabalhista'
    },
    {
      id: 2,
      nome: 'João Santos',
      telefone: '+55 11 99999-5678',
      status: 'aguardando',
      ultimaMensagem: 'IA: Posso ajudar com seu caso de família?',
      horario: '13:45',
      naoLidas: 0,
      areaJuridica: 'Direito de Família'
    },
    {
      id: 3,
      nome: 'Ana Costa',
      telefone: '+55 11 99999-9012',
      status: 'qualificado',
      ultimaMensagem: 'Sim, gostaria de agendar uma consulta',
      horario: '12:15',
      naoLidas: 1,
      areaJuridica: 'Direito Previdenciário'
    }
  ];

  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);

  const messages = [
    {
      id: 1,
      sender: 'lead',
      content: 'Olá, preciso de ajuda com uma questão trabalhista',
      timestamp: '14:30',
      read: true
    },
    {
      id: 2,
      sender: 'ia',
      content: 'Olá! Sou a assistente jurídica virtual. Posso ajudá-la com questões trabalhistas. Pode me contar mais detalhes sobre sua situação?',
      timestamp: '14:30',
      read: true
    },
    {
      id: 3,
      sender: 'lead',
      content: 'Fui demitida sem justa causa e não recebi as verbas rescisórias corretamente',
      timestamp: '14:31',
      read: true
    },
    {
      id: 4,
      sender: 'ia',
      content: 'Entendo sua situação. Vou fazer algumas perguntas para qualificar melhor seu caso:\n\n1. Há quanto tempo trabalhava na empresa?\n2. Tinha carteira assinada?\n3. Quais verbas não foram pagas?',
      timestamp: '14:32',
      read: false
    }
  ];

  const iaStats = [
    { label: 'Conversas Ativas', value: '47', icon: MessageSquare },
    { label: 'Taxa de Resposta', value: '94%', icon: CheckCircle2 },
    { label: 'Tempo Médio', value: '1.2min', icon: Clock },
    { label: 'Leads Qualificados', value: '23', icon: BarChart3 }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp IA Jurídica</h1>
          <p className="text-gray-600">Atendimento inteligente 24/7 para leads jurídicos</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Status da IA:</span>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {isActive ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              <span>{isActive ? 'Ativo' : 'Pausado'}</span>
            </button>
          </div>
          <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Configurar IA</span>
          </button>
        </div>
      </div>

      {/* IA Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {iaStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <Icon className="h-8 w-8 text-amber-500" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
        {/* Conversations List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Conversas Ativas</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation.id === conv.id ? 'bg-amber-50 border-r-2 border-amber-500' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{conv.nome}</h4>
                      {conv.naoLidas > 0 && (
                        <span className="bg-amber-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {conv.naoLidas}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{conv.telefone}</p>
                    <p className="text-sm text-gray-600 truncate mt-1">{conv.ultimaMensagem}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">{conv.horario}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        conv.status === 'ativo' ? 'bg-green-100 text-green-800' :
                        conv.status === 'aguardando' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {conv.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedConversation.nome}</h3>
                <p className="text-sm text-gray-500">{selectedConversation.areaJuridica}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-amber-500" />
                <span className="text-sm text-gray-600">IA Ativa</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'lead' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'lead' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {message.sender === 'ia' && (
                    <div className="flex items-center space-x-1 mb-1">
                      <Bot className="h-3 w-3 text-amber-500" />
                      <span className="text-xs text-amber-600 font-medium">IA Jurídica</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.sender === 'lead' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Digite uma mensagem..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <button className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-lg">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppIA;
