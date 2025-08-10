.PHONY: help dev prod stop build logs clean

# Default target
help:
	@echo "🎮 Shop Mini Games Backend"
	@echo "=========================="
	@echo ""
	@echo "Available commands:"
	@echo "  make dev     - Start in development mode (hot reload)"
	@echo "  make prod    - Start in production mode"
	@echo "  make stop    - Stop all services"
	@echo "  make build   - Build and start in background"
	@echo "  make logs    - Show service logs"
	@echo "  make clean   - Stop services and remove volumes"
	@echo ""

# Development mode with hot reload
dev:
	@echo "🔧 Starting in development mode..."
	docker-compose -f docker-compose.dev.yml up --build

# Production mode
prod:
	@echo "🚀 Starting in production mode..."
	docker-compose up --build -d
	@echo "✅ Services started!"
	@echo "📖 API Documentation: http://localhost:8000/docs"
	@echo "🔍 Health Check: http://localhost:8000/health"

# Stop all services
stop:
	@echo "🛑 Stopping services..."
	docker-compose -f docker-compose.yml down 2>/dev/null || true
	docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
	@echo "✅ Services stopped"

# Build and start in background
build:
	@echo "🔨 Building and starting services..."
	docker-compose -f docker-compose.dev.yml up --build -d
	@echo "✅ Services started in background!"
	@echo "📖 API Documentation: http://localhost:8000/docs"

# Show logs
logs:
	@echo "📋 Showing logs..."
	docker-compose -f docker-compose.dev.yml logs -f

# Clean up everything
clean:
	@echo "🧹 Cleaning up..."
	docker-compose -f docker-compose.yml down -v 2>/dev/null || true
	docker-compose -f docker-compose.dev.yml down -v 2>/dev/null || true
	docker system prune -f
	@echo "✅ Cleanup complete"