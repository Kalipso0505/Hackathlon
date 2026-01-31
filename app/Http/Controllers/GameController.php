<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\Game;
use App\Services\AiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GameController extends Controller
{
    public function __construct(
        private readonly AiService $aiService
    ) {}

    /**
     * Show the game page
     */
    public function index(): Response
    {
        return Inertia::render('Game', [
            'personas' => $this->getPersonas(),
        ]);
    }

    /**
     * Start a new game
     */
    public function start(Request $request): JsonResponse
    {
        $game = Game::create([
            'user_id' => $request->user()?->id,
            'scenario_slug' => 'office_murder',
            'status' => 'active',
            'revealed_clues' => [],
        ]);

        try {
            $gameInfo = $this->aiService->startGame($game->id);
        } catch (\Exception $e) {
            // AI service might not be running, return basic info
            $gameInfo = $this->getFallbackGameInfo($game->id);
        }

        return response()->json([
            'game_id' => $game->id,
            'scenario_name' => $gameInfo['scenario_name'] ?? 'Der Fall InnoTech',
            'setting' => $gameInfo['setting'] ?? '',
            'victim' => $gameInfo['victim'] ?? 'Marcus Weber (CFO)',
            'personas' => $gameInfo['personas'] ?? $this->getPersonas(),
            'intro_message' => $gameInfo['intro_message'] ?? $this->getDefaultIntro(),
        ]);
    }

    /**
     * Send a chat message
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'game_id' => 'required|uuid|exists:games,id',
            'persona_slug' => 'required|string|in:elena,tom,lisa,klaus',
            'message' => 'required|string|max:1000',
        ]);

        $game = Game::findOrFail($validated['game_id']);

        if (! $game->isActive()) {
            return response()->json([
                'error' => 'Game is not active',
            ], 400);
        }

        // Save user message
        ChatMessage::create([
            'game_id' => $game->id,
            'persona_slug' => null,
            'content' => $validated['message'],
        ]);

        // Get chat history for this persona
        $chatHistory = $game->messages()
            ->where(function ($query) use ($validated) {
                $query->whereNull('persona_slug')
                    ->orWhere('persona_slug', $validated['persona_slug']);
            })
            ->get()
            ->map(fn (ChatMessage $msg) => [
                'role' => $msg->isUserMessage() ? 'user' : 'assistant',
                'content' => $msg->content,
            ])
            ->toArray();

        try {
            $response = $this->aiService->chat(
                $game->id,
                $validated['persona_slug'],
                $validated['message'],
                $chatHistory
            );

            // Save persona response
            $chatMessage = ChatMessage::create([
                'game_id' => $game->id,
                'persona_slug' => $validated['persona_slug'],
                'content' => $response['response'],
                'revealed_clue' => $response['revealed_clue'] ?? null,
            ]);

            // Update revealed clues
            if (! empty($response['revealed_clue'])) {
                $clues = $game->revealed_clues ?? [];
                $clues[] = $response['revealed_clue'];
                $game->update(['revealed_clues' => array_unique($clues)]);
            }

            return response()->json([
                'persona_slug' => $response['persona_slug'],
                'persona_name' => $response['persona_name'],
                'response' => $response['response'],
                'revealed_clue' => $response['revealed_clue'] ?? null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'AI Service nicht erreichbar. Bitte versuche es später erneut.',
                'details' => config('app.debug') ? $e->getMessage() : null,
            ], 503);
        }
    }

    /**
     * Get chat history for a game
     */
    public function history(string $gameId): JsonResponse
    {
        $game = Game::with('messages')->findOrFail($gameId);

        return response()->json([
            'game_id' => $game->id,
            'status' => $game->status,
            'revealed_clues' => $game->revealed_clues ?? [],
            'messages' => $game->messages->map(fn (ChatMessage $msg) => [
                'id' => $msg->id,
                'persona_slug' => $msg->persona_slug,
                'content' => $msg->content,
                'is_user' => $msg->isUserMessage(),
                'created_at' => $msg->created_at->toIso8601String(),
            ]),
        ]);
    }

    /**
     * Accuse a persona
     */
    public function accuse(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'game_id' => 'required|uuid|exists:games,id',
            'accused_persona' => 'required|string|in:elena,tom,lisa,klaus',
        ]);

        $game = Game::findOrFail($validated['game_id']);

        if (! $game->isActive()) {
            return response()->json(['error' => 'Game is not active'], 400);
        }

        // Tom is the murderer
        $correct = $validated['accused_persona'] === 'tom';
        $game->solve($validated['accused_persona'], $correct);

        return response()->json([
            'correct' => $correct,
            'message' => $correct
                ? 'Richtig! Tom Berger ist der Mörder. Er hat Marcus Weber im Affekt erschlagen, nachdem dieser ihn fälschlicherweise des Geheimnisverrats beschuldigt hatte.'
                : 'Falsch! Der wahre Mörder ist Tom Berger. Er hat Marcus erschlagen, nachdem dieser ihn ungerechtfertigt des Geheimnisverrats beschuldigt hatte.',
            'solution' => [
                'murderer' => 'Tom Berger',
                'motive' => 'Marcus beschuldigte Tom fälschlicherweise, Firmengeheimnisse gestohlen zu haben und drohte mit Kündigung.',
                'weapon' => 'Bronzene "Innovator des Jahres" Trophäe',
            ],
        ]);
    }

    /**
     * Get personas list
     */
    private function getPersonas(): array
    {
        return [
            [
                'slug' => 'elena',
                'name' => 'Elena Schmidt',
                'role' => 'CEO',
                'description' => 'Die Gründerin und CEO von InnoTech. Professionell, ehrgeizig, kontrolliert.',
                'emoji' => '🏢',
                'image' => 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces&q=80',
            ],
            [
                'slug' => 'tom',
                'name' => 'Tom Berger',
                'role' => 'Lead Developer',
                'description' => 'Der technische Kopf des Startups. Introvertiert, brillant, manchmal nervös.',
                'emoji' => '💻',
                'image' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces&q=80',
            ],
            [
                'slug' => 'lisa',
                'name' => 'Lisa Hoffmann',
                'role' => 'Executive Assistant',
                'description' => 'Die langjährige Assistentin. Loyal, aufmerksam, diskret.',
                'emoji' => '📋',
                'image' => 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces&q=80',
            ],
            [
                'slug' => 'klaus',
                'name' => 'Klaus Müller',
                'role' => 'Facility Manager',
                'description' => 'Der erfahrene Hausmeister. Ruhig, beobachtend, kennt alle Ecken.',
                'emoji' => '🔧',
                'image' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces&q=80',
            ],
        ];
    }

    private function getDefaultIntro(): string
    {
        return 'Willkommen beim Fall "InnoTech". Marcus Weber, CFO der InnoTech GmbH, wurde tot aufgefunden. Befrage die Verdächtigen und löse den Fall!';
    }

    private function getFallbackGameInfo(string $gameId): array
    {
        return [
            'game_id' => $gameId,
            'scenario_name' => 'Der Fall InnoTech',
            'setting' => 'Die InnoTech GmbH ist ein aufstrebendes Tech-Startup in München.',
            'victim' => 'Marcus Weber (CFO)',
            'personas' => $this->getPersonas(),
            'intro_message' => $this->getDefaultIntro(),
        ];
    }
}
