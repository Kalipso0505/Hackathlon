# Hackathlon – Makefile für Installation, Start und Wartung
# Voraussetzung: Docker und Docker Compose installiert

.PHONY: default install start stop openapi update help

# Standardziel: Hilfe anzeigen, wenn make ohne Ziel aufgerufen wird
default: help

# ------------------------------------------------------------------------------
# Installation (erstmalig)
# ------------------------------------------------------------------------------
install:
	docker compose up -d --build
	docker compose exec php composer setup

# ------------------------------------------------------------------------------
# Start / Stop
# ------------------------------------------------------------------------------
start:
	docker compose up -d

stop:
	docker compose stop

down:
	docker compose down

# ------------------------------------------------------------------------------
# OpenAPI-Generierung
# ------------------------------------------------------------------------------
openapi:
	docker compose exec php composer openapi

# ------------------------------------------------------------------------------
# Projekt-Update (Composer, Docker-Build, NPM)
# ------------------------------------------------------------------------------
update:
	docker compose build
	docker compose up -d
	docker compose exec php composer update
	docker compose exec php npm install
	docker compose exec php npm run build

# ------------------------------------------------------------------------------
# Hilfe
# ------------------------------------------------------------------------------
help:
	@echo "Hackathlon – verfügbare Ziele:"
	@echo ""
	@echo "  make install   – Ersteinrichtung (docker build, composer setup)"
	@echo "  make start     – Container starten"
	@echo "  make stop      – Container stoppen"
	@echo "  make down      – Container stoppen und entfernen"
	@echo "  make openapi   – OpenAPI-Spezifikation aus Code generieren"
	@echo "  make update    – Projekt aktualisieren (docker build, composer update, npm install, npm build)"
	@echo "  make help      – Diese Hilfe anzeigen"
