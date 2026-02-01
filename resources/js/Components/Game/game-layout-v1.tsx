/**
 * Game Layout V1 - Dark FBI Operations Center
 * Dunkles Design mit roten Akzenten
 * Minimalistisch, fokussiert auf den Chat
 */
import { GripVertical, Users, FileText, MessageCircle, MapPin, Clock, AlertTriangle, BookOpen, StickyNote, Send, Pin, Save, Volume2 } from 'lucide-react';
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

export function GameLayoutV1({
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
        minWidth: 200,
        maxWidth: 400,
        defaultLeftWidth: 260,
        defaultRightWidth: 300,
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
                className="shrink-0 border-r border-zinc-800 flex flex-col"
                style={{ width: resizeState.leftWidth }}
            >
                {/* Header */}
                <div className="px-4 py-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                            Suspects
                        </span>
                        <span className="text-xs text-zinc-600 font-mono">({personas.length})</span>
                    </div>
                </div>

                {/* Persona List */}
                <div className="flex-1 overflow-y-auto">
                    {personas.map((persona) => {
                        const isSelected = selectedPersona?.slug === persona.slug;
                        const unread = getUnreadCount(persona.slug);
                        
                        return (
                            <button
                                key={persona.slug}
                                onClick={() => onSelectPersona(persona)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-zinc-800/50",
                                    isSelected 
                                        ? "bg-red-500/10 border-l-2 border-l-red-500" 
                                        : "hover:bg-zinc-900/50"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0",
                                    isSelected 
                                        ? "bg-red-500/20 text-red-400" 
                                        : "bg-zinc-800 text-zinc-400"
                                )}>
                                    {persona.emoji || persona.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={cn(
                                            "font-medium truncate text-sm",
                                            isSelected ? "text-red-400" : "text-zinc-200"
                                        )}>
                                            {persona.name}
                                        </span>
                                        {unread > 0 && (
                                            <span className="px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full font-bold">
                                                {unread}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-zinc-500 truncate">
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
                    'w-1 flex items-center justify-center cursor-col-resize hover:bg-red-500/20 transition-colors',
                    resizeState.isResizingLeft && 'bg-red-500/30'
                )}
                onMouseDown={resizeActions.startResizeLeft}
            />

            {/* Center - Chat */}
            <div className="flex-1 min-w-0 flex flex-col">
                {selectedPersona ? (
                    <>
                        {/* Chat Header */}
                        <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg">
                                {selectedPersona.emoji || selectedPersona.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <h2 className="font-semibold text-zinc-100">{selectedPersona.name}</h2>
                                <p className="text-xs text-zinc-500">{selectedPersona.role}</p>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="font-mono">ONLINE</span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {currentMessages.length === 0 ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-center">
                                        <MessageCircle className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                                        <p className="text-sm text-zinc-500">
                                            Begin interrogation of <span className="text-zinc-300">{selectedPersona.name}</span>
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
                                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm shrink-0">
                                                        {selectedPersona.emoji || selectedPersona.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div className={cn(
                                                    "max-w-[70%] group relative",
                                                    message.is_user ? "items-end" : "items-start"
                                                )}>
                                                    <div className={cn(
                                                        "px-4 py-2.5 rounded-2xl text-sm",
                                                        message.is_user 
                                                            ? "bg-red-600 text-white rounded-br-md" 
                                                            : "bg-zinc-800 text-zinc-200 rounded-bl-md",
                                                        isPinned && "ring-1 ring-yellow-500/50"
                                                    )}>
                                                        {message.content}
                                                    </div>
                                                    
                                                    {/* Message Actions */}
                                                    {!message.is_user && (
                                                        <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => onPinMessage(messageId)}
                                                                className={cn(
                                                                    "p-1 rounded hover:bg-zinc-800",
                                                                    isPinned ? "text-yellow-500" : "text-zinc-600"
                                                                )}
                                                            >
                                                                <Pin className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                onClick={() => onSaveToNotes(messageId, message.content, selectedPersona.name)}
                                                                className={cn(
                                                                    "p-1 rounded hover:bg-zinc-800",
                                                                    isSaved ? "text-green-500" : "text-zinc-600"
                                                                )}
                                                            >
                                                                <Save className="w-3 h-3" />
                                                            </button>
                                                            {message.audio_base64 && (
                                                                <button
                                                                    onClick={() => audioActions.toggle(messageId, message.audio_base64!)}
                                                                    className={cn(
                                                                        "p-1 rounded hover:bg-zinc-800",
                                                                        isPlaying ? "text-red-500" : "text-zinc-600"
                                                                    )}
                                                                >
                                                                    <Volume2 className="w-3 h-3" />
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
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm shrink-0">
                                                {selectedPersona.emoji || selectedPersona.name.charAt(0)}
                                            </div>
                                            <div className="bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-3">
                                                <div className="flex gap-1">
                                                    <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                    <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                    <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-zinc-800">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                    placeholder={`Interrogate ${selectedPersona.name}...`}
                                    disabled={isLoading}
                                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim() || isLoading}
                                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">👈</span>
                            </div>
                            <h3 className="text-lg font-semibold text-zinc-200 mb-2">Select a Suspect</h3>
                            <p className="text-sm text-zinc-500 max-w-xs">
                                Choose a person from the list to begin your interrogation
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Resize Handle */}
            <div
                className={cn(
                    'w-1 flex items-center justify-center cursor-col-resize hover:bg-red-500/20 transition-colors',
                    resizeState.isResizingRight && 'bg-red-500/30'
                )}
                onMouseDown={resizeActions.startResizeRight}
            />

            {/* Right Sidebar - Case File */}
            <div 
                className="shrink-0 border-l border-zinc-800 flex flex-col"
                style={{ width: resizeState.rightWidth }}
            >
                {/* Header */}
                <div className="px-4 py-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                            Case File
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-800">
                    {(['case', 'clues', 'notes'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 py-2 text-xs font-mono uppercase tracking-wider transition-colors",
                                activeTab === tab 
                                    ? "text-red-400 border-b-2 border-red-500 bg-red-500/5" 
                                    : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            {tab}
                            {tab === 'clues' && revealedClues.length > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full">
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
                                <h4 className="text-sm font-bold text-zinc-200 mb-1">{caseInfo.scenarioName}</h4>
                                <p className="text-xs text-zinc-500">{caseInfo.setting}</p>
                            </div>

                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                    <span className="text-xs font-mono uppercase text-red-400">Victim</span>
                                </div>
                                <p className="font-semibold text-zinc-200">{caseInfo.victim.name}</p>
                                <p className="text-sm text-zinc-400">{caseInfo.victim.role}</p>
                                {caseInfo.victim.description && (
                                    <p className="text-xs text-zinc-500 mt-1">{caseInfo.victim.description}</p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <MapPin className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-mono uppercase text-zinc-600">Location</p>
                                        <p className="text-sm text-zinc-300">{caseInfo.location}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Clock className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-mono uppercase text-zinc-600">Time</p>
                                        <p className="text-sm text-zinc-300">{caseInfo.timeOfIncident}</p>
                                    </div>
                                </div>
                            </div>

                            {caseInfo.timeline && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <BookOpen className="w-4 h-4 text-zinc-600" />
                                        <span className="text-[10px] font-mono uppercase text-zinc-600">Timeline</span>
                                    </div>
                                    <p className="text-xs text-zinc-400 whitespace-pre-line">{caseInfo.timeline}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'clues' && (
                        <div>
                            {revealedClues.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                                    <p className="text-sm text-zinc-500">No clues discovered</p>
                                    <p className="text-xs text-zinc-600 mt-1">Interview suspects to uncover evidence</p>
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {revealedClues.map((clue, index) => (
                                        <li key={index} className="flex gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                            <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-[10px] font-bold text-green-400 shrink-0">
                                                {index + 1}
                                            </span>
                                            <p className="text-sm text-zinc-300">{clue}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div className="h-full flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                                <StickyNote className="w-4 h-4 text-zinc-600" />
                                <span className="text-[10px] font-mono uppercase text-zinc-600">Investigation Notes</span>
                            </div>
                            <textarea
                                value={notes}
                                onChange={(e) => onNotesChange(e.target.value)}
                                placeholder="Write your notes here..."
                                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-zinc-700"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
