---
title: "Admin Dashboard Layout with ng-alain"
description: "Install @delon packages, configure dark theme, ng-alain layout with sidebar navigation, and dashboard statistics page"
status: completed
priority: P1
effort: 3h
branch: main
tags: [ng-alain, dashboard, dark-theme, layout]
created: 2026-02-13
---

# Admin Dashboard Layout with ng-alain

## Objective

Transform the basic Angular 21 admin app into a full ng-alain-powered admin panel with dark theme, sidebar navigation, and dashboard statistics page.

## Current State

- Angular 21 + NG-ZORRO v21.1.0 installed
- ng-alain v21.0.4 as devDependency (CLI schematics only)
- **No @delon/\* runtime packages** installed
- Auth system (guard, interceptor, service) working
- Basic login + dashboard pages exist, no layout wrapper
- `styles.less` only imports ng-zorro base styles

## Phases

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 1 | Install @delon/* dependencies | 15m | done | [phase-01](./phase-01-install-dependencies.md) |
| 2 | Dark theme setup | 20m | done | [phase-02](./phase-02-dark-theme-setup.md) |
| 3 | App config ng-alain providers | 30m | done | [phase-03](./phase-03-app-config-ng-alain.md) |
| 4 | Admin layout component | 45m | done | [phase-04](./phase-04-admin-layout-component.md) |
| 5 | Dashboard statistics page | 30m | done | [phase-05](./phase-05-dashboard-page.md) |

## Key Decisions

1. **Standalone APIs only** - no NgModules, use provideAlain() or individual providers
2. **Dark theme via LESS variables** - override before ng-zorro import
3. **Layout wraps authenticated routes** - login stays outside layout
4. **Vietnamese UI text** - all labels, menu items in Vietnamese

## Dependencies

- @delon/theme ^21.x (layout components, MenuService, SettingsService)
- @delon/abc ^21.x (sidebar-nav, page-header)
- @delon/util ^21.x (utilities)

## Success Criteria

- `npm start` runs without errors
- Dark theme applied globally
- Sidebar with 11 menu items renders
- Header with brand + user menu renders
- Dashboard shows 4 stat cards in responsive grid
- Login page unaffected by layout changes
