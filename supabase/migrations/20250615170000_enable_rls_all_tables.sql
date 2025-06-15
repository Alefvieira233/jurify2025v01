
-- Enable RLS and create policies for all tables to make data accessible

-- Leads table
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leads" ON public.leads
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert leads" ON public.leads
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update leads" ON public.leads
FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete leads" ON public.leads
FOR DELETE USING (true);

-- Contratos table
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view contratos" ON public.contratos
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert contratos" ON public.contratos
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update contratos" ON public.contratos
FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete contratos" ON public.contratos
FOR DELETE USING (true);

-- Agendamentos table
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view agendamentos" ON public.agendamentos
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert agendamentos" ON public.agendamentos
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update agendamentos" ON public.agendamentos
FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete agendamentos" ON public.agendamentos
FOR DELETE USING (true);

-- Agentes IA table
ALTER TABLE public.agentes_ia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view agentes" ON public.agentes_ia
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert agentes" ON public.agentes_ia
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update agentes" ON public.agentes_ia
FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete agentes" ON public.agentes_ia
FOR DELETE USING (true);

-- Logs table
ALTER TABLE public.logs_execucao_agentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view logs" ON public.logs_execucao_agentes
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert logs" ON public.logs_execucao_agentes
FOR INSERT WITH CHECK (true);

-- Notificacoes table
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view notificacoes" ON public.notificacoes
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert notificacoes" ON public.notificacoes
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update notificacoes" ON public.notificacoes
FOR UPDATE USING (true);
