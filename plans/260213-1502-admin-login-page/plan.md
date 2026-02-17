---
title: "Admin Login Page"
description: "Build login page with ng-zorro-antd, auth service, guard and interceptor for MyManga admin panel"
status: completed
priority: P1
effort: 3h
branch: main
tags: [auth, login, ng-zorro-antd, angular]
created: 2026-02-13
---

# Admin Login Page

## Overview

Add authentication to MyManga VN admin panel: login page with ng-zorro-antd UI, auth service with JWT token management, route guard, and HTTP interceptor. Currently a bare Angular 21 project with no runtime UI library or auth infrastructure.

## Phases

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 1 | Project Setup & Dependencies | 30min | done | [phase-01-setup.md](./phase-01-setup.md) |
| 2 | Auth Infrastructure | 1h | done | [phase-02-auth-infrastructure.md](./phase-02-auth-infrastructure.md) |
| 3 | Login Page Component | 1h | done | [phase-03-login-page.md](./phase-03-login-page.md) |
| 4 | Routing & Dashboard Placeholder | 30min | done | [phase-04-routing.md](./phase-04-routing.md) |

## Key Dependencies

- ng-zorro-antd ^19.x (Angular 21 compatible) -- verify latest version at install time
- @angular/platform-browser/animations (already peer dep)
- @angular/common/http (already in @angular/common)

## File Tree (New Files)

```
src/
  environments/
    environment.ts
    environment.prod.ts
  app/
    core/
      services/auth.service.ts
      interceptors/auth.interceptor.ts
      guards/auth.guard.ts
    pages/
      login/
        login.ts
        login.html
        login.less
        login.spec.ts
      dashboard/
        dashboard.ts
        dashboard.html
        dashboard.less
    app.config.ts          (modified)
    app.routes.ts          (modified)
  styles.less              (modified)
```

## Success Criteria

- Login form renders with email/password fields and submit button
- Successful login stores JWT, redirects to /dashboard
- Invalid credentials show error message from API
- Unauthenticated access to /dashboard redirects to /login
- Bearer token auto-attached to outgoing API requests
- 401 responses trigger logout + redirect to /login
- All unit tests pass
