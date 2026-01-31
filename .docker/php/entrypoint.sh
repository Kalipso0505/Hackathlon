#!/bin/sh
set -e

# Git: gemountetes /var/www als safe markieren
git config --global --add safe.directory /var/www 2>/dev/null || true
gosu www-data git config --global --add safe.directory /var/www 2>/dev/null || true

# Ensure Laravel directories exist and have correct permissions
if [ -d /var/www/storage ]; then
    chown -R www-data:www-data /var/www/storage
    chmod -R 775 /var/www/storage
fi

if [ -d /var/www/bootstrap/cache ]; then
    chown -R www-data:www-data /var/www/bootstrap/cache
    chmod -R 775 /var/www/bootstrap/cache
fi

# Ensure vendor/bin is accessible
if [ -d /var/www/vendor/bin ]; then
    chown -R www-data:www-data /var/www/vendor/bin
fi

# Set default umask for group write access
umask 002

# permissions for PHPMyAdmin sessions
mkdir -p /sessions
chmod 777 /sessions

exec "$@"