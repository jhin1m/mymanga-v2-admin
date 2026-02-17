# Phase 03: App Config ng-alain Setup

## Context

- [plan.md](./plan.md) | Phase 3 of 5
- Depends on: Phase 01 (dependencies), Phase 02 (theme)
- Current `app.config.ts` has: provideRouter, provideHttpClient, provideAnimationsAsync, provideNzIcons

## Overview

Register @delon providers in `app.config.ts`, add required NZ icons, and configure MenuService with sidebar menu items via an APP_INITIALIZER or startup service.

## Key Insights

- @delon/theme v21 likely exposes `provideAlain()` for standalone apps
- If `provideAlain()` not available, register `MenuService` and `SettingsService` individually
- MenuService.add() populates sidebar-nav component
- Icons must be registered via provideNzIcons - sidebar-nav renders icons by name

## Requirements

- Register @delon providers (MenuService, SettingsService, etc.)
- Register 13 NZ icons for sidebar + header
- Create startup service to initialize menu items
- Configure 11 sidebar menu items (Vietnamese labels)

## Architecture

```
src/app/
  app.config.ts              # Add delon providers + icons (MODIFY)
  core/
    startup/
      startup.service.ts     # Initialize menus + settings (NEW)
```

## Related Files

- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/app.config.ts`

## Implementation Steps

### Step 1: Create startup service `src/app/core/startup/startup.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { MenuService, SettingsService } from '@delon/theme';

@Injectable({ providedIn: 'root' })
export class StartupService {
  private readonly menuService = inject(MenuService);
  private readonly settingsService = inject(SettingsService);

  load(): void {
    // App settings
    this.settingsService.setApp({
      name: 'MyManga AdminCP',
      description: 'Quản lý hệ thống MyManga',
    });

    this.settingsService.setUser({
      name: 'Admin',
      avatar: '',
    });

    // Sidebar menu
    this.menuService.add([
      {
        group: true,
        text: 'MENU CHÍNH',
        children: [
          {
            text: 'Thông tin chung',
            link: '/dashboard',
            icon: { type: 'icon', value: 'dashboard' },
          },
          {
            text: 'Quản lý truyện',
            link: '/manga',
            icon: { type: 'icon', value: 'book' },
          },
          {
            text: 'Quản lý chương',
            link: '/chapters',
            icon: { type: 'icon', value: 'file' },
          },
          {
            text: 'Quản lý thể loại',
            link: '/categories',
            icon: { type: 'icon', value: 'tags' },
          },
          {
            text: 'Quản lý nhóm dịch',
            link: '/teams',
            icon: { type: 'icon', value: 'team' },
          },
        ],
      },
      {
        group: true,
        text: 'THÀNH VIÊN',
        children: [
          {
            text: 'Quản lý user',
            link: '/users',
            icon: { type: 'icon', value: 'user' },
          },
          {
            text: 'Bảng xếp hạng',
            link: '/rankings',
            icon: { type: 'icon', value: 'trophy' },
          },
        ],
      },
      {
        group: true,
        text: 'HỆ THỐNG',
        children: [
          {
            text: 'Nhật ký hoạt động',
            link: '/logs',
            icon: { type: 'icon', value: 'history' },
          },
          {
            text: 'Bình luận',
            link: '/comments',
            icon: { type: 'icon', value: 'message' },
          },
          {
            text: 'Thông báo',
            link: '/notifications',
            icon: { type: 'icon', value: 'notification' },
          },
          {
            text: 'Cài đặt',
            link: '/settings',
            icon: { type: 'icon', value: 'global' },
          },
        ],
      },
    ]);
  }
}
```

### Step 2: Update `src/app/app.config.ts`

```typescript
import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import {
  MailOutline,
  LockOutline,
  DashboardOutline,
  UserOutline,
  BookOutline,
  TeamOutline,
  FileOutline,
  TagsOutline,
  TrophyOutline,
  HistoryOutline,
  MessageOutline,
  NotificationOutline,
  MenuFoldOutline,
  MenuUnfoldOutline,
  GlobalOutline,
  LogoutOutline,
  SettingOutline,
} from '@ant-design/icons-angular/icons';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { StartupService } from './core/startup/startup.service';

function initializeApp(startupService: StartupService) {
  return () => startupService.load();
}

const icons = [
  MailOutline,
  LockOutline,
  DashboardOutline,
  UserOutline,
  BookOutline,
  TeamOutline,
  FileOutline,
  TagsOutline,
  TrophyOutline,
  HistoryOutline,
  MessageOutline,
  NotificationOutline,
  MenuFoldOutline,
  MenuUnfoldOutline,
  GlobalOutline,
  LogoutOutline,
  SettingOutline,
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    provideNzIcons(icons),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [StartupService],
      multi: true,
    },
  ],
};
```

> **Note**: If @delon/theme exports `provideAlain()`, use it instead of manual provider registration. MenuService and SettingsService are typically `providedIn: 'root'` so they may work without explicit registration. Test first; if not, add `provideAlain({ /* config */ })` to providers array.

### Step 3: Check if provideAlain exists

After installing @delon/theme, check exports:

```bash
grep -r "provideAlain" node_modules/@delon/theme/
```

If it exists, simplify app.config.ts by using `provideAlain()` instead of manual APP_INITIALIZER.

## Todo

- [ ] Create `src/app/core/startup/` directory
- [ ] Create `src/app/core/startup/startup.service.ts`
- [ ] Update `src/app/app.config.ts` with icons + startup initializer
- [ ] Check if `provideAlain()` exists and use it if available
- [ ] Verify `npm start` compiles without missing provider errors

## Success Criteria

- App initializes without errors
- MenuService populated with 11 items (verify via console or sidebar-nav in Phase 4)
- All 13+ icons registered

## Risk Assessment

- **Medium**: `provideAlain()` API may differ - fallback to manual providers if needed
- **Low**: Icon names may not match sidebar-nav expectations - verify icon `value` matches antd icon name without "Outline" suffix
- **Low**: MenuService.add() format may vary - check @delon/theme v21 typings
