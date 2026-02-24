# User Management Files - Quick Reference

## Absolute Paths

### Core Services
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/auth.service.ts`
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/members.service.ts`

### Guards & Interceptors
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/guards/auth.guard.ts`
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/interceptors/auth.interceptor.ts`

### Models & Types
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/models/api-types.ts`

### UI Components
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/members/members.ts`
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/login/login.ts`

### Configuration & Setup
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/app.routes.ts`
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/app.config.ts`
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/startup/startup.service.ts`

---

## Quick API Reference

### Authentication
```
POST /api/admin/auth           → login
GET  /api/admin/auth           → getProfile
DELETE /api/admin/auth         → logout
```

### Members Management
```
GET    /api/admin/users        → getMembers(params)
POST   /api/admin/users/:id/ban → banUser(id)
PUT    /api/admin/users/:id/update-points → updateUserPoints(id, payload)
DELETE /api/admin/users/:id/delete-comment → deleteUserComments(id)
```

---

## Key Interfaces

### Member
```ts
{
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
```

### MemberListParams
```ts
{
  page?: number;
  per_page?: number;
  'filter[id]'?: string;
  'filter[name]'?: string;
  'filter[email]'?: string;
  'filter[role]'?: string;
}
```

---

## Route Structure

```
/login                          → LoginComponent (public)
/                              → AdminLayoutComponent (protected)
  /dashboard                   → DashboardComponent
  /members                     → MembersComponent
  /manga
    /list                      → MangaListComponent
    /create                    → MangaCreateComponent
    /edit/:id                  → MangaEditComponent
    /:mangaId/chapters/create  → ChapterCreateComponent
    /:mangaId/chapters/:chapterId/edit → ChapterEditComponent
  (other routes...)
```

---

## Angular Patterns Used

- **Standalone Components:** No NgModules
- **Signals API:** `signal()`, `computed()`
- **Functional Guards:** CanActivateFn
- **Functional Interceptors:** HttpInterceptorFn
- **DI via inject():** Not constructor-based
- **Reactive Forms:** FormBuilder, ReactiveFormsModule
- **ng-zorro:** NZ components for UI
