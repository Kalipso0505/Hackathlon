# Hackathlon – Makefile für Installation, Start und Wartung
# Voraussetzung: Docker und Docker Compose installiert

.PHONY: default install start stop down openapi update help seed-prompts migrate fresh db-reset fix-permissions setup-env clean build dev

# Standardziel: Hilfe anzeigen, wenn make ohne Ziel aufgerufen wird
default: help

# ------------------------------------------------------------------------------
# Installation (erstmalig)
# ------------------------------------------------------------------------------
install: setup-env
	docker compose up -d --build
	docker compose exec php rm -rf /var/www/public/build 2>/dev/null || true
	docker compose exec php gosu www-data composer setup
	docker compose exec php gosu www-data php artisan db:seed

# ------------------------------------------------------------------------------
# Start / Stop
# ------------------------------------------------------------------------------
start:
	docker compose up -d

dev:
	@echo "Starte Vite Dev-Server (Hot Reload)..."
	@echo "Frontend erreichbar unter http://localhost (via Nginx)"
	@echo "Stoppen mit Ctrl+C"
	docker compose exec php gosu www-data npm run dev

stop:
	docker compose stop

down:
	docker compose down

# ------------------------------------------------------------------------------
# OpenAPI-Generierung
# ------------------------------------------------------------------------------
openapi:
	docker compose exec php gosu www-data composer openapi

# ------------------------------------------------------------------------------
# Datenbank-Operationen
# ------------------------------------------------------------------------------
migrate:
	docker compose exec php gosu www-data php artisan migrate

fresh:
	docker compose exec php gosu www-data php artisan db:wipe --drop-views --force
	docker compose exec php gosu www-data php artisan migrate --seed

db-reset:
	@echo "Kompletter Datenbank-Reset (löscht alle MySQL-Daten)..."
	docker compose stop db
	docker run --rm -v $$(pwd)/.docker/db/data:/data alpine sh -c "rm -rf /data/*"
	docker compose up -d db
	@echo "Warte auf MySQL-Initialisierung..."
	@sleep 15
	docker compose exec db mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS refactorian CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
	docker compose exec php gosu www-data php artisan migrate --seed

seed-prompts:
	docker compose exec php gosu www-data php artisan db:seed --class=PromptTemplateSeeder

# ------------------------------------------------------------------------------
# Projekt-Update (Composer, Docker-Build, NPM)
# ------------------------------------------------------------------------------
update: setup-env
	docker compose build
	docker compose up -d
	docker compose exec php gosu www-data composer update
	docker compose exec php gosu www-data php artisan migrate
	docker compose exec php gosu www-data php artisan db:seed
	docker compose exec php gosu www-data npm install
	docker compose exec php rm -rf /var/www/public/build 2>/dev/null || true
	docker compose exec php gosu www-data npm run build

# ------------------------------------------------------------------------------
# Build / Clean
# ------------------------------------------------------------------------------
build:
	docker compose exec php rm -rf /var/www/public/build 2>/dev/null || true
	docker compose exec php gosu www-data npm run build

clean:
	@echo "Bereinige generierte Verzeichnisse (als root im Container)..."
	docker compose exec php rm -rf /var/www/public/build 2>/dev/null || true
	docker compose exec php rm -rf /var/www/node_modules/.vite 2>/dev/null || true
	@echo "Fertig."

# ------------------------------------------------------------------------------
# Berechtigungen / Permissions
# ------------------------------------------------------------------------------
fix-permissions:
	@echo "Setze Berechtigungen für Laravel-Verzeichnisse (via Docker)..."
	docker compose exec php chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
	docker compose exec php chmod -R 775 /var/www/storage /var/www/bootstrap/cache
	docker compose exec php chown -R www-data:www-data /var/www/public/build 2>/dev/null || true
	docker compose exec php chown -R www-data:www-data /var/www/vendor 2>/dev/null || true
	docker compose exec php chown -R www-data:www-data /var/www/node_modules 2>/dev/null || true
	@echo "Fertig."

setup-env:
	@echo "Konfiguriere .env mit aktueller User-ID..."
	@if [ ! -f .env ]; then cp .env.example .env; fi
	@sed -i 's/^WWWUSER=.*/WWWUSER='$$(id -u)'/' .env 2>/dev/null || \
		echo "WWWUSER=$$(id -u)" >> .env
	@sed -i 's/^WWWGROUP=.*/WWWGROUP='$$(id -g)'/' .env 2>/dev/null || \
		echo "WWWGROUP=$$(id -g)" >> .env
	@echo "WWWUSER=$$(id -u), WWWGROUP=$$(id -g) in .env gesetzt."

# ------------------------------------------------------------------------------
# Hilfe
# ------------------------------------------------------------------------------
help:
	@echo ""
	@echo "  HACKATHLON"
	@echo "  =========="
	@echo ""
	@echo "  +----------------------------------------------+"
	@echo "  |  SCHNELLSTART                                |"
	@echo "  |  Erstmalig:  make install                    |"
	@echo "  |  Danach:     make start + make dev           |"
	@echo "  +----------------------------------------------+"
	@echo ""
	@echo "  ERSTEINRICHTUNG"
	@echo "  ---------------"
	@echo "  install        Komplette Ersteinrichtung (einmalig)"
	@echo "  setup-env      User-ID in .env konfigurieren"
	@echo ""
	@echo "  ENTWICKLUNG"
	@echo "  -----------"
	@echo "  start          Container starten"
	@echo "  dev            Vite Dev-Server mit Hot Reload"
	@echo "  stop           Container stoppen"
	@echo "  down           Container stoppen und entfernen"
	@echo ""
	@echo "  BUILD"
	@echo "  -----"
	@echo "  build          Frontend fuer Production bauen"
	@echo "  update         Projekt aktualisieren (composer, npm, migrate)"
	@echo "  openapi        OpenAPI-Spec aus Code generieren"
	@echo ""
	@echo "  DATENBANK"
	@echo "  ---------"
	@echo "  migrate        Migrationen ausfuehren"
	@echo "  fresh          DB loeschen und neu aufsetzen"
	@echo "  seed-prompts   Prompt-Templates laden"
	@echo "  db-reset       Kompletter DB-Reset (bei Korruption)"
	@echo ""
	@echo "  TROUBLESHOOTING"
	@echo "  ---------------"
	@echo "  fix-permissions  Datei-Berechtigungen reparieren"
	@echo "  clean            Build-Cache loeschen"
	@echo ""
