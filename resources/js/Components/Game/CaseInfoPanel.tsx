import { useState, useEffect } from 'react';

interface Message {
    id?: number;
    persona_slug: string | null;
    content: string;
    is_user: boolean;
    created_at?: string;
    messageId?: string;
}

interface Persona {
    slug: string;
    name: string;
    role: string;
}

interface CaseInfoPanelProps {
    revealedClues: string[];
    gameId: string | null;
    pinnedMessages?: Set<string>;
    messages?: Record<string, Message[]>;
    personas?: Persona[];
}

type TabType = 'notes' | 'evidence' | 'case';

export function CaseInfoPanel({ revealedClues, gameId, pinnedMessages = new Set(), messages = {}, personas = [] }: CaseInfoPanelProps) {
    const [activeTab, setActiveTab] = useState<TabType>('case');
    const [notes, setNotes] = useState<string>('');
    
    // Load notes from localStorage
    useEffect(() => {
        if (gameId) {
            const savedNotes = localStorage.getItem(`case-notes-${gameId}`);
            if (savedNotes) {
                setNotes(savedNotes);
            }
        }
    }, [gameId]);
    
    // Listen for notes updates from saved messages
    useEffect(() => {
        const handleNotesUpdate = () => {
            if (gameId) {
                const savedNotes = localStorage.getItem(`case-notes-${gameId}`);
                if (savedNotes) {
                    setNotes(savedNotes);
                }
            }
        };
        window.addEventListener('notes-updated', handleNotesUpdate);
        return () => window.removeEventListener('notes-updated', handleNotesUpdate);
    }, [gameId]);
    
    // Save notes to localStorage
    useEffect(() => {
        if (gameId && notes !== '') {
            localStorage.setItem(`case-notes-${gameId}`, notes);
        }
    }, [notes, gameId]);
    
    // Get pinned messages
    const getPinnedMessages = () => {
        const pinned: Array<{ message: Message; personaName: string }> = [];
        Object.entries(messages).forEach(([personaSlug, personaMessages]) => {
            personaMessages.forEach((message, index) => {
                // Generate stable messageId if missing
                const messageId = message.messageId || `${gameId}-${personaSlug}-${index}-${message.content.substring(0, 30).replace(/\s/g, '').substring(0, 20)}`;
                if (pinnedMessages.has(messageId)) {
                    const persona = personas.find(p => p.slug === personaSlug);
                    pinned.push({
                        message,
                        personaName: message.is_user ? 'Du' : (persona?.name || personaSlug)
                    });
                }
            });
        });
        return pinned;
    };
    
    const tabs: { id: TabType; label: string }[] = [
        { id: 'notes', label: 'NOTIZEN' },
        { id: 'evidence', label: 'EVIDENCE STORAGE' },
        { id: 'case', label: 'CASE INFORMATION' },
    ];

    return (
        <div className="cia-bg-panel border border-white/10 h-full flex flex-col">
            {/* Tabs Header */}
            <div className="bg-black/50 border-b border-white/10">
                <div className="flex">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex-1 px-3 py-2 text-xs cia-text uppercase font-bold transition-colors
                                border-r border-white/10 last:border-r-0
                                ${activeTab === tab.id
                                    ? 'text-white bg-white/5 border-b-2 border-white/20'
                                    : 'text-gray-400 hover:text-gray-300 hover:bg-black/30'
                                }
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto cia-scrollbar">
                {activeTab === 'notes' && (
                    <div className="p-4 h-full flex flex-col">
                        <div className="mb-3">
                            <h3 className="text-xs text-white uppercase cia-text font-bold mb-2">
                                INVESTIGATION NOTES
                            </h3>
                            <p className="text-xs text-gray-400 cia-text">
                                Record your observations and findings
                            </p>
                        </div>
                        
                        {/* Pinned Messages */}
                        {pinnedMessages.size > 0 && (
                            <div className="mb-4">
                                <div className="mb-2">
                                    <h4 className="text-xs cia-text-yellow uppercase cia-text font-bold">
                                        ANGEPINNTE NACHRICHTEN ({pinnedMessages.size})
                                    </h4>
                                </div>
                                <div className="space-y-2 max-h-40 overflow-y-auto cia-scrollbar mb-3">
                                    {getPinnedMessages().map((item, index) => (
                                        <div 
                                            key={index}
                                            className="cia-bg-dark border border-yellow-500/30 rounded p-2 text-xs"
                                        >
                                            <div className="mb-1">
                                                <span className="cia-text-yellow font-semibold">{item.personaName}</span>
                                            </div>
                                            <p className="cia-text text-white text-xs line-clamp-2">{item.message.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Enter your notes here..."
                            className="
                                flex-1 w-full resize-none cia-bg-dark border border-white/10 
                                px-3 py-2 text-white cia-text text-sm rounded
                                focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10
                                placeholder-gray-500
                            "
                        />
                        <div className="mt-3 pt-3 border-t border-white/10 text-xs cia-text text-gray-400">
                            <span>CHARACTERS: {notes.length}</span>
                        </div>
                    </div>
                )}
                
                {activeTab === 'evidence' && (
                    <div className="p-4">
                        <div className="mb-4">
                            <h3 className="text-xs text-white uppercase cia-text font-bold mb-2">
                                EVIDENCE STORAGE
                            </h3>
                            <p className="text-xs text-gray-400 cia-text">
                                Collected evidence and clues
                            </p>
                        </div>
                        
                        {revealedClues.length > 0 ? (
                            <div className="space-y-3">
                                {revealedClues.map((clue, index) => (
                                    <div 
                                        key={index}
                                        className="cia-document p-3 border border-gray-300"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-xs cia-text font-bold uppercase">
                                                EVIDENCE #{String(index + 1).padStart(3, '0')}
                                            </span>
                                            <span className="text-xs cia-text text-gray-600">
                                                {new Date().toLocaleDateString('de-DE')}
                                            </span>
                                        </div>
                                        <p className="text-sm cia-text">{clue}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="cia-bg-dark border border-white/10 p-6 text-center">
                                <p className="text-xs text-gray-400 cia-text">
                                    NO EVIDENCE COLLECTED
                                </p>
                                <p className="text-xs text-gray-500 cia-text mt-2">
                                    Interrogate subjects to gather evidence
                                </p>
                            </div>
                        )}
                    </div>
                )}
                
                {activeTab === 'case' && (
                    <div className="p-4 space-y-4">
                        <div className="cia-document p-4">
                            <div className="border-b-2 border-black pb-2 mb-3">
                                <h3 className="text-sm font-bold uppercase cia-text">CASE FILE</h3>
                                <p className="text-xs text-gray-600 cia-text">CASE <span className="cia-monospace">#INNOTECH-2024-001</span></p>
                            </div>
                            
                            <div className="space-y-3 text-xs cia-text">
                                <div>
                                    <span className="font-bold uppercase">VICTIM:</span>
                                    <span className="ml-2">MARCUS WEBER, CFO</span>
                                </div>
                                <div>
                                    <span className="font-bold uppercase">STATUS:</span>
                                    <span className="ml-2 text-red-600">DECEASED</span>
                                </div>
                                <div>
                                    <span className="font-bold uppercase">LOCATION:</span>
                                    <span className="ml-2">INNOTECH HEADQUARTERS</span>
                                </div>
                                <div>
                                    <span className="font-bold uppercase">TIME OF INCIDENT:</span>
                                    <span className="ml-2">SUNDAY EVENING, 20:00 - 23:00</span>
                                </div>
                                <div className="pt-2 border-t border-gray-300">
                                    <span className="font-bold uppercase">CASE ID:</span>
                                    <span className="ml-2 cia-monospace font-mono">{gameId || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="cia-bg-dark border border-white/10 p-4">
                            <h4 className="text-xs text-white uppercase cia-text font-bold mb-3">
                                INVESTIGATION STATUS
                            </h4>
                            <div className="space-y-2 text-xs cia-text">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">SUBJECTS INTERROGATED:</span>
                                    <span className="text-white">4</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">EVIDENCE COLLECTED:</span>
                                    <span className="text-white">{revealedClues.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">STATUS:</span>
                                    <span className="cia-text-yellow cia-pulse">ACTIVE</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="cia-bg-dark border border-white/10 p-4">
                            <h4 className="text-xs text-white uppercase cia-text font-bold mb-3">
                                SYSTEM INFORMATION
                            </h4>
                            <div className="space-y-2 text-xs cia-text text-gray-400">
                                <div className="flex justify-between">
                                    <span>SECURITY LEVEL:</span>
                                    <span className="text-white">SEC 113</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>CLASSIFICATION:</span>
                                    <span className="cia-text-yellow">TOP SECRET</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>ACCESS LEVEL:</span>
                                    <span className="text-white">AUTHORIZED</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
