/**
 * Accuse Modal V2 - FBI Dossier Style
 * Passend zum V2 Game Layout
 */
import { useState } from 'react';
import { Target, AlertTriangle, X, Stamp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Persona } from '@/types/game';

interface AccuseModalProps {
    isOpen: boolean;
    onClose: () => void;
    personas: Persona[];
    onAccuse: (personaSlug: string) => void;
    isLoading: boolean;
}

export function AccuseModalV2({
    isOpen,
    onClose,
    personas,
    onAccuse,
    isLoading,
}: AccuseModalProps) {
    const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
    const [confirmStep, setConfirmStep] = useState(false);

    const handleClose = () => {
        setSelectedSlug(null);
        setConfirmStep(false);
        onClose();
    };

    const handleSelect = (slug: string) => {
        setSelectedSlug(slug);
        setConfirmStep(false);
    };

    const handleProceed = () => {
        if (selectedSlug) {
            setConfirmStep(true);
        }
    };

    const handleConfirm = () => {
        if (selectedSlug) {
            onAccuse(selectedSlug);
        }
    };

    const selectedPersona = personas.find(p => p.slug === selectedSlug);

    if (!isOpen) return null;

    // Paper background style
    const paperBg = {
        background: 'linear-gradient(135deg, #f5f0e1 0%, #e8e0cc 50%, #f0e8d8 100%)',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/70"
                onClick={handleClose}
            />
            
            {/* Modal */}
            <div 
                className="relative w-full max-w-lg rounded-lg shadow-2xl overflow-hidden font-mono"
                style={paperBg}
            >
                {/* Red Header Bar */}
                <div className="bg-red-800 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Target className="w-6 h-6 text-white" />
                            <div>
                                <h2 className="text-white font-bold uppercase tracking-wider">
                                    Official Accusation
                                </h2>
                                <p className="text-red-200 text-xs uppercase tracking-wider">
                                    Case Resolution Form
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-red-200 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {!confirmStep ? (
                        <>
                            {/* Instructions */}
                            <div className="mb-4 p-3 border-2 border-zinc-400 bg-white/50">
                                <p className="text-xs text-zinc-600 uppercase tracking-wider mb-1">Instructions:</p>
                                <p className="text-sm text-zinc-700">
                                    Select the individual you believe to be responsible for the crime. 
                                    This decision is final and cannot be reversed.
                                </p>
                            </div>

                            {/* Suspect Selection */}
                            <div className="space-y-2 mb-6">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
                                    ★ Persons of Interest ★
                                </p>
                                {personas.map((persona, idx) => (
                                    <button
                                        key={persona.slug}
                                        onClick={() => handleSelect(persona.slug)}
                                        className={cn(
                                            'w-full flex items-center gap-3 p-3 border-2 transition-all text-left',
                                            selectedSlug === persona.slug
                                                ? 'border-red-700 bg-red-50'
                                                : 'border-zinc-300 bg-white/50 hover:border-zinc-500 hover:bg-amber-50/50'
                                        )}
                                    >
                                        <span className="text-xs text-zinc-500 font-bold">#{idx + 1}</span>
                                        <div className={cn(
                                            "w-10 h-10 rounded border-2 flex items-center justify-center text-lg font-bold",
                                            selectedSlug === persona.slug
                                                ? "border-red-700 bg-red-100 text-red-700"
                                                : "border-zinc-400 bg-zinc-100 text-zinc-600"
                                        )}>
                                            {persona.emoji || persona.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "font-bold uppercase text-sm",
                                                selectedSlug === persona.slug ? "text-red-800" : "text-zinc-700"
                                            )}>
                                                {persona.name}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                {persona.role}
                                            </p>
                                        </div>
                                        {selectedSlug === persona.slug && (
                                            <div className="px-2 py-1 bg-red-700 text-white text-[10px] uppercase tracking-wider rounded">
                                                Selected
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t-2 border-zinc-300">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2.5 border-2 border-zinc-400 text-zinc-600 hover:bg-zinc-100 transition-colors text-sm uppercase tracking-wider"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleProceed}
                                    disabled={!selectedSlug}
                                    className="flex-1 px-4 py-2.5 bg-red-700 hover:bg-red-800 disabled:bg-zinc-300 disabled:text-zinc-500 text-white transition-colors text-sm uppercase tracking-wider border-2 border-red-800 disabled:border-zinc-400"
                                >
                                    Proceed
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Confirmation */}
                            <div className="text-center py-4">
                                {/* Warning Stamp */}
                                <div className="relative inline-block mb-6">
                                    <div className="w-24 h-24 rounded-full border-4 border-red-700 flex items-center justify-center mx-auto transform -rotate-12">
                                        <div className="text-center">
                                            <AlertTriangle className="w-8 h-8 text-red-700 mx-auto" />
                                            <span className="text-[10px] text-red-700 font-bold uppercase">Warning</span>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-zinc-800 mb-2 uppercase tracking-wide">
                                    Confirm Accusation
                                </h3>
                                <p className="text-sm text-zinc-600 mb-4">
                                    You are about to formally accuse:
                                </p>
                                
                                {selectedPersona && (
                                    <div className="inline-block p-4 border-2 border-red-700 bg-red-50 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded border-2 border-red-700 bg-white flex items-center justify-center text-xl font-bold text-red-700">
                                                {selectedPersona.emoji || selectedPersona.name.charAt(0)}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-red-800 uppercase">{selectedPersona.name}</p>
                                                <p className="text-xs text-zinc-600">{selectedPersona.role}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="p-3 border border-zinc-400 bg-amber-50/50 text-xs text-zinc-600">
                                    <AlertTriangle className="w-4 h-4 inline-block mr-1 text-amber-600" />
                                    This action is final. An incorrect accusation will result in case failure.
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t-2 border-zinc-300">
                                <button
                                    onClick={() => setConfirmStep(false)}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2.5 border-2 border-zinc-400 text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 transition-colors text-sm uppercase tracking-wider"
                                >
                                    Go Back
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2.5 bg-red-700 hover:bg-red-800 disabled:bg-red-400 text-white transition-colors text-sm uppercase tracking-wider border-2 border-red-800"
                                >
                                    {isLoading ? 'Processing...' : 'Confirm'}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-2 border-t border-zinc-300 text-center bg-zinc-100/50">
                    <span className="text-[10px] text-red-700 uppercase tracking-widest">
                        ★ Confidential Document ★
                    </span>
                </div>
            </div>
        </div>
    );
}
