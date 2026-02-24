# Scout Report: User Management Codebase Analysis
Date: 2026-02-24 | Task: Identify user management patterns and existing architecture

## Summary
Existing user management implementation (`members`) already covers core functionality. Full architecture documented below with patterns established for CRUD operations, list pages, forms, services, and routing.

---

## 1. USER SERVICE (EXISTING)

### File: `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/members.service.ts`

**Patterns:**
- HttpClient + HttpParams for safe query string building
- Interfaces: Member, MemberListParams
- Spatie QueryBuilder backend format: `filter[field]=value`
- Methods: `getMembers()`, `banUser()`, `deleteUserComments()`

**Key Code:**
```typescript
@Injectable({ providedIn: 'root' })
export class MembersService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/users`;

  getMembers(params: MemberListParams): Observable<PaginatedResponse<Member>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<Member>>(this.apiBase, { params: httpParams });
  }
}
```

**Member Interface:**
```typescript
export interface Member {
  id: string;
  name: string;
  email: string;
  total_points: number;
  used_points: number;
  avatar_full_url: string | null;
  banned_until: string | null;
  created_at: string;
  level: number;
  exp: number;
}
```

---

## 2. USER LIST PAGE (EXISTING)

### File: `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/members/members.ts`

**Components:**
- HTML: `members.html`
- Styles: `members.less`

**Patterns:**
- Standalone component with signals for state
- Search form (FormBuilder, ReactiveFormsModule)
- Pagination (custom PaginationBarComponent)
- ng-zorro table with sticky headers
- Modal/popconfirm for destructive actions

**Key Architecture:**
```typescript
@Component({
  selector: 'app-members',
  imports: [ReactiveFormsModule, DatePipe, NzCardModule, NzTableModule, ...],
  templateUrl: './members.html',
  styleUrl: './members.less',
})
export class MembersComponent implements OnInit {
  private readonly membersService = inject(MembersService);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);

  // Signals for reactive state
  protected readonly members = signal<Member[]>([]);
  protected readonly loading = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(20);

  // Search form with fields: id, name, email, role
  protected readonly searchForm = this.fb.group({
    id: [''],
    name: [''],
    email: [''],
    role: [''],
  });

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
      error: () => {
        this.members.set([]);
        this.total.set(0);
        this.message.error('Không thể tải danh sách thành viên');
        this.loading.set(false);
      },
    });
  }
}
```

**HTML Template Pattern:**
- Search card with form fields
- Pagination bar (top & bottom)
- ng-zorro table with:
  - Avatar + name display
  - Status tags (banned vs active)
  - Action buttons (Ban, Delete Comments)
  - Sticky right column for actions

---

## 3. ROUTING

### File: `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/app.routes.ts`

**Pattern:**
- Lazy loading with `loadComponent()`
- AuthGuard on layout route (blocks unauthenticated users)
- Members path: `/members`

```typescript
{
  path: '',
  canActivate: [authGuard],
  loadComponent: () => import('./layout/admin-layout/admin-layout').then((m) => m.AdminLayoutComponent),
  children: [
    {
      path: 'members',
      loadComponent: () => import('./pages/members/members').then((m) => m.MembersComponent),
    },
    // ... other routes
  ],
},
```

---

## 4. MENU CONFIGURATION

### File: `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/startup/startup.service.ts`

**Pattern:**
- MenuService.add() for sidebar items
- Groups organized by section (MENU CHÍNH, CỘNG ĐỒNG, HỆ THỐNG)
- Members under MENU CHÍNH

```typescript
{
  group: true,
  text: 'MENU CHÍNH',
  children: [
    {
      text: 'Thành viên',
      link: '/members',
      icon: { type: 'icon', value: 'user' },
    },
    // ...
  ],
}
```

---

## 5. GENERIC PATTERNS (FROM OTHER SERVICES)

### Service Pattern - AdvertisementsService

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/advertisements.service.ts`

**Full CRUD Pattern:**
```typescript
@Injectable({ providedIn: 'root' })
export class AdvertisementsService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/advertisements`;

  getAdvertisements(params: AdvertisementListParams): Observable<PaginatedResponse<Advertisement>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<Advertisement>>(this.apiBase, { params: httpParams });
  }

  getAdvertisement(id: string): Observable<ApiResponse<Advertisement>> {
    return this.http.get<ApiResponse<Advertisement>>(`${this.apiBase}/${id}`);
  }

  createAdvertisement(payload: AdvertisementPayload): Observable<ApiResponse<Advertisement>> {
    return this.http.post<ApiResponse<Advertisement>>(this.apiBase, payload);
  }

  updateAdvertisement(id: string, payload: Partial<AdvertisementPayload>): Observable<ApiResponse<Advertisement>> {
    return this.http.put<ApiResponse<Advertisement>>(`${this.apiBase}/${id}`, payload);
  }

  deleteAdvertisement(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
```

### List Page with Modal Pattern - AdvertisementsComponent

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/advertisements/advertisements.ts`

**Key Patterns:**
- Modal form component (AdvertisementFormModalComponent)
- Shared modal logic for create/edit
- Quick actions (toggle status)
- Inline data validation before API call
- Label maps for enum display (Type, Location)

```typescript
private showAdModal(
  title: string,
  defaults: { name: string; type: string; ... },
  onSubmit: (payload: AdvertisementPayload) => Observable<unknown>,
): void {
  this.modal.create({
    nzTitle: title,
    nzContent: AdvertisementFormModalComponent,
    nzData: defaults,
    nzWidth: 640,
    nzOkText: 'Lưu',
    nzCancelText: 'Hủy',
    nzOnOk: (instance: AdvertisementFormModalComponent) => {
      // Validate
      if (!instance.name.trim()) {
        this.message.warning('Vui lòng nhập tên quảng cáo');
        return false;
      }
      // Build payload & submit
      const payload: AdvertisementPayload = { ... };
      return new Promise<boolean>((resolve) => {
        onSubmit(payload).subscribe({
          next: () => {
            this.message.success(`Đã lưu quảng cáo "${name}"`);
            this.loadAds();
            resolve(true);
          },
          error: () => {
            this.message.error('Thao tác thất bại');
            resolve(false);
          },
        });
      });
    },
  });
}
```

### Complex Form Pattern - MangaCreateComponent

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/manga-create/manga-create.ts`

**Key Patterns:**
- Reactive forms with validators
- Dropdown search with debounce (Subject + debounceTime)
- File upload (FormData)
- Rich text editor (ngx-editor)
- Multiple data loading (genres, artists, groups, etc.)

```typescript
private setupSearchStreams(): void {
  this.artistSearch$
    .pipe(debounceTime(300), distinctUntilChanged())
    .subscribe((term) => {
      if (term.length < 2) return;
      this.artistLoading.set(true);
      this.artistsService.getArtists({ 'filter[name]': term, per_page: 20 }).subscribe({
        next: (res) => {
          this.artistOptions.set(res.data ?? []);
          this.artistLoading.set(false);
        },
        error: () => this.artistLoading.set(false),
      });
    });
}
```

---

## 6. SHARED UTILITIES

### PaginationBarComponent

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/shared/pagination-bar/pagination-bar.ts`

**Signals-based component:**
```typescript
@Component({
  selector: 'app-pagination-bar',
  standalone: true,
  imports: [NzPaginationModule],
  template: `
    <div class="pagination-bar" [class.bottom]="position() === 'bottom'">
      @if (position() === 'top') {
        <span class="total-text">
          Tổng <strong>{{ total() }}</strong> {{ totalLabel() }}
        </span>
      }
      <nz-pagination
        [nzPageIndex]="pageIndex()"
        [nzPageSize]="pageSize()"
        [nzTotal]="total()"
        [nzShowSizeChanger]="true"
        [nzPageSizeOptions]="pageSizeOptions()"
      />
    </div>
  `,
})
export class PaginationBarComponent {
  readonly total = input.required<number>();
  readonly pageIndex = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalLabel = input<string>('mục');
  readonly position = input<'top' | 'bottom'>('top');
  readonly pageSizeOptions = input<number[]>([10, 20, 50]);

  readonly pageIndexChange = output<number>();
  readonly pageSizeChange = output<number>();
}
```

---

## 7. API TYPES & RESPONSES

### File: `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/models/api-types.ts`

```typescript
export interface PaginatedResponse<T> {
  status: number;
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  count: number;
  total: number;
  perPage: number;
  currentPage: number;
  totalPages: number;
  links?: { next?: string; previous?: string };
}
```

### ApiResponse (from AuthService)

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/auth.service.ts`

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}
```

---

## 8. AUTHENTICATION & INTERCEPTORS

### AuthService

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/services/auth.service.ts`

**Patterns:**
- Signals-based token storage
- Computed isAuthenticated reactive property
- Logout function (fire-and-forget DELETE)

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenSignal = signal<string | null>(this.getToken());
  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  login(email: string, password: string): Observable<ApiResponse<AuthToken>> {
    return this.http.post<ApiResponse<AuthToken>>(...)
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            this.setToken(res.data.token);
          }
        }),
      );
  }

  logout(): void {
    const token = this.getToken();
    if (token) {
      this.http.delete(...).pipe(catchError(() => EMPTY)).subscribe();
    }
    this.removeToken();
    this.router.navigate(['/login']);
  }
}
```

### AuthInterceptor

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/interceptors/auth.interceptor.ts`

**Patterns:**
- Functional interceptor (HttpInterceptorFn)
- Attaches Bearer token to API requests
- Auto-logout on 401 (except login endpoint)

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token && req.url.startsWith(environment.apiUrl)) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.endsWith('/api/admin/auth')) {
        authService.logout();
      }
      return throwError(() => error);
    }),
  );
};
```

### AuthGuard

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/core/guards/auth.guard.ts`

```typescript
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
```

---

## 9. LAYOUT

### AdminLayoutComponent

**File:** `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/layout/admin-layout/admin-layout.ts`

**Patterns:**
- LayoutDefaultComponent from @delon/theme
- Sidebar nav auto-renders (don't put nav inside layout content)
- Toggle sidebar functionality
- Logout button in header

```typescript
@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, LayoutDefaultComponent, LayoutDefaultHeaderItemComponent, ...],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.less',
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly layoutService = inject(LayoutDefaultService);

  protected readonly layoutOptions = {
    logoLink: '/dashboard',
    logoFixWidth: 200,
    showHeaderCollapse: false,
  };

  protected toggleCollapsed(): void {
    this.layoutService.toggleCollapsed();
  }

  protected onLogout(): void {
    this.authService.logout();
  }
}
```

---

## 10. FILE STRUCTURE SUMMARY

```
src/app/
├── core/
│   ├── guards/
│   │   └── auth.guard.ts
│   ├── interceptors/
│   │   └── auth.interceptor.ts
│   ├── models/
│   │   └── api-types.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── members.service.ts           ← USER SERVICE (EXISTING)
│   │   ├── advertisements.service.ts    ← REFERENCE PATTERN
│   │   ├── manga.service.ts             ← REFERENCE PATTERN
│   │   └── [13 other services]
│   └── startup/
│       └── startup.service.ts           ← MENU CONFIG
├── pages/
│   ├── members/
│   │   ├── members.ts                   ← USER LIST (EXISTING)
│   │   ├── members.html
│   │   └── members.less
│   ├── advertisements/                  ← REFERENCE PATTERN
│   │   ├── advertisements.ts
│   │   ├── advertisements.html
│   │   └── advertisements.less
│   ├── manga-create/                    ← REFERENCE PATTERN (complex forms)
│   └── [15 other pages]
├── layout/
│   └── admin-layout/
│       ├── admin-layout.ts
│       ├── admin-layout.html
│       └── admin-layout.less
├── shared/
│   └── pagination-bar/
│       └── pagination-bar.ts            ← SHARED COMPONENT
├── app.config.ts
├── app.routes.ts
└── main.ts
```

---

## 11. KEY ARCHITECTURE DECISIONS

### HTTP Client Pattern
- Always use `HttpParams` for query strings (auto-encodes special chars)
- Filter format: `filter[fieldname]=value` (Spatie QueryBuilder)
- Pagination: `page` and `per_page` params

### State Management
- Signals for component state (`signal()`, `computed()`)
- No NgRx/State library (simple CRUD apps)
- Reactive forms for search/filters

### UI Patterns
- ng-zorro-antd components
- Modal forms for create/edit (shared logic)
- Sticky right columns for actions
- Popconfirm for destructive actions
- Loading state during API calls
- Toast messages (NzMessageService)

### API Response Format
- Standard ApiResponse<T> wrapper
- PaginatedResponse<T> for list endpoints
- Auto 401 logout via interceptor

### Code Style
- Standalone components (no NgModules)
- `inject()` for DI (no constructors)
- Single file per component (template inline for modals)
- TypeScript strict mode
- LESS styles (component-scoped)

---

## 12. FILES NOT REQUIRING USER MANAGEMENT

List pages without user-specific functions:
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/artists/artists.ts`
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/doujinshis/doujinshis.ts`
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/genres/genres.ts`
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/groups/groups.ts`
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/pets/pets.ts`
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/comments/comments.ts`
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/chapter-reports/chapter-reports.ts`
- `/Users/jhin1m/Desktop/ducanh-project/admin-mymanga/src/app/pages/achievements/achievements.ts`

---

## Unresolved Questions

1. Do we need additional user CRUD endpoints (create, update, delete users) or only list/ban?
2. Should user edit page have separate component or modal like advertisements?
3. Does user profile/detail view exist or needed?
4. Any additional user fields beyond what's in Member interface?

