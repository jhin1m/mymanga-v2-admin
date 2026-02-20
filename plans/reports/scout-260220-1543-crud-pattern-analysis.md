# CRUD Management Page Pattern Analysis

## Overview
Analyzed 3 fully implemented CRUD management pages (achievements, genres, groups) plus supporting infrastructure to extract reusable patterns for "Pets" management page.

**Scanned Files:**
- Components: achievements.ts, genres.ts, groups.ts (+ .html templates)
- Services: achievements.service.ts, genres.service.ts, groups.service.ts
- Routing: app.routes.ts
- Menu: startup.service.ts
- Shared: pagination-bar component, api-types models

---

## 1. COMPONENT ARCHITECTURE

### Basic Structure (All follow identical pattern)
```typescript
@Component({
  selector: 'app-{entity}',
  imports: [
    ReactiveFormsModule, DatePipe,
    NzCardModule, NzTableModule, NzFormModule, NzInputModule, 
    NzButtonModule, NzGridModule, NzIconModule, NzPopconfirmModule,
    PaginationBarComponent,
  ],
  templateUrl: './{entity}.html',
  styleUrl: './{entity}.less',
})
export class {Entity}Component implements OnInit {
  // Inject services
  private readonly {entity}Service = inject({Entity}Service);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);

  // Signal-based state
  protected readonly {entities} = signal<{Entity}[]>([]);
  protected readonly loading = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(1);
  protected readonly pageSize = signal(20);
  
  protected readonly searchForm = this.fb.group({
    name: [''],  // + additional filters as needed
  });

  ngOnInit(): void {
    this.load{Entities}();
  }
}
```

### Key Patterns

**Signal State Management:**
- 5 core signals: `{entities}`, `loading`, `total`, `pageIndex`, `pageSize`
- All are `signal<T>()` wrapping data types
- Used directly in template via `signal()` syntax (e.g., `{{ achievements() }}`)
- Updated via `.set()` method

**Search/Filter Form:**
- Reactive forms with `FormBuilder`
- Single form group: `searchForm = fb.group({ name: [''], ... })`
- Supports arbitrary filters via bracket notation: `params['filter[name]']`, `params['filter[id]']`

**Load Method Pattern:**
```typescript
load{Entities}(): void {
  this.loading.set(true);
  const formValue = this.searchForm.getRawValue();
  const params: {Entity}ListParams = {
    page: this.pageIndex(),
    per_page: this.pageSize(),
    sort: '-created_at',  // Most recent first
  };
  if (formValue.name) params['filter[name]'] = formValue.name;

  this.{entity}Service.get{Entities}(params).subscribe({
    next: (res) => {
      this.{entities}.set(res?.data ?? []);
      this.total.set(res?.pagination?.total ?? 0);
      this.loading.set(false);
    },
    error: () => {
      this.{entities}.set([]);
      this.total.set(0);
      this.message.error('Không thể tải danh sách {entities}');
      this.loading.set(false);
    },
  });
}
```

**Event Handlers:**
- `onSearch()` — reset pageIndex to 1, call load
- `onReset()` — clear form, reset pageIndex, call load
- `onPageChange(page)` — update pageIndex signal, call load
- `onPageSizeChange(size)` — update pageSize signal, reset pageIndex, call load

**Modal Pattern (Create & Edit):**
- Private method `showXxxModal(title, defaults, onSubmit)` used by both create & edit
- Modal receives form data via `nzData` input
- Form modal component updates instance properties
- `nzOnOk` callback validates & calls service method
- Promise resolves `true` (close) or `false` (stay open)
- On success: message toast + reload list
- On error: message toast + keep modal open

Example (Achievements — single field):
```typescript
private showAchievementModal(
  title: string,
  defaults: { name: string },
  onSubmit: (payload: AchievementPayload) => Observable<unknown>,
): void {
  this.modal.create({
    nzTitle: title,
    nzContent: AchievementFormModalComponent,
    nzData: defaults,
    nzOkText: 'Lưu',
    nzCancelText: 'Hủy',
    nzOnOk: (instance: AchievementFormModalComponent) => {
      const name = instance.name.trim();
      if (!name) {
        this.message.warning('Vui lòng nhập tên danh hiệu');
        return false;
      }
      const payload: AchievementPayload = { name };
      return new Promise<boolean>((resolve) => {
        onSubmit(payload).subscribe({
          next: () => {
            this.message.success(`Đã lưu danh hiệu "${name}"`);
            this.loadAchievements();
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

onCreateAchievement(): void {
  this.showAchievementModal('Tạo danh hiệu mới', { name: '' }, (payload) =>
    this.achievementsService.createAchievement(payload),
  );
}

onEditAchievement(achievement: Achievement): void {
  this.showAchievementModal(
    'Sửa danh hiệu',
    { name: achievement.name },
    (payload) => this.achievementsService.updateAchievement(achievement.id, payload),
  );
}
```

Example (Genres — multiple fields):
```typescript
private showGenreModal(
  title: string,
  defaults: { name: string; showHeader: boolean; showMb: boolean },
  onSubmit: (payload: GenrePayload) => Observable<unknown>,
): void {
  this.modal.create({
    nzTitle: title,
    nzContent: GenreFormModalComponent,
    nzData: defaults,
    nzOkText: 'Lưu',
    nzCancelText: 'Hủy',
    nzOnOk: (instance: GenreFormModalComponent) => {
      const name = instance.name.trim();
      if (!name) {
        this.message.warning('Vui lòng nhập tên thể loại');
        return false;
      }
      const payload: GenrePayload = {
        name,
        show_header: instance.showHeader,
        show_mb: instance.showMb,
      };
      return new Promise<boolean>((resolve) => {
        onSubmit(payload).subscribe({
          next: () => {
            this.message.success(`Đã lưu thể loại "${name}"`);
            this.loadGenres();
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

**Delete Pattern:**
```typescript
onDelete{Entity}({entity}: {Entity}): void {
  this.{entity}Service.delete{Entity}({entity}.id).subscribe({
    next: () => {
      this.message.success(`Đã xóa {entity} "${entity.name}"`);
      this.load{Entities}();
    },
    error: () => this.message.error('Xóa {entity} thất bại'),
  });
}
```

---

## 2. MODAL FORM COMPONENT PATTERN

Inline components created in same file. Two approaches:

**Approach 1 — Named Fields (Genres, Achievements):**
```typescript
@Component({
  selector: 'app-{entity}-form-modal',
  imports: [FormsModule, NzInputModule, NzFormModule, /* other modules */],
  template: `
    <nz-form-item>
      <nz-form-label>Label</nz-form-label>
      <nz-form-control>
        <input nz-input [(ngModel)]="fieldName" placeholder="..." />
      </nz-form-control>
    </nz-form-item>
    <!-- repeat for each field -->
  `,
})
export class {Entity}FormModalComponent {
  private readonly data = inject<{ field1: string; field2: boolean; ... }>(NZ_MODAL_DATA);
  field1 = this.data.field1 ?? '';
  field2 = this.data.field2 ?? false;
  // ...
}
```

**Approach 2 — Simple Input (Groups):**
```typescript
@Component({
  selector: 'app-group-name-input',
  imports: [FormsModule, NzInputModule],
  template: `<input nz-input [(ngModel)]="name" placeholder="..." (keyup.enter)="name" />`,
})
export class GroupNameInputComponent {
  private readonly data = inject<{ defaultName: string }>(NZ_MODAL_DATA);
  name = this.data.defaultName ?? '';
}
```

**Key Points:**
- Inject `NZ_MODAL_DATA` to receive defaults
- Use two-way binding `[(ngModel)]` for form input
- Class properties are mutable (no signals in modals)
- Validation happens in parent component (nzOnOk callback), not modal
- Use `NzFormModule` + `NzFormItem/Label/Control` for layout consistency

---

## 3. TEMPLATE ARCHITECTURE

### Search Card (Top Section)
```html
<nz-card nzTitle="Tìm kiếm {Entity}" [nzExtra]="searchExtra">
  <form nz-form [formGroup]="searchForm" (ngSubmit)="onSearch()" nzLayout="vertical">
    <div nz-row [nzGutter]="[16, 0]">
      <div nz-col [nzXs]="24" [nzSm]="24" [nzMd]="24">
        <nz-form-item>
          <nz-form-label>Field Label</nz-form-label>
          <nz-form-control>
            <input nz-input formControlName="fieldName" placeholder="..." />
          </nz-form-control>
        </nz-form-item>
      </div>
      <!-- Add more fields as needed -->
    </div>
  </form>

  <ng-template #searchExtra>
    <div class="search-actions">
      <button nz-button nzSize="small" (click)="onReset()" type="button">
        <nz-icon nzType="redo" />
        Reset
      </button>
      <button nz-button nzType="primary" nzSize="small" (click)="onSearch()">
        <nz-icon nzType="search" />
        Tìm kiếm
      </button>
      <button nz-button nzType="primary" nzSize="small" (click)="onCreate{Entity}()">
        <nz-icon nzType="plus" />
        Tạo mới
      </button>
    </div>
  </ng-template>
</nz-card>
```

### Table Card (Data Display)
```html
<nz-card class="table-card">
  <!-- Top Pagination Bar -->
  <app-pagination-bar
    [total]="total()"
    [pageIndex]="pageIndex()"
    [pageSize]="pageSize()"
    totalLabel="{entity-label}"  <!-- e.g., "danh hiệu", "thể loại" -->
    position="top"
    (pageIndexChange)="onPageChange($event)"
    (pageSizeChange)="onPageSizeChange($event)"
  />

  <!-- Table -->
  <nz-table
    #{entity}Table
    [nzData]="{entities}()"
    [nzLoading]="loading()"
    [nzFrontPagination]="false"
    [nzShowPagination]="false"
    [nzScroll]="{ x: '700px' }"  <!-- Adjust width based on columns -->
    nzSize="middle"
  >
    <thead>
      <tr>
        <th nzWidth="80px" nzAlign="center">ID</th>
        <th nzWidth="250px">Field Name</th>
        <!-- Additional columns -->
        <th nzWidth="150px">Ngày tạo</th>
        <th nzWidth="120px" nzAlign="center" nzRight>Hành động</th>
      </tr>
    </thead>
    <tbody>
      @for ({entity} of {entity}Table.data; track {entity}.id) {
        <tr>
          <td nzAlign="center">{{ {entity}.id }}</td>
          <td>
            <span class="{entity}-name">{{ {entity}.name }}</span>
          </td>
          <!-- Additional columns -->
          <td class="text-muted">{{ {entity}.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
          <td nzAlign="center" nzRight>
            <div class="action-buttons">
              <button nz-button nzSize="small" (click)="onEdit{Entity}({entity})" title="Sửa">
                <nz-icon nzType="edit" />
              </button>
              <button
                nz-button
                nzDanger
                nzSize="small"
                nz-popconfirm
                [nzPopconfirmTitle]="'Xóa {entity} \'' + {entity}.name + '\'?'"
                (nzOnConfirm)="onDelete{Entity}({entity})"
                title="Xóa"
              >
                <nz-icon nzType="delete" />
              </button>
            </div>
          </td>
        </tr>
      }
    </tbody>
  </nz-table>

  <!-- Bottom Pagination Bar (only if has data) -->
  @if ({entities}().length > 0) {
    <app-pagination-bar
      [total]="total()"
      [pageIndex]="pageIndex()"
      [pageSize]="pageSize()"
      position="bottom"
      (pageIndexChange)="onPageChange($event)"
      (pageSizeChange)="onPageSizeChange($event)"
    />
  }
</nz-card>
```

**Key Template Patterns:**
- `[nzData]="{entities}()"` — signal binding
- `[nzLoading]="loading()"` — shows spinner while loading
- `#referenceVar` — template reference for table (used with `track`)
- `@for (...; track .id)` — Angular 17+ control flow syntax
- `.text-muted` — style for secondary text (from ng-zorro)
- `nzAlign="center"` + `nzRight` — column alignment
- Popconfirm for destructive actions (delete)
- Two pagination bars (top + bottom conditional)

---

## 4. SERVICE ARCHITECTURE

### Base Service Template
```typescript
@Injectable({ providedIn: 'root' })
export class {Entity}Service {
  private readonly http = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/admin/{entities}`;

  get{Entities}(params: {Entity}ListParams): Observable<PaginatedResponse<{Entity}>> {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<PaginatedResponse<{Entity}>>(this.apiBase, { params: httpParams });
  }

  create{Entity}(payload: {Entity}Payload): Observable<ApiResponse<{Entity}>> {
    return this.http.post<ApiResponse<{Entity}>>(this.apiBase, payload);
  }

  update{Entity}(id: string, payload: {Entity}Payload): Observable<ApiResponse<{Entity}>> {
    return this.http.put<ApiResponse<{Entity}>>(`${this.apiBase}/${id}`, payload);
  }

  delete{Entity}(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${id}`);
  }
}
```

### Type Definitions
```typescript
// Data model
export interface {Entity} {
  id: string;
  name: string;
  slug?: string;  // Some entities have slug
  created_at: string;
  updated_at: string;
  user_id?: string;
  user?: { id: string; name: string };
  // Custom fields...
}

// Request params for list/filter
export interface {Entity}ListParams {
  page?: number;
  per_page?: number;
  sort?: string;
  include?: string;
  'filter[name]'?: string;
  'filter[id]'?: string;
  // Custom filters...
}

// Payload for create/update
export interface {Entity}Payload {
  name: string;
  // Custom fields...
}
```

**API Conventions:**
- Base URL: `${environment.apiUrl}/api/admin/{entities}` (plural)
- GET list: `GET /api/admin/{entities}?page=1&per_page=20&sort=-created_at&filter[name]=value`
- CREATE: `POST /api/admin/{entities}` with JSON body
- UPDATE: `PUT /api/admin/{entities}/:id` with JSON body
- DELETE: `DELETE /api/admin/{entities}/:id`
- Response wrapper: `{ status: 200, success: true, data: [...], pagination: {...} }`

**Parameter Handling:**
- Dynamic filters via bracket notation: `params['filter[name]']`
- Missing/empty values are skipped (not sent)
- All params converted to string via `String(value)`

---

## 5. ROUTING PATTERN

**In app.routes.ts:**
```typescript
{
  path: '{entities}',
  loadComponent: () => 
    import('./pages/{entities}/{entities}').then((m) => m.{Entity}Component),
}
```

**Conventions:**
- File name: lowercase plural (e.g., `genres.ts`, `groups.ts`)
- Component selector: `app-{entity}` (singular)
- Component exported as `{Entity}Component` (e.g., `GenresComponent`)
- Lazy loaded via `loadComponent` (not module-based)

---

## 6. MENU REGISTRATION PATTERN

**In startup.service.ts:**
```typescript
this.menuService.add([
  {
    group: true,
    text: 'GROUP LABEL',
    children: [
      {
        text: '{Entity} Label',
        link: '/{entities}',  // matches route path
        icon: { type: 'icon', value: 'icon-type' },
      },
    ],
  },
]);
```

**Example from codebase:**
```typescript
// Main menu section
{
  text: 'Thể loại',
  link: '/genres',
  icon: { type: 'icon', value: 'tags' },
}

// Community section
{
  text: 'Danh hiệu',
  link: '/badges',  // Note: route is '/badges', but component is for achievements
  icon: { type: 'icon', value: 'trophy' },
}
```

**Icon Names (ng-zorro):**
Common: `user`, `book`, `team`, `file`, `tags`, `trophy`, `edit`, `delete`, `search`, `plus`, `redo`, `message`, `notification`, `history`

---

## 7. SHARED UTILITIES

### PaginationBarComponent
Located: `src/app/shared/pagination-bar/pagination-bar.ts`

**Usage:**
```html
<app-pagination-bar
  [total]="total()"
  [pageIndex]="pageIndex()"
  [pageSize]="pageSize()"
  totalLabel="entity-label"  <!-- e.g., "danh hiệu" -->
  position="top"            <!-- 'top' | 'bottom' -->
  (pageIndexChange)="onPageChange($event)"
  (pageSizeChange)="onPageSizeChange($event)"
/>
```

**Features:**
- Displays "Tổng X {label}" (only at top position)
- Pagination control with page size selector (10, 20, 50 options)
- Position options: 'top' shows label, 'bottom' aligns right

### API Types
Located: `src/app/core/models/api-types.ts`

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
}
```

---

## 8. STYLING PATTERN

### Global Patterns
- CSS classes use kebab-case: `.entity-name`, `.text-muted`, `.action-buttons`, `.search-actions`, `.pagination-bar`
- Component styles: `.less` files with same name as component
- Table scrolling: `[nzScroll]="{ x: '700px' }"` set based on content width

### LESS Variables (from ng-zorro/theme)
Available in all .less files via theme.less import chain.

---

## 9. UNRESOLVED QUESTIONS

1. Are there any custom field validators needed for "Pets" entity?
2. Should "Pets" have additional relationship fields (like groups have user, genres have show_header/show_mb)?
3. What icon should be used for Pets in the menu?
4. Which menu group should Pets belong to (MENU CHÍNH or CỘNG ĐỒNG)?
5. Does the backend API expect plural "pets" or singular "pet" in the endpoint?
6. Are there any special sorting/filtering options beyond the name field?
