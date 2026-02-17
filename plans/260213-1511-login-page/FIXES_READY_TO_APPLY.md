# Ready-to-Apply Code Fixes

Copy-paste these fixes directly into your source files. Each fix is marked with the file path and line numbers.

---

## Fix #1: Reset Loading State on Login Success

**File:** `src/app/pages/login/login.ts`
**Lines:** 52-76
**Time:** 1 minute

**BEFORE:**
```typescript
this.authService.login(email, password).subscribe({
  next: () => {
    this.router.navigate(['/dashboard']);
  },
  error: (err: HttpErrorResponse) => {
    this.loading.set(false);
    // ... error handling
  },
});
```

**AFTER:**
```typescript
this.authService.login(email, password).subscribe({
  next: () => {
    this.loading.set(false); // ADD THIS LINE
    this.router.navigate(['/dashboard']);
  },
  error: (err: HttpErrorResponse) => {
    this.loading.set(false);
    // ... error handling
  },
});
```

**Why:** Ensures loading indicator disappears immediately on successful login, not just on error.

---

## Fix #2: Add Error Handling to Logout

**File:** `src/app/core/services/auth.service.ts`
**Lines:** 43-51
**Time:** 2 minutes

**BEFORE:**
```typescript
logout(): void {
  // Fire-and-forget DELETE to revoke server token
  const token = this.getToken();
  if (token) {
    this.http.delete(`${environment.apiUrl}/api/admin/auth`).subscribe();
  }
  this.removeToken();
  this.router.navigate(['/login']);
}
```

**AFTER:**
```typescript
logout(): void {
  // Fire-and-forget DELETE to revoke server token
  const token = this.getToken();
  if (token) {
    this.http.delete(`${environment.apiUrl}/api/admin/auth`).subscribe({
      next: () => console.log('Token revoked successfully'),
      error: (err) => console.error('Failed to revoke token on server:', err),
    });
  }
  this.removeToken();
  this.router.navigate(['/login']);
}
```

**Why:** Logs errors from server token revocation instead of silently failing.

---

## Fix #3: Add Field-Level Validation Messages

**File:** `src/app/pages/login/login.html`
**Lines:** 14-42
**Time:** 10 minutes

**BEFORE:**
```html
<form nz-form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
  <nz-form-item>
    <nz-form-label nzFor="email">Email</nz-form-label>
    <nz-form-control nzErrorTip="Vui lòng nhập email hợp lệ">
      <nz-input-group nzPrefixIcon="mail">
        <input
          nz-input
          formControlName="email"
          placeholder="admin@mymanga.vn"
          id="email"
        />
      </nz-input-group>
    </nz-form-control>
  </nz-form-item>

  <nz-form-item>
    <nz-form-label nzFor="password">Mật khẩu</nz-form-label>
    <nz-form-control nzErrorTip="Mật khẩu tối thiểu 8 ký tự">
      <nz-input-group nzPrefixIcon="lock">
        <input
          nz-input
          type="password"
          formControlName="password"
          placeholder="Mật khẩu"
          id="password"
        />
      </nz-input-group>
    </nz-form-control>
  </nz-form-item>
  <!-- ... -->
</form>
```

**AFTER:**
```html
<form nz-form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
  <nz-form-item>
    <nz-form-label nzFor="email">Email</nz-form-label>
    <nz-form-control>
      @if (loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched) {
        <ng-template nzErrorTip>Email là bắt buộc</ng-template>
      }
      @if (loginForm.get('email')?.hasError('email') && loginForm.get('email')?.touched) {
        <ng-template nzErrorTip>Email không hợp lệ</ng-template>
      }
      <nz-input-group nzPrefixIcon="mail">
        <input
          nz-input
          formControlName="email"
          placeholder="admin@mymanga.vn"
          id="email"
        />
      </nz-input-group>
    </nz-form-control>
  </nz-form-item>

  <nz-form-item>
    <nz-form-label nzFor="password">Mật khẩu</nz-form-label>
    <nz-form-control>
      @if (loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched) {
        <ng-template nzErrorTip>Mật khẩu là bắt buộc</ng-template>
      }
      @if (loginForm.get('password')?.hasError('minlength') && loginForm.get('password')?.touched) {
        <ng-template nzErrorTip>Mật khẩu tối thiểu 8 ký tự</ng-template>
      }
      <nz-input-group nzPrefixIcon="lock">
        <input
          nz-input
          type="password"
          formControlName="password"
          placeholder="Mật khẩu"
          id="password"
        />
      </nz-input-group>
    </nz-form-control>
  </nz-form-item>
  <!-- ... -->
</form>
```

**Why:** Shows specific validation errors only when field is touched, improving UX clarity.

---

## Fix #4: Create `auth.service.spec.ts` (NEW FILE)

**File:** `src/app/core/services/auth.service.spec.ts`
**Time:** 1.5 hours
**Importance:** HIGH - Critical gap in test coverage

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService, ApiResponse, AuthToken } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const routerMock = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerMock },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('login', () => {
    it('should store token on successful login', (done) => {
      const mockResponse: ApiResponse<AuthToken> = {
        success: true,
        data: { token: 'eyJhbGc...test-jwt', type: 'Bearer' },
      };

      service.login('admin@test.com', 'password123').subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(service.getToken()).toBe('eyJhbGc...test-jwt');
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/admin/auth`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'admin@test.com', password: 'password123' });
      req.flush(mockResponse);
    });

    it('should not store token on failed login (401)', (done) => {
      service.login('admin@test.com', 'wrong-password').subscribe({
        error: () => {
          expect(service.getToken()).toBeNull();
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/admin/auth`);
      req.flush(
        { success: false, message: 'Unauthorized' },
        { status: 401, statusText: 'Unauthorized' }
      );
    });

    it('should handle validation errors (422)', (done) => {
      service.login('invalid-email', 'pass').subscribe({
        error: () => {
          expect(service.getToken()).toBeNull();
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/admin/auth`);
      req.flush(
        { success: false, errors: { email: ['Invalid email format'] } },
        { status: 422, statusText: 'Unprocessable Entity' }
      );
    });
  });

  describe('logout', () => {
    it('should clear token and navigate on logout', () => {
      localStorage.setItem('admin_token', 'test-jwt');
      service.logout();

      expect(service.getToken()).toBeNull();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should attempt to revoke token with DELETE request', () => {
      localStorage.setItem('admin_token', 'test-jwt');
      service.logout();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/admin/auth`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle logout DELETE error gracefully', () => {
      localStorage.setItem('admin_token', 'test-jwt');
      spyOn(console, 'error');
      service.logout();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/admin/auth`);
      req.error(new ErrorEvent('Network error'));

      expect(console.error).toHaveBeenCalledWith(
        'Failed to revoke token on server:',
        jasmine.any(Object)
      );
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('getProfile', () => {
    it('should fetch profile from API', () => {
      const mockProfile = { id: 1, email: 'admin@test.com', role: 'admin' };

      service.getProfile().subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.data).toEqual(mockProfile);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/admin/auth`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockProfile });
    });
  });

  describe('Token management', () => {
    it('should return token from localStorage if present', () => {
      localStorage.setItem('admin_token', 'stored-jwt');
      expect(service.getToken()).toBe('stored-jwt');
    });

    it('should return null if no token in localStorage', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('isAuthenticated signal', () => {
    it('should be false when no token', () => {
      localStorage.clear();
      const newService = TestBed.inject(AuthService);
      expect(newService.isAuthenticated()).toBeFalsy();
    });

    it('should be true when token exists', () => {
      localStorage.setItem('admin_token', 'test-jwt');
      const newService = TestBed.inject(AuthService);
      expect(newService.isAuthenticated()).toBeTruthy();
    });
  });
});
```

---

## Fix #5: Create `auth.guard.spec.ts` (NEW FILE)

**File:** `src/app/core/guards/auth.guard.spec.ts`
**Time:** 45 minutes

```typescript
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: jasmine.createSpyObj('AuthService', [], { isAuthenticated: jasmine.createSpy() }) },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['createUrlTree']) },
      ],
    });

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should allow access if authenticated', () => {
    (authServiceSpy.isAuthenticated as any).and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => authGuard());

    expect(result).toBe(true);
  });

  it('should deny access and redirect if not authenticated', () => {
    (authServiceSpy.isAuthenticated as any).and.returnValue(false);
    const urlTree = {} as any;
    routerSpy.createUrlTree.and.returnValue(urlTree);

    const result = TestBed.runInInjectionContext(() => authGuard());

    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
    expect(result).toEqual(urlTree);
  });
});
```

---

## Fix #6: Create `auth.interceptor.spec.ts` (NEW FILE)

**File:** `src/app/core/interceptors/auth.interceptor.spec.ts`
**Time:** 1 hour

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
      ],
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should attach Bearer token to API requests', () => {
    authServiceSpy.getToken.and.returnValue('test-jwt-token');

    httpClient.get(`${environment.apiUrl}/api/admin/profile`).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/admin/profile`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
    req.flush({});
  });

  it('should not attach token to non-API requests', () => {
    authServiceSpy.getToken.and.returnValue('test-jwt-token');

    httpClient.get('https://example.com/data').subscribe();

    const req = httpMock.expectOne('https://example.com/data');
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush({});
  });

  it('should not attach token if no token available', () => {
    authServiceSpy.getToken.and.returnValue(null);

    httpClient.get(`${environment.apiUrl}/api/admin/profile`).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/api/admin/profile`);
    expect(req.request.headers.get('Authorization')).toBeNull();
    req.flush({});
  });

  it('should trigger logout on 401 response', () => {
    authServiceSpy.getToken.and.returnValue('expired-token');

    httpClient.get(`${environment.apiUrl}/api/admin/profile`).subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/admin/profile`);
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.logout).toHaveBeenCalled();
  });

  it('should not logout on 401 if request is to login endpoint', () => {
    authServiceSpy.getToken.and.returnValue(null);

    httpClient.post(`${environment.apiUrl}/api/admin/auth`, {}).subscribe({
      error: () => {},
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/admin/auth`);
    req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.logout).not.toHaveBeenCalled();
  });

  it('should pass through other error statuses', () => {
    authServiceSpy.getToken.and.returnValue('test-jwt-token');

    httpClient.get(`${environment.apiUrl}/api/admin/profile`).subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(500);
      },
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/admin/profile`);
    req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(authServiceSpy.logout).not.toHaveBeenCalled();
  });
});
```

---

## Fix #7: Create `login.component.spec.ts` (NEW FILE)

**File:** `src/app/pages/login/login.spec.ts`
**Time:** 1.5 hours

```typescript
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login';
import { AuthService } from '../../core/services/auth.service';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authMock = jasmine.createSpyObj('AuthService', ['login']);
    const routerMock = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        ReactiveFormsModule,
        NzFormModule,
        NzInputModule,
        NzButtonModule,
        NzAlertModule,
        NzCardModule,
        NzIconModule,
      ],
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Form Initialization', () => {
    it('should create login form with email and password controls', () => {
      expect(component['loginForm'].get('email')).toBeTruthy();
      expect(component['loginForm'].get('password')).toBeTruthy();
    });

    it('should have email required and email format validators', () => {
      const emailControl = component['loginForm'].get('email');
      emailControl?.setValue('');
      expect(emailControl?.hasError('required')).toBe(true);

      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBe(true);

      emailControl?.setValue('valid@email.com');
      expect(emailControl?.valid).toBe(true);
    });

    it('should have password required and minLength validators', () => {
      const passwordControl = component['loginForm'].get('password');
      passwordControl?.setValue('');
      expect(passwordControl?.hasError('required')).toBe(true);

      passwordControl?.setValue('short');
      expect(passwordControl?.hasError('minlength')).toBe(true);

      passwordControl?.setValue('password123');
      expect(passwordControl?.valid).toBe(true);
    });
  });

  describe('onSubmit', () => {
    it('should not submit if form is invalid', () => {
      component['loginForm'].patchValue({
        email: 'invalid',
        password: 'short',
      });

      component['onSubmit']();

      expect(authServiceSpy.login).not.toHaveBeenCalled();
      expect(component['loginForm'].touched).toBe(false); // markAllAsTouched called but form invalid
    });

    it('should call authService.login with email and password', () => {
      authServiceSpy.login.and.returnValue(of({ success: true }));

      component['loginForm'].patchValue({
        email: 'admin@test.com',
        password: 'password123',
      });

      component['onSubmit']();

      expect(authServiceSpy.login).toHaveBeenCalledWith('admin@test.com', 'password123');
    });

    it('should set loading to true during submission', () => {
      authServiceSpy.login.and.returnValue(of({ success: true }));

      component['loginForm'].patchValue({
        email: 'admin@test.com',
        password: 'password123',
      });

      component['onSubmit']();

      expect(component['loading']()).toBe(true);
    });

    it('should clear error message on new submission attempt', () => {
      authServiceSpy.login.and.returnValue(of({ success: true }));

      component['errorMessage'].set('Previous error');
      component['loginForm'].patchValue({
        email: 'admin@test.com',
        password: 'password123',
      });

      component['onSubmit']();

      expect(component['errorMessage']()).toBeNull();
    });

    it('should navigate to dashboard on successful login', () => {
      authServiceSpy.login.and.returnValue(of({ success: true, data: { token: 'test-jwt' } }));

      component['loginForm'].patchValue({
        email: 'admin@test.com',
        password: 'password123',
      });

      component['onSubmit']();

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
      expect(component['loading']()).toBe(false);
    });

    it('should handle 401 (unauthorized) error', (done) => {
      const error = new HttpErrorResponse({
        status: 401,
        statusText: 'Unauthorized',
        error: { message: 'Invalid credentials' },
      });
      authServiceSpy.login.and.returnValue(throwError(() => error));

      component['loginForm'].patchValue({
        email: 'admin@test.com',
        password: 'wrong-password',
      });

      component['onSubmit']();

      setTimeout(() => {
        expect(component['errorMessage']()).toBe('Invalid credentials');
        expect(component['loading']()).toBe(false);
        done();
      }, 100);
    });

    it('should handle 422 (validation) error with field errors', (done) => {
      const error = new HttpErrorResponse({
        status: 422,
        statusText: 'Unprocessable Entity',
        error: { errors: { email: ['Invalid email'], password: ['Too weak'] } },
      });
      authServiceSpy.login.and.returnValue(throwError(() => error));

      component['loginForm'].patchValue({
        email: 'invalid',
        password: 'weak',
      });

      component['onSubmit']();

      setTimeout(() => {
        expect(component['errorMessage']()).toBe('Invalid email. Too weak');
        expect(component['loading']()).toBe(false);
        done();
      }, 100);
    });

    it('should handle generic server error', (done) => {
      const error = new HttpErrorResponse({
        status: 500,
        statusText: 'Internal Server Error',
      });
      authServiceSpy.login.and.returnValue(throwError(() => error));

      component['loginForm'].patchValue({
        email: 'admin@test.com',
        password: 'password123',
      });

      component['onSubmit']();

      setTimeout(() => {
        expect(component['errorMessage']()).toBe('Đã có lỗi xảy ra, vui lòng thử lại');
        expect(component['loading']()).toBe(false);
        done();
      }, 100);
    });
  });
});
```

---

## Application Order

Apply fixes in this order:

1. **Fix #1 + #2** (5 minutes) — Quick stability improvements
2. **Fix #3** (10 minutes) — UX improvement
3. **Fix #4** (1.5 hours) — Most critical test coverage
4. **Fix #5** (45 minutes) — Guard tests
5. **Fix #6** (1 hour) — Interceptor tests
6. **Fix #7** (1.5 hours) — Component tests

**Total time:** ~5-6 hours for complete implementation

---

## Verification Commands

After applying fixes:

```bash
# Type check
npx tsc --noEmit

# Run all tests
npm test

# Build
npm run build

# Check test coverage
npm test -- --coverage
```

Expected results after fixes:
- ✓ Build passes
- ✓ All tests pass
- ✓ Coverage >80% for auth module
