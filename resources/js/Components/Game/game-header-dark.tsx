/**
 * Game Header - Dark Theme
 * Passend zu den neuen dunklen Game Layouts
 */
import { Target, RotateCcw, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameStatus } from '@/types/game';

interface GameHeaderProps {
    scenarioName: string;
    status: GameStatus;
    onAccuse: () => void;
    onReset: () => void;
}

export function GameHeaderDark({
    scenarioName,
    status,
    onAccuse,
    onReset,
}: GameHeaderProps) {
    const canAccuse = status === 'active';
    const isEnded = status === 'solved' || status === 'failed';

    return (
        <header className="bg-zinc-900 border-b border-zinc-800">
            <div className="flex items-center justify-between h-14 px-4">
                {/* Left: Logo & Scenario */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Shield className="h-6 w-6 text-red-500" />
                        <span className="font-bold text-lg tracking-tight text-zinc-100 hidden sm:inline">
                            F<span className="text-red-500">AI</span>rytale
                        </span>
                    </div>
                    
                    {scenarioName && (
                        <>
                            <div className="h-6 w-px bg-zinc-700" />
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-zinc-300 truncate max-w-[200px]">
                                    {scenarioName}
                                </span>
                                {status === 'active' && (
                                    <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-green-500/20 text-green-400 rounded border border-green-500/30">
                                        Investigating
                                    </span>
                                )}
                                {status === 'solved' && (
                                    <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-green-500/20 text-green-400 rounded border border-green-500/30">
                                        Solved
                                    </span>
                                )}
                                {status === 'failed' && (
                                    <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-red-500/20 text-red-400 rounded border border-red-500/30">
                                        Failed
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    {canAccuse && (
                        <button
                            onClick={onAccuse}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <Target className="h-4 w-4" />
                            <span className="hidden sm:inline">Make Accusation</span>
                            <span className="sm:hidden">Accuse</span>
                        </button>
                    )}

                    {isEnded && (
                        <button
                            onClick={onReset}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg transition-colors border border-zinc-700"
                        >
                            <RotateCcw className="h-4 w-4" />
                            <span className="hidden sm:inline">New Game</span>
                            <span className="sm:hidden">New</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
