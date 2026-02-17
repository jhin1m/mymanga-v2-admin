# Phase 3: Login Page Component

## Context Links
- [plan.md](./plan.md)
- [Phase 2](./phase-02-auth-infrastructure.md)

## Overview

Build the login form UI using ng-zorro-antd standalone components, reactive forms with validation, signal-based loading/error state, and API error display.

## Key Insights

- ng-zorro-antd exports standalone components since v17+ (import individual components, not modules)
- Use `ReactiveFormsModule` for form binding
- Signal-based state for `loading` and `errorMessage` (Angular 21 pattern)
- 422 errors contain field-level validation; display inline or as alert
- Form layout: centered card, ~400px wide, MyManga branding at top

## Requirements

1. Email field: required, email format validation
2. Password field: required, minLength(8)
3. Submit button with loading spinner
4. API error display (401 message, 422 field errors)
5. On success: redirect to /dashboard
6. Responsive centered layout

## Architecture

```
pages/login/
  login.ts        # Component class
  login.html      # Template
  login.less      # Styles
  login.spec.ts   # Tests
```

### Component Structure

```typescript
@Component({
  standalone: true,  // default in Angular 21
  imports: [
    ReactiveFormsModule,
    NzFormModule, NzInputModule, NzButtonModule,
    NzAlertModule, NzIconModule, NzCardModule,
  ],
})
export class LoginComponent {
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  loginForm: FormGroup;  // email + password controls
}
```

## Related Code Files

| File | Action |
|------|--------|
| src/app/pages/login/login.ts | Create |
| src/app/pages/login/login.html | Create |
| src/app/pages/login/login.less | Create |
| src/app/pages/login/login.spec.ts | Create |

## Implementation Steps

### Step 1: Create login.ts

```typescript
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    NzFormModule, NzInputModule, NzButtonModule,
    NzAlertModule, NzIconModule, NzCardModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.less',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.getRawValue();
    this.authService.login(email, password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 401) {
          this.errorMessage.set(err.error?.message ?? 'Invalid credentials');
        } else if (err.status === 422) {
          const errors = err.error?.errors;
          if (errors) {
            const messages = Object.values(errors).flat().join('. ');
            this.errorMessage.set(messages);
          } else {
            this.errorMessage.set(err.error?.message ?? 'Validation error');
          }
        } else {
          this.errorMessage.set('An unexpected error occurred');
        }
      },
    });
  }
}
```

### Step 2: Create login.html

```html
<div class="login-container">
  <nz-card class="login-card">
    <h1 class="login-title">MyManga Admin</h1>

    @if (errorMessage()) {
      <nz-alert nzType="error" [nzMessage]="errorMessage()!" nzShowIcon class="login-alert" />
    }

    <form nz-form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <nz-form-item>
        <nz-form-label nzFor="email">Email</nz-form-label>
        <nz-form-control nzErrorTip="Please enter a valid email">
          <nz-input-group nzPrefixIcon="mail">
            <input nz-input formControlName="email" placeholder="admin@mymanga.vn" id="email" />
          </nz-input-group>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label nzFor="password">Password</nz-form-label>
        <nz-form-control nzErrorTip="Password must be at least 8 characters">
          <nz-input-group nzPrefixIcon="lock">
            <input nz-input type="password" formControlName="password" placeholder="Password" id="password" />
          </nz-input-group>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <button nz-button nzType="primary" nzBlock [nzLoading]="loading()" type="submit">
          Log In
        </button>
      </nz-form-item>
    </form>
  </nz-card>
</div>
```

### Step 3: Create login.less

```less
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f0f2f5;
}

.login-card {
  width: 400px;
  max-width: 90vw;
}

.login-title {
  text-align: center;
  font-size: 24px;
  margin-bottom: 24px;
  color: #1890ff;
}

.login-alert {
  margin-bottom: 16px;
}
```

### Step 4: Create login.spec.ts

Test cases:
- Renders form with email and password fields
- Submit disabled logic when form invalid (markAllAsTouched called)
- Successful login navigates to /dashboard
- 401 error displays error message
- 422 error displays validation messages
- Loading state toggles during submit

## Todo

- [ ] Create src/app/pages/login/login.ts
- [ ] Create src/app/pages/login/login.html
- [ ] Create src/app/pages/login/login.less
- [ ] Create src/app/pages/login/login.spec.ts
- [ ] Verify form validation works (required, email format, minLength)
- [ ] Verify error messages display for 401 and 422
- [ ] Verify loading spinner on submit button

## Success Criteria

- Login form renders correctly with ng-zorro styling
- Validation errors show inline when form submitted invalid
- API errors display as alert banner
- Loading spinner visible during API call
- Successful login redirects to /dashboard

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| ng-zorro icon registration | Medium | May need to register icons via NzIconService or provideNzIcons; check docs |
| Form control error tip not showing | Low | Ensure nz-form-control wraps input and formControlName is correct |

## Security Considerations

- Password field uses type="password" (masked input)
- No "remember me" or credential caching beyond JWT token
- Form does not log credentials to console

## Next Steps

Proceed to [Phase 4: Routing & Dashboard Placeholder](./phase-04-routing.md)
