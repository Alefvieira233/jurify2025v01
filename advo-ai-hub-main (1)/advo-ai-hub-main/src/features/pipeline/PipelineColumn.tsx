import { memo } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { PipelineCard } from './PipelineCard';
import { type Lead } from '@/hooks/useLeads';

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
        <div
            className="flex flex-col h-full bg-white/[0.02] border border-white/[0.05] rounded-3xl overflow-hidden backdrop-blur-sm transition-all duration-700 hover:bg-white/[0.04] scrollbar-premium"
            style={{
                animationDelay: `${stageIndex * 0.1}s`,
                minHeight: '700px'
            }}
        >
            {/* Header Column */}
            <div className="p-6 border-b border-white/[0.05] bg-gradient-to-br from-white/[0.03] to-transparent">
                <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[hsl(var(--primary))]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {stage.title}
                    </h3>
                    <div className="px-2 py-0.5 rounded-full bg-[hsl(var(--primary)_/_0.1)] border border-[hsl(var(--primary)_/_0.2)]">
                        <span className="text-[10px] font-bold text-[hsl(var(--primary))]">{leads.length}</span>
                    </div>
                </div>
                <div className="h-0.5 w-12 bg-gradient-to-r from-[hsl(var(--primary))] to-transparent rounded-full opacity-50" />
            </div>

            <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-4 space-y-4 transition-all duration-300 min-h-[500px] ${snapshot.isDraggingOver ? 'bg-[hsl(var(--primary)_/_0.03)] scale-[0.99]' : ''
                            }`}
                    >
                        {leads.map((lead, index) => (
                            <PipelineCard key={lead.id} lead={lead} index={index} />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
});

export default PipelineColumn;
