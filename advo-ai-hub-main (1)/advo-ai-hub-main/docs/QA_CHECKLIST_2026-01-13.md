# QA Checklist - Jurify (Manual)

## Auth and Session
- [ ] Sign up with valid password rules
- [ ] Sign in / sign out
- [ ] Session persists after refresh
- [ ] Logout syncs across tabs
- [ ] Inactivity logout after configured timeout
- [ ] Permission errors show readable messages

## Leads
- [ ] Create lead
- [ ] Edit lead
- [ ] Delete lead
- [ ] Search / filter / pagination

## Contratos
- [ ] Create contrato
- [ ] View details
- [ ] Update status / assinatura
- [ ] Export / share

## Agendamentos
- [ ] Create agendamento
- [ ] Edit / cancel
- [ ] Reminder and status updates

## WhatsApp
- [ ] Configure WhatsApp credentials (tenant)
- [ ] Webhook verification
- [ ] Receive inbound message -> lead created
- [ ] Outbound response sent
- [ ] Unread count increments

## Integracoes
- [ ] Create / update / delete integration
- [ ] Toggle status
- [ ] Sync timestamp updates

## Agentes IA
- [ ] Create / update / delete agent
- [ ] Run test message
- [ ] Verify logs and metrics

## Relatorios
- [ ] Dashboard metrics load
- [ ] CSV export works
- [ ] Charts show tenant data only

## Admin / RBAC
- [ ] Admin-only pages hidden for non-admin
- [ ] Admin actions blocked for non-admin

## System Monitor
- [ ] Health check runs
- [ ] Errors show readable messages
- [ ] Performance panel shows timing
