---
title: "Achievements Management Page"
description: "CRUD page for managing achievements (danh hiệu) following genres page pattern"
status: pending
priority: P2
effort: 1.5h
branch: main
tags: [achievements, crud, admin-page]
created: 2026-02-20
---

# Achievements Management Page

## Goal
Add a full CRUD management page for Achievements (Danh hiệu) at route `/badges`, following the established genres page pattern.

## API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/achievements` | List with filter[name], filter[user_id], include=user |
| GET | `/api/admin/achievements/{id}` | Detail |
| POST | `/api/admin/achievements` | Create |
| PUT | `/api/admin/achievements/{id}` | Update |
| DELETE | `/api/admin/achievements/{id}` | Delete |

## Implementation Phases

### Phase 01: Service Layer `[pending]`
Create `achievements.service.ts` with interfaces + CRUD methods.
→ [phase-01-service-layer.md](./phase-01-service-layer.md)

### Phase 02: Component + Route `[pending]`
Create achievements component (TS + HTML + LESS) and register route.
→ [phase-02-component-route.md](./phase-02-component-route.md)

## Files to Create
- `src/app/core/services/achievements.service.ts`
- `src/app/pages/achievements/achievements.ts`
- `src/app/pages/achievements/achievements.html`
- `src/app/pages/achievements/achievements.less`

## Files to Modify
- `src/app/app.routes.ts` — add `badges` route

## Notes
- Menu item already exists in `startup.service.ts` (link: `/badges`)
- Follow genres page pattern exactly (signal-based state, modal form, pagination)
