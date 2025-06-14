
import React from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, XCircle, Check, CheckCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NotificationsPanel = () => {
  const { 
    notifications, 
    loading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    isRead 
  } = useNotifications();

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'sucesso':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'alerta':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'erro':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'sucesso':
        return 'border-l-green-500 bg-green-50';
      case 'alerta':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'erro':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Bell className="h-8 w-8 text-amber-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
              <p className="text-gray-600">
                {unreadCount > 0 
                  ? `Você tem ${unreadCount} notificação(ões) não lida(s)`
                  : 'Todas as notificações foram lidas'
                }
              </p>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <Button 
              onClick={markAllAsRead}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Marcar todas como lidas</span>
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhuma notificação
                </h3>
                <p className="text-gray-600">
                  Você não possui notificações no momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => {
              const read = isRead(notification);
              
              return (
                <Card 
                  key={notification.id}
                  className={`border-l-4 transition-all ${getTypeColor(notification.tipo)} ${
                    !read ? 'shadow-md' : 'opacity-75'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(notification.tipo)}
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900">
                            {notification.titulo}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={notification.tipo === 'erro' ? 'destructive' : 'secondary'}>
                              {notification.tipo}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {format(new Date(notification.data_criacao), "dd 'de' MMMM 'às' HH:mm", {
                                locale: ptBR
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {!read && (
                        <Button
                          onClick={() => markAsRead(notification.id)}
                          variant="ghost"
                          size="sm"
                          className="text-amber-600 hover:text-amber-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <p className="text-gray-700 leading-relaxed">
                      {notification.mensagem}
                    </p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;
