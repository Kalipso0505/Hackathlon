<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('games', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('scenario_slug')->default('office_murder');
            $table->enum('status', ['active', 'solved', 'failed'])->default('active');
            $table->json('revealed_clues')->nullable();
            $table->json('game_state')->nullable();
            $table->string('accused_persona')->nullable(); // Wer wurde beschuldigt
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
