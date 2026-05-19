# Personal API

> Your own personal data layer — preferences, schedule, and context served on demand.

## Architecture
Microservices monorepo using Node.js, TypeScript, and Docker.

## Services
| Service | Port | Responsibility |
|---|---|---|
| api-gateway | 3000 | Routing, auth, rate limiting |
| preference-service | 3001 | Stores user preferences |
| schedule-service | 3002 | Calendar & time context |
| context-service | 3003 | Live context aggregation |
| auth-service | 3004 | JWT / API key management |

## Getting Started
See `docs/` for full setup instructions.