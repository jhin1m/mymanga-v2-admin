---
title: "Doujinshis management page"
description: "Clone artists page for doujinshis — same UI, logic, API pattern"
status: done
priority: P3
effort: 1h
branch: main
tags: [doujinshis, crud, angular, clone]
created: 2026-02-17
---

# Doujinshis Management Page

## Overview

Tạo trang quản lý doujinshis y hệt trang artists. Cùng UI (search, table, CRUD modal), cùng API pattern, chỉ thay tên entity.

## Source Reference

Trang artists hiện tại:
- `src/app/core/services/artists.service.ts` — service + interfaces
- `src/app/pages/artists/artists.ts` — component logic + modal
- `src/app/pages/artists/artists.html` — template
- `src/app/pages/artists/artists.less` — styles

## Dependency Graph

```
Phase 01 (Service) ──┐
                     ├──> Both can run in PARALLEL (no file overlap)
Phase 02 (Component) ┘
```

**Execution strategy:** Phase 1 & 2 run in parallel. No sequential dependency.

## File Ownership Matrix

| File | Phase |
|------|-------|
| `src/app/core/services/doujinshis.service.ts` | Phase 01 |
| `src/app/pages/doujinshis/doujinshis.ts` | Phase 02 |
| `src/app/pages/doujinshis/doujinshis.html` | Phase 02 |
| `src/app/pages/doujinshis/doujinshis.less` | Phase 02 |
| `src/app/app.routes.ts` (add doujinshis route) | Phase 02 |

## Phases

| # | Phase | Status | Parallel Group | File |
|---|-------|--------|----------------|------|
| 01 | Doujinshis Service | pending | A | [phase-01-doujinshis-service.md](./phase-01-doujinshis-service.md) |
| 02 | Doujinshis Component + Route | pending | A | [phase-02-doujinshis-component.md](./phase-02-doujinshis-component.md) |

## Validation Summary

**Validated:** 2026-02-17
**Questions asked:** 3

### Confirmed Decisions
- **Route path:** `doujinshi` (singular, matches existing menu link) — no change to startup.service.ts needed
- **API shape:** Same as Artist (id, name, slug, user_id, user, timestamps) — backend ready
- **DRY approach:** Clone only (KISS) — no shared base service/component

### Action Items
- None — plan confirmed as-is

## Notes

- Menu sidebar entry đã tồn tại (`startup.service.ts:63-65`), link `/doujinshi`
- Route path: `doujinshi` (singular, confirmed)
- API endpoint: `/api/admin/doujinshis`
