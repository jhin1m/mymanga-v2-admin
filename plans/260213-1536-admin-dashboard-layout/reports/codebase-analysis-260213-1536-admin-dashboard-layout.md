# Codebase Analysis: Admin Dashboard Layout

**Date**: 2026-02-13
**Plan**: [admin-dashboard-layout](../plan.md)

## Current State Summary

| Aspect | Status |
|--------|--------|
| Angular | v21.1.0 - latest |
| NG-ZORRO | v21.1.0 - compatible |
| ng-alain | v21.0.4 - devDependency only (CLI) |
| @delon/* runtime | NOT installed |
| Auth system | Complete (guard, interceptor, service, login page) |
| Layout | None - raw router-outlet |
| Styling | Minimal - only ng-zorro base import |

## File Structure

```
src/app/
  app.ts / app.html / app.less        # Root component (has Angular placeholder cruft)
  app.config.ts                        # Providers: router, http, animations, 2 icons
  app.routes.ts                        # 2 routes: /login, /dashboard (flat)
  core/
    guards/auth.guard.ts               # CanActivateFn, redirects to /login
    interceptors/auth.interceptor.ts   # Attaches Bearer token
    services/auth.service.ts           # Login/logout/getToken, signal-based
  pages/
    login/login.ts + .html + .less     # Full login form with validation
    dashboard/dashboard.ts + .html     # Placeholder with logout button
```

## Key Observations

1. **No layout wrapper** - pages render directly in root router-outlet
2. **app.html has 193 lines of Angular default placeholder** - needs cleanup
3. **Only 2 NZ icons registered** (MailOutline, LockOutline) - need 13+ more
4. **Dashboard is placeholder** - just a title + logout button
5. **Auth is solid** - signal-based, proper token management, guard functional
6. **Standalone components throughout** - no NgModules, good for @delon v21

## Gaps to Fill

1. Install @delon/theme, @delon/abc, @delon/util (runtime packages)
2. Dark theme LESS variables (currently no theme customization)
3. ng-alain providers + startup service (MenuService, SettingsService)
4. Layout component with sidebar + header
5. Dashboard redesign with statistics cards

## Risk Areas

- **@delon v21 API uncertainty** - standalone API may differ from docs (most docs cover NgModule era). Must verify exports after install.
- **LESS import paths** - @delon/theme style imports may have different paths in v21.
- **sidebar-nav dependencies** - may require i18n token or router integration setup.

## Recommendations

- Install packages first, then inspect actual exports before writing code
- Use `grep` on node_modules/@delon to verify component selectors and export names
- Keep layout simple initially; iterate on styling after core structure works
- Test each phase incrementally - don't batch all changes
