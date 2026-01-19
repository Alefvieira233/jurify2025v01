import { memo } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PipelineCard } from './PipelineCard';

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

interface Stage {
    id: string;
    title: string;
    color: string;
}

interface PipelineColumnProps {
    stage: Stage;
    leads: Lead[];
    stageIndex: number;
}

export const PipelineColumn = memo(({ stage, leads, stageIndex }: PipelineColumnProps) => {
    return (
        <Card
            className={`relative group ${stage.color} min-h-96 rounded-3xl border-2 overflow-hidden fade-in`}
            style={{ animationDelay: `${stageIndex * 0.08}s` }}
        >
            <div className="absolute -inset-1 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-3xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <CardHeader className="relative pb-3">
                <h3
                    className="font-bold text-gray-900 text-base"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                    {stage.title}
                </h3>
                <div className="flex items-center gap-2">
                    <span
                        className="text-lg font-bold text-gray-700"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                        {leads.length}
                    </span>
                    <span className="text-xs text-gray-500">leads</span>
                </div>
            </CardHeader>

            <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                    <CardContent
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`relative space-y-3 min-h-80 transition-all duration-300 ${snapshot.isDraggingOver ? 'bg-white/30 scale-[1.02]' : ''
                            }`}
                    >
                        {leads.map((lead, index) => (
                            <PipelineCard key={lead.id} lead={lead} index={index} />
                        ))}
                        {provided.placeholder}
                    </CardContent>
                )}
            </Droppable>
        </Card>
    );
});

export default PipelineColumn;
