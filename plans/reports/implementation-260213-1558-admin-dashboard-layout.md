# Implementation Report: Admin Dashboard Layout

## Status: COMPLETED
- Build: PASS (ng build --configuration=development)
- TypeScript: PASS (tsc --noEmit, zero errors)
- Dev server: Running on port 4201

## Changes Summary

### New Files (6)
| File | Purpose |
|------|---------|
| `src/styles/theme.less` | Dark theme LESS variable overrides |
| `src/app/core/startup/startup.service.ts` | Menu + settings initialization |
| `src/app/layout/admin-layout/admin-layout.ts` | Layout component (standalone) |
| `src/app/layout/admin-layout/admin-layout.html` | Layout template with sidebar + header |
| `src/app/layout/admin-layout/admin-layout.less` | Layout dark styling overrides |

### Modified Files (5)
| File | Change |
|------|--------|
| `package.json` | Added @delon/theme, @delon/abc, @delon/util v21.0.5 |
| `angular.json` | Added `stylePreprocessorOptions.includePaths: ["node_modules/"]` |
| `src/styles.less` | Restructured imports: theme → ng-zorro → delon (selective) |
| `src/app/app.config.ts` | Added provideAlain(), 18 icons, APP_INITIALIZER, vi locale |
| `src/app/app.routes.ts` | Nested auth routes under AdminLayoutComponent |
| `src/app/app.html` | Cleaned up Angular placeholder, kept `<router-outlet />` |
| `src/app/pages/dashboard/dashboard.ts` | Replaced with stat cards (signal-based) |
| `src/app/pages/dashboard/dashboard.html` | 4-column responsive grid with nz-statistic |
| `src/app/pages/dashboard/dashboard.less` | Dark card styling |

## Issues Resolved During Implementation

1. **LESS import resolution**: Angular 21's build system doesn't support `~` prefix or bare `@delon/...` paths. Fixed by adding `stylePreprocessorOptions.includePaths` in angular.json.

2. **@delon/theme/default.less imports chart/form deps**: `default.less` imports `../chart/index.less` which isn't installed. Fixed by importing delon LESS files individually (mixins → theme-default → system → layout-default → abc).

3. **sidebar-nav not in @delon/abc**: In v21, sidebar nav is `LayoutDefaultNavComponent` from `@delon/theme/layout-default`, not a separate component from @delon/abc.

## Architecture

```
Route: /login → LoginComponent (standalone, no layout)
Route: / → AdminLayoutComponent (auth-guarded)
  └── /dashboard → DashboardComponent (4 stat cards)
```

## Key Takeaways
- `provideAlain()` from @delon/theme handles icon registration + locale config
- `LayoutDefaultNavComponent` reads menu items from `MenuService` automatically
- `LayoutDefaultService.toggleCollapsed()` handles sidebar collapse
- Vietnamese locale registered via `registerLocaleData(vi)` + `provideAlain({ defaultLang })`
