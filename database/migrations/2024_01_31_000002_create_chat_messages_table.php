<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->uuid('game_id');
            $table->foreign('game_id')->references('id')->on('games')->cascadeOnDelete();
            $table->string('persona_slug')->nullable(); // null = User message
            $table->text('content');
            $table->string('revealed_clue')->nullable();
            $table->timestamps();

            $table->index(['game_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
    }
};
