/**
 * 🔍 Sentry Configuration - Error Tracking & Performance Monitoring
 *
 * Configuração enterprise-grade para:
 * - Error tracking em produção
 * - Performance monitoring
 * - User feedback
 * - Release tracking
 */

import * as Sentry from '@sentry/react';
import type { User } from '@supabase/supabase-js';

/**
 * Inicializa Sentry apenas em produção
 */
export function initSentry() {
  // Só inicializar em produção
  if (import.meta.env.MODE !== 'production') {
    console.log('🔍 Sentry: Disabled in development mode');
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('⚠️ Sentry DSN not configured');
    return;
  }

  Sentry.init({
    dsn,

    // Environment
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',

    // Integrations
    integrations: [
      // Browser tracing para performance
      Sentry.browserTracingIntegration({
        // Trace navegação
        tracingOrigins: [
          'localhost',
          /^\//,
          // Adicionar domínios de produção aqui
        ],
      }),

      // Replay de sessões (útil para debug)
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),

      // Feedback widget
      Sentry.feedbackIntegration({
        colorScheme: 'system',
        showBranding: false,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% das sessões
    replaysOnErrorSampleRate: 1.0, // 100% quando há erro

    // Filtering
    beforeSend(event, hint) {
      // Não enviar erros de desenvolvimento
      if (import.meta.env.MODE === 'development') {
        return null;
      }

      // Filtrar erros conhecidos e não-críticos
      const error = hint.originalException;

      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message);

        // Ignorar erros de extensões do navegador
        if (message.includes('chrome-extension://')) {
          return null;
        }

        // Ignorar erros de rede esperados
        if (message.includes('Network Error') || message.includes('Failed to fetch')) {
          console.warn('Network error (not sent to Sentry):', message);
          return null;
        }
      }

      return event;
    },

    // Ignora errors comuns
    ignoreErrors: [
      // Errors do navegador
      'Non-Error promise rejection captured',
      'ResizeObserver loop limit exceeded',

      // Errors de extensões
      /chrome-extension/,
      /moz-extension/,

      // Errors de ad blockers
      /adblock/i,

      // Timeout esperados
      'AbortError',
      'timeout',
    ],

    // Denylist de URLs (não rastrear)
    denyUrls: [
      // Extensões do navegador
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,

      // Scripts de terceiros
      /googletagmanager\.com/i,
      /google-analytics\.com/i,
    ],
  });

  console.log('✅ Sentry initialized');
}

/**
 * Configura contexto do usuário no Sentry
 */
export function setSentryUser(user: User | null) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.user_metadata?.full_name || user.email?.split('@')[0],
  });
}

/**
 * Adiciona contexto customizado
 */
export function setSentryContext(key: string, value: Record<string, any>) {
  Sentry.setContext(key, value);
}

/**
 * Adiciona breadcrumb (rastro de ações do usuário)
 */
export function addSentryBreadcrumb(message: string, category?: string, level?: Sentry.SeverityLevel) {
  Sentry.addBreadcrumb({
    message,
    category: category || 'user-action',
    level: level || 'info',
    timestamp: Date.now() / 1000,
  });
}

/**
 * Captura erro manualmente
 */
export function captureSentryError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: context ? { custom: context } : undefined,
  });
}

/**
 * Captura mensagem (não-erro)
 */
export function captureSentryMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Performance monitoring - medir transações
 */
export function startSentryTransaction(name: string, op: string = 'custom') {
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * HOC para error boundary
 */
export const withSentryErrorBoundary = Sentry.withErrorBoundary;

/**
 * Hook do React para Sentry
 */
export const useSentry = () => {
  return {
    captureError: captureSentryError,
    captureMessage: captureSentryMessage,
    addBreadcrumb: addSentryBreadcrumb,
    setUser: setSentryUser,
    setContext: setSentryContext,
  };
};
