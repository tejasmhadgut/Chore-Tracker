# ChoreTrack

A multi-tenant household task management platform built for distributed, high-throughput operation. Groups of users can assign recurring chores, track completion on a Kanban board, and receive real-time notifications across horizontally scaled API instances.

## Architecture

```
                        ┌─────────────────────────────────────────┐
                        │              Nginx (least_conn)          │
                        └──────────┬──────────────┬───────────────┘
                                   │              │
                    ┌──────────────▼──┐      ┌───▼─────────────┐
                    │   API Pod 1     │      │   API Pod 2      │
                    │  (.NET Core)    │      │  (.NET Core)     │
                    └──────┬──────────┘      └────────┬─────────┘
                           │                          │
          ┌────────────────┼──────────────────────────┼──────────────┐
          │                │                          │              │
    ┌─────▼──────┐  ┌──────▼──────┐  ┌───────────────▼──┐  ┌───────▼──────┐
    │ PostgreSQL │  │  PG Replica │  │   Redis           │  │  RabbitMQ    │
    │ (primary)  │  │  (reads)    │  │   L2 cache +      │  │  async events│
    └────────────┘  └─────────────┘  │   SignalR backplane│  └──────────────┘
                                     └───────────────────┘
```

- **Nginx** load balances across API pods using `least_conn`
- **Redis** serves as both L2 cache and SignalR backplane (ensures real-time notifications reach users regardless of which pod handles their connection)
- **PostgreSQL read replica** via streaming replication offloads read traffic from primary
- **RabbitMQ** handles async event fan-out (chore assignments, cache invalidation, email notifications)
- **Hangfire** schedules recurring chore generation on a dedicated worker pod
- **PgBouncer** pools database connections in Kubernetes to prevent connection exhaustion at scale

## Performance

| Metric | Baseline | Optimized |
|--------|----------|-----------|
| Throughput | ~46 req/s | **305 req/s (6.6×)** |
| p50 latency | ~300ms | **46ms** |
| p95 latency | >10s | **~800ms** |
| Chore query latency | 9.9ms | **0.8ms (12×)** |

Optimizations applied:
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
# Edit appsettings.Local.json and fill in JWT SecretKey and any optional services
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

| Key | Description |
|-----|-------------|
| `JWT:SecretKey` | Required. Min 32 chars, used to sign auth tokens |
| `Authentication:Google:ClientId/Secret` | Optional. Enables Google OAuth login |
| `SendGrid:ApiKey` | Optional. Enables invite email delivery |
| `AWS:S3:ProfilePictureBucket` | Optional. Enables avatar uploads |

All connection strings for Redis, RabbitMQ, and PostgreSQL are configured via `ConnectionStrings` in `appsettings.json` or injected as environment variables in Docker/Kubernetes.

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
