<?php

namespace App\Providers;

use Dedoc\Scramble\Scramble;
use Illuminate\Routing\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Scramble::configure()
            ->routes(function (Route $route): bool {
                $uri = $route->uri();
                if (Str::startsWith($uri, 'api/')) {
                    return true;
                }
                if (Str::startsWith($uri, 'game/') && $uri !== 'game') {
                    return true;
                }

                return false;
            });
    }
}
