import { Button } from '@/Components/ui/button';
import { AlertTriangle, List, Home, Bug } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

interface GameHeaderProps {
    revealedClues: string[];
    onAccuse: () => void;
}

export function GameHeader({ revealedClues, onAccuse }: GameHeaderProps) {
    const [showClues, setShowClues] = useState(false);
    
    return (
        <header className="bg-slate-900/80 border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-slate-400 hover:text-slate-200 transition-colors">
                        <Home className="h-5 w-5" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🔍</span>
                        <div>
                            <h1 className="font-bold text-red-100">Der Fall InnoTech</h1>
                            <p className="text-xs text-slate-400">Ermittlung läuft...</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Debug button */}
                    <Link href="/debug">
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="border-slate-600 text-slate-300 hover:bg-slate-700/50 gap-2"
                        >
                            <Bug className="h-4 w-4" />
                            <span className="hidden sm:inline">Debug</span>
                        </Button>
                    </Link>
                    
                    {/* Clues button */}
                    <div className="relative">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowClues(!showClues)}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700/50 gap-2"
                        >
                            <List className="h-4 w-4" />
                            <span className="hidden sm:inline">Hinweise</span>
                            {revealedClues.length > 0 && (
                                <span className="bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                                    {revealedClues.length}
                                </span>
                            )}
                        </Button>
                        
                        {/* Clues dropdown */}
                        {showClues && (
                            <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-3 z-50">
                                <h3 className="font-semibold text-slate-200 mb-2 text-sm">Entdeckte Hinweise</h3>
                                {revealedClues.length > 0 ? (
                                    <ul className="space-y-1.5">
                                        {revealedClues.map((clue, i) => (
                                            <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                                <span className="text-red-400">•</span>
                                                {clue}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-slate-400">
                                        Noch keine Hinweise entdeckt. Befrage die Verdächtigen!
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Accuse button */}
                    <Button 
                        onClick={onAccuse}
                        className="bg-red-700 hover:bg-red-600 text-white gap-2"
                        size="sm"
                    >
                        <AlertTriangle className="h-4 w-4" />
                        <span className="hidden sm:inline">Beschuldigen</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}
