# Phase 04: Admin Layout Component

## Context

- [plan.md](./plan.md) | Phase 4 of 5
- Depends on: Phase 01-03
- Current: routes go directly to page components, no layout wrapper
- `app.html` has Angular default placeholder + `<router-outlet />`

## Overview

Create admin layout component using @delon/theme's `layout-default`. This wraps all authenticated routes with sidebar navigation and header. Restructure routes so dashboard (and future pages) render inside the layout, while login stays standalone.

## Key Insights

- `LayoutDefaultComponent` from @delon/theme provides the shell (header + sidebar + content)
- `SidebarNavComponent` from @delon/abc renders menu items from MenuService
- Layout uses content projection: `<layout-default-header-item>` for header slots
- Routes must nest authenticated pages as children of a layout route
- Clean up `app.html` - remove default Angular placeholder

## Requirements

- Admin layout with fixed sidebar (200px) and header
- Sidebar: `sidebar-nav` component reading from MenuService
- Header left: "AdminCP" brand text + hamburger toggle
- Header right: "VN" language label + "Admin" user dropdown with logout
- Login route outside layout, all other routes inside layout

## Architecture

```
src/app/
  layout/
    admin-layout/
      admin-layout.ts        # Component (NEW)
      admin-layout.html      # Template (NEW)
      admin-layout.less      # Styles (NEW)
  app.routes.ts              # Restructure routes (MODIFY)
  app.html                   # Clean up placeholder (MODIFY)
  app.less                   # Clean up (MODIFY)
```

## Related Files

- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/app.routes.ts`
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/app.html`
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/app.ts`

## Implementation Steps

### Step 1: Create `src/app/layout/admin-layout/admin-layout.ts`

```typescript
import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutDefaultComponent, LayoutDefaultHeaderItemComponent } from '@delon/theme/layout-default';
import { SidebarNavComponent } from '@delon/abc/sidebar-nav';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    LayoutDefaultComponent,
    LayoutDefaultHeaderItemComponent,
    SidebarNavComponent,
    NzIconModule,
    NzDropDownModule,
    NzAvatarModule,
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.less',
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);
  protected readonly collapsed = signal(false);

  protected toggleCollapsed(): void {
    this.collapsed.update((v) => !v);
  }

  protected onLogout(): void {
    this.authService.logout();
  }
}
```

### Step 2: Create `src/app/layout/admin-layout/admin-layout.html`

```html
<layout-default [options]="{ logoFixWidth: 200, logoLink: '/dashboard' }">
  <!-- Sidebar -->
  <layout-default-nav>
    <sidebar-nav />
  </layout-default-nav>

  <!-- Header Left -->
  <layout-default-header-item direction="left">
    <div class="header-brand">
      <span class="brand-text">AdminCP</span>
    </div>
  </layout-default-header-item>

  <layout-default-header-item direction="left">
    <span
      class="header-trigger"
      (click)="toggleCollapsed()"
      nz-icon
      [nzType]="collapsed() ? 'menu-unfold' : 'menu-fold'"
    ></span>
  </layout-default-header-item>

  <!-- Header Right -->
  <layout-default-header-item direction="right">
    <span class="header-lang">VN</span>
  </layout-default-header-item>

  <layout-default-header-item direction="right">
    <div
      class="header-user"
      nz-dropdown
      [nzDropdownMenu]="userMenu"
      nzPlacement="bottomRight"
    >
      <nz-avatar nzSize="small" nzText="A" style="background-color: #2563eb"></nz-avatar>
      <span class="header-user-name">Admin</span>
    </div>
    <nz-dropdown-menu #userMenu="nzDropdownMenu">
      <ul nz-menu>
        <li nz-menu-item (click)="onLogout()">
          <span nz-icon nzType="logout"></span>
          Đăng xuất
        </li>
      </ul>
    </nz-dropdown-menu>
  </layout-default-header-item>

  <!-- Content -->
  <router-outlet />
</layout-default>
```

> **Note**: The exact template API for `layout-default` may vary. Check @delon/theme v21 source if compilation fails. Key variations:
> - `<layout-default-nav>` vs `[nav]` input
> - `<layout-default-header-item>` vs projected content slots
> - `options` input vs individual `@Input()` properties
> Adjust template accordingly after checking exports.

### Step 3: Create `src/app/layout/admin-layout/admin-layout.less`

```less
:host {
  display: block;
  height: 100vh;
}

.header-brand {
  display: flex;
  align-items: center;
  padding: 0 16px;
}

.brand-text {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.header-trigger {
  font-size: 18px;
  padding: 0 16px;
  cursor: pointer;
  color: #9ca3af;
  transition: color 0.2s;

  &:hover {
    color: #ffffff;
  }
}

.header-lang {
  color: #9ca3af;
  font-size: 13px;
  padding: 0 12px;
  cursor: pointer;
}

.header-user {
  display: flex;
  align-items: center;
  padding: 0 12px;
  cursor: pointer;
  color: #ffffff;
}

.header-user-name {
  margin-left: 8px;
  font-size: 14px;
}

// Sidebar dark overrides
::ng-deep {
  .alain-default__aside {
    background: #0a0a0a !important;
  }

  .alain-default__header {
    background: #000000 !important;
  }

  .sidebar-nav {
    background: #0a0a0a;
  }

  .sidebar-nav__item {
    a {
      color: #9ca3af !important;

      &:hover {
        color: #ffffff !important;
        background: rgba(255, 255, 255, 0.05) !important;
      }
    }

    &.sidebar-nav__selected > a {
      color: #ffffff !important;
      background: rgba(37, 99, 235, 0.1) !important;
      border-right: 3px solid #2563eb;
    }
  }

  .sidebar-nav__group-title {
    color: #6b7280 !important;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}
```

### Step 4: Update `src/app/app.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/admin-layout/admin-layout').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
```

### Step 5: Clean up `src/app/app.html`

Replace entire content with:

```html
<router-outlet />
```

### Step 6: Clean up `src/app/app.less`

Replace with empty or minimal:

```less
// Global app styles handled by src/styles.less
```

## Todo

- [ ] Create `src/app/layout/admin-layout/` directory
- [ ] Create `admin-layout.ts`, `admin-layout.html`, `admin-layout.less`
- [ ] Update `src/app/app.routes.ts` - nest authenticated routes under layout
- [ ] Clean up `src/app/app.html` - remove Angular placeholder
- [ ] Clean up `src/app/app.less`
- [ ] Verify layout renders with sidebar and header
- [ ] Verify login page renders without layout
- [ ] Check sidebar-nav populates from MenuService

## Success Criteria

- Navigating to `/dashboard` shows layout with sidebar + header + content area
- Navigating to `/login` shows standalone login page (no layout)
- Sidebar shows all 11 menu items grouped by category
- Header shows "AdminCP" brand, hamburger, "VN", "Admin" user dropdown
- Logout from dropdown works

## Risk Assessment

- **High**: @delon/theme v21 layout API may differ from documented v18/v19 - must verify component exports and template syntax after install
- **Medium**: `sidebar-nav` may require additional providers (e.g., `ALAIN_I18N_TOKEN`) - provide a no-op implementation if needed
- **Low**: ::ng-deep deprecation warnings - acceptable for now, refactor to global styles later
