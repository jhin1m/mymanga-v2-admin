# Scout Report: Page Creation Patterns

## Project Structure Overview

```
src/app/
├── app.ts                           # Root component bootstrap
├── app.config.ts                    # Application configuration (providers)
├── app.routes.ts                    # Route definitions
├── app.html / app.less              # Root component template/styles
├── core/
│   ├── guards/                      # Route guards
│   │   └── auth.guard.ts            # Protects authenticated routes
│   ├── interceptors/                # HTTP interceptors
│   │   └── auth.interceptor.ts      # Token attachment + 401 handling
│   ├── services/                    # Core services
│   │   └── auth.service.ts          # Authentication service
│   └── startup/                     # App initialization
│       └── startup.service.ts       # Menu + settings config
├── layout/
│   └── admin-layout/                # Main layout wrapper
│       ├── admin-layout.ts          # Component (standalone)
│       ├── admin-layout.html        # Template
│       └── admin-layout.less        # Styles
└── pages/                           # Feature pages
    ├── login/                       # Login page (outside layout)
    │   ├── login.ts
    │   ├── login.html
    │   └── login.less
    └── dashboard/                   # Dashboard page
        ├── dashboard.ts
        ├── dashboard.html
        └── dashboard.less
```

## Route Configuration Pattern

### app.routes.ts Structure
- **Login route**: Standalone, outside admin layout (`/login`)
- **Authenticated routes**: Wrapped in AdminLayoutComponent, protected by `authGuard`
- **Route lazy-loading**: `loadComponent()` imports components dynamically
- **Route children**: Authenticated routes nested under layout

Example route structure:
```typescript
{
  path: 'dashboard',
  loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent),
}
```

**Key Points:**
- Login is NOT a child of the layout
- All authenticated pages ARE children of AdminLayoutComponent
- Routes use lazy-loading with `loadComponent()` (not eagerly imported)
- Default redirect: `/dashboard` (unauthenticated users redirected to `/login`)

---

## Page Component Pattern

### Basic Structure (Standalone Component)
All pages follow the **standalone component** pattern (no NgModules):

```typescript
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
// Import ng-zorro components as needed
import { NzCardModule } from 'ng-zorro-antd/card';

interface DataInterface {
  // Define data structure
}

@Component({
  selector: 'app-page-name',           // Prefix: app-
  imports: [CommonModule, NzCardModule], // Import all dependencies
  templateUrl: './page-name.html',     // Template file
  styleUrl: './page-name.less',        // Styles file
})
export class PageNameComponent {
  // Use signals for state
  protected readonly data = signal<DataInterface[]>([]);
  
  // Methods
  protected onAction(): void {
    // Handle action
  }
}
```

### Key Conventions:
- **Component selector**: `app-{page-name}`
- **Prefix**: `app-` enforced in angular.json
- **Visibility**: Use `protected` for template-accessible properties/methods
- **State**: Use `signal()` for reactive state, `computed()` for derived state
- **Imports**: Explicitly list all dependencies in `imports` array

---

## Service Pattern (API Integration)

### AuthService Example
Located in `src/app/core/services/auth.service.ts`

**Key Features:**
- Standard `ApiResponse<T>` wrapper for all responses
- Uses `HttpClient` with signals for state management
- Token storage in localStorage
- Error handling with catchError/tap

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenSignal = signal<string | null>(null);
  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  login(email: string, password: string): Observable<ApiResponse<AuthToken>> {
    return this.http.post<ApiResponse<AuthToken>>(
      `${environment.apiUrl}/api/admin/auth`,
      { email, password }
    ).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setToken(res.data.token);
        }
      })
    );
  }
}
```

**Pattern for New Services:**
1. Create in `src/app/core/services/`
2. Use `@Injectable({ providedIn: 'root' })` for singleton
3. Inject `HttpClient` + `environment.apiUrl`
4. Return `Observable<ApiResponse<T>>`
5. Use `signal()` for internal state
6. Use `computed()` for derived values

---

## Authentication & Guards

### Auth Flow:
1. **Login**: User submits credentials → `AuthService.login()` → Store token
2. **Protected Routes**: `authGuard` checks `isAuthenticated()` computed signal
3. **HTTP Requests**: `authInterceptor` attaches `Authorization: Bearer {token}` header
4. **401 Response**: `authInterceptor` triggers logout (except on `/api/admin/auth`)

### Auth Interceptor Pattern:
- Functional interceptor (new Angular 15+ style)
- Injects services with `inject()`
- Only attaches token to requests starting with `environment.apiUrl`
- Auto-logout on 401 (except login endpoint)

---

## Menu Configuration

### StartupService Pattern
Located in `src/app/core/startup/startup.service.ts`

**Purpose**: Initializes app settings and menu items on app startup

```typescript
@Injectable({ providedIn: 'root' })
export class StartupService {
  private readonly menuService = inject(MenuService);
  
  load(): Promise<void> {
    return Promise.resolve().then(() => {
      this.initAppSettings();
      this.initMenuItems();
    });
  }

  private initMenuItems(): void {
    this.menuService.add([
      {
        group: true,
        text: 'MENU CHÍNH',
        children: [
          {
            text: 'Tổng quan',
            link: '/dashboard',
            icon: { type: 'icon', value: 'dashboard' },
          },
          // More items...
        ],
      },
    ]);
  }
}
```

**Key Points:**
- Menu structured in groups
- Icons reference @ant-design/icons (declared in app.config.ts)
- Uses `/path` links (router links)
- Child items create submenu

**To Add New Menu Item:**
1. Create route in `app.routes.ts`
2. Add menu item in `StartupService.initMenuItems()`
3. Icon must be declared in `app.config.ts` icons array

---

## Styling Pattern

### Component Styles (LESS)
Each component has `.less` file with component-scoped styles:

```less
// src/app/pages/dashboard/dashboard.less
.stat-card {
  .stat-card-content {
    display: flex;
    align-items: center;
  }
  .stat-icon {
    font-size: 24px;
  }
}
```

### Global Styles:
- `src/styles.less` — Global styles (loaded in angular.json)
- `src/app/app.less` — App root styles
- Theme config in `src/styles/theme.less` (dark theme setup)

**Dark Theme Setup:**
- CRITICAL: Set `@root-entry-name: dark;` in custom theme
- NEVER import `ng-zorro-antd.less` directly (resets to light)
- Import order: theme → overrides → ng-zorro core → components

---

## Form Handling Pattern (from Login)

### Reactive Forms Pattern:
```typescript
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    
    this.loading.set(true);
    const { email, password } = this.loginForm.getRawValue();
    this.authService.login(email, password).subscribe({
      next: () => { /* success */ },
      error: (err: HttpErrorResponse) => { /* handle error */ },
    });
  }
}
```

---

## Environment Configuration

### environment.ts Structure:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8000',
};
```

**Usage in Services:**
- All API calls prefixed with `${environment.apiUrl}/api/...`
- Example: `${environment.apiUrl}/api/admin/auth`

---

## ng-alain & ng-zorro Integration

### App Configuration:
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    provideAlain({
      icons: [/* icon list */],
      defaultLang: { /* i18n config */ },
    }),
    // ... other providers
  ],
};
```

### Layout Components:
- `LayoutDefaultComponent` — Main layout wrapper
- `LayoutDefaultHeaderItemComponent` — Header elements
- Auto-renders sidebar nav (LayoutDefaultNavComponent) when nav input not provided

### Common ng-zorro Modules:
- `NzCardModule` — Card containers
- `NzGridModule` — Grid layout (nz-row, nz-col)
- `NzButtonModule` — Buttons
- `NzIconModule` — Icons
- `NzFormModule` — Form layout
- `NzInputModule` — Input fields
- `NzTableModule` — Data tables
- `NzDropDownModule` — Dropdown menus

---

## File Organization Summary

### For Creating a New Page:

**1. Create page component:**
```
src/app/pages/{page-name}/
├── {page-name}.ts           # Component
├── {page-name}.html         # Template
└── {page-name}.less         # Styles
```

**2. Create service (if needed):**
```
src/app/core/services/{feature}.service.ts
```

**3. Update route:**
Add to `src/app/app.routes.ts` under children of AdminLayoutComponent

**4. Update menu:**
Add to `StartupService.initMenuItems()`

**5. Register icons (if new):**
Add to icons array in `app.config.ts`

---

## Existing Components Summary

### Dashboard Component
- **Path**: `src/app/pages/dashboard/`
- **Pattern**: Signal-based state, static card layout
- **Modules**: NzCardModule, NzGridModule, NzStatisticModule, NzIconModule
- **Data**: `stats` signal with hardcoded demo data

### Login Component
- **Path**: `src/app/pages/login/`
- **Pattern**: Reactive form with error handling
- **Modules**: ReactiveFormsModule, NzFormModule, NzInputModule, NzButtonModule, NzAlertModule
- **Flow**: Form validation → AuthService.login() → Router navigate

### Admin Layout Component
- **Path**: `src/app/layout/admin-layout/`
- **Features**: Header with user menu, sidebar toggle, logout
- **Depends on**: LayoutDefaultComponent from @delon/theme

---

## Key Services & Utilities

| Service | Location | Purpose |
|---------|----------|---------|
| `AuthService` | `core/services/auth.service.ts` | Token management, login/logout |
| `StartupService` | `core/startup/startup.service.ts` | Menu & app settings init |
| `authGuard` | `core/guards/auth.guard.ts` | Route protection |
| `authInterceptor` | `core/interceptors/auth.interceptor.ts` | Token injection & 401 handling |

---

## Development Checklist for New Page

- [ ] Create component file: `src/app/pages/{name}/{name}.ts`
- [ ] Create template: `src/app/pages/{name}/{name}.html`
- [ ] Create styles: `src/app/pages/{name}/{name}.less`
- [ ] Add route to `app.routes.ts` under AdminLayoutComponent children
- [ ] Add menu item to `StartupService.initMenuItems()`
- [ ] Create API service if needed: `src/app/core/services/{feature}.service.ts`
- [ ] Register new icons in `app.config.ts` if used
- [ ] Test auth guard protection
- [ ] Test lazy-loading

---

## Unresolved Questions

None — all patterns clearly documented.
