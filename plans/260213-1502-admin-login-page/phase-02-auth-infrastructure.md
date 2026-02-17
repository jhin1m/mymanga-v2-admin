# Phase 2: Auth Infrastructure

## Context Links
- [plan.md](./plan.md)
- [Phase 1](./phase-01-setup.md)

## Overview

Create auth service (token CRUD + API calls), HTTP interceptor (auto-attach Bearer token, handle 401), and auth guard (protect routes). All use Angular 21 functional patterns.

## Key Insights

- Angular 21 favors functional interceptors (`HttpInterceptorFn`) over class-based
- Angular 21 favors functional guards (`CanActivateFn`) over class-based
- Service uses `inject()` function, signals for reactive state
- Token stored in localStorage under key `admin_token`
- API responses follow consistent shape: `{ success: boolean, data?: T, message?: string, errors?: Record<string, string[]> }`

## Requirements

1. Auth service handles login, logout, getProfile, token management
2. HTTP interceptor attaches Bearer token to API requests
3. HTTP interceptor handles 401 by clearing token + redirecting to /login
4. Auth guard blocks unauthenticated access, redirects to /login
5. Interceptor only attaches token to requests targeting the API base URL

## Architecture

```
core/
  services/
    auth.service.ts     # Injectable, token CRUD + API methods
  interceptors/
    auth.interceptor.ts # HttpInterceptorFn
  guards/
    auth.guard.ts       # CanActivateFn
```

### API Response Types

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

interface AuthToken {
  token: string;
  type: 'Bearer';
}
```

## Related Code Files

| File | Action |
|------|--------|
| src/app/core/services/auth.service.ts | Create |
| src/app/core/interceptors/auth.interceptor.ts | Create |
| src/app/core/guards/auth.guard.ts | Create |
| src/app/app.config.ts | Modify: register interceptor |

## Implementation Steps

### Step 1: Create auth.service.ts

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'admin_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenSignal = signal<string | null>(this.getToken());

  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  login(email: string, password: string): Observable<ApiResponse<AuthToken>> {
    return this.http
      .post<ApiResponse<AuthToken>>(`${environment.apiUrl}/api/admin/auth`, { email, password })
      .pipe(tap(res => {
        if (res.success && res.data) {
          this.setToken(res.data.token);
        }
      }));
  }

  logout(): void {
    this.removeToken();
    this.router.navigate(['/login']);
  }

  getProfile(): Observable<ApiResponse<unknown>> {
    return this.http.get<ApiResponse<unknown>>(`${environment.apiUrl}/api/admin/auth`);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.tokenSignal.set(token);
  }

  private removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.tokenSignal.set(null);
  }
}
```

### Step 2: Create auth.interceptor.ts

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Only attach token to API requests
  if (token && req.url.startsWith(environment.apiUrl)) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/api/admin/auth')) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
```

Note: Exclude the login endpoint from 401 handling to avoid redirect loops.

### Step 3: Create auth.guard.ts

```typescript
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
```

### Step 4: Register interceptor in app.config.ts

Update `provideHttpClient(withInterceptors([]))` to:
```typescript
provideHttpClient(withInterceptors([authInterceptor]))
```

## Todo

- [ ] Create src/app/core/services/auth.service.ts
- [ ] Create src/app/core/interceptors/auth.interceptor.ts
- [ ] Create src/app/core/guards/auth.guard.ts
- [ ] Register authInterceptor in app.config.ts
- [ ] Write unit tests for auth.service (login success/error, token management)
- [ ] Write unit tests for auth.guard (authenticated vs not)

## Success Criteria

- AuthService.login() POSTs to correct URL, stores token on success
- AuthService.logout() clears token and navigates to /login
- Interceptor attaches Bearer header only to API-bound requests
- Interceptor catches 401 and triggers logout (except on login endpoint)
- Guard redirects unauthenticated users to /login
- All unit tests pass

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| 401 redirect loop on login page | High | Exclude login endpoint from 401 handler |
| localStorage unavailable (SSR) | Low | Admin panel is client-only; no SSR planned |

## Security Considerations

- Token stored in localStorage (acceptable for admin panel; HttpOnly cookie would be better but requires backend changes)
- Token cleared on logout and 401
- Interceptor scoped to API URL only; won't leak token to third-party requests

## Next Steps

Proceed to [Phase 3: Login Page Component](./phase-03-login-page.md)
