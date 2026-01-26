import { memo } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { type Lead } from '@/hooks/useLeads';
import { User, Phone, Scale, Banknote, Calendar } from 'lucide-react';

interface PipelineCardProps {
    lead: Lead;
    index: number;
}

export const PipelineCard = memo(({ lead, index }: PipelineCardProps) => {
    return (
        <Draggable key={lead.id} draggableId={lead.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`relative group/card p-4 rounded-xl border transition-all duration-500 cursor-grab active:cursor-grabbing ${snapshot.isDragging
                            ? 'bg-[hsl(var(--card)_/_0.95)] border-[hsl(var(--primary))] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rotate-2 scale-105 z-50'
                            : 'bg-[hsl(var(--card)_/_0.4)] border-white/5 hover:border-white/20 hover:bg-[hsl(var(--card)_/_0.6)] hover:-translate-y-1'
                        }`}
                >
                    {/* Glossy overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none rounded-xl" />

                    <div className="relative space-y-4">
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-white text-base leading-tight group-hover/card:text-[hsl(var(--primary))] transition-colors duration-300" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                                {lead.nome_completo}
                            </h4>
                            <div className="bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                <span className="text-[9px] uppercase font-black tracking-tighter text-white/50">{lead.origem || 'WEB'}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[11px] text-white/60">
                                <Phone className="h-3 w-3 text-[hsl(var(--primary))]" />
                                <span>{lead.telefone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-white/60">
                                <Scale className="h-3 w-3 text-[hsl(var(--primary))]" />
                                <span className="truncate">{lead.area_juridica}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-white/60">
                                <User className="h-3 w-3 text-white/30" />
                                <span className="truncate">{lead.responsavel || 'Sem Resp.'}</span>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-widest text-white/30">Valor Estimado</span>
                                <span className="text-xs font-bold text-[hsl(var(--primary))]">
                                    {lead.valor_causa ? `R$ ${Number(lead.valor_causa).toLocaleString('pt-BR')}` : 'R$ ---'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-white/20">
                                <Calendar className="h-2.5 w-2.5" />
                                <span>{new Date(lead.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Drag glow */}
                    {snapshot.isDragging && (
                        <div className="absolute -inset-0.5 bg-[hsl(var(--primary)_/_0.2)] blur-lg rounded-xl -z-10" />
                    )}
                </div>
            )}
        </Draggable>
    );
});

export default PipelineCard;
