<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\AiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

class DebugController extends Controller
{
    public function __construct(
        private readonly AiService $aiService
    ) {}

    /**
     * Show the debug dashboard
     */
    public function index(): Response
    {
        return Inertia::render('Debug');
    }

    /**
     * Get all personas with their full knowledge
     */
    public function personas(): JsonResponse
    {
        try {
            // Get personas from AI service
            $response = Http::timeout(10)
                ->get(config('services.ai.url').'/debug/personas');

            if (! $response->ok()) {
                throw new \RuntimeException('Failed to fetch personas: '.$response->body());
            }

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to load personas from AI service',
                'message' => $e->getMessage(),
                'personas' => [],
            ], 500);
        }
    }
}
