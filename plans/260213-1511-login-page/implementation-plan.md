# Login Page Implementation Plan

**Date:** 2026-02-13
**Status:** IN REVIEW
**Priority:** HIGH

---

## Executive Summary

Login page implementation for MyManga admin panel is **functionally complete and mostly secure**, following Angular 21 best practices. Code compiles successfully, tests pass, TypeScript strict mode enforced. Main issues are security hardening (token storage), test coverage gaps, and minor UX improvements.

---

## Completed Tasks

- [x] Standalone login component with reactive forms
- [x] JWT token-based authentication flow
- [x] Auth service with signals API
- [x] Functional interceptor for Bearer token injection
- [x] Functional route guard for protected pages
- [x] Error handling for 401, 422, and generic errors
- [x] Dashboard placeholder with logout
- [x] TypeScript strict mode compilation
- [x] ng-zorro-antd UI components integrated
- [x] Environment-specific API URLs

---

## Critical Issues (MUST FIX)

### Issue #1: Token Storage Security

**Severity:** CRITICAL
**Status:** NOT FIXED
**Assigned:** Backend + Frontend

**Problem:** JWT token stored in localStorage is vulnerable to XSS attacks.

**Current Code:**
```typescript
// src/app/core/services/auth.service.ts
private setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  this.tokenSignal.set(token);
}
```

**Root Cause:** Browser XSS can access localStorage; HttpOnly cookies cannot be accessed by JS.

**Fix Required:**
1. Backend: Set JWT via `Set-Cookie` header with HttpOnly, Secure, SameSite=Strict flags
2. Frontend: Remove localStorage usage; rely on browser-managed cookies
3. Frontend: Enable withCredentials in HttpClient config

**Implementation:**
```typescript
// src/app/core/services/auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Token now managed by browser (HttpOnly cookie)
  readonly isAuthenticated = computed(() => {
    // Check by attempting to fetch profile or check session
    // Alternative: maintain a signal set on app bootstrap
    return !!this.getAuthStatus();
  });

  login(email: string, password: string): Observable<ApiResponse<AuthToken>> {
    return this.http.post<ApiResponse<AuthToken>>(
      `${environment.apiUrl}/api/admin/auth`,
      { email, password },
      { withCredentials: true } // Enable cookie send
    ).pipe(
      tap((res) => {
        if (res.success) {
          // Token is now in HttpOnly cookie set by server
          // No need to store it here
        }
      }),
    );
  }

  logout(): void {
    this.http.delete(
      `${environment.apiUrl}/api/admin/auth`,
      { withCredentials: true }
    ).subscribe({
      error: (err) => console.error('Logout revocation failed:', err)
    });
    this.router.navigate(['/login']);
  }

  private getAuthStatus(): boolean {
    // Determine auth from response or re-check on app init
    return true; // Placeholder; implement based on backend response
  }
}
```

**Backend Requirement:**
```
Set-Cookie: admin_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600
```

**Timeline:** 1-2 days (coordinate with backend team)

---

### Issue #2: Loading State Not Reset on Success

**Severity:** HIGH
**Status:** NOT FIXED
**File:** `src/app/pages/login/login.ts`

**Problem:** Login button loading state not cleared if navigation delay occurs.

**Current Code:**
```typescript
this.authService.login(email, password).subscribe({
  next: () => {
    this.router.navigate(['/dashboard']); // loading still true!
  },
  error: (err: HttpErrorResponse) => {
    this.loading.set(false); // Only set false on error
  },
});
```

**Fix:**
```typescript
this.authService.login(email, password).subscribe({
  next: () => {
    this.loading.set(false); // ADD THIS
    this.router.navigate(['/dashboard']);
  },
  error: (err: HttpErrorResponse) => {
    this.loading.set(false);
    // ... error handling
  },
});
```

**Timeline:** 5 minutes

---

### Issue #3: Missing Error Handling in Logout

**Severity:** MEDIUM
**Status:** NOT FIXED
**File:** `src/app/core/services/auth.service.ts`

**Problem:** DELETE request to revoke token has no error handling (fire-and-forget).

**Current Code:**
```typescript
if (token) {
  this.http.delete(`${environment.apiUrl}/api/admin/auth`).subscribe();
}
```

**Fix:**
```typescript
if (token) {
  this.http.delete(`${environment.apiUrl}/api/admin/auth`).subscribe({
    next: () => console.log('Token revoked'),
    error: (err) => console.error('Failed to revoke token:', err),
  });
}
```

**Timeline:** 5 minutes

---

## High Priority Issues (SHOULD FIX BEFORE RELEASE)

### Issue #4: Zero Test Coverage for Auth Layer

**Severity:** HIGH
**Status:** NOT FIXED
**Impact:** No validation that auth logic works as intended

**Missing Tests:**
- [ ] auth.service.spec.ts (token getter/setter, login, logout, getProfile)
- [ ] auth.interceptor.spec.ts (token injection, 401 handling)
- [ ] auth.guard.spec.ts (allow/deny based on auth state)
- [ ] login.component.spec.ts (form submission, error display)

**Test File: auth.service.spec.ts**
```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should store token on successful login', () => {
    const mockResponse = { success: true, data: { token: 'test-jwt', type: 'Bearer' } };
    service.login('admin@test.com', 'password123').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/admin/auth`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    expect(service.getToken()).toBe('test-jwt');
  });

  it('should not store token on failed login', () => {
    service.login('admin@test.com', 'wrong').subscribe({ error: () => {} });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/admin/auth`);
    req.error(new ErrorEvent('Unauthorized'), { status: 401 });

    expect(service.getToken()).toBeNull();
  });

  it('should clear token on logout', () => {
    localStorage.setItem('admin_token', 'test-jwt');
    service.logout();

    expect(service.getToken()).toBeNull();
    httpMock.expectOne(`${environment.apiUrl}/api/admin/auth`);
  });

  it('should compute isAuthenticated correctly', () => {
    expect(service.isAuthenticated()).toBeFalsy();

    localStorage.setItem('admin_token', 'test-jwt');
    const newService = TestBed.inject(AuthService);
    expect(newService.isAuthenticated()).toBeTruthy();
  });
});
```

**Timeline:** 2-3 hours

---

### Issue #5: No CSRF Protection Validation

**Severity:** MEDIUM
**Status:** NEEDS VERIFICATION

**Problem:** No explicit CSRF token in form; relies on SameSite cookie + Origin header validation.

**Verification Checklist:**
- [ ] Confirm backend validates Origin header on POST `/api/admin/auth`
- [ ] Confirm backend sets SameSite=Strict on session cookie
- [ ] Test CSRF attack simulation (cross-domain form submission blocked)

**If CSRF Token Required:**
```typescript
// Backend provides CSRF token endpoint
// Frontend retrieves before form load

export class LoginComponent implements OnInit {
  csrfToken = signal<string | null>(null);

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.getCSRFToken().subscribe(
      (token) => this.csrfToken.set(token.token)
    );
  }

  onSubmit() {
    const formData = { ...this.loginForm.getRawValue(), _csrf: this.csrfToken() };
    // Submit with CSRF token
  }
}
```

**Timeline:** Depends on backend coordination (1-2 hours)

---

## Medium Priority Issues (NICE TO HAVE)

### Issue #6: No Password Reset Flow

**Status:** OUT OF SCOPE (design issue)
**Recommendation:** Add "Forgot Password" link in login template

```html
<div class="login-footer">
  <a routerLink="/forgot-password">Quên mật khẩu?</a>
</div>
```

---

### Issue #7: Field-Level Validation Messages Not Displayed

**File:** `src/app/pages/login/login.html`

**Current:**
```html
<nz-form-control nzErrorTip="Vui lòng nhập email hợp lệ">
```

**Improved:**
```html
<nz-form-control>
  @if (email?.hasError('required') && email?.touched) {
    <ng-template nzErrorTip>Email là bắt buộc</ng-template>
  }
  @if (email?.hasError('email') && email?.touched) {
    <ng-template nzErrorTip>Email không hợp lệ</ng-template>
  }
</nz-form-control>
```

**Timeline:** 30 minutes

---

### Issue #8: Bundle Size Over Budget

**Status:** WARNING (not critical)
**Size:** +1.47 KB over 1 MB limit

**Options:**
1. Increase budget (acceptable for initial build)
2. Tree-shake ng-zorro unused components
3. Lazy-load additional modules in dashboard

**Timeline:** If needed, 1-2 hours

---

## Task Breakdown

### Phase 1: Critical Security Fixes (Days 1-2)

- [ ] **Task 1.1:** Migrate auth token to HttpOnly cookie
  - Backend: Update `/api/admin/auth` response to set Set-Cookie header
  - Frontend: Remove localStorage usage from auth.service.ts
  - Implement: Add withCredentials to HttpClient requests
  - Estimated: 2 hours (backend + frontend)

- [ ] **Task 1.2:** Fix loading state reset on login success
  - File: `src/app/pages/login/login.ts` line 54
  - Change: Add `this.loading.set(false);` in `next` callback
  - Estimated: 5 minutes

- [ ] **Task 1.3:** Add error handling to logout DELETE
  - File: `src/app/core/services/auth.service.ts` line 47
  - Change: Add error/next handlers to subscribe()
  - Estimated: 5 minutes

### Phase 2: Test Coverage (Days 2-3)

- [ ] **Task 2.1:** Create auth.service.spec.ts
  - Tests: Token storage, login, logout, isAuthenticated signal
  - Coverage target: 90%+
  - Estimated: 1.5 hours

- [ ] **Task 2.2:** Create auth.interceptor.spec.ts
  - Tests: Token injection, 401 handling, auto-logout
  - Coverage target: 85%+
  - Estimated: 1 hour

- [ ] **Task 2.3:** Create auth.guard.spec.ts
  - Tests: Allow/deny based on auth state, redirect to login
  - Coverage target: 90%+
  - Estimated: 45 minutes

- [ ] **Task 2.4:** Create login.component.spec.ts
  - Tests: Form validation, error display, success navigation
  - Coverage target: 80%+
  - Estimated: 1.5 hours

### Phase 3: Security Validation (Day 3)

- [ ] **Task 3.1:** Verify CSRF protection
  - Backend: Validate Origin header
  - Frontend: Test cross-domain attack blocked
  - Estimated: 1 hour

- [ ] **Task 3.2:** Verify authentication flow end-to-end
  - Manual testing: Login → Dashboard → Logout → Login
  - Estimated: 30 minutes

### Phase 4: Enhancements (Optional, Next Sprint)

- [ ] **Task 4.1:** Add field-level validation messages
- [ ] **Task 4.2:** Implement i18n for error messages
- [ ] **Task 4.3:** Add password recovery flow
- [ ] **Task 4.4:** Optimize bundle size

---

## Deployment Checklist

- [ ] All critical issues fixed
- [ ] Test coverage >80% for auth layer
- [ ] Security scan passed (no XSS, CSRF, token exposure)
- [ ] Build passes without errors
- [ ] Manual E2E testing completed
- [ ] Backend CSRF/SameSite validation confirmed
- [ ] HttpOnly cookie working in production environment
- [ ] Error logging configured (no sensitive data)
- [ ] Rate limiting on login endpoint verified

---

## Rollback Plan

If issues found in production:
1. Immediately disable authentication (use mock auth for debugging)
2. Revert token storage to sessionStorage temporarily
3. Investigate root cause
4. Re-deploy after fix validated

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Build success | ✓ | ✓ |
| Tests passing | ✓ | ✓ (basic only) |
| Auth test coverage | 80%+ | 0% |
| No XSS vulnerabilities | ✓ | ⚠ (localStorage flag) |
| CSRF protection verified | ✓ | ? |
| HttpOnly cookies implemented | ✓ | ✗ |

---

## Next Steps

1. **Immediate (today):**
   - Address critical security issues (#1-3)
   - Coordinate with backend on HttpOnly cookies

2. **This week:**
   - Implement unit tests (Task 2.1-2.4)
   - Verify CSRF protection (Task 3.1)

3. **Next week:**
   - Optional enhancements (Task 4.x)
   - Prepare for staging deployment
