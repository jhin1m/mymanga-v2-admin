---
title: "Chapter Reports Management Page"
description: "Tạo trang quản lý báo cáo chapter với list, filter, statistics, bulk delete"
status: pending
priority: P2
effort: 2h
branch: main
tags: [chapter-reports, crud, angular, ng-zorro]
created: 2026-02-20
---

# Chapter Reports Management Page

## Overview

Tạo trang quản lý báo cáo chapter cho admin panel. Người dùng frontend gửi báo cáo lỗi chapter (ảnh hỏng, thiếu ảnh, sai thứ tự...), admin cần xem danh sách, lọc theo loại, xóa đơn/bulk.

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Service + Types | pending | [phase-01-service.md](./phase-01-service.md) |
| 2 | Component + Template + Styles | pending | [phase-02-component.md](./phase-02-component.md) |
| 3 | Route + Menu Integration | pending | [phase-03-integration.md](./phase-03-integration.md) |

## Files Changed

### New
- `src/app/core/services/chapter-report.service.ts` — API service + interfaces
- `src/app/pages/chapter-reports/chapter-reports.ts` — Component logic
- `src/app/pages/chapter-reports/chapter-reports.html` — Template
- `src/app/pages/chapter-reports/chapter-reports.less` — Styles

### Modified
- `src/app/app.routes.ts` — Thêm route `chapter-reports`
- `src/app/core/startup/startup.service.ts` — Thêm menu item

## API Endpoints

- `GET /api/admin/chapter-reports` — List (pagination, filter, include)
- `GET /api/admin/chapter-reports/statistics` — Statistics
- `DELETE /api/admin/chapter-reports/{id}` — Delete single
- `DELETE /api/admin/chapter-reports/bulk-delete` — Bulk delete
