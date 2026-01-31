<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatMessage extends Model
{
    protected $fillable = [
        'game_id',
        'persona_slug',
        'content',
        'revealed_clue',
    ];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function isUserMessage(): bool
    {
        return $this->persona_slug === null;
    }

    public function isPersonaMessage(): bool
    {
        return $this->persona_slug !== null;
    }
}
