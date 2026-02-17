# Dashboard Runtime Investigation Report

**Date:** 2026-02-13
**Issue:** Dashboard at http://localhost:4200/dashboard not working
**Status:** Root causes identified

---

## Executive Summary

Dashboard fails at runtime due to **missing NzMenuModule import** in admin-layout component. Secondary issue: APP_INITIALIZER factory returns void instead of Promise, causing potential race conditions in app initialization.

**Impact:** Admin layout header dropdown menu (user menu) fails to render → dashboard route likely blocked or renders with errors.

**Priority fixes:**
1. **CRITICAL:** Add NzMenuModule to AdminLayoutComponent imports
2. **HIGH:** Fix APP_INITIALIZER to return Promise from StartupService.load()

---

## Root Causes

### 1. Missing NzMenuModule Import (CRITICAL)

**File:** `/src/app/layout/admin-layout/admin-layout.ts`

**Evidence:**
- Template uses `<ul nz-menu>` and `<li nz-menu-item>` directives (lines 37-43 in admin-layout.html)
- Component imports array contains NzDropDownModule, NzAvatarModule, NzIconModule
- **NzMenuModule is NOT imported**

**Impact:** Angular cannot resolve `nz-menu` and `nz-menu-item` directives → runtime template error → admin layout fails to render → dashboard blocked.

**Template excerpt:**
```html
<!-- Line 36-44 in admin-layout.html -->
<nz-dropdown-menu #userMenu="nzDropdownMenu">
  <ul nz-menu>  <!-- ERROR: nz-menu directive not found -->
    <li nz-menu-item (click)="onLogout()">  <!-- ERROR: nz-menu-item directive not found -->
      <span nz-icon nzType="logout"></span>
      Đăng xuất
    </li>
  </ul>
</nz-dropdown-menu>
```

**Fix:**
```typescript
// admin-layout.ts - line 9
import { NzMenuModule } from 'ng-zorro-antd/menu';

@Component({
  imports: [
    RouterOutlet,
    LayoutDefaultComponent,
    LayoutDefaultHeaderItemComponent,
    LayoutDefaultNavComponent,
    NzIconModule,
    NzDropDownModule,
    NzAvatarModule,
    NzMenuModule,  // ADD THIS
  ],
  // ...
})
```

---

### 2. APP_INITIALIZER Returns Void (HIGH Priority)

**File:** `/src/app/app.config.ts`

**Evidence:**
- StartupService.load() returns `void` (line 13 in startup.service.ts)
- APP_INITIALIZER factory function `initializeApp` returns `() => void` (line 60 in app.config.ts)
- Angular expects APP_INITIALIZER to return `Promise<any> | Observable<any>` for async initialization

**Current code:**
```typescript
// app.config.ts - line 59-61
function initializeApp(startupService: StartupService) {
  return () => startupService.load();  // Returns void
}

// startup.service.ts - line 13-16
load(): void {  // Should return Promise<void>
  this.initAppSettings();
  this.initMenuItems();
}
```

**Impact:** Angular may not wait for menu initialization before routing → sidebar menu items may not be available when AdminLayoutComponent renders.

**Fix:**
```typescript
// startup.service.ts
load(): Promise<void> {
  return Promise.resolve().then(() => {
    this.initAppSettings();
    this.initMenuItems();
  });
}
```

---

## Additional Findings (No immediate action needed)

### Auth Guard Behavior
- Auth guard checks `authService.isAuthenticated()` (computed signal based on localStorage token)
- If no token exists, redirects to `/login`
- **Assumption:** User has valid token in localStorage for testing, otherwise dashboard route is blocked by design

### Route Structure
- Correct lazy-loaded route structure with admin-layout wrapping dashboard
- Auth guard applied at parent route level (`path: ''`)
- Dashboard route correctly configured as child route

### Delon Configuration
- provideAlain() correctly configured with Vietnamese locale
- Icons properly registered in app config
- MenuService.add() called synchronously in startup service (works but see issue #2)

### Build Status
- Zero TypeScript compilation errors
- Build succeeds with budget warnings only (non-blocking)
- All lazy chunks generated correctly

---

## Recommendations

### Immediate Fixes

**1. Add NzMenuModule to AdminLayoutComponent** (5 min)
```typescript
// File: src/app/layout/admin-layout/admin-layout.ts
// Line: 9 (after other imports)
import { NzMenuModule } from 'ng-zorro-antd/menu';

// Line: 25 (in imports array)
imports: [
  // ... existing imports ...
  NzMenuModule,  // ADD
],
```

**2. Fix APP_INITIALIZER async pattern** (5 min)
```typescript
// File: src/app/core/startup/startup.service.ts
// Line: 13
load(): Promise<void> {
  return Promise.resolve().then(() => {
    this.initAppSettings();
    this.initMenuItems();
  });
}
```

### Testing Steps

After fixes:
1. Clear localStorage: `localStorage.clear()` in browser console
2. Navigate to http://localhost:4200
3. Should redirect to `/login`
4. Login with valid credentials
5. Should redirect to `/dashboard`
6. Verify sidebar menu items render correctly
7. Verify header user dropdown menu works (click avatar)
8. Check browser console for errors (should be zero)

### Preventive Measures

1. **Enable Angular strict template checking** (already enabled in tsconfig.json)
2. **Add E2E tests** for critical user flows (login → dashboard → logout)
3. **Add runtime error monitoring** (Sentry/LogRocket) for production
4. **Template linting:** Consider angular-eslint rules to catch missing directive imports

---

## Supporting Evidence

### Files Analyzed
- ✓ `/src/app/app.config.ts` — provideAlain config, APP_INITIALIZER setup
- ✓ `/src/app/app.routes.ts` — route structure with auth guard
- ✓ `/src/app/layout/admin-layout/admin-layout.ts` — component imports
- ✓ `/src/app/layout/admin-layout/admin-layout.html` — template directives
- ✓ `/src/app/pages/dashboard/dashboard.ts` — dashboard component
- ✓ `/src/app/pages/dashboard/dashboard.html` — dashboard template
- ✓ `/src/app/core/guards/auth.guard.ts` — authentication logic
- ✓ `/src/app/core/services/auth.service.ts` — token management
- ✓ `/src/app/core/startup/startup.service.ts` — menu initialization
- ✓ `/src/styles.less` — global styles
- ✓ `/src/styles/theme.less` — dark theme variables

### Build Output
```
✓ Build succeeds with warnings only
✗ Budget exceeded (non-blocking for dev)
✓ All lazy chunks generated correctly
✓ Zero TypeScript errors
```

### Package Versions
- Angular: 21
- ng-zorro-antd: 21.1.0
- @delon/theme: 21.0.5
- @delon/abc: 21.0.5

---

## Unresolved Questions

1. Does user have valid auth token in localStorage for testing?
2. What is the exact browser console error message when accessing /dashboard?
3. Is the backend API at http://127.0.0.1:8000 running and accessible?
