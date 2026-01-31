import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { X, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface Persona {
    slug: string;
    name: string;
    role: string;
    description: string;
    emoji: string;
}

interface AccuseModalProps {
    isOpen: boolean;
    onClose: () => void;
    personas: Persona[];
    onAccuse: (personaSlug: string) => void;
    isLoading: boolean;
}

export function AccuseModal({ 
    isOpen, 
    onClose, 
    personas, 
    onAccuse,
    isLoading 
}: AccuseModalProps) {
    const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
    const [confirmStep, setConfirmStep] = useState(false);
    
    if (!isOpen) return null;
    
    const handleAccuse = () => {
        if (!selectedSlug) return;
        
        if (!confirmStep) {
            setConfirmStep(true);
            return;
        }
        
        onAccuse(selectedSlug);
    };
    
    const handleClose = () => {
        setSelectedSlug(null);
        setConfirmStep(false);
        onClose();
    };
    
    const selectedPersona = personas.find(p => p.slug === selectedSlug);
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
            />
            
            {/* Modal */}
            <Card className="relative z-10 max-w-lg w-full bg-slate-900 border-red-900/50">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-700/50">
                    <CardTitle className="flex items-center gap-2 text-red-100">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        {confirmStep ? 'Bist du sicher?' : 'Täter beschuldigen'}
                    </CardTitle>
                    <button 
                        onClick={handleClose}
                        className="text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </CardHeader>
                
                <CardContent className="p-6">
                    {!confirmStep ? (
                        <>
                            <p className="text-slate-300 mb-4">
                                Wen beschuldigst du des Mordes an Marcus Weber?
                            </p>
                            <p className="text-sm text-red-400 mb-6">
                                Achtung: Diese Entscheidung beendet das Spiel!
                            </p>
                            
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {personas.map(persona => (
                                    <button
                                        key={persona.slug}
                                        onClick={() => setSelectedSlug(persona.slug)}
                                        className={`
                                            p-4 rounded-lg border transition-all text-left
                                            ${selectedSlug === persona.slug
                                                ? 'bg-red-900/50 border-red-500/50'
                                                : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
                                            }
                                        `}
                                    >
                                        <div className="text-2xl mb-2">{persona.emoji}</div>
                                        <div className="font-medium text-slate-200">{persona.name}</div>
                                        <div className="text-xs text-slate-400">{persona.role}</div>
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <div className="text-4xl mb-4">{selectedPersona?.emoji}</div>
                            <p className="text-slate-300 mb-2">
                                Du beschuldigst
                            </p>
                            <p className="text-xl font-bold text-red-100 mb-4">
                                {selectedPersona?.name}
                            </p>
                            <p className="text-sm text-slate-400 mb-6">
                                Diese Entscheidung ist endgültig und beendet das Spiel.
                            </p>
                        </div>
                    )}
                    
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={confirmStep ? () => setConfirmStep(false) : handleClose}
                            className="flex-1 border-slate-600 text-slate-300"
                            disabled={isLoading}
                        >
                            {confirmStep ? 'Zurück' : 'Abbrechen'}
                        </Button>
                        <Button
                            onClick={handleAccuse}
                            disabled={!selectedSlug || isLoading}
                            className="flex-1 bg-red-700 hover:bg-red-600 text-white"
                        >
                            {isLoading ? 'Wird geprüft...' : confirmStep ? 'Beschuldigen' : 'Weiter'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
