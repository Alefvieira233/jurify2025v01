import { memo } from 'react';
import { Draggable } from '@hello-pangea/dnd';

interface Lead {
    id: string;
    nome_completo: string;
    telefone: string;
    email: string;
    area_juridica: string;
    origem: string;
    valor_causa: number;
    responsavel: string;
    status: string;
    created_at: string;
}

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
                    className={`relative group/card bg-white/95 backdrop-blur-sm p-4 rounded-2xl border border-gray-200 cursor-move transition-all duration-500 ${snapshot.isDragging
                            ? 'rotate-3 shadow-2xl scale-105 border-[hsl(var(--accent))]'
                            : 'hover:shadow-lg hover:border-[hsl(var(--accent)_/_0.3)] hover:-translate-y-1'
                        }`}
                >
                    {snapshot.isDragging && (
                        <div className="absolute -inset-1 bg-gradient-to-br from-[hsl(var(--accent)_/_0.2)] to-transparent rounded-2xl blur-lg" />
                    )}

                    <div className="relative space-y-2">
                        <h4
                            className="font-bold text-gray-900 text-sm leading-tight"
                            style={{ fontFamily: "'Cormorant Garamond', serif" }}
                        >
                            {lead.nome_completo}
                        </h4>
                        <div className="text-xs text-gray-600 space-y-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                            <div className="flex items-center gap-1.5">
                                <span className="opacity-50">📞</span>
                                <span className="truncate">{lead.telefone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="opacity-50">⚖️</span>
                                <span className="truncate">{lead.area_juridica}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="opacity-50">👤</span>
                                <span className="truncate">{lead.responsavel}</span>
                            </div>
                            {lead.valor_causa && (
                                <div className="flex items-center gap-1.5 font-semibold text-[hsl(var(--accent))]">
                                    <span className="opacity-50">💰</span>
                                    <span>R$ {Number(lead.valor_causa).toLocaleString('pt-BR')}</span>
                                </div>
                            )}
                        </div>
                        <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                            {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
});

export default PipelineCard;
