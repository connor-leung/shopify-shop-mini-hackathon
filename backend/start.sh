#!/bin/bash

# Shop Mini Games Backend - Quick Start Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🎮 Shop Mini Games Backend${NC}"
echo "================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Parse command line arguments
MODE="dev"
ACTION="up"

while [[ $# -gt 0 ]]; do
    case $1 in
        --prod|--production)
            MODE="prod"
            shift
            ;;
        --dev|--development)
            MODE="dev"
            shift
            ;;
        --down|--stop)
            ACTION="down"
            shift
            ;;
        --build)
            ACTION="build"
            shift
            ;;
        --logs)
            ACTION="logs"
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dev, --development    Run in development mode (default)"
            echo "  --prod, --production    Run in production mode"
            echo "  --down, --stop          Stop all services"
            echo "  --build                 Build and start services"
            echo "  --logs                  Show logs"
            echo "  -h, --help              Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                      # Start in development mode"
            echo "  $0 --prod               # Start in production mode"
            echo "  $0 --down               # Stop all services"
            echo "  $0 --build              # Build and start"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Set compose file based on mode
if [ "$MODE" = "prod" ]; then
    COMPOSE_FILE="docker-compose.yml"
    echo -e "${YELLOW}🚀 Running in PRODUCTION mode${NC}"
else
    COMPOSE_FILE="docker-compose.dev.yml"
    echo -e "${YELLOW}🔧 Running in DEVELOPMENT mode${NC}"
fi

# Execute the requested action
case $ACTION in
    "up")
        echo -e "${GREEN}Starting services...${NC}"
        docker-compose -f $COMPOSE_FILE up --build
        ;;
    "down")
        echo -e "${YELLOW}Stopping services...${NC}"
        docker-compose -f docker-compose.yml down
        docker-compose -f docker-compose.dev.yml down
        echo -e "${GREEN}✅ Services stopped${NC}"
        ;;
    "build")
        echo -e "${GREEN}Building and starting services...${NC}"
        docker-compose -f $COMPOSE_FILE up --build -d
        echo -e "${GREEN}✅ Services started in background${NC}"
        echo -e "${GREEN}📖 API Documentation: http://localhost:8000/docs${NC}"
        echo -e "${GREEN}🔍 API Health Check: http://localhost:8000/health${NC}"
        ;;
    "logs")
        echo -e "${GREEN}Showing logs...${NC}"
        docker-compose -f $COMPOSE_FILE logs -f
        ;;
esac