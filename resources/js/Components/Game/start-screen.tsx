import { useState } from 'react';
import { Sparkles, Zap, ArrowRight, Loader2, Lightbulb, Wand2, Play } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Textarea } from '@/Components/ui/textarea';
import { Badge } from '@/Components/ui/badge';
import { cn } from '@/lib/utils';
import type { Difficulty } from '@/types/game';

interface StartScreenProps {
    scenarioInput: string;
    onScenarioInputChange: (value: string) => void;
    difficulty: Difficulty;
    onDifficultyChange: (value: Difficulty) => void;
    onGenerate: () => void;
    onQuickStart: () => void;
    isGenerating: boolean;
}

const difficulties: { value: Difficulty; label: string; description: string }[] = [
    { value: 'einfach', label: 'Easy', description: 'More hints, obvious clues' },
    { value: 'mittel', label: 'Medium', description: 'Balanced challenge' },
    { value: 'schwer', label: 'Hard', description: 'Minimal hints, complex motives' },
];

const exampleScenarios = [
    'A wedding party at a vineyard',
    'A tech startup office after hours',
    'A cruise ship in the Mediterranean',
    'A ski lodge during a blizzard',
    'An exclusive art gallery opening',
    'A luxury train journey through Europe',
];

// ============================================================================
// VARIANT SELECTOR - Change this value to switch designs: 1, 2, or 3
// ============================================================================
const DESIGN_VARIANT: 1 | 2 | 3 = 2;

export function StartScreen(props: StartScreenProps) {
    if (DESIGN_VARIANT === 1) return <StartScreenVariant1 {...props} />;
    if (DESIGN_VARIANT === 2) return <StartScreenVariant2 {...props} />;
    if (DESIGN_VARIANT === 3) return <StartScreenVariant3 {...props} />;
    return <StartScreenVariant1 {...props} />;
}

// ============================================================================
// VARIANT 1: Minimalist Split-Screen with Gradient Hero
// ============================================================================
function StartScreenVariant1({
    scenarioInput,
    onScenarioInputChange,
    difficulty,
    onDifficultyChange,
    onGenerate,
    onQuickStart,
    isGenerating,
}: StartScreenProps) {
    const [showExamples, setShowExamples] = useState(false);
    const canGenerate = scenarioInput.trim().length > 10 && !isGenerating;

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Hero */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-accent p-12 flex-col justify-between text-white">
                <div>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-8">
                        <Wand2 className="h-4 w-4" />
                        <span className="text-sm font-medium">AI-Powered Mystery</span>
                    </div>
                    <h1 className="text-5xl font-bold mb-6 leading-tight">
                        Solve the Perfect
                        <br />
                        Murder Mystery
                    </h1>
                    <p className="text-xl text-white/90 max-w-md">
                        Interrogate AI suspects with unique personalities. 
                        Every conversation reveals clues. Can you find the killer?
                    </p>
                </div>

                <div className="space-y-4 max-w-md">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold">1</span>
                        </div>
                        <div>
                            <p className="font-medium mb-1">Choose Your Mystery</p>
                            <p className="text-sm text-white/80">Quick start or create your own scenario</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold">2</span>
                        </div>
                        <div>
                            <p className="font-medium mb-1">Interrogate Suspects</p>
                            <p className="text-sm text-white/80">Chat with AI personas to uncover the truth</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold">3</span>
                        </div>
                        <div>
                            <p className="font-medium mb-1">Make Your Accusation</p>
                            <p className="text-sm text-white/80">Choose wisely - you only get one chance</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
                <div className="w-full max-w-lg">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            FAIrytale
                        </h1>
                        <p className="text-muted-foreground">
                            AI-Powered Murder Mystery
                        </p>
                    </div>

                    {/* Quick Start */}
                    <div className="mb-8">
                        <Button
                            onClick={onQuickStart}
                            disabled={isGenerating}
                            variant="default"
                            size="lg"
                            className="w-full gap-2 h-14 text-base shadow-lg"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Zap className="h-5 w-5" />
                                    Quick Start – Villa Sonnenhof Mystery
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="relative flex items-center gap-4 mb-8">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-sm font-medium text-muted-foreground">
                            Or create your own
                        </span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Custom Scenario */}
                    <div className="space-y-6">
                        <div>
                            <label className="text-sm font-semibold text-foreground mb-3 block">
                                Describe your scenario
                            </label>
                            <Textarea
                                value={scenarioInput}
                                onChange={(e) => onScenarioInputChange(e.target.value)}
                                placeholder="A wedding celebration at a vineyard in Tuscany..."
                                rows={4}
                                className="resize-none"
                                disabled={isGenerating}
                            />
                            <button
                                onClick={() => setShowExamples(!showExamples)}
                                className="mt-2 text-xs text-primary hover:underline inline-flex items-center gap-1"
                            >
                                <Lightbulb className="h-3 w-3" />
                                {showExamples ? 'Hide examples' : 'Need inspiration?'}
                            </button>
                            {showExamples && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {exampleScenarios.map((example) => (
                                        <Badge
                                            key={example}
                                            variant="outline"
                                            className="cursor-pointer hover:bg-primary/10 hover:border-primary"
                                            onClick={() => onScenarioInputChange(example)}
                                        >
                                            {example}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Difficulty */}
                        <div>
                            <label className="text-sm font-semibold text-foreground mb-3 block">
                                Difficulty
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {difficulties.map((d) => (
                                    <button
                                        key={d.value}
                                        onClick={() => onDifficultyChange(d.value)}
                                        disabled={isGenerating}
                                        className={cn(
                                            'p-3 rounded-lg border text-center transition-all',
                                            difficulty === d.value
                                                ? 'border-primary bg-primary/5 ring-2 ring-primary'
                                                : 'border-border hover:border-primary/50'
                                        )}
                                    >
                                        <p className="font-medium text-sm text-foreground">
                                            {d.label}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {d.description}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Generate Button */}
                        <Button
                            onClick={onGenerate}
                            disabled={!canGenerate}
                            variant="outline"
                            size="lg"
                            className="w-full gap-2 h-12 border-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Creating your mystery...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-5 w-5" />
                                    Generate Custom Scenario
                                    <ArrowRight className="h-4 w-4 ml-auto" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// VARIANT 2: Card-Based Centered Design with Visual Emphasis
// ============================================================================
function StartScreenVariant2({
    scenarioInput,
    onScenarioInputChange,
    difficulty,
    onDifficultyChange,
    onGenerate,
    onQuickStart,
    isGenerating,
}: StartScreenProps) {
    const [showExamples, setShowExamples] = useState(false);
    const canGenerate = scenarioInput.trim().length > 10 && !isGenerating;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background via-primary/5 to-background">
            <div className="w-full max-w-3xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent mb-6 shadow-lg">
                        <Wand2 className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-5xl font-bold text-foreground mb-4">
                        FAIrytale
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Step into an AI-powered murder mystery where every suspect has secrets to hide
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-card border-2 border-border rounded-3xl shadow-2xl overflow-hidden">
                    {/* Quick Start Section */}
                    <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-8 border-b-2 border-border">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                <Zap className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">
                                    Ready to play now?
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Jump into our curated mystery scenario
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={onQuickStart}
                            disabled={isGenerating}
                            size="lg"
                            className="w-full gap-2 h-14 text-base"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Play className="h-5 w-5" />
                                    Start Villa Sonnenhof Mystery
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Custom Section */}
                    <div className="p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                                <Sparkles className="h-6 w-6 text-accent" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">
                                    Create your own mystery
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Describe any scenario and let AI bring it to life
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Scenario Input */}
                            <div>
                                <Textarea
                                    value={scenarioInput}
                                    onChange={(e) => onScenarioInputChange(e.target.value)}
                                    placeholder="Describe your mystery scenario...

Example: A high-stakes poker game at a private mansion. The host is found dead after the final hand. Each player had a motive..."
                                    rows={5}
                                    className="resize-none text-base"
                                    disabled={isGenerating}
                                />
                                <div className="mt-3 flex items-center justify-between">
                                    <button
                                        onClick={() => setShowExamples(!showExamples)}
                                        className="text-sm text-primary hover:underline inline-flex items-center gap-1.5"
                                    >
                                        <Lightbulb className="h-4 w-4" />
                                        {showExamples ? 'Hide' : 'Show'} inspiration
                                    </button>
                                    <span className="text-xs text-muted-foreground">
                                        {scenarioInput.length} characters
                                    </span>
                                </div>
                                {showExamples && (
                                    <div className="flex flex-wrap gap-2 mt-4 p-4 bg-muted/30 rounded-lg">
                                        {exampleScenarios.map((example) => (
                                            <Badge
                                                key={example}
                                                variant="secondary"
                                                className="cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors"
                                                onClick={() => onScenarioInputChange(example)}
                                            >
                                                {example}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Difficulty Selector */}
                            <div>
                                <label className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <span>Choose difficulty</span>
                                    <Badge variant="outline" className="text-xs">
                                        {difficulty}
                                    </Badge>
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {difficulties.map((d) => (
                                        <button
                                            key={d.value}
                                            onClick={() => onDifficultyChange(d.value)}
                                            disabled={isGenerating}
                                            className={cn(
                                                'p-4 rounded-xl border-2 text-center transition-all',
                                                difficulty === d.value
                                                    ? 'border-primary bg-primary text-primary-foreground shadow-lg scale-105'
                                                    : 'border-border hover:border-primary/50 hover:scale-102'
                                            )}
                                        >
                                            <p className="font-bold text-base mb-1">
                                                {d.label}
                                            </p>
                                            <p className={cn(
                                                "text-xs",
                                                difficulty === d.value
                                                    ? 'text-primary-foreground/90'
                                                    : 'text-muted-foreground'
                                            )}>
                                                {d.description}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Generate Button */}
                            <Button
                                onClick={onGenerate}
                                disabled={!canGenerate}
                                size="lg"
                                className="w-full gap-2 h-14 text-base shadow-lg"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Creating your mystery...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-5 w-5" />
                                        Generate My Mystery
                                        <ArrowRight className="h-5 w-5 ml-auto" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-muted-foreground mt-8">
                    Powered by advanced AI • Every game is unique • Unlimited possibilities
                </p>
            </div>
        </div>
    );
}

// ============================================================================
// VARIANT 3: Compact Two-Column with Tabs
// ============================================================================
function StartScreenVariant3({
    scenarioInput,
    onScenarioInputChange,
    difficulty,
    onDifficultyChange,
    onGenerate,
    onQuickStart,
    isGenerating,
}: StartScreenProps) {
    const [activeTab, setActiveTab] = useState<'quick' | 'custom'>('quick');
    const [showExamples, setShowExamples] = useState(false);
    const canGenerate = scenarioInput.trim().length > 10 && !isGenerating;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
            <div className="w-full max-w-5xl">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                    {/* Left - Branding */}
                    <div className="text-center lg:text-left">
                        <Badge className="mb-6 text-sm px-4 py-1.5">
                            AI-Powered Investigation
                        </Badge>
                        <h1 className="text-6xl font-bold text-foreground mb-6 tracking-tight">
                            FAIrytale
                        </h1>
                        <p className="text-2xl text-muted-foreground mb-8 leading-relaxed">
                            Interrogate AI suspects.
                            <br />
                            Uncover hidden motives.
                            <br />
                            <span className="text-foreground font-semibold">Solve the murder.</span>
                        </p>

                        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
                            <div className="text-center p-4 rounded-xl bg-card border">
                                <div className="text-3xl font-bold text-primary mb-1">∞</div>
                                <p className="text-xs text-muted-foreground">Scenarios</p>
                            </div>
                            <div className="text-center p-4 rounded-xl bg-card border">
                                <div className="text-3xl font-bold text-primary mb-1">AI</div>
                                <p className="text-xs text-muted-foreground">Powered</p>
                            </div>
                            <div className="text-center p-4 rounded-xl bg-card border">
                                <div className="text-3xl font-bold text-primary mb-1">1×</div>
                                <p className="text-xs text-muted-foreground">Guess</p>
                            </div>
                        </div>
                    </div>

                    {/* Right - Game Start */}
                    <div className="bg-card border-2 rounded-2xl shadow-2xl overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b-2">
                            <button
                                onClick={() => setActiveTab('quick')}
                                className={cn(
                                    'flex-1 px-6 py-4 font-semibold transition-all',
                                    activeTab === 'quick'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-muted'
                                )}
                            >
                                <Zap className="h-4 w-4 inline mr-2" />
                                Quick Start
                            </button>
                            <button
                                onClick={() => setActiveTab('custom')}
                                className={cn(
                                    'flex-1 px-6 py-4 font-semibold transition-all',
                                    activeTab === 'custom'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-muted'
                                )}
                            >
                                <Sparkles className="h-4 w-4 inline mr-2" />
                                Custom
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Quick Start Tab */}
                            {activeTab === 'quick' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground mb-2">
                                            Villa Sonnenhof Mystery
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-6">
                                            A curated murder mystery set in an elegant villa. 
                                            Perfect for first-time detectives.
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
                                            <Badge variant="secondary">Medium Difficulty</Badge>
                                            <Badge variant="secondary">~30 min</Badge>
                                            <Badge variant="secondary">6 Suspects</Badge>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={onQuickStart}
                                        disabled={isGenerating}
                                        size="lg"
                                        className="w-full gap-2 h-14 text-base"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Starting...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="h-5 w-5" />
                                                Start Investigation
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}

                            {/* Custom Tab */}
                            {activeTab === 'custom' && (
                                <div className="space-y-5">
                                    {/* Scenario */}
                                    <div>
                                        <label className="text-sm font-semibold text-foreground mb-2 block">
                                            Your scenario
                                        </label>
                                        <Textarea
                                            value={scenarioInput}
                                            onChange={(e) => onScenarioInputChange(e.target.value)}
                                            placeholder="Describe your mystery setting..."
                                            rows={4}
                                            className="resize-none"
                                            disabled={isGenerating}
                                        />
                                        <button
                                            onClick={() => setShowExamples(!showExamples)}
                                            className="mt-2 text-xs text-primary hover:underline inline-flex items-center gap-1"
                                        >
                                            <Lightbulb className="h-3 w-3" />
                                            Examples
                                        </button>
                                        {showExamples && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {exampleScenarios.map((example) => (
                                                    <Badge
                                                        key={example}
                                                        variant="outline"
                                                        className="cursor-pointer hover:bg-primary/10 text-xs"
                                                        onClick={() => onScenarioInputChange(example)}
                                                    >
                                                        {example}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Difficulty */}
                                    <div>
                                        <label className="text-sm font-semibold text-foreground mb-2 block">
                                            Difficulty
                                        </label>
                                        <div className="flex gap-2">
                                            {difficulties.map((d) => (
                                                <button
                                                    key={d.value}
                                                    onClick={() => onDifficultyChange(d.value)}
                                                    disabled={isGenerating}
                                                    className={cn(
                                                        'flex-1 p-3 rounded-lg border transition-all text-center',
                                                        difficulty === d.value
                                                            ? 'border-primary bg-primary/10 ring-2 ring-primary'
                                                            : 'border-border hover:border-primary/50'
                                                    )}
                                                >
                                                    <p className="font-semibold text-sm">
                                                        {d.label}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Generate */}
                                    <Button
                                        onClick={onGenerate}
                                        disabled={!canGenerate}
                                        size="lg"
                                        className="w-full gap-2 h-12"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-5 w-5" />
                                                Generate
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-8">
                    Every mystery is unique • Powered by AI • No two games are the same
                </p>
            </div>
        </div>
    );
}
