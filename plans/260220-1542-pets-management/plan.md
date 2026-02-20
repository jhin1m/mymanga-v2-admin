---
title: "Pets Management Page"
description: "CRUD management page for Ban dong hanh (pets) in admin panel"
status: pending
priority: P2
effort: 2h
branch: main
tags: [pets, crud, admin, angular]
created: 2026-02-20
---

# Pets Management Page

## Overview

Add "Ban dong hanh" (Pets) management page with full CRUD. Follows achievements pattern exactly — simple entity with name field, modal create/edit, table list with pagination.

## Phases

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 1 | Service & Types | 30m | pending | [phase-01](./phase-01-service-and-types.md) |
| 2 | Component & Template | 1h | pending | [phase-02](./phase-02-component-and-template.md) |
| 3 | Routing & Menu | 15m | pending | [phase-03](./phase-03-routing-and-menu.md) |

## Validation Summary

**Validated:** 2026-02-20
**Questions asked:** 4

### Confirmed Decisions
- **Menu group:** Move from "HỆ THỐNG" → "CỘNG ĐỒNG" (cùng Nhóm dịch, Danh hiệu)
- **Menu icon:** `smile` (thay vì `history` hoặc `heart`)
- **Pet fields:** Name + image upload (modal cần thêm upload ảnh)
- **User column:** Không cần — giữ bảng đơn giản (Name, Image, Created At, Actions)

### Action Items
- [ ] Phase 01: Thêm `image` field vào Pet interface + PetPayload dùng FormData (multipart/form-data)
- [ ] Phase 02: Modal thêm nz-upload cho image + bảng hiển thị thumbnail
- [ ] Phase 03: Chuyển menu từ "HỆ THỐNG" → "CỘNG ĐỒNG", icon `smile`, link `/pets`

## Key Decisions

- Mirror achievements pattern but **extended with image upload** (like manga cover upload)
- Modal form: name field + image upload (file, mimes: jpg/png/webp)
- Support `filter[name]` and `filter[user_id]` in service, only name search in UI
- Menu moved to "CỘNG ĐỒNG" group with `smile` icon

## Files to Create/Modify

**New files:**
- `src/app/core/services/pets.service.ts`
- `src/app/pages/pets/pets.ts`
- `src/app/pages/pets/pets.html`
- `src/app/pages/pets/pets.less`

**Modified files:**
- `src/app/app.routes.ts` — add pets route
- `src/app/core/startup/startup.service.ts` — move menu to CỘNG ĐỒNG, icon `smile`, link `/pets`
