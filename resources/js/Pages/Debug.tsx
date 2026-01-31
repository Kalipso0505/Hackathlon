import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { RefreshCw, Eye, Code } from 'lucide-react';
import axios from 'axios';

interface Persona {
    slug: string;
    name: string;
    role: string;
    personality: string;
    private_knowledge: string;
    shared_knowledge: string;
    knows_about_others: string;
}

export default function Debug() {
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        loadPersonas();
    }, []);

    const loadPersonas = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/debug/personas');
            setPersonas(response.data.personas);
        } catch (error) {
            console.error('Failed to load personas:', error);
        } finally {
            setLoading(false);
        }
    };

    const selected = personas.find(p => p.slug === selectedPersona);

    return (
        <>
            <Head title="Debug Dashboard" />
            <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-red-400">🔍 Debug Dashboard</h1>
                            <p className="text-slate-400 mt-1">Agent Knowledge & System Prompts</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={loadPersonas}
                                variant="outline"
                                className="border-slate-700 text-slate-300"
                                disabled={loading}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                            <a href="/game">
                                <Button className="bg-red-700 hover:bg-red-600">
                                    Back to Game
                                </Button>
                            </a>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-6">
                        {/* Sidebar - Persona List */}
                        <div className="col-span-3">
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-lg text-slate-200">Agents</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {personas.map(persona => (
                                        <button
                                            key={persona.slug}
                                            onClick={() => setSelectedPersona(persona.slug)}
                                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                                                selectedPersona === persona.slug
                                                    ? 'bg-red-900/50 border-red-500 border'
                                                    : 'bg-slate-800 hover:bg-slate-750 border border-slate-700'
                                            }`}
                                        >
                                            <div className="font-medium text-slate-200">{persona.name}</div>
                                            <div className="text-sm text-slate-400">{persona.role}</div>
                                            <div className="text-xs text-slate-500 mt-1">{persona.slug}</div>
                                        </button>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content - Persona Details */}
                        <div className="col-span-9">
                            {selected ? (
                                <div className="space-y-4">
                                    {/* Personality */}
                                    <Card className="bg-slate-900 border-slate-800">
                                        <CardHeader>
                                            <CardTitle className="text-red-400 flex items-center gap-2">
                                                <Eye className="h-5 w-5" />
                                                Personality Prompt
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <pre className="text-sm text-slate-300 whitespace-pre-wrap bg-slate-950 p-4 rounded border border-slate-800">
                                                {selected.personality}
                                            </pre>
                                        </CardContent>
                                    </Card>

                                    {/* Private Knowledge */}
                                    <Card className="bg-slate-900 border-slate-800">
                                        <CardHeader>
                                            <CardTitle className="text-orange-400 flex items-center gap-2">
                                                <Code className="h-5 w-5" />
                                                Private Knowledge (Secrets)
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <pre className="text-sm text-slate-300 whitespace-pre-wrap bg-slate-950 p-4 rounded border border-slate-800">
                                                {selected.private_knowledge}
                                            </pre>
                                        </CardContent>
                                    </Card>

                                    {/* Shared Knowledge */}
                                    <Card className="bg-slate-900 border-slate-800">
                                        <CardHeader>
                                            <CardTitle className="text-blue-400 flex items-center gap-2">
                                                <Eye className="h-5 w-5" />
                                                Shared Knowledge (All Agents)
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <pre className="text-sm text-slate-300 whitespace-pre-wrap bg-slate-950 p-4 rounded border border-slate-800">
                                                {selected.shared_knowledge}
                                            </pre>
                                        </CardContent>
                                    </Card>

                                    {/* Knows About Others */}
                                    <Card className="bg-slate-900 border-slate-800">
                                        <CardHeader>
                                            <CardTitle className="text-green-400 flex items-center gap-2">
                                                <Eye className="h-5 w-5" />
                                                Knowledge About Other Agents
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <pre className="text-sm text-slate-300 whitespace-pre-wrap bg-slate-950 p-4 rounded border border-slate-800">
                                                {selected.knows_about_others}
                                            </pre>
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : (
                                <Card className="bg-slate-900 border-slate-800 h-full flex items-center justify-center">
                                    <CardContent className="text-center text-slate-400">
                                        <div className="text-4xl mb-4">👈</div>
                                        <p>Select an agent to view their knowledge and prompts</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
