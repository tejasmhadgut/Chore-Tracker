#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_CHECK_TIMEOUT="${POSTGRES_CHECK_TIMEOUT:-30}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      ChoreTrackerAPI Startup Sequence${NC}"
echo -e "${BLUE}║      Distributed System Initialization${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"

# Step 1: Wait for PostgreSQL
echo -e "\n${YELLOW}[1/2]${NC} Waiting for PostgreSQL to be ready..."
echo "      Host: $POSTGRES_HOST:$POSTGRES_PORT"

start_time=$(date +%s)
timeout=$((start_time + POSTGRES_CHECK_TIMEOUT))

until nc -z "$POSTGRES_HOST" "$POSTGRES_PORT" 2>/dev/null; do
    current_time=$(date +%s)
    if [ $current_time -ge $timeout ]; then
        echo -e "${RED}✗ PostgreSQL failed to start within ${POSTGRES_CHECK_TIMEOUT}s${NC}"
        exit 1
    fi
    elapsed=$((current_time - start_time))
    echo -e "      ⏳ PostgreSQL unavailable... (${elapsed}s elapsed)"
    sleep 1
done

echo -e "${GREEN}✓ PostgreSQL is up and ready${NC}"

# Step 2: Start the application
echo -e "\n${YELLOW}[2/2]${NC} Starting ChoreTrackerAPI..."
echo -e "      Port: 5000"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Starting application (migrations will run automatically)...${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

cd /app
exec dotnet ChoreTrackerAPI.dll
