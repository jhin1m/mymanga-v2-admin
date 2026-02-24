# Scout Report: User Management Files

**Date:** 2026-02-24  
**Scope:** src/app/  
**Task:** Locate all user management-related files (services, components, models, guards, routes)

---

## Summary

Found **7 core user management files** across services, guards, interceptors, models, routes, and components. System uses standalone components with signal-based reactive state. Authentication flow via AuthService with Bearer tokens. Members management handles user list, points editing, and user actions (ban/delete comments).

---

## File Structure

### 1. Authentication & Authorization

#### `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/auth.service.ts`
- **Purpose:** Core authentication service (login, logout, token management)
- **Key Types:**
  - `ApiResponse<T>` — Standard API response wrapper
  - `AuthToken` — { token: string, type: 'Bearer' }
- **Key Methods:**
  - `login(email, password)` → POST `/api/admin/auth` → sets token in signal
  - `logout()` → DELETE `/api/admin/auth` → clears localStorage + signal
  - `getProfile()` → GET `/api/admin/auth` → fetches current user
  - `isAuthenticated` computed signal — reactive boolean
- **Token Storage:** localStorage key `admin_token`
- **Patterns:** DI via `inject()`, signal + computed for reactive state

#### `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/guards/auth.guard.ts`
- **Type:** Standalone route guard (CanActivateFn)
- **Behavior:** Blocks unauthenticated users, redirects to `/login`
- **Check:** `authService.isAuthenticated()` computed signal

#### `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/interceptors/auth.interceptor.ts`
- **Type:** Functional HTTP interceptor
- **Features:**
  - Attaches `Authorization: Bearer {token}` to API requests
  - Auto-logout on 401 responses (except login endpoint)
  - Skips token for non-API URLs

---

### 2. User/Member Service

#### `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/members.service.ts`
- **API Base:** `${apiUrl}/api/admin/users`
- **Interfaces:**
  ```ts
  interface Member {
    id: string;
    name: string;
    email: string;
    total_points: number;
    used_points: number;
    achievements_points: number;
    avatar_full_url: string | null;
    banned_until: string | null;
    created_at: string;
    level: number;
    exp: number;
  }
  
  interface MemberListParams {
    page?: number;
    per_page?: number;
    'filter[id]'?: string;
    'filter[name]'?: string;
    'filter[email]'?: string;
    'filter[role]'?: string;  // Note: filter exists but role not in Member interface
  }
  
  interface UpdatePointsPayload {
    total_points?: number;
    used_points?: number;
    achievements_points?: number;
  }
  ```
- **Methods:**
  - `getMembers(params)` → GET with filter/pagination (Spatie QueryBuilder format)
  - `banUser(id)` → POST `/api/admin/users/{id}/ban`
  - `deleteUserComments(id)` → DELETE `/api/admin/users/{id}/delete-comment`
  - `updateUserPoints(id, payload)` → PUT `/api/admin/users/{id}/update-points`
- **Response Type:** `PaginatedResponse<Member>` with pagination metadata

---

### 3. Models & Types

#### `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/models/api-types.ts`
```ts
interface PaginationInfo {
  count: number;
  total: number;
  perPage: number;
  currentPage: number;
  totalPages: number;
  links?: { next?: string; previous?: string };
}

interface PaginatedResponse<T> {
  status: number;
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
}
```

---

### 4. UI Components

#### `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/members/members.ts`
- **Purpose:** Members list/management page
- **Architecture:** Standalone component with signals
- **State (signals):**
  - `members: Member[]`
  - `loading: boolean`
  - `total: number` (pagination)
  - `pageIndex: number` (current page)
  - `pageSize: number` (items per page)
- **Form:** Reactive form for search/filters
  - Fields: id, name, email, role
  - Hardcoded roles: [admin, translator, user]
- **Features:**
  - Search members by id/name/email/role
  - Pagination controls
  - Ban/unban user
  - Delete user comments
  - Edit user points (modal)
- **Sub-component:** `EditPointsModalComponent`
  - Inline modal for editing total_points, used_points, achievements_points
  - Uses `NZ_MODAL_DATA` injection for data passing

**Key Code Snippet — Load Members:**
```ts
loadMembers(): void {
  this.loading.set(true);
  const formValue = this.searchForm.getRawValue();
  const params: MemberListParams = {
    page: this.pageIndex(),
    per_page: this.pageSize(),
  };
  if (formValue.id) params['filter[id]'] = formValue.id;
  if (formValue.name) params['filter[name]'] = formValue.name;
  if (formValue.email) params['filter[email]'] = formValue.email;
  if (formValue.role) params['filter[role]'] = formValue.role;
  
  this.membersService.getMembers(params).subscribe({
    next: (res) => {
      this.members.set(res?.data ?? []);
      this.total.set(res?.pagination?.total ?? 0);
      this.loading.set(false);
    },
    error: () => { /* handle */ },
  });
}
```

---

### 5. Route Definitions

#### `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/app.routes.ts`
```ts
// Login route (outside layout)
{ path: 'login', loadComponent: () => import('./pages/login/login')... }

// Authenticated routes (inside AdminLayoutComponent, with authGuard)
{
  path: '',
  canActivate: [authGuard],
  loadComponent: () => import('./layout/admin-layout/admin-layout')...
  children: [
    { path: 'members', loadComponent: () => import('./pages/members/members')... },
    // ... other routes
  ]
}
```

#### `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/login/login.ts`
- **Purpose:** Login page
- **Form:** email + password (validation: email format, password minLength 8)
- **Flow:**
  1. User enters credentials
  2. Call `authService.login(email, password)`
  3. On success → navigate to `/dashboard`
  4. On 401 → show error message
  5. On 422 → show validation errors
- **Error Handling:** Flattens backend validation errors into single message

---

### 6. App Configuration

#### `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/app.config.ts`
- **HTTP:** `provideHttpClient(withInterceptors([authInterceptor]))`
- **Auth Interceptor:** Applied globally to all requests
- **Startup:** `APP_INITIALIZER` triggers `StartupService.load()` on app init

---

### 7. Startup & Menu Setup

#### `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/startup/startup.service.ts`
- **Purpose:** Initialize app settings + sidebar menu
- **Menu Items Include:** "Thành viên" (Members) → `/members`
- **App Settings:** Configures name, description, user avatar in layout

---

## Key Patterns & Observations

### Authentication Flow
1. User logs in at `/login` → AuthService stores token in localStorage + signal
2. Auth interceptor automatically attaches Bearer token to all API requests
3. Auth guard blocks unauthenticated access to protected routes
4. 401 response triggers auto-logout + redirect to `/login`

### State Management
- **Signals** for reactive state (members, loading, pagination)
- **Computed signals** for derived state (isAuthenticated)
- **Reactive Forms** for search/filter inputs
- No NgRx or similar — pure Angular signals

### API Integration
- Standard `ApiResponse<T>` wrapper for all responses
- `PaginatedResponse<T>` for list endpoints
- Spatie QueryBuilder filter format: `filter[field]=value`
- Optional chaining (`res?.data ?? []`) for defensive programming

### Role Support
- **Hardcoded in UI:** admin, translator, user
- **Backend reference:** `'filter[role]'` in MemberListParams
- **Gap:** Member interface lacks `role` field — likely needs extension

### Modal Pattern
- `NzModalService.create()` with `EditPointsModalComponent`
- Data passing via `NZ_MODAL_DATA` injection
- Modal returns Promise to control close behavior

---

## Files Summary (Paths)

| File | Purpose |
|------|---------|
| `/src/app/core/services/auth.service.ts` | Authentication (login/logout/token) |
| `/src/app/core/guards/auth.guard.ts` | Route protection guard |
| `/src/app/core/interceptors/auth.interceptor.ts` | Token injection + 401 handling |
| `/src/app/core/services/members.service.ts` | Member list/edit API |
| `/src/app/core/models/api-types.ts` | Pagination models |
| `/src/app/pages/members/members.ts` | Members list component |
| `/src/app/pages/login/login.ts` | Login form component |
| `/src/app/app.routes.ts` | Route definitions |
| `/src/app/app.config.ts` | App initialization + interceptors |
| `/src/app/core/startup/startup.service.ts` | Menu + app settings |

---

## Unresolved Questions

1. **Member.role field:** Filter `'filter[role]'` exists in params, but `role` field is absent from Member interface. Needs confirmation if backend returns role or if it's only for filtering.
2. **Permission/Authorization:** No role-based access control (RBAC) currently visible. Are there plan-level permissions for member actions (ban/delete comments)?
3. **User Profile:** `AuthService.getProfile()` fetches current user but not used anywhere in visible code. Where is current user info displayed?
4. **Point System:** total_points, used_points, achievements_points clearly defined, but business logic for earning/spending points not visible in frontend.

---

**Scout Status:** Complete. All user management files identified and documented.
