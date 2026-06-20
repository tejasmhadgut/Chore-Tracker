# ChoreTrack

A household task management platform where groups can assign chores, track completion on a Kanban board, and receive real-time notifications.

The project evolved into a distributed system to explore caching, messaging, horizontal scaling, and database replication in a practical context.

## Why I Built This

Most task management projects stop at CRUD. I used ChoreTrack as a vehicle to work through production-oriented backend problems:

- How do you keep a cache consistent when multiple API pods are writing to the same database?
- How do you deliver real-time notifications to a user when any pod might handle their WebSocket connection?
- When does connection pooling help, and when does it hurt?
- What does horizontal scaling actually look like under load?

These aren't problems you run into until you try to run the same app on more than one server.

## Architecture

```
              [Browser]
                  │
          [React Frontend]
                  │
                  ▼
      ┌─────────────────────┐
      │   Nginx (least_conn) │
      └────────┬─────┬───────┘
               │     │
       ┌───────▼─┐ ┌─▼────────┐     ┌─────────────────┐
       │ API Pod 1│ │ API Pod 2│     │  API Worker Pod  │
       │ L1 Cache │ │ L1 Cache │     │  (Hangfire jobs) │
       └────┬─────┘ └────┬─────┘     └────────┬─────────┘
            │            │                    │
            └─────┬───────┘                   │
                  │                           │
       ┌──────────▼──────────┐                │
       │      PgBouncer       │◄───────────────┘
       │  (connection pool)   │
       └──────┬───────┬───────┘
              │       │
    ┌─────────▼──┐ ┌──▼──────────┐   ┌────────────────────┐   ┌──────────────────┐
    │ PostgreSQL  │ │ PG Replica  │   │ Redis              │   │ RabbitMQ         │
    │ (writes)    │ │ (reads)     │   │ L2 cache +         │   │ chore events,    │
    │  streaming──►│             │   │ SignalR backplane   │   │ cache invalidation│
    └─────────────┘ └─────────────┘   └────────────────────┘   └──────────────────┘
```

- **L1 + L2 caching** — each pod has an in-process `IMemoryCache` (no network hop); Redis is the shared L2 layer and also the SignalR backplane so notifications reach users regardless of which pod holds their connection
- **PgBouncer** — pools database connections in Kubernetes to prevent exhaustion when pods scale out
- **PostgreSQL read replica** — streaming replication; all reads routed to replica, writes to primary
- **RabbitMQ** — async fan-out for chore events, cache invalidation, and email delivery
- **Hangfire worker pod** — background job scheduling isolated from the request-handling pods

## Performance

| Metric | Baseline | Optimized |
|--------|----------|-----------|
| Throughput | ~46 req/s | **305 req/s (6.6×)** |
| p50 latency | ~300ms | **46ms** |
| p95 latency | >10s | **~800ms** |
| Chore query latency | 9.9ms | **0.8ms (12×)** |

Benchmarks collected using [k6](https://k6.io) against a Kubernetes deployment running 2 API replicas. Optimizations applied:

- Two-tier caching: L1 `IMemoryCache` (per-pod) + L2 Redis (shared)
- 4 composite indexes identified via `EXPLAIN ANALYZE` on hot query paths
- PostgreSQL streaming read replica for read/write separation
- Kubernetes HPA demonstrated 2 → 7 replica scale-out at 148% CPU under load

## Features

- **Group management** — create groups, invite members via invite codes
- **Chore tracking** — assign chores with difficulty ratings, due dates, recurrence schedules
- **Kanban board** — drag-and-drop task management with real-time sync across users
- **Real-time notifications** — SignalR push notifications across all connected pods
- **Analytics dashboard** — completion heatmaps, leaderboards, contribution charts, timeline views
- **Recurring automation** — Hangfire background jobs generate next occurrences on completion
- **Authentication** — JWT cookie auth + Google OAuth
- **Profile management** — avatars via AWS S3

## Tech Stack

**Backend:** C#, .NET Core, Entity Framework Core, SignalR, Hangfire, MassTransit  
**Frontend:** React, TypeScript, Vite  
**Data:** PostgreSQL 16, Redis 7  
**Messaging:** RabbitMQ  
**Infrastructure:** Docker, Docker Compose, Kubernetes, Nginx, PgBouncer

## Quick Start (Docker Compose)

**Prerequisites:** Docker, Docker Compose

```bash
git clone https://github.com/tejasmhadgut/Chore-Tracker.git
cd Chore-Tracker
```

Copy and configure environment:
```bash
cp ChoreTrackerAPI/appsettings.json ChoreTrackerAPI/appsettings.Local.json
# Fill in JWT:SecretKey (required) and any optional service keys
```

Start the stack:
```bash
docker-compose up --build
```

| Service | URL |
|---------|-----|
| API + Frontend | http://localhost:8080 |
| Frontend (dev) | http://localhost:3000 |
| RabbitMQ Management | http://localhost:15672 (guest/guest) |

To seed sample data:
```bash
./populate.sh
# Username: testuser  Password: TestPassword1@
```

## Kubernetes Deployment

**Prerequisites:** kubectl, a running cluster (k3d, minikube, etc.)

```bash
# Build and load the API image
docker build -t choretrack-api:latest ./ChoreTrackerAPI
# For k3d: k3d image import choretrack-api:latest -c <cluster-name>

# Configure secrets
cp k8s/secrets.yaml k8s/secrets.local.yaml
# Edit k8s/secrets.local.yaml with real connection strings and passwords

# Deploy
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.local.yaml
kubectl apply -f k8s/

# Access
kubectl port-forward svc/choretrack-nginx 8080:80 -n choretrack
```

## Configuration

**Required:** PostgreSQL, Redis, RabbitMQ connection strings + JWT secret key

**Optional:**
- Google OAuth (`Authentication:Google:ClientId/Secret`) — enables social login
- SendGrid (`SendGrid:ApiKey`) — enables invite emails
- AWS S3 (`AWS:S3:ProfilePictureBucket`) — enables avatar uploads

All values go in `appsettings.Local.json` locally or as environment variables in Docker/Kubernetes.

## Project Structure

```
ChoreTrackerAPI/
├── BackgroundJobs/       # Hangfire job definitions
├── Configuration/        # Rate limiting, auth filters
├── Consumers/            # RabbitMQ message consumers
├── Controller/           # REST API endpoints
├── CQRS/                 # Commands, queries, handlers
├── Data/                 # EF Core DbContext (primary + read-only)
├── Messages/             # RabbitMQ event/command contracts
├── Migrations/           # EF Core schema migrations
├── Models/               # Domain entities
├── ServiceInterfaces/    # Abstractions
├── Services/             # Business logic
frontend/
├── src/components/       # React components
├── src/pages/            # Route-level pages
├── src/services/         # API client layer
├── src/context/          # Auth, notifications, group context
k8s/                      # Kubernetes manifests
├── api.yaml              # Deployment + HPA
├── postgres.yaml         # StatefulSet with streaming replica
├── pgbouncer.yaml        # Connection pooler
├── redis.yaml            # Cache + SignalR backplane
├── rabbitmq.yaml         # Message broker
nginx.conf                # Load balancer config
docker-compose.yml        # Full local stack
```
