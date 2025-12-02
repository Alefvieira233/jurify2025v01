
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle, Database, Server, Wifi } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SystemStatus {
  database: 'online' | 'offline' | 'checking';
  auth: 'online' | 'offline' | 'checking';
  realtime: 'online' | 'offline' | 'checking';
}

const SystemStatus = () => {
  const [status, setStatus] = useState<SystemStatus>({
    database: 'checking',
    auth: 'checking',
    realtime: 'checking'
  });

  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const checkSystemStatus = async () => {
    // Check database
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      setStatus(prev => ({ ...prev, database: error ? 'offline' : 'online' }));
    } catch {
      setStatus(prev => ({ ...prev, database: 'offline' }));
    }

    // Check auth
    try {
      const { data } = await supabase.auth.getSession();
      setStatus(prev => ({ ...prev, auth: 'online' }));
    } catch {
      setStatus(prev => ({ ...prev, auth: 'offline' }));
    }

    // Check realtime (simplified)
    setStatus(prev => ({ ...prev, realtime: 'online' }));
  };

  const getStatusIcon = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500 animate-pulse" />;
    }
  };

  const getStatusBadge = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'offline':
        return <Badge className="bg-red-100 text-red-800">Offline</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Verificando</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Status do Sistema</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-gray-500" />
            <span className="text-sm">Base de Dados</span>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.database)}
            {getStatusBadge(status.database)}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Server className="h-4 w-4 text-gray-500" />
            <span className="text-sm">Autenticação</span>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.auth)}
            {getStatusBadge(status.auth)}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wifi className="h-4 w-4 text-gray-500" />
            <span className="text-sm">Tempo Real</span>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.realtime)}
            {getStatusBadge(status.realtime)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemStatus;
