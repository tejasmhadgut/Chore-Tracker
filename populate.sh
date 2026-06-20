#!/bin/bash

# ChoreTrack Data Population Script
# Registers a test user, creates groups, and populates chores

set -e

API_URL="http://localhost:8000"
COOKIE_JAR="/tmp/choretrack_cookies.txt"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  ChoreTrack Data Population Script${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Clean up old cookies
rm -f "$COOKIE_JAR"

# Step 1: Register test user
echo -e "${YELLOW}[1/4]${NC} Registering test user..."

REGISTER_RESPONSE=$(curl -s -X POST "${API_URL}/api/account/register" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_JAR" \
  -d '{
    "userName": "testuser",
    "email": "testuser@example.com",
    "password": "TestPassword1@",
    "firstName": "Test",
    "lastName": "User"
  }')

echo "  Register response: $REGISTER_RESPONSE"

# Step 2: Login
echo -e "${YELLOW}[2/4]${NC} Logging in..."

LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/api/account/login" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_JAR" \
  -b "$COOKIE_JAR" \
  -d '{
    "userName": "testuser",
    "password": "TestPassword1@"
  }')

echo "  Login response: $LOGIN_RESPONSE"

# Verify we got cookies
if [ ! -f "$COOKIE_JAR" ] || [ ! -s "$COOKIE_JAR" ]; then
  echo -e "${RED}Login failed - no cookies received${NC}"
  exit 1
fi

echo -e "${GREEN}  Authenticated successfully${NC}"
echo ""

# Step 3: Create Groups
echo -e "${YELLOW}[3/4]${NC} Creating groups..."

# RecurrenceType: Daily=0, Weekly=1, Monthly=2, Custom=3, None=4
# ChoreStatus: Todo=0, InProgress=1, Done=2
# ChoreDifficulty: Easy=1, Medium=3, Hard=5

GROUP1=$(curl -s -X POST "${API_URL}/api/groups/create" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -d '{"name":"Apartment Mates","description":"Shared apartment cleaning and maintenance"}')
GROUP1_ID=$(echo "$GROUP1" | jq -r '.groupId // .id // empty' 2>/dev/null)
echo -e "  ${GREEN}+${NC} Apartment Mates (ID: $GROUP1_ID)"

GROUP2=$(curl -s -X POST "${API_URL}/api/groups/create" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -d '{"name":"Family House","description":"Home chores and maintenance responsibilities"}')
GROUP2_ID=$(echo "$GROUP2" | jq -r '.groupId // .id // empty' 2>/dev/null)
echo -e "  ${GREEN}+${NC} Family House (ID: $GROUP2_ID)"

GROUP3=$(curl -s -X POST "${API_URL}/api/groups/create" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -d '{"name":"Office Team","description":"Workspace cleaning and organization"}')
GROUP3_ID=$(echo "$GROUP3" | jq -r '.groupId // .id // empty' 2>/dev/null)
echo -e "  ${GREEN}+${NC} Office Team (ID: $GROUP3_ID)"

GROUP4=$(curl -s -X POST "${API_URL}/api/groups/create" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -d '{"name":"Gym Community","description":"Equipment maintenance and facility upkeep"}')
GROUP4_ID=$(echo "$GROUP4" | jq -r '.groupId // .id // empty' 2>/dev/null)
echo -e "  ${GREEN}+${NC} Gym Community (ID: $GROUP4_ID)"

GROUP5=$(curl -s -X POST "${API_URL}/api/groups/create" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -d '{"name":"Garden Club","description":"Outdoor gardening and landscaping tasks"}')
GROUP5_ID=$(echo "$GROUP5" | jq -r '.groupId // .id // empty' 2>/dev/null)
echo -e "  ${GREEN}+${NC} Garden Club (ID: $GROUP5_ID)"

echo ""

# Step 4: Create Chores
echo -e "${YELLOW}[4/4]${NC} Creating chores..."

create_chore() {
  local group_id=$1
  local name=$2
  local desc=$3
  local recurrence=$4
  local difficulty=$5
  local end_date="2026-12-31T23:59:59Z"

  RESULT=$(curl -s -X POST "${API_URL}/api/chores/${group_id}/create" \
    -H "Content-Type: application/json" \
    -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    -d "{\"name\":\"${name}\",\"description\":\"${desc}\",\"recurrenceType\":${recurrence},\"status\":0,\"difficulty\":${difficulty},\"recurrenceEndDate\":\"${end_date}\"}")

  local chore_id=$(echo "$RESULT" | jq -r '.id // empty' 2>/dev/null)
  if [ -n "$chore_id" ]; then
    echo -e "    ${GREEN}+${NC} ${name} (ID: $chore_id)"
  else
    echo -e "    ${RED}x${NC} ${name} - Failed: $RESULT"
  fi
}

# Apartment chores
echo -e "  Apartment Mates:"
create_chore "$GROUP1_ID" "Kitchen Cleaning" "Deep clean kitchen counters, stove, and sink" 0 3    # Daily, Medium
create_chore "$GROUP1_ID" "Bathroom Scrub" "Clean toilet, shower, and tiles" 1 5                   # Weekly, Hard
create_chore "$GROUP1_ID" "Vacuum Living Room" "Vacuum carpets and couch cushions" 1 1             # Weekly, Easy
create_chore "$GROUP1_ID" "Laundry Rotation" "Wash and fold communal laundry" 1 3                  # Weekly, Medium
create_chore "$GROUP1_ID" "Trash Day" "Take out trash and recycling" 1 1                           # Weekly, Easy

# Family House chores
echo -e "  Family House:"
create_chore "$GROUP2_ID" "Mow the Lawn" "Cut grass and trim edges" 1 5                            # Weekly, Hard
create_chore "$GROUP2_ID" "Pool Maintenance" "Clean pool filters and test chemicals" 1 3           # Weekly, Medium
create_chore "$GROUP2_ID" "Grocery Shopping" "Weekly grocery run" 1 3                               # Weekly, Medium
create_chore "$GROUP2_ID" "Car Wash" "Wash and wax vehicles" 2 3                                   # Monthly, Medium
create_chore "$GROUP2_ID" "Gutter Cleaning" "Clean roof gutters and downspouts" 2 5                # Monthly, Hard

# Office chores
echo -e "  Office Team:"
create_chore "$GROUP3_ID" "Office Floor Sweep" "Sweep and mop office floors" 0 1                   # Daily, Easy
create_chore "$GROUP3_ID" "Kitchen Restocking" "Refill coffee, tea, and supplies" 1 3              # Weekly, Medium
create_chore "$GROUP3_ID" "Meeting Room Setup" "Prepare conference rooms" 0 1                      # Daily, Easy
create_chore "$GROUP3_ID" "Desk Sanitizing" "Disinfect desks and keyboards" 1 3                    # Weekly, Medium

# Gym chores
echo -e "  Gym Community:"
create_chore "$GROUP4_ID" "Equipment Sanitation" "Wipe down all gym equipment" 0 3                 # Daily, Medium
create_chore "$GROUP4_ID" "Floor Cleaning" "Mop and sanitize gym floors" 0 3                       # Daily, Medium
create_chore "$GROUP4_ID" "Towel Laundry" "Wash all gym towels" 1 1                                # Weekly, Easy
create_chore "$GROUP4_ID" "Equipment Inspection" "Check equipment for damage" 2 5                  # Monthly, Hard

# Garden chores
echo -e "  Garden Club:"
create_chore "$GROUP5_ID" "Watering Plants" "Water all flowers and vegetables" 0 1                 # Daily, Easy
create_chore "$GROUP5_ID" "Weeding Beds" "Remove weeds from garden beds" 1 3                       # Weekly, Medium
create_chore "$GROUP5_ID" "Compost Management" "Turn and maintain compost pile" 1 3                # Weekly, Medium
create_chore "$GROUP5_ID" "Hedge Trimming" "Trim hedges and bushes" 2 5                            # Monthly, Hard

echo ""
echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}Data population complete!${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo "Created:"
echo "  - 5 groups"
echo "  - 22 chores with various difficulties and recurrences"
echo ""
echo "Login credentials:"
echo "  Username: testuser"
echo "  Password: TestPassword1@"
echo ""
echo "Frontend: http://localhost:5173"
echo "API:      http://localhost:8000"
echo ""

# Cleanup
rm -f "$COOKIE_JAR"
