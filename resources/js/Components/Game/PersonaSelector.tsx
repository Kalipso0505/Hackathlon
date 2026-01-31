
interface Persona {
    slug: string;
    name: string;
    role: string;
    description: string;
    emoji: string;
    image?: string;
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
        <div className="cia-bg-panel border border-white/10 h-full flex flex-col">
            {/* Header */}
            <div className="bg-black/50 border-b border-white/10 px-3 py-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider cia-text">
                    CHATS (KONTAKTE)
                </h3>
            </div>
            
            {/* Chats List */}
            <div className="flex-1 overflow-y-auto cia-scrollbar">
                {personas.map(persona => {
                    const isSelected = selectedPersona?.slug === persona.slug;
                    const count = messageCount[persona.slug] || 0;
                    
                    return (
                        <button
                            key={persona.slug}
                            onClick={() => onSelect(persona)}
                            className={`
                                w-full text-left p-3 transition-all duration-200 border-b border-white/5
                                ${isSelected 
                                    ? 'cia-bg-dark border-l-4 border-l-white/30' 
                                    : 'cia-bg-panel hover:bg-black/30'
                                }
                            `}
                        >
                            <div className="flex items-center gap-3">
                                {persona.image ? (
                                    <div className="w-20 h-24 shrink-0 rounded overflow-hidden border-2 border-white/10">
                                        <img 
                                            src={persona.image} 
                                            alt={persona.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Fallback zu Emoji bei Fehler
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const parent = target.parentElement;
                                                if (parent) {
                                                    parent.innerHTML = `<div class="text-2xl flex items-center justify-center w-full h-full">${persona.emoji}</div>`;
                                                }
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="text-2xl shrink-0">{persona.emoji}</div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className={`font-semibold truncate cia-text text-sm ${
                                            isSelected ? 'text-white' : 'text-gray-200'
                                        }`}>
                                            {persona.name}
                                        </span>
                                        {count > 0 && (
                                            <span className={`text-xs px-1.5 py-0.5 cia-text font-bold shrink-0 ${
                                                isSelected 
                                                    ? 'bg-gray-800 text-white' 
                                                    : 'bg-gray-800/30 text-white'
                                            }`}>
                                                {count}
                                            </span>
                                        )}
                                    </div>
                                    <div className={`text-xs cia-text truncate ${
                                        isSelected ? 'text-white opacity-80' : 'text-gray-400'
                                    }`}>
                                        {persona.role}
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
            
            {/* Footer */}
            <div className="bg-black/50 border-t border-white/10 px-3 py-2 text-xs cia-text text-gray-400">
                <div className="flex items-center justify-between">
                    <span>TOTAL:</span>
                    <span className="text-white">{personas.length}</span>
                </div>
            </div>
        </div>
    );
}
