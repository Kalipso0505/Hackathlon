import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Send, Loader2 } from 'lucide-react';

interface Persona {
    slug: string;
    name: string;
    role: string;
    description: string;
    emoji: string;
}

interface Message {
    id?: number;
    persona_slug: string | null;
    content: string;
    is_user: boolean;
    created_at?: string;
}

interface ChatWindowProps {
    persona: Persona;
    messages: Message[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    introMessage?: string;
}

export function ChatWindow({ 
    persona, 
    messages, 
    onSendMessage, 
    isLoading,
    introMessage 
}: ChatWindowProps) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        inputRef.current?.focus();
    }, [persona]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <Card className="h-full flex flex-col bg-slate-800/50 border-slate-700/50">
            {/* Header */}
            <CardHeader className="border-b border-slate-700/50 py-3 px-4">
                <div className="flex items-center gap-3">
                    <div className="text-3xl">{persona.emoji}</div>
                    <div>
                        <h2 className="font-semibold text-slate-100">{persona.name}</h2>
                        <p className="text-sm text-slate-400">{persona.role}</p>
                    </div>
                </div>
            </CardHeader>
            
            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {/* Intro message */}
                {messages.length === 0 && (
                    <div className="bg-slate-700/30 rounded-lg p-4 text-sm text-slate-300 border border-slate-600/30">
                        <p className="mb-2">
                            Du sprichst jetzt mit <strong className="text-slate-100">{persona.name}</strong>.
                        </p>
                        <p className="text-slate-400">
                            Stelle Fragen über den Mordfall, ihr Alibi, oder was sie über die anderen Verdächtigen wissen.
                        </p>
                    </div>
                )}
                
                {messages.map((message, index) => (
                    <div 
                        key={index}
                        className={`flex ${message.is_user ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`
                            max-w-[80%] rounded-2xl px-4 py-2.5
                            ${message.is_user 
                                ? 'bg-red-700/80 text-white rounded-br-md' 
                                : 'bg-slate-700/70 text-slate-100 rounded-bl-md'
                            }
                        `}>
                            {!message.is_user && (
                                <div className="flex items-center gap-2 mb-1 text-xs text-slate-400">
                                    <span>{persona.emoji}</span>
                                    <span>{persona.name}</span>
                                </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                    </div>
                ))}
                
                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-700/70 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">{persona.name} schreibt...</span>
                        </div>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </CardContent>
            
            {/* Input */}
            <form onSubmit={handleSubmit} className="border-t border-slate-700/50 p-3">
                <div className="flex gap-2">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Frage an ${persona.name}...`}
                        disabled={isLoading}
                        rows={1}
                        className="
                            flex-1 resize-none bg-slate-700/50 border border-slate-600/50 
                            rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-400
                            focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30
                            disabled:opacity-50
                        "
                    />
                    <Button 
                        type="submit" 
                        disabled={!input.trim() || isLoading}
                        className="bg-red-700 hover:bg-red-600 text-white px-4"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
