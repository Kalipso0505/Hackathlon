import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { PersonaSelector } from '@/Components/Game/PersonaSelector';
import { ChatWindow } from '@/Components/Game/ChatWindow';
import { GameHeader } from '@/Components/Game/GameHeader';
import { AccuseModal } from '@/Components/Game/AccuseModal';
import axios from 'axios';

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

interface GameState {
    gameId: string | null;
    status: 'idle' | 'loading' | 'active' | 'solved' | 'failed';
    introMessage: string;
    revealedClues: string[];
    messages: Record<string, Message[]>; // Per persona
}

interface Props {
    personas: Persona[];
}

export default function Game({ personas }: Props) {
    const [gameState, setGameState] = useState<GameState>({
        gameId: null,
        status: 'idle',
        introMessage: '',
        revealedClues: [],
        messages: {},
    });
    const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showAccuseModal, setShowAccuseModal] = useState(false);
    const [solution, setSolution] = useState<{
        correct: boolean;
        message: string;
        solution: { murderer: string; motive: string; weapon: string };
    } | null>(null);

    const startGame = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post('/game/start');
            const data = response.data;
            
            setGameState({
                gameId: data.game_id,
                status: 'active',
                introMessage: data.intro_message,
                revealedClues: [],
                messages: {},
            });
        } catch (error) {
            console.error('Failed to start game:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async (message: string) => {
        if (!gameState.gameId || !selectedPersona) return;

        const personaSlug = selectedPersona.slug;
        
        // Add user message to UI immediately
        const userMessage: Message = {
            persona_slug: null,
            content: message,
            is_user: true,
        };
        
        setGameState(prev => ({
            ...prev,
            messages: {
                ...prev.messages,
                [personaSlug]: [...(prev.messages[personaSlug] || []), userMessage],
            },
        }));

        setIsLoading(true);
        try {
            const response = await axios.post('/game/chat', {
                game_id: gameState.gameId,
                persona_slug: personaSlug,
                message: message,
            });
            
            const data = response.data;
            
            // Add persona response
            const personaMessage: Message = {
                persona_slug: data.persona_slug,
                content: data.response,
                is_user: false,
            };
            
            setGameState(prev => ({
                ...prev,
                messages: {
                    ...prev.messages,
                    [personaSlug]: [...(prev.messages[personaSlug] || []), personaMessage],
                },
                revealedClues: data.revealed_clue 
                    ? [...prev.revealedClues, data.revealed_clue]
                    : prev.revealedClues,
            }));
        } catch (error: any) {
            const errorMessage: Message = {
                persona_slug: personaSlug,
                content: error.response?.data?.error || 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.',
                is_user: false,
            };
            
            setGameState(prev => ({
                ...prev,
                messages: {
                    ...prev.messages,
                    [personaSlug]: [...(prev.messages[personaSlug] || []), errorMessage],
                },
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const accusePersona = async (accusedSlug: string) => {
        if (!gameState.gameId) return;

        setIsLoading(true);
        try {
            const response = await axios.post('/game/accuse', {
                game_id: gameState.gameId,
                accused_persona: accusedSlug,
            });
            
            setSolution(response.data);
            setGameState(prev => ({
                ...prev,
                status: response.data.correct ? 'solved' : 'failed',
            }));
        } catch (error) {
            console.error('Failed to accuse:', error);
        } finally {
            setIsLoading(false);
            setShowAccuseModal(false);
        }
    };

    // Idle state - show start screen
    if (gameState.status === 'idle') {
        return (
            <>
                <Head title="Murder Mystery - Start" />
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex items-center justify-center p-6">
                    <Card className="max-w-2xl w-full bg-slate-900/80 border-red-900/50 backdrop-blur">
                        <CardHeader className="text-center space-y-4">
                            <div className="text-6xl">🔍</div>
                            <CardTitle className="text-4xl font-bold text-red-100">
                                Der Fall InnoTech
                            </CardTitle>
                            <CardDescription className="text-lg text-slate-300">
                                Ein Mordfall erschüttert das Tech-Startup. Kannst du den Mörder finden?
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-slate-800/50 rounded-lg p-6 space-y-4 text-slate-300">
                                <p>
                                    <span className="text-red-400 font-semibold">Das Opfer:</span> Marcus Weber, CFO der InnoTech GmbH, wurde tot in seinem Büro aufgefunden.
                                </p>
                                <p>
                                    <span className="text-red-400 font-semibold">Die Tatzeit:</span> Sonntagabend zwischen 20:00 und 23:00 Uhr.
                                </p>
                                <p>
                                    <span className="text-red-400 font-semibold">Deine Aufgabe:</span> Befrage die vier Verdächtigen und finde heraus, wer der Mörder ist.
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {personas.map(persona => (
                                    <div 
                                        key={persona.slug}
                                        className="bg-slate-800/30 rounded-lg p-3 text-center border border-slate-700/50"
                                    >
                                        <div className="text-2xl mb-1">{persona.emoji}</div>
                                        <div className="text-sm font-medium text-slate-200">{persona.name}</div>
                                        <div className="text-xs text-slate-400">{persona.role}</div>
                                    </div>
                                ))}
                            </div>
                            
                            <Button 
                                onClick={startGame} 
                                disabled={isLoading}
                                className="w-full bg-red-700 hover:bg-red-600 text-white py-6 text-lg"
                            >
                                {isLoading ? 'Wird geladen...' : 'Ermittlung starten'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    // Game ended - show solution
    if (solution) {
        return (
            <>
                <Head title={solution.correct ? 'Fall gelöst!' : 'Fall nicht gelöst'} />
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex items-center justify-center p-6">
                    <Card className={`max-w-2xl w-full backdrop-blur ${
                        solution.correct 
                            ? 'bg-green-900/80 border-green-500/50' 
                            : 'bg-red-900/80 border-red-500/50'
                    }`}>
                        <CardHeader className="text-center space-y-4">
                            <div className="text-6xl">{solution.correct ? '🎉' : '😔'}</div>
                            <CardTitle className="text-3xl font-bold text-white">
                                {solution.correct ? 'Fall gelöst!' : 'Falsche Beschuldigung'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 text-white">
                            <p className="text-lg text-center">{solution.message}</p>
                            
                            <div className="bg-black/20 rounded-lg p-6 space-y-3">
                                <h3 className="font-semibold text-lg border-b border-white/20 pb-2">Die Auflösung</h3>
                                <p><span className="opacity-70">Täter:</span> {solution.solution.murderer}</p>
                                <p><span className="opacity-70">Motiv:</span> {solution.solution.motive}</p>
                                <p><span className="opacity-70">Tatwaffe:</span> {solution.solution.weapon}</p>
                            </div>
                            
                            <Button 
                                onClick={() => {
                                    setGameState({
                                        gameId: null,
                                        status: 'idle',
                                        introMessage: '',
                                        revealedClues: [],
                                        messages: {},
                                    });
                                    setSolution(null);
                                }}
                                className="w-full bg-white/20 hover:bg-white/30 text-white py-4"
                            >
                                Neues Spiel starten
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    // Active game
    return (
        <>
            <Head title="Murder Mystery - Ermittlung" />
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
                <GameHeader 
                    revealedClues={gameState.revealedClues}
                    onAccuse={() => setShowAccuseModal(true)}
                />
                
                <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full">
                    {/* Persona Selector - Sidebar on desktop, top on mobile */}
                    <div className="lg:w-72 shrink-0">
                        <PersonaSelector 
                            personas={personas}
                            selectedPersona={selectedPersona}
                            onSelect={setSelectedPersona}
                            messageCount={Object.fromEntries(
                                personas.map(p => [p.slug, gameState.messages[p.slug]?.length || 0])
                            )}
                        />
                    </div>
                    
                    {/* Chat Window */}
                    <div className="flex-1 min-h-0">
                        {selectedPersona ? (
                            <ChatWindow 
                                persona={selectedPersona}
                                messages={gameState.messages[selectedPersona.slug] || []}
                                onSendMessage={sendMessage}
                                isLoading={isLoading}
                                introMessage={gameState.introMessage}
                            />
                        ) : (
                            <Card className="h-full bg-slate-800/50 border-slate-700/50 flex items-center justify-center">
                                <CardContent className="text-center text-slate-400">
                                    <div className="text-4xl mb-4">👈</div>
                                    <p>Wähle eine Person aus, um sie zu befragen</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
                
                {/* Accuse Modal */}
                <AccuseModal 
                    isOpen={showAccuseModal}
                    onClose={() => setShowAccuseModal(false)}
                    personas={personas}
                    onAccuse={accusePersona}
                    isLoading={isLoading}
                />
            </div>
        </>
    );
}
