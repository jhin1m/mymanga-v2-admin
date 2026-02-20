---
title: "Comments Management Page"
description: "Trang quản lý bình luận với tìm kiếm, phân trang và xoá comment"
status: completed
priority: P2
effort: 1.5h
branch: main
tags: [comments, crud, admin-page]
created: 2026-02-20
---

# Comments Management Page

## Overview

Tạo trang quản lý bình luận cho admin panel. Cho phép admin tìm kiếm, xem danh sách và xoá bình luận.

## API Reference

- **Endpoint**: `/api/admin/comments`
- **Methods**: GET (list), DELETE (remove)
- **Query params**: `sort`, `filter[username]`, `filter[created_at_start]`, `filter[created_at_end]`, `include=user`
- **Response**: Standard `PaginatedResponse<Comment>` format

## Implementation Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Comments Service | `completed` | [phase-01-comments-service.md](./phase-01-comments-service.md) |
| 2 | Comments Component & Route | `completed` | [phase-02-comments-component.md](./phase-02-comments-component.md) |

## Files to Create

1. `src/app/core/services/comments.service.ts`
2. `src/app/pages/comments/comments.ts`
3. `src/app/pages/comments/comments.html`
4. `src/app/pages/comments/comments.less`

## Files to Modify

1. `src/app/app.routes.ts` — add comments route
2. Menu already configured in `startup.service.ts` (link: `/comments`)

## Pattern

Follow `genres` page pattern exactly:
- Standalone component + signals + FormBuilder
- NZ-ZORRO table with server-side pagination
- `PaginationBarComponent` (top + bottom)
- HttpClient + HttpParams service pattern
