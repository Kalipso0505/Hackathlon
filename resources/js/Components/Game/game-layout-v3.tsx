/**
 * Game Layout V3 - Modern Dark Thriller
 * Cleanes dunkles Design mit subtilen roten Akzenten
 * Fokus auf Lesbarkeit und moderne UX
 */
import { GripVertical, Users, FileText, MessageCircle, MapPin, Clock, AlertTriangle, BookOpen, StickyNote, Send, Pin, Save, Volume2, User } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { useResize } from '@/hooks/use-resize';
import { useAudioPlayer } from '@/hooks/use-audio-player';
import { cn } from '@/lib/utils';
import type { Persona, Message, CaseInfo, ChatHistory } from '@/types/game';

interface GameLayoutProps {
    personas: Persona[];
    selectedPersona: Persona | null;
    messages: ChatHistory;
    caseInfo: CaseInfo;
    revealedClues: string[];
    notes: string;
    isLoading: boolean;
    pinnedMessages: Set<string>;
    savedMessages: Set<string>;
    gameId: string | null;
    onSelectPersona: (persona: Persona) => void;
    onSendMessage: (message: string) => void;
    onNotesChange: (notes: string) => void;
    onPinMessage: (messageId: string) => void;
    onSaveToNotes: (messageId: string, content: string, personaName: string) => void;
    getUnreadCount: (slug: string) => number;
}

export function GameLayoutV3({
    personas,
    selectedPersona,
    messages,
    caseInfo,
    revealedClues,
    notes,
    isLoading,
    pinnedMessages,
    savedMessages,
    gameId,
    onSelectPersona,
    onSendMessage,
    onNotesChange,
    onPinMessage,
    onSaveToNotes,
    getUnreadCount,
}: GameLayoutProps) {
    const [resizeState, resizeActions] = useResize({
        minWidth: 240,
        maxWidth: 420,
        defaultLeftWidth: 280,
        defaultRightWidth: 340,
    });

    const [activeTab, setActiveTab] = useState<'case' | 'clues' | 'notes'>('case');
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [audioState, audioActions] = useAudioPlayer();

    const currentMessages = selectedPersona 
        ? (messages[selectedPersona.slug] || [])
        : [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentMessages]);

    const handleSend = () => {
        if (inputValue.trim() && !isLoading) {
            onSendMessage(inputValue.trim());
            setInputValue('');
        }
    };

    const getMessageId = (message: Message, index: number) => {
        return message.messageId || `${gameId}-${selectedPersona?.slug}-${index}`;
    };

    return (
        <div className="flex-1 flex bg-zinc-950 overflow-hidden">
            {/* Left Sidebar - Suspects */}
            <div 
                className="shrink-0 bg-zinc-900/50 flex flex-col"
                style={{ width: resizeState.leftWidth }}
            >
                {/* Header */}
                <div className="px-4 py-4 border-b border-zinc-800/50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <Users className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-200">Suspects</h3>
                            <p className="text-xs text-zinc-500">{personas.length} persons of interest</p>
                        </div>
                    </div>
                </div>

                {/* Persona List */}
                <div className="flex-1 overflow-y-auto py-2">
                    {personas.map((persona) => {
                        const isSelected = selectedPersona?.slug === persona.slug;
                        const unread = getUnreadCount(persona.slug);
                        
                        return (
                            <button
                                key={persona.slug}
                                onClick={() => onSelectPersona(persona)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-all",
                                    isSelected 
                                        ? "bg-gradient-to-r from-red-500/20 to-transparent border-l-2 border-l-red-500" 
                                        : "hover:bg-zinc-800/30"
                                )}
                            >
                                <div className={cn(
                                    "w-11 h-11 rounded-xl flex items-center justify-center text-lg font-semibold shrink-0 transition-all",
                                    isSelected 
                                        ? "bg-red-500/20 text-red-400 ring-2 ring-red-500/30" 
                                        : "bg-zinc-800 text-zinc-400"
                                )}>
                                    {persona.emoji || persona.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={cn(
                                            "font-medium truncate",
                                            isSelected ? "text-zinc-100" : "text-zinc-300"
                                        )}>
                                            {persona.name}
                                        </span>
                                        {unread > 0 && (
                                            <span className="px-2 py-0.5 text-[10px] bg-red-500 text-white rounded-full font-semibold">
                                                {unread}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                                        {persona.role}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Left Resize Handle */}
            <div
                className={cn(
                    'w-1 flex items-center justify-center cursor-col-resize transition-colors',
                    resizeState.isResizingLeft ? 'bg-red-500/50' : 'hover:bg-zinc-700'
                )}
                onMouseDown={resizeActions.startResizeLeft}
            />

            {/* Center - Chat */}
            <div className="flex-1 min-w-0 flex flex-col bg-zinc-950">
                {selectedPersona ? (
                    <>
                        {/* Chat Header */}
                        <div className="px-5 py-4 border-b border-zinc-800/50 bg-zinc-900/30">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-xl ring-2 ring-zinc-700">
                                    {selectedPersona.emoji || selectedPersona.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <h2 className="font-semibold text-zinc-100 text-lg">{selectedPersona.name}</h2>
                                    <p className="text-sm text-zinc-500">{selectedPersona.role}</p>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                                    <span className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-xs text-green-400 font-medium">Available</span>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {currentMessages.length === 0 ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-center max-w-sm">
                                        <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                                            <MessageCircle className="w-8 h-8 text-zinc-600" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-zinc-300 mb-2">Start Interrogation</h3>
                                        <p className="text-sm text-zinc-500">
                                            Ask <span className="text-zinc-300">{selectedPersona.name}</span> questions to gather information about the case.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {currentMessages.map((message, index) => {
                                        const messageId = getMessageId(message, index);
                                        const isPinned = pinnedMessages.has(messageId);
                                        const isSaved = savedMessages.has(messageId);
                                        const isPlaying = audioState.playingMessageId === messageId;

                                        return (
                                            <div
                                                key={messageId}
                                                className={cn(
                                                    "flex gap-3",
                                                    message.is_user ? "flex-row-reverse" : "flex-row"
                                                )}
                                            >
                                                {!message.is_user && (
                                                    <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-sm shrink-0">
                                                        {selectedPersona.emoji || selectedPersona.name.charAt(0)}
                                                    </div>
                                                )}
                                                {message.is_user && (
                                                    <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                                                        <User className="w-4 h-4 text-red-400" />
                                                    </div>
                                                )}
                                                <div className={cn(
                                                    "max-w-[75%] group relative"
                                                )}>
                                                    <div className={cn(
                                                        "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                                                        message.is_user 
                                                            ? "bg-red-500/20 text-zinc-200 rounded-tr-md" 
                                                            : "bg-zinc-800/80 text-zinc-200 rounded-tl-md",
                                                        isPinned && "ring-2 ring-yellow-500/40"
                                                    )}>
                                                        {message.content}
                                                    </div>
                                                    
                                                    {/* Message Actions */}
                                                    {!message.is_user && (
                                                        <div className="flex gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => onPinMessage(messageId)}
                                                                className={cn(
                                                                    "p-1.5 rounded-lg hover:bg-zinc-800 transition-colors",
                                                                    isPinned ? "text-yellow-500" : "text-zinc-600 hover:text-zinc-400"
                                                                )}
                                                                title="Pin message"
                                                            >
                                                                <Pin className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => onSaveToNotes(messageId, message.content, selectedPersona.name)}
                                                                className={cn(
                                                                    "p-1.5 rounded-lg hover:bg-zinc-800 transition-colors",
                                                                    isSaved ? "text-green-500" : "text-zinc-600 hover:text-zinc-400"
                                                                )}
                                                                title="Save to notes"
                                                            >
                                                                <Save className="w-3.5 h-3.5" />
                                                            </button>
                                                            {message.audio_base64 && (
                                                                <button
                                                                    onClick={() => audioActions.toggle(messageId, message.audio_base64!)}
                                                                    className={cn(
                                                                        "p-1.5 rounded-lg hover:bg-zinc-800 transition-colors",
                                                                        isPlaying ? "text-red-500" : "text-zinc-600 hover:text-zinc-400"
                                                                    )}
                                                                    title="Play audio"
                                                                >
                                                                    <Volume2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Loading */}
                                    {isLoading && (
                                        <div className="flex gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-sm shrink-0">
                                                {selectedPersona.emoji || selectedPersona.name.charAt(0)}
                                            </div>
                                            <div className="bg-zinc-800/80 rounded-2xl rounded-tl-md px-4 py-3">
                                                <div className="flex gap-1.5">
                                                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/30">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                    placeholder={`Ask ${selectedPersona.name} a question...`}
                                    disabled={isLoading}
                                    className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 focus:bg-zinc-800/80 transition-all"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim() || isLoading}
                                    className="px-5 py-3 bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl transition-all font-medium flex items-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    <span className="hidden sm:inline">Send</span>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center max-w-sm">
                            <div className="w-20 h-20 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-5">
                                <Users className="w-10 h-10 text-zinc-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-zinc-200 mb-2">Select a Suspect</h3>
                            <p className="text-sm text-zinc-500">
                                Choose a person from the list to begin your interrogation and gather evidence.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Resize Handle */}
            <div
                className={cn(
                    'w-1 flex items-center justify-center cursor-col-resize transition-colors',
                    resizeState.isResizingRight ? 'bg-red-500/50' : 'hover:bg-zinc-700'
                )}
                onMouseDown={resizeActions.startResizeRight}
            />

            {/* Right Sidebar - Case File */}
            <div 
                className="shrink-0 bg-zinc-900/50 flex flex-col"
                style={{ width: resizeState.rightWidth }}
            >
                {/* Header */}
                <div className="px-4 py-4 border-b border-zinc-800/50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-200">Case File</h3>
                            <p className="text-xs text-zinc-500">Evidence & Notes</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex px-4 pt-3 gap-1">
                    {(['case', 'clues', 'notes'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all capitalize",
                                activeTab === tab 
                                    ? "bg-red-500/20 text-red-400" 
                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                            )}
                        >
                            {tab}
                            {tab === 'clues' && revealedClues.length > 0 && (
                                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full font-semibold">
                                    {revealedClues.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'case' && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-base font-semibold text-zinc-200 mb-1">{caseInfo.scenarioName}</h4>
                                <p className="text-sm text-zinc-500 leading-relaxed">{caseInfo.setting}</p>
                            </div>

                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                    <span className="text-xs font-semibold uppercase text-red-400 tracking-wide">Victim</span>
                                </div>
                                <p className="font-semibold text-zinc-200">{caseInfo.victim.name}</p>
                                <p className="text-sm text-zinc-400">{caseInfo.victim.role}</p>
                                {caseInfo.victim.description && (
                                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{caseInfo.victim.description}</p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex gap-3 p-3 rounded-lg bg-zinc-800/30">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                                        <MapPin className="w-4 h-4 text-zinc-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase text-zinc-500 font-medium tracking-wide">Location</p>
                                        <p className="text-sm text-zinc-300">{caseInfo.location}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 p-3 rounded-lg bg-zinc-800/30">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                                        <Clock className="w-4 h-4 text-zinc-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase text-zinc-500 font-medium tracking-wide">Time of Incident</p>
                                        <p className="text-sm text-zinc-300">{caseInfo.timeOfIncident}</p>
                                    </div>
                                </div>
                            </div>

                            {caseInfo.timeline && (
                                <div className="p-3 rounded-lg bg-zinc-800/30">
                                    <div className="flex items-center gap-2 mb-2">
                                        <BookOpen className="w-4 h-4 text-zinc-500" />
                                        <span className="text-[10px] uppercase text-zinc-500 font-medium tracking-wide">Timeline</span>
                                    </div>
                                    <p className="text-sm text-zinc-400 whitespace-pre-line leading-relaxed">{caseInfo.timeline}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'clues' && (
                        <div>
                            {revealedClues.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-14 h-14 rounded-2xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
                                        <FileText className="w-7 h-7 text-zinc-600" />
                                    </div>
                                    <p className="text-sm text-zinc-400 font-medium">No clues discovered</p>
                                    <p className="text-xs text-zinc-500 mt-1">Interview suspects to uncover evidence</p>
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {revealedClues.map((clue, index) => (
                                        <li key={index} className="flex gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                                            <span className="w-6 h-6 rounded-lg bg-green-500/20 flex items-center justify-center text-xs font-bold text-green-400 shrink-0">
                                                {index + 1}
                                            </span>
                                            <p className="text-sm text-zinc-300 leading-relaxed">{clue}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div className="h-full flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                                <StickyNote className="w-4 h-4 text-zinc-500" />
                                <span className="text-xs text-zinc-500 font-medium">Your investigation notes</span>
                            </div>
                            <textarea
                                value={notes}
                                onChange={(e) => onNotesChange(e.target.value)}
                                placeholder="Write your notes here...

• Key observations
• Suspect inconsistencies  
• Your theories"
                                className="flex-1 bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4 text-sm text-zinc-300 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-zinc-600 focus:bg-zinc-800/50 transition-all leading-relaxed"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
