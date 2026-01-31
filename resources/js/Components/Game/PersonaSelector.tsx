import { Card, CardContent } from '@/Components/ui/card';

interface Persona {
    slug: string;
    name: string;
    role: string;
    description: string;
    emoji: string;
}

interface PersonaSelectorProps {
    personas: Persona[];
    selectedPersona: Persona | null;
    onSelect: (persona: Persona) => void;
    messageCount: Record<string, number>;
}

export function PersonaSelector({ 
    personas, 
    selectedPersona, 
    onSelect,
    messageCount 
}: PersonaSelectorProps) {
    return (
        <Card className="bg-slate-800/50 border-slate-700/50 h-full">
            <CardContent className="p-3 space-y-2">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Verdächtige
                </h3>
                
                <div className="space-y-2">
                    {personas.map(persona => {
                        const isSelected = selectedPersona?.slug === persona.slug;
                        const count = messageCount[persona.slug] || 0;
                        
                        return (
                            <button
                                key={persona.slug}
                                onClick={() => onSelect(persona)}
                                className={`
                                    w-full text-left p-3 rounded-lg transition-all duration-200
                                    ${isSelected 
                                        ? 'bg-red-900/50 border-red-500/50 border shadow-lg shadow-red-500/10' 
                                        : 'bg-slate-700/30 border-slate-600/30 border hover:bg-slate-700/50 hover:border-slate-500/50'
                                    }
                                `}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl">{persona.emoji}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`font-medium truncate ${
                                                isSelected ? 'text-red-100' : 'text-slate-200'
                                            }`}>
                                                {persona.name}
                                            </span>
                                            {count > 0 && (
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                    isSelected 
                                                        ? 'bg-red-700/50 text-red-200' 
                                                        : 'bg-slate-600/50 text-slate-300'
                                                }`}>
                                                    {count}
                                                </span>
                                            )}
                                        </div>
                                        <div className={`text-sm ${
                                            isSelected ? 'text-red-300' : 'text-slate-400'
                                        }`}>
                                            {persona.role}
                                        </div>
                                    </div>
                                </div>
                                
                                {isSelected && (
                                    <p className="mt-2 text-xs text-slate-300 line-clamp-2">
                                        {persona.description}
                                    </p>
                                )}
                            </button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
